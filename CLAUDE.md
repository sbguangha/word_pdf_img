# FormatMagic - Claude Code 开发指南

## 🎯 项目概览
- **项目名称**: FormatMagic - 文件格式转换工具
- **技术栈**: Next.js 15 + TypeScript + Tailwind CSS + Express + Docker
- **主要功能**: PDF、Word、图片格式之间的相互转换
- **开发环境**: 已配置完成，支持热重载

## 🚀 快速启动命令

### 开发环境启动
```bash
npm run dev:full      # 一键启动前后端开发环境
# 访问: http://localhost:3000 (前端) | http://localhost:3001 (后端)
```

### 常用开发命令
```bash
npm run dev          # 仅启动Next.js前端 (端口3000)
npm run dev:server   # 仅启动Express后端 (端口3001)
npm run lint         # 代码检查
npm run type-check   # TypeScript类型检查
npm run build        # 构建生产版本
```

## 📁 核心目录结构

```
src/app/                    # Next.js主要开发目录
├── page.tsx               # 主页
├── image-to-pdf/page.tsx  # 图片转PDF
├── pdf-to-image/page.tsx  # PDF转图片
├── word-to-pdf/page.tsx   # Word转PDF (开发中)
└── word-to-image/page.tsx # Word转图片 (待实现)

server/                    # Express后端
├── index.js              # 主服务器
├── simple.js             # 简化版服务器
└── uploads/              # 文件上传目录
```

## 🔧 开发规范

### 代码风格
- **语言**: TypeScript优先
- **样式**: Tailwind CSS类名优先
- **组件**: 函数式组件 + React Hooks
- **命名**: 驼峰命名法，组件使用PascalCase

### 文件组织
- 页面组件: `src/app/[功能]/page.tsx`
- 通用组件: `src/components/*.tsx`
- 接口定义: 直接在组件文件中定义TypeScript类型
- 工具函数: 内联在需要的地方

## 🔄 API接口规范

### 基础URL
```
开发环境: http://localhost:3001
```

### 核心接口
```typescript
// 文件上传
POST /api/upload
Content-Type: multipart/form-data

// 文件转换
POST /api/convert
{
  "filename": "string",
  "targetFormat": "pdf|jpg|png|docx"
}

// 文件下载
GET /api/download/:filename
```

## 🐛 常见问题解决方案

### 端口占用
```bash
# Windows检查端口
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# 一键重启开发环境
npm run dev:full
```

### 依赖问题
```bash
# 完全清理重装
rm -rf node_modules package-lock.json
npm install

# 或Windows
rmdir /s node_modules
del package-lock.json
npm install
```

### TypeScript错误
```bash
npm run type-check    # 检查类型错误
npm run lint          # 检查代码风格
```

## 🧪 测试方法

### 功能测试
1. 访问 http://localhost:3000
2. 测试图片转PDF: 拖拽多张图片测试
3. 测试PDF转图片: 上传PDF文件测试
4. 检查响应式布局: 移动端浏览器测试

### API测试
```bash
# 测试后端连接
curl http://localhost:3001/

# 测试文件上传
curl -X POST -F "file=@test.jpg" http://localhost:3001/api/upload
```

## 🐳 Docker部署

### 关键概念
- **本地依赖无效**：C盘安装的Ghostscript/GraphicsMagick对Docker容器不可见
- **容器化方案**：Dockerfile内重新安装Linux版依赖
- **完全隔离**：容器环境与宿主机系统分离

### Docker化步骤
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache ghostscript graphicsmagick
COPY . /app
# 容器内路径: /usr/bin/gs, /usr/bin/gm
```

### 开发环境
```bash
docker-compose up     # 启动完整开发环境
```

### 生产部署
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 功能开发状态

| 功能 | 状态 | 备注 |
|------|------|------|
| 图片转PDF | ✅ 完成 | 包含拖拽排序、自定义设置 |
| PDF转图片 | ✅ 完成 | 支持JPG/PNG格式选择，已集成Ghostscript和GraphicsMagick |
| Word转PDF | ✅ 完成 | 中文编码问题已解决，支持Unicode字符 |
| PDF转Word | ⏳ 规划中 | 需要OCR技术 |
| Word转图片 | ⏳ 待实现 | 依赖Word转PDF |
| 批量转换 | ⏳ 待实现 | 未来版本 |
| Docker部署 | ✅ 已解决 | 本地依赖与容器隔离问题已明确


 Update Todos


 ✅ 图片转PDF（支持拖拽排序、自定义设置）
  - ✅ PDF转图片（支持JPG/PNG、多页处理）
  - ✅ Word转PDF（基本功能完成，中文内容有编码问题）
  - ✅ Word转图片（通过链式转换实现）
  ☐ 完善PDF转Word功能 - 集成OCR技术实现完整转换
  ☐ 优化前端用户体验 - 添加实时进度条和状态更新
  ☐ 增强批量转换功能 - 支持多文件同时处理
  ☐ 添加文件预览功能 - 转换前预览原始文件
  ☐ 优化响应式设计 - 移动端体验优化
  ☐ 添加文件管理系统 - 历史记录和重新下载
  ☐ 集成高级设置 - 自定义转换参数

## 🎯 开发优先级

### 当前任务 (本周)
1. ✅ 完成Word转PDF功能
2. ✅ 修复中文编码问题（使用jsPDF库）
3. ✅ 统一前后端错误提示

### 下个迭代 (下周)
1. 添加进度条实时更新
2. 实现批量文件转换
3. 添加文件预览功能

## 🔍 调试技巧

### 前端调试
- 浏览器开发者工具: F12
- React DevTools扩展
- Network面板查看API调用

### 后端调试
```bash
# 查看服务器日志
tail -f server/conversion.log

# 调试特定转换
node test-convert.js
```

## 📋 代码检查清单

### 提交前检查
- [ ] TypeScript类型检查通过
- [ ] ESLint代码检查通过
- [ ] 功能在开发环境测试通过
- [ ] 响应式布局正常
- [ ] 错误处理完善

### 代码审查要点
- 组件是否可复用
- 错误处理是否完整
- 性能优化是否考虑
- 用户体验是否流畅

## 📞 紧急联系
- **项目路径**: E:\1_CODE\word_pdf_img
- **开发环境**: localhost:3000 + localhost:3001
- **一键启动**: `npm run dev:full`

---

*最后更新: 2025-08-01*
*Claude Code配置文件 - 保持更新以反映项目最新状态*