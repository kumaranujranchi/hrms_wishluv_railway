import { ObjectStorageService as ReplitObjectStorageService } from './objectStorage';
import { ObjectStorageService as RailwayObjectStorageService } from './objectStorage.railway';

// Determine which object storage service to use based on environment
export const ObjectStorageService = process.env.NODE_ENV === 'production' && !process.env.REPL_ID
  ? RailwayObjectStorageService
  : ReplitObjectStorageService;

export const objectStorageService = new ObjectStorageService();

// Export the appropriate object storage client
export { objectStorageClient } from process.env.NODE_ENV === 'production' && !process.env.REPL_ID
  ? './objectStorage.railway'
  : './objectStorage';