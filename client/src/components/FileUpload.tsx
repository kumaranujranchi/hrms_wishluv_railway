import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, X, Check, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<string>;
  accept?: string;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
}

interface FileWithPreview extends File {
  preview?: string;
}

export default function FileUpload({ 
  onFileUpload, 
  accept = "*/*", 
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = "",
  disabled = false 
}: FileUploadProps) {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > maxSize) {
      setErrorMessage(`File size must be less than ${formatFileSize(maxSize)}`);
      setUploadStatus('error');
      return;
    }

    const fileWithPreview = Object.assign(selectedFile, {
      preview: selectedFile.type.startsWith('image/') 
        ? URL.createObjectURL(selectedFile)
        : undefined
    });

    setFile(fileWithPreview);
    setUploadStatus('idle');
    setErrorMessage('');
    setUploadProgress(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || uploading || disabled) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const uploadedUrl = await onFileUpload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');
      
      // Clean up preview URL
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={className}>
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {!file ? (
        <Card 
          className={`border-2 border-dashed cursor-pointer transition-colors hover:border-primary/50 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={openFileDialog}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-neutral-400 mb-4" />
            <p className="text-sm text-neutral-600 mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-neutral-500">
              Max file size: {formatFileSize(maxSize)}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              {file.preview ? (
                <img 
                  src={file.preview} 
                  alt="Preview" 
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-16 bg-neutral-100 rounded flex items-center justify-center">
                  <File className="h-8 w-8 text-neutral-400" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-neutral-500">{formatFileSize(file.size)}</p>
                
                {uploading && (
                  <div className="mt-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-neutral-500 mt-1">
                      {uploadProgress}% uploaded
                    </p>
                  </div>
                )}
                
                {uploadStatus === 'error' && (
                  <div className="flex items-center space-x-1 mt-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-xs text-red-600">{errorMessage}</p>
                  </div>
                )}
                
                {uploadStatus === 'success' && (
                  <div className="flex items-center space-x-1 mt-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <p className="text-xs text-green-600">Upload successful</p>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                {uploadStatus !== 'success' && (
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploading || disabled}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRemove}
                  disabled={uploading || disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}