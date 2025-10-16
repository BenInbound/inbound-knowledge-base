'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSizeMB?: number;
}

/**
 * File Upload Component
 * Allows users to select and upload Tettra export files (CSV or JSON)
 * T142: Create file upload component
 */
export default function FileUpload({
  onFileSelect,
  acceptedFormats = ['.csv', '.json'],
  maxSizeMB = 10,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    // Check file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(extension)) {
      return `Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-accent-500 bg-accent-50' : 'border-primary-300'}
            ${error ? 'border-red-500 bg-red-50' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="space-y-4">
            {selectedFile ? (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-accent-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-primary-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-primary-600">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleButtonClick}
                  type="button"
                >
                  Choose Different File
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div>
                  <Button
                    variant="outline"
                    onClick={handleButtonClick}
                    type="button"
                  >
                    Choose File
                  </Button>
                </div>
                <p className="text-sm text-primary-600">
                  or drag and drop
                </p>
                <p className="text-xs text-primary-500">
                  {acceptedFormats.join(', ').toUpperCase()} up to {maxSizeMB}MB
                </p>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 mt-2">
                {error}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
