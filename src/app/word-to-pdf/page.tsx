'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import ConversionModal from '@/components/ConversionModal';

interface ConversionResult {
  outputFilename: string;
  downloadUrl: string;
}

export default function WordToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<'uploading' | 'converting' | 'success' | 'error'>('converting');
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState({
    pageSize: 'A4',
    orientation: 'portrait',
    quality: 'high'
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const wordFile = droppedFiles.find(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    );
    if (wordFile) {
      setFile(wordFile);
      setError('');
      setConversionResult(null);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setError('');
      setConversionResult(null);
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setError('请选择一个Word文件');
      return;
    }

    setIsConverting(true);
    setShowModal(true);
    setError('');
    setProgress(0);
    setConversionStatus('uploading');

    try {
      // 第一步：上传文件
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || '文件上传失败');
      }

      const uploadResult = await uploadResponse.json();
      setProgress(30);

      // 第二步：转换文件
      setConversionStatus('converting');
      setProgress(50);

      const convertResponse = await fetch('http://localhost:3001/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: uploadResult.filename,
          targetFormat: 'pdf',
          quality: options.quality
        })
      });

      if (!convertResponse.ok) {
        const errorData = await convertResponse.json();
        throw new Error(errorData.error || '转换失败');
      }

      const result = await convertResponse.json();
      setConversionResult(result);
      setProgress(100);
      setConversionStatus('success');

    } catch (err) {
      setError(err instanceof Error ? err.message : '转换过程中发生错误');
      setConversionStatus('error');
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Word转PDF</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            将Word文档（.docx/.doc）转换为PDF格式，保持原有格式和排版。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：文件上传和预览区域 */}
          <div className="lg:col-span-2">
            {/* 文件上传区域 */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <FileUpload
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple={false}
                maxSize={50}
                onFilesSelected={handleFilesSelected}
                title="选择Word文件"
                description="或将Word文件拖拽到这里"
              />
            </div>

            {/* 文件信息 */}
            {file && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">已选择的文件</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              
              {/* 页面尺寸 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">页面尺寸</label>
                <select
                  value={options.pageSize}
                  onChange={(e) => setOptions(prev => ({ ...prev, pageSize: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                  <option value="A5">A5</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>

              {/* 页面方向 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">页面方向</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOptions(prev => ({ ...prev, orientation: 'portrait' }))}
                    className={`p-3 border rounded-md text-sm ${
                      options.orientation === 'portrait'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    竖向
                  </button>
                  <button
                    onClick={() => setOptions(prev => ({ ...prev, orientation: 'landscape' }))}
                    className={`p-3 border rounded-md text-sm ${
                      options.orientation === 'landscape'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    横向
                  </button>
                </div>
              </div>

              {/* 转换质量 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">转换质量</label>
                <select
                  value={options.quality}
                  onChange={(e) => setOptions(prev => ({ ...prev, quality: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">低质量</option>
                  <option value="medium">中等质量</option>
                  <option value="high">高质量</option>
                </select>
              </div>

              {/* 转换按钮 */}
              <button
                onClick={handleConvert}
                disabled={!file || isConverting}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isConverting ? '转换中...' : '转换为PDF'}
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
                    下载PDF文件
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

      {/* 转换模态框 */}
      <ConversionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Word转PDF"
        progress={progress}
        status={conversionStatus}
        message={error}
        onDownload={handleDownload}
        onRetry={() => {
          setShowModal(false);
          setError('');
          handleConvert();
        }}
      />
    </div>
  );
}