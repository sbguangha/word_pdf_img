'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConversionModal from '@/components/ConversionModal';

interface ConversionResult {
  outputFilename: string;
  downloadUrl: string;
}

export default function ImageToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<'uploading' | 'converting' | 'success' | 'error'>('converting');
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState({
    pageSize: 'A4',
    orientation: 'portrait',
    margin: 'medium',
    quality: 'high',
    fitMode: 'fit', // fit, fill, stretch
    backgroundColor: 'white'
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const imageFiles = droppedFiles.filter(file => 
      file.type.startsWith('image/')
    );
    setFiles(prev => [...prev, ...imageFiles]);
    setError('');
    setConversionResult(null);
  };

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setError('');
    setConversionResult(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const [movedFile] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, movedFile);
      return newFiles;
    });
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      setError('请选择至少一个图片文件');
      return;
    }

    setIsConverting(true);
    setShowModal(true);
    setError('');
    setProgress(0);
    setConversionStatus('uploading');

    try {
      // 模拟上传进度
      for (let i = 0; i <= 50; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('options', JSON.stringify(options));

      setConversionStatus('converting');

      // 模拟转换进度
      for (let i = 50; i <= 90; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const response = await fetch('http://localhost:3001/api/images-to-pdf', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '转换失败');
      }

      const result = await response.json();
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">图片转PDF</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            将JPG、PNG图片转换为PDF文档。支持多张图片合并为一个PDF文件。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：文件上传和预览区域 */}
          <div className="lg:col-span-2">
            {/* 文件上传区域 */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <FileUpload
                accept="image/*"
                multiple={true}
                maxSize={50}
                onFilesSelected={handleFilesSelected}
                title="选择图片文件"
                description="或将图片拖拽到这里"
              />
            </div>

            {/* 文件预览列表 */}
            {files.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    已选择的图片 ({files.length})
                  </h3>
                  <button
                    onClick={() => setFiles([])}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    清空所有
                  </button>
                </div>

                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 提示：您可以拖拽图片来调整在PDF中的顺序
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {files.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent hover:border-red-300 transition-colors">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* 删除按钮 */}
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="删除图片"
                      >
                        ×
                      </button>

                      {/* 排序按钮 */}
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {index > 0 && (
                          <button
                            onClick={() => moveFile(index, index - 1)}
                            className="bg-white bg-opacity-90 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-opacity-100 mr-1"
                            title="向前移动"
                          >
                            ↑
                          </button>
                        )}
                        {index < files.length - 1 && (
                          <button
                            onClick={() => moveFile(index, index + 1)}
                            className="bg-white bg-opacity-90 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-opacity-100"
                            title="向后移动"
                          >
                            ↓
                          </button>
                        )}
                      </div>

                      {/* 页码标识 */}
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        第 {index + 1} 页
                      </div>

                      <p className="text-xs text-gray-600 mt-1 truncate" title={file.name}>
                        {file.name}
                      </p>
                    </div>
                  ))}
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                  <option value="A5">A5</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
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
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    竖向
                  </button>
                  <button
                    onClick={() => setOptions(prev => ({ ...prev, orientation: 'landscape' }))}
                    className={`p-3 border rounded-md text-sm ${
                      options.orientation === 'landscape'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    横向
                  </button>
                </div>
              </div>

              {/* 图片适配模式 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">图片适配</label>
                <select
                  value={options.fitMode}
                  onChange={(e) => setOptions(prev => ({ ...prev, fitMode: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="fit">适应页面（保持比例）</option>
                  <option value="fill">填充页面（可能裁剪）</option>
                  <option value="stretch">拉伸填充（可能变形）</option>
                </select>
              </div>

              {/* 页边距 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">页边距</label>
                <select
                  value={options.margin}
                  onChange={(e) => setOptions(prev => ({ ...prev, margin: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="none">无边距</option>
                  <option value="small">小边距</option>
                  <option value="medium">中等边距</option>
                  <option value="large">大边距</option>
                </select>
              </div>

              {/* 背景颜色 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">背景颜色</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOptions(prev => ({ ...prev, backgroundColor: 'white' }))}
                    className={`p-3 border rounded-md text-sm flex items-center justify-center ${
                      options.backgroundColor === 'white'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-2"></div>
                    白色
                  </button>
                  <button
                    onClick={() => setOptions(prev => ({ ...prev, backgroundColor: 'transparent' }))}
                    className={`p-3 border rounded-md text-sm flex items-center justify-center ${
                      options.backgroundColor === 'transparent'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="w-4 h-4 bg-transparent border border-gray-300 rounded mr-2" style={{backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '8px 8px', backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'}}></div>
                    透明
                  </button>
                </div>
              </div>

              {/* 转换按钮 */}
              <button
                onClick={handleConvert}
                disabled={files.length === 0 || isConverting}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isConverting ? (
                  <>
                    <LoadingSpinner size="sm" color="gray" className="mr-2" />
                    转换中...
                  </>
                ) : (
                  '转换为PDF文件'
                )}
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
        title="图片转PDF"
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
