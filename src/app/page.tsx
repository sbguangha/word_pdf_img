'use client';

import { useState, useCallback } from 'react';

interface ConversionResult {
  outputFilename: string;
  downloadUrl: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
      setConversionResult(null);
    }
  }, []);

  // 简化的拖拽功能
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setFile(file);
      setError('');
      setConversionResult(null);
    }
  };

  const getAvailableFormats = (fileType: string) => {
    if (fileType.includes('word') || fileType.includes('document')) {
      return [
        { value: 'pdf', label: 'PDF' },
        { value: 'jpg', label: 'JPG' }
      ];
    } else if (fileType.includes('pdf')) {
      return [
        { value: 'jpg', label: 'JPG' },
        { value: 'docx', label: 'Word (DOCX)' }
      ];
    } else if (fileType.includes('image')) {
      return [
        { value: 'pdf', label: 'PDF' },
        { value: 'docx', label: 'Word (DOCX)' }
      ];
    }
    return [];
  };

  const handleConvert = async () => {
    if (!file || !targetFormat) {
      setError('请选择文件和目标格式');
      return;
    }

    setIsConverting(true);
    setError('');

    try {
      // 首先上传文件
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('文件上传失败');
      }

      const uploadResult = await uploadResponse.json();

      // 然后进行转换
      const convertResponse = await fetch('http://localhost:3001/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: uploadResult.filename,
          targetFormat: targetFormat
        })
      });

      if (!convertResponse.ok) {
        const errorData = await convertResponse.json();
        throw new Error(errorData.error || '转换失败');
      }

      const convertResult = await convertResponse.json();
      setConversionResult(convertResult);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            文件格式转换工具
          </h1>
          <p className="text-lg text-gray-600">
            支持 Word、PDF、JPG 格式之间的相互转换
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* 文件上传区域 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. 选择文件</h2>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput')?.click()}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors border-gray-300 hover:border-gray-400"
            >
              <input
                id="fileInput"
                type="file"
                className="hidden"
                accept=".docx,.doc,.pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFile(file);
                    setError('');
                    setConversionResult(null);
                  }
                }}
              />
              {file ? (
                <div>
                  <p className="text-green-600 font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600">
                    拖拽文件到这里，或点击选择文件
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    支持 .docx, .doc, .pdf, .jpg, .png 格式，最大 50MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 格式选择 */}
          {file && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. 选择目标格式</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {getAvailableFormats(file.type).map((format) => (
                  <button
                    key={format.value}
                    onClick={() => setTargetFormat(format.value)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      targetFormat === format.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 转换按钮 */}
          {file && targetFormat && (
            <div className="mb-8">
              <button
                onClick={handleConvert}
                disabled={isConverting}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isConverting ? '转换中...' : '开始转换'}
              </button>
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* 转换结果 */}
          {conversionResult && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 mb-4">转换成功！</p>
              <button
                onClick={handleDownload}
                className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                下载文件
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
