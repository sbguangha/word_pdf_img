'use client';

import { useState } from 'react';
import Link from 'next/link';

interface HeaderProps {
  currentPage?: string;
}

export default function Header({ currentPage }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navItems = [
    { name: '合并PDF', href: '#', key: 'merge' },
    { name: '拆分PDF', href: '#', key: 'split' },
    { name: '压缩PDF', href: '#', key: 'compress' },
    { name: 'PDF转换', href: '#', key: 'convert' },
    { name: '所有PDF工具', href: '#', key: 'all' },
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="FormatMagic"
              className="h-10 w-auto mr-2"
            />
            <span className="text-xl md:text-2xl font-bold text-red-600">FormatMagic</span>
          </Link>

          {/* 桌面端导航菜单 */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className={`px-3 py-2 text-sm font-medium ${
                  currentPage === item.key
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-700 hover:text-red-600'
                }`}
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* 桌面端右侧按钮 */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium">
              登录
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">
              注册
            </button>
          </div>

          {/* 移动端菜单按钮 */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* 移动端菜单 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  className={`block px-3 py-2 text-sm font-medium ${
                    currentPage === item.key
                      ? 'text-red-600 bg-red-50'
                      : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <button className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50">
                登录
              </button>
              <button className="block w-full text-left px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700">
                注册
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
