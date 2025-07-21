'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import ConversionModal from '@/components/ConversionModal';

interface ConversionResult {
  outputFilename: string;
  downloadUrl: string;
  images?: string[];
}

export default function PdfToImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<'uploading' | 'converting' | 'success' | 'error'>('converting');
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState({
    format: 'jpg',
    quality: 'high',
    dpi: '300',
    pages: 'all'
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const pdfFile = droppedFiles.find(file => file.type === 'application/pdf');
    if (pdfFile) {
      setFile(pdfFile);
      setError('');
      setConversionResult(null);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]); // 只取第一个文件
      setError('');
      setConversionResult(null);
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setError('请选择一个PDF文件');
      return;
    }

    setIsConverting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(options));

      const response = await fetch('http://localhost:3001/api/pdf-to-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '转换失败');
      }

      const result = await response.json();
      setConversionResult(result);

    } catch (err) {
      setError(err instanceof Error ? err.message : '转换过程中发生错误');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (conversionResult) {
      window.open(`http://localhost:3001${conversionResult.downloadUrl}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <Header currentPage="convert" />

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">PDF转图片</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            将PDF文档的每一页转换为JPG或PNG图片。支持高质量输出和自定义设置。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：文件上传和预览区域 */}
          <div className="lg:col-span-2">
            {/* 文件上传区域 */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <FileUpload
                accept=".pdf,application/pdf"
                multiple={false}
                maxSize={50}
                onFilesSelected={handleFilesSelected}
                title="选择PDF文件"
                description="或将PDF拖拽到这里"
              />
            </div>

            {/* 文件信息 */}
            {file && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">已选择的文件</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：转换选项 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">转换选项</h3>
              
              {/* 输出格式 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">输出格式</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOptions(prev => ({ ...prev, format: 'jpg' }))}
                    className={`p-3 border rounded-md text-sm ${
                      options.format === 'jpg'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    JPG
                  </button>
                  <button
                    onClick={() => setOptions(prev => ({ ...prev, format: 'png' }))}
                    className={`p-3 border rounded-md text-sm ${
                      options.format === 'png'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    PNG
                  </button>
                </div>
              </div>

              {/* 图片质量 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">图片质量</label>
                <select
                  value={options.quality}
                  onChange={(e) => setOptions(prev => ({ ...prev, quality: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="low">低质量 (72 DPI)</option>
                  <option value="medium">中等质量 (150 DPI)</option>
                  <option value="high">高质量 (300 DPI)</option>
                  <option value="ultra">超高质量 (600 DPI)</option>
                </select>
              </div>

              {/* 页面范围 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">页面范围</label>
                <select
                  value={options.pages}
                  onChange={(e) => setOptions(prev => ({ ...prev, pages: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">所有页面</option>
                  <option value="first">仅第一页</option>
                  <option value="custom">自定义范围</option>
                </select>
              </div>

              {/* 转换按钮 */}
              <button
                onClick={handleConvert}
                disabled={!file || isConverting}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isConverting ? '转换中...' : '转换为图片'}
              </button>

              {/* 错误信息 */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* 转换结果 */}
              {conversionResult && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 text-sm mb-3">转换成功！</p>
                  <button
                    onClick={handleDownload}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    下载图片文件
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 简单页脚 */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 FormatMagic. 保留所有权利。
          </p>
        </div>
      </footer>
    </div>
  );
}
