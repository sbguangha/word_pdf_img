'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

// 功能卡片数据
const conversionTools = [
  {
    id: 'pdf-to-image',
    title: 'PDF转图片',
    description: '将PDF文档转换为JPG或PNG图片',
    icon: '🖼️',
    color: 'bg-red-500',
    href: '/pdf-to-image',
    available: true
  },
  {
    id: 'image-to-pdf',
    title: '图片转PDF',
    description: '将JPG、PNG图片转换为PDF文档',
    icon: '📄',
    color: 'bg-blue-500',
    href: '/image-to-pdf',
    available: true
  },
  {
    id: 'word-to-pdf',
    title: 'Word转PDF',
    description: '将Word文档转换为PDF格式',
    icon: '📝',
    color: 'bg-green-500',
    href: '#',
    available: false
  },
  {
    id: 'pdf-to-word',
    title: 'PDF转Word',
    description: '将PDF文档转换为可编辑的Word格式',
    icon: '📋',
    color: 'bg-purple-500',
    href: '#',
    available: false
  },
  {
    id: 'word-to-image',
    title: 'Word转图片',
    description: '将Word文档转换为JPG或PNG图片',
    icon: '🖨️',
    color: 'bg-orange-500',
    href: '#',
    available: false
  },
  {
    id: 'image-to-word',
    title: '图片转Word',
    description: '将图片中的文字识别并转换为Word文档',
    icon: '🔍',
    color: 'bg-teal-500',
    href: '#',
    available: false
  }
];

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<string>('image-to-pdf');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <Header currentPage="convert" />

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 主标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {conversionTools.find(tool => tool.id === selectedTool)?.title || '图片转PDF'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {conversionTools.find(tool => tool.id === selectedTool)?.description || '将JPG、PNG图片转换为PDF文档，或将每一页转换为JPG文件。'}
          </p>
        </div>

        {/* 文件上传区域 */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <Link
                href={conversionTools.find(tool => tool.id === selectedTool)?.href || '/image-to-pdf'}
                className="inline-block bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-red-700 transition-colors"
              >
                选择一个{selectedTool === 'image-to-pdf' ? '图片' : 'PDF'}文件
              </Link>
              <p className="text-sm text-gray-500 mt-3">
                或者将{selectedTool === 'image-to-pdf' ? '图片' : 'PDF'}文件拖拽到这里
              </p>
            </div>
          </div>
        </div>

        {/* 功能工具网格 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            PDF爱好者的在线工具
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-4xl mx-auto">
            完全免费、易于使用、丰富的PDF处理工具，包括：合并、拆分、压缩、转换、旋转和解锁PDF文件，以及给PDF文件添加水印的工具等。只需几秒钟即可完成。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conversionTools.map((tool) => (
              <div
                key={tool.id}
                className={`bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg ${
                  selectedTool === tool.id ? 'ring-2 ring-red-500 ring-opacity-50' : ''
                } ${tool.available ? 'cursor-pointer' : 'opacity-60'}`}
              >
                {tool.available ? (
                  <Link href={tool.href} className="block">
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center text-white text-xl mr-4`}>
                        {tool.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{tool.title}</h3>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{tool.description}</p>
                  </Link>
                ) : (
                  <div onClick={() => setSelectedTool(tool.id)}>
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center text-white text-xl mr-4`}>
                        {tool.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{tool.title}</h3>
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">即将推出</span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{tool.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 使用步骤说明 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            如何使用 {conversionTools.find(tool => tool.id === selectedTool)?.title || '图片转PDF'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">选择文件</h3>
              <p className="text-gray-600 text-sm">
                点击上方按钮选择{selectedTool === 'image-to-pdf' ? '图片' : 'PDF'}文件，或直接拖拽文件到页面
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">设置选项</h3>
              <p className="text-gray-600 text-sm">
                根据需要调整转换设置，如页面尺寸、质量、格式等参数
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">下载结果</h3>
              <p className="text-gray-600 text-sm">
                等待转换完成，然后下载转换后的文件到您的设备
              </p>
            </div>
          </div>
        </div>

        {/* 特性介绍区域 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            为什么选择FormatMagic
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">完全免费</h3>
              <p className="text-gray-600 text-sm">所有转换工具完全免费使用，无需注册，无水印限制</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">安全可靠</h3>
              <p className="text-gray-600 text-sm">文件处理完全在本地进行，保护您的隐私和数据安全</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">快速高效</h3>
              <p className="text-gray-600 text-sm">先进的转换算法，几秒钟内完成文件格式转换</p>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">FormatMagic</h3>
              <p className="text-gray-400 text-sm">
                专业的文件格式转换工具，支持PDF、Word、图片格式之间的相互转换
              </p>
            </div>

            <div>
              <h4 className="text-md font-medium mb-4">PDF工具</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">合并PDF</a></li>
                <li><a href="#" className="hover:text-white">拆分PDF</a></li>
                <li><a href="#" className="hover:text-white">压缩PDF</a></li>
                <li><a href="#" className="hover:text-white">PDF转换</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-md font-medium mb-4">转换工具</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/pdf-to-image" className="hover:text-white">PDF转图片</Link></li>
                <li><Link href="/image-to-pdf" className="hover:text-white">图片转PDF</Link></li>
                <li><a href="#" className="hover:text-white">Word转PDF</a></li>
                <li><a href="#" className="hover:text-white">PDF转Word</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-md font-medium mb-4">关于我们</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">使用条款</a></li>
                <li><a href="#" className="hover:text-white">隐私政策</a></li>
                <li><a href="#" className="hover:text-white">联系我们</a></li>
                <li><a href="#" className="hover:text-white">帮助中心</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 FormatMagic. 保留所有权利。
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

