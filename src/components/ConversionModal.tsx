'use client';

import { useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  progress?: number;
  status: 'uploading' | 'converting' | 'success' | 'error';
  message?: string;
  onDownload?: () => void;
  onRetry?: () => void;
}

export default function ConversionModal({
  isOpen,
  onClose,
  title,
  progress = 0,
  status,
  message,
  onDownload,
  onRetry
}: ConversionModalProps) {
  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'converting':
        return <LoadingSpinner size="lg" color="red" />;
      case 'success':
        return (
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'uploading':
        return '正在上传文件...';
      case 'converting':
        return '正在转换文件...';
      case 'success':
        return '转换完成！';
      case 'error':
        return message || '转换失败，请重试';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={status === 'success' || status === 'error' ? onClose : undefined}
      />
      
      {/* 模态框内容 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* 关闭按钮 - 只在成功或错误状态显示 */}
          {(status === 'success' || status === 'error') && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* 内容区域 */}
          <div className="text-center">
            <div className="mb-4">
              {getStatusIcon()}
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {title}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {getStatusMessage()}
            </p>
            
            {/* 进度条 - 仅在上传和转换时显示 */}
            {(status === 'uploading' || status === 'converting') && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">{progress}%</p>
              </div>
            )}
            
            {/* 操作按钮 */}
            <div className="flex space-x-3 justify-center">
              {status === 'success' && onDownload && (
                <button
                  onClick={onDownload}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  下载文件
                </button>
              )}
              
              {status === 'error' && onRetry && (
                <button
                  onClick={onRetry}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  重试
                </button>
              )}
              
              {(status === 'success' || status === 'error') && (
                <button
                  onClick={onClose}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  关闭
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
