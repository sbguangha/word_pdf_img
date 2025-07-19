# 文件格式转换工具 - MVP版本

一个支持 Word、PDF、JPG 格式之间相互转换的网站应用。

## 🚀 快速开始

### 方式1: Next.js开发环境 (推荐)
```bash
# 1. 安装依赖
npm install

# 2. 启动前端开发服务器
npm run dev

# 3. 启动后端服务器 (新终端窗口)
npm run dev:server

# 4. 或者同时启动前后端
npm run dev:full
```

访问地址：
- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:3001

### 方式2: 静态页面 (备用方案)
如果Next.js有问题，可以直接使用静态页面：
```bash
# 启动后端服务器
node server/simple.js

# 然后打开浏览器访问
file:///e:/2_CODE/word_to_pdf_img/public/app.html
```

## 📋 当前功能状态

### ✅ 已实现
- **Next.js开发环境**: ✅ 已修复，支持热重载
- **前端界面**: React组件化，响应式设计
- **图片转PDF**: 前端+后端双重实现，支持 JPG/PNG 转 PDF
- **PDF转图片**: 后端实现，支持 PDF 转 JPG
- **后端API框架**: Express服务器，支持文件上传下载
- **CORS支持**: 跨域请求处理
- **文件验证**: 文件类型和大小限制 (50MB)
- **专业PDF处理**: 使用 pdf-lib 和 pdf2pic 库

### 🚧 开发中
- **Word转PDF**: API接口已准备，转换逻辑开发中
- **图片转Word**: 需要 OCR + 文档生成
- **批量转换**: 支持多文件同时处理

### � 技术改进
- **开发环境**: Next.js + TypeScript + Tailwind CSS
- **代码组织**: React组件化，更好的维护性
- **类型安全**: TypeScript支持
- **开发体验**: 热重载，自动刷新

## �🛠️ 技术栈

### 前端
- **Next.js 15.3.5**: React框架，已配置完成
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架
- **React**: 组件化开发
- **jsPDF**: 前端PDF生成

### 后端
- **Node.js**: 运行环境
- **Express 5.1.0**: Web框架
- **Multer**: 文件上传中间件
- **Sharp**: 图片处理
- **pdf-lib**: PDF操作库
- **CORS**: 跨域支持

## 📁 项目结构

```
word_to_pdf_img/
├── src/app/                # Next.js应用 (主要开发目录)
│   ├── page.tsx           # 主页面组件
│   ├── layout.tsx         # 根布局
│   └── globals.css        # 全局样式
├── public/                # 静态文件 (备用方案)
│   ├── app.html           # 静态版本
│   ├── test.html          # 功能测试页面
│   └── pdf-test.html      # PDF转图片专项测试
├── server/                # 后端服务器
│   ├── simple.js          # 简化服务器 (推荐)
│   ├── index.js           # 完整服务器
│   ├── uploads/           # 上传文件目录
│   └── outputs/           # 转换结果目录
├── docs/                  # 部署文档
├── next.config.ts         # Next.js配置
├── tailwind.config.ts     # Tailwind配置
├── package.json
└── README.md
```

## 🔧 开发环境配置

### 环境要求
- Node.js 18+
- npm 8+
- 至少 2GB 可用内存

### 安装步骤
```bash
# 1. 克隆项目
git clone <repository-url>
cd word_to_pdf_img

# 2. 安装依赖
npm install

# 3. 启动开发环境
npm run dev:full
```

### 开发脚本
```bash
npm run dev          # 启动Next.js前端 (端口3000)
npm run dev:server   # 启动Express后端 (端口3001)
npm run dev:full     # 同时启动前后端
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run type-check   # TypeScript类型检查
```

## 🎯 使用方法

### Next.js版本 (推荐)
1. 启动开发环境: `npm run dev:full`
2. 访问 http://localhost:3000
3. 选择文件并转换
4. 下载转换结果

### 静态版本 (备用)
1. 启动后端: `node server/simple.js`
2. 打开 `public/app.html`
3. 进行文件转换操作

### 功能测试
- **全面测试**: `public/test.html`
- **PDF专项**: `public/pdf-test.html`
- **修复版本**: `public/pdf-fixed.html`

## 🔍 API接口

### 基础信息
```
GET http://localhost:3001/
```

### 文件上传
```
POST http://localhost:3001/api/upload
Content-Type: multipart/form-data
```

### 文件转换
```
POST http://localhost:3001/api/convert
Content-Type: application/json
{
  "filename": "uploaded-file-name",
  "targetFormat": "pdf|jpg|docx"
}
```

### 文件下载
```
GET http://localhost:3001/api/download/:filename
```

## 📊 项目状态

### 完成度
- **Next.js环境**: 100% ✅
- **前端界面**: 95% ✅
- **后端API**: 80% ✅
- **图片转PDF**: 100% ✅
- **PDF转图片**: 80% ✅
- **Word转换**: 30% 🚧
- **错误处理**: 70% 🚧

### 测试覆盖
- **开发环境**: 100% ✅
- **手动测试**: 80% ✅
- **自动化测试**: 20% 🚧

## ⚠️ 故障排除

### Next.js启动问题
```bash
# 清理缓存
rm -rf .next node_modules
npm install

# 检查Node.js版本
node --version  # 应该是18+

# 检查端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

### 常见问题
1. **端口占用**: 修改端口或关闭占用进程
2. **依赖问题**: 删除node_modules重新安装
3. **TypeScript错误**: 运行 `npm run type-check`
4. **样式问题**: 检查Tailwind CSS配置

## 🚀 部署指南

### 开发环境
```bash
npm run dev:full
```

### 生产环境
```bash
# 构建应用
npm run build

# 启动生产服务器
npm start

# 使用PM2管理进程
pm2 start ecosystem.config.js
```

## � 下一步计划

### 短期目标 (本周)
1. ✅ 修复Next.js开发环境
2. 🚧 完善Word转PDF功能
3. 🚧 统一前后端API调用
4. 🚧 添加错误边界处理

### 中期目标 (本月)
1. 批量文件转换
2. 转换进度实时显示
3. 文件预览功能
4. 用户设置保存

### 长期目标 (季度)
1. 用户认证系统
2. 云存储集成
3. 移动端适配
4. 企业级功能

## 📝 开发笔记

- **主要开发**: 使用Next.js版本 (src/app/)
- **备用方案**: 静态HTML版本 (public/)
- **API测试**: 使用Postman或curl测试后端接口
- **热重载**: 前端代码修改自动刷新
- **类型安全**: TypeScript提供编译时检查

---

**项目状态**: 开发环境已就绪，核心功能可用  
**维护状态**: 积极开发中  
**最后更新**: 2025年1月13日

