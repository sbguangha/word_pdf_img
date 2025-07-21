'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  accept: string;
  multiple?: boolean;
  maxSize?: number; // MB
  onFilesSelected: (files: File[]) => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function FileUpload({
  accept,
  multiple = false,
  maxSize = 50,
  onFilesSelected,
  title,
  description,
  icon,
  className = ''
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];
    let errorMessage = '';

    for (const file of files) {
      // 检查文件大小
      if (file.size > maxSize * 1024 * 1024) {
        errorMessage = `文件 "${file.name}" 超过 ${maxSize}MB 限制`;
        continue;
      }

      // 检查文件类型
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const isValidType = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        } else {
          return file.type.match(type.replace('*', '.*'));
        }
      });

      if (!isValidType) {
        errorMessage = `文件 "${file.name}" 格式不支持`;
        continue;
      }

      validFiles.push(file);
    }

    if (errorMessage) {
      setError(errorMessage);
    } else {
      setError('');
    }

    return validFiles;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(droppedFiles);
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = validateFiles(selectedFiles);
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
    
    // 清空input值，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-red-400 bg-red-50' 
            : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
        />
        
        <div className="flex flex-col items-center">
          {icon || (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          )}
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{description}</p>
          
          <button 
            type="button"
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            选择文件
          </button>
          
          <p className="text-sm text-gray-500 mt-3">
            支持 {accept.replace(/\*/g, '').replace(/,/g, ', ')} 格式，最大 {maxSize}MB
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
