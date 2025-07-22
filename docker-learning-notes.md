# Docker深入学习笔记

## 第一课：依赖管理和构建策略

### 问题分析

我们的FormatMagic项目遇到的构建问题是典型的Docker化挑战：

#### 1. 原生依赖问题
- **canvas**: 需要Cairo图形库和Python编译环境
- **sharp**: 需要libvips图像处理库
- **pdfjs-dist**: 需要特定Node.js版本

#### 2. Alpine Linux限制
- 包管理器差异 (apk vs apt)
- 缺少某些开发库
- glibc vs musl libc兼容性

### Docker最佳实践

#### 1. 多阶段构建 (Multi-stage Build)
```dockerfile
# 构建阶段 - 包含所有构建工具
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
# ... 构建过程

# 运行阶段 - 只包含运行时依赖
FROM node:20-alpine AS runner
RUN apk add --no-cache cairo jpeg
# ... 复制构建产物
```

**优势**:
- 减小最终镜像大小
- 分离构建和运行环境
- 提高安全性

#### 2. 依赖层缓存优化
```dockerfile
# 先复制package.json，利用Docker层缓存
COPY package*.json ./
RUN npm install

# 再复制源代码
COPY . .
RUN npm run build
```

#### 3. 基础镜像选择策略

| 镜像类型 | 大小 | 适用场景 | 优缺点 |
|---------|------|----------|--------|
| alpine | ~5MB | 生产环境 | 小但兼容性问题 |
| slim | ~50MB | 平衡选择 | 中等大小，较好兼容性 |
| full | ~300MB | 开发环境 | 大但包含所有工具 |

### 解决方案策略

#### 策略1: 使用预构建镜像
```dockerfile
FROM node:20-slim  # 使用slim而不是alpine
```

#### 策略2: 分离复杂依赖
```dockerfile
# 只在需要时安装canvas
RUN if [ "$ENABLE_CANVAS" = "true" ]; then \
    apk add --no-cache cairo-dev; \
    npm install canvas; \
fi
```

#### 策略3: 使用.dockerignore优化
```
node_modules
.git
.next
*.log
```

## 第二课：调试技巧

### 1. 构建调试
```bash
# 详细输出
docker build --progress=plain

# 不使用缓存
docker build --no-cache

# 查看构建历史
docker history <image>
```

### 2. 容器调试
```bash
# 进入容器
docker exec -it <container> sh

# 查看日志
docker logs <container>

# 检查资源使用
docker stats
```

### 3. 镜像分析
```bash
# 查看镜像层
docker inspect <image>

# 分析镜像大小
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

## 第三课：性能优化

### 1. 构建时间优化
- 使用多阶段构建
- 优化Dockerfile指令顺序
- 使用.dockerignore

### 2. 镜像大小优化
- 选择合适的基础镜像
- 清理包管理器缓存
- 合并RUN指令

### 3. 运行时优化
- 设置合适的资源限制
- 使用健康检查
- 配置重启策略

## 实践练习

### 练习1: 分析依赖
1. 列出项目的所有依赖
2. 识别哪些需要原生编译
3. 设计分层构建策略

### 练习2: 优化Dockerfile
1. 重写Dockerfile以减小镜像大小
2. 添加健康检查
3. 实现优雅关闭

### 练习3: 调试技能
1. 故意引入错误
2. 使用调试工具定位问题
3. 修复并验证解决方案
