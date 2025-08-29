import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

// Railway-compatible Google Cloud Storage client
export const objectStorageClient = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// Railway-compatible object storage service
export class ObjectStorageService {
  constructor() {}

  // Gets the bucket name from environment
  getBucketName(): string {
    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error(
        "GOOGLE_CLOUD_STORAGE_BUCKET not set. Please set this environment variable."
      );
    }
    return bucketName;
  }

  // Gets the public object search paths
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "public";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    return paths;
  }

  // Gets the private object directory
  getPrivateObjectDir(): string {
    return process.env.PRIVATE_OBJECT_DIR || "private";
  }

  // Search for a public object from the search paths
  async searchPublicObject(filePath: string): Promise<File | null> {
    const bucketName = this.getBucketName();
    const bucket = objectStorageClient.bucket(bucketName);

    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const objectName = `${searchPath}/${filePath}`;
      const file = bucket.file(objectName);

      // Check if file exists
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }

    return null;
  }

  // Downloads an object to the response
  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      // Get file metadata
      const [metadata] = await file.getMetadata();
      // Get the ACL policy for the object
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${
          isPublic ? "public" : "private"
        }, max-age=${cacheTtlSec}`,
      });

      // Stream the file to the response
      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Gets the upload URL for an object entity
  async getObjectEntityUploadURL(): Promise<string> {
    const bucketName = this.getBucketName();
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const objectName = `${privateObjectDir}/uploads/${objectId}`;

    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    // Generate signed URL for upload
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: 'application/octet-stream',
    });

    return signedUrl;
  }

  // Gets the object entity file from the object path
  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    const privateObjectDir = this.getPrivateObjectDir();
    const objectName = `${privateObjectDir}/${entityId}`;
    
    const bucketName = this.getBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    
    return objectFile;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }

    // Extract the path from the URL by removing query parameters and domain
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    const bucketName = this.getBucketName();
    const privateObjectDir = this.getPrivateObjectDir();

    // Remove bucket name from path
    const bucketPrefix = `/${bucketName}/`;
    if (!rawObjectPath.startsWith(bucketPrefix)) {
      return rawObjectPath;
    }

    const objectPath = rawObjectPath.slice(bucketPrefix.length);
    const privateDirPrefix = `${privateObjectDir}/`;
    
    if (!objectPath.startsWith(privateDirPrefix)) {
      return rawObjectPath;
    }

    // Extract the entity ID from the path
    const entityId = objectPath.slice(privateDirPrefix.length);
    return `/objects/${entityId}`;
  }

  // Tries to set the ACL policy for the object entity and return the normalized path
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  // Checks if the user can access the object entity
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }

  // Generate signed URL for downloading
  async getSignedDownloadUrl(objectName: string, ttlSec: number = 3600): Promise<string> {
    const bucketName = this.getBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + ttlSec * 1000,
    });

    return signedUrl;
  }
}