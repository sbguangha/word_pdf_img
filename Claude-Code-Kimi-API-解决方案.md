# Claude Code + 月之暗面 Kimi API 问题解决方案

## 🔍 问题诊断

经过详细测试，发现问题的根本原因是：

### ❌ 错误配置
- **错误的API端点**: `https://api.moonshot.cn/authropic` (返回404错误)
- **环境变量设置错误**: `ANTHROPIC_BASE_URL` 被设置为错误的URL

### ✅ 正确配置
- **正确的API端点**: `https://api.moonshot.cn/v1`
- **API密钥有效**: `sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti`
- **可用模型**: moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k等

## 🛠️ 解决方案

### 方案1: 永久修复（推荐）

1. **以管理员身份运行** `fix-environment-permanent.bat`
2. **重启所有终端窗口**
3. **测试连接**: `claude "你好，测试连接"`

### 方案2: 临时启动

使用 `start-claude-correct.bat` 启动Claude Code，这会在当前会话中设置正确的环境变量。

### 方案3: 手动修复

1. **打开系统环境变量设置**:
   - 按 `Win + R`，输入 `sysdm.cpl`
   - 点击"环境变量"
   - 在用户变量中找到 `ANTHROPIC_BASE_URL`
   - 将值改为: `https://api.moonshot.cn/v1`

2. **重启终端并测试**

## 📁 提供的文件

| 文件名 | 用途 |
|--------|------|
| `fix-environment-permanent.bat` | 永久修复环境变量 |
| `start-claude-correct.bat` | 临时启动Claude Code |
| `verify-api-connection.js` | 验证API连接状态 |
| `config-fixed.json` | 修复后的Claude Code Router配置 |

## 🧪 验证步骤

1. **运行验证脚本**: `node verify-api-connection.js`
2. **检查输出**: 应该显示正确端点工作，错误端点失败
3. **测试Claude Code**: `claude "你好"`

## 📝 技术细节

### API端点对比
```
❌ 错误: https://api.moonshot.cn/authropic/v1/models
✅ 正确: https://api.moonshot.cn/v1/models
```

### 环境变量设置
```bash
ANTHROPIC_BASE_URL=https://api.moonshot.cn/v1
ANTHROPIC_API_KEY=sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti
```

### Claude Code Router配置
```json
{
  "LOG": true,
  "Providers": [
    {
      "name": "kimi2",
      "api_base_url": "https://api.moonshot.cn/v1",
      "api_key": "sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti",
      "models": [
        "moonshot-v1-8k",
        "moonshot-v1-32k", 
        "moonshot-v1-128k"
      ],
      "transformer": {
        "use": ["openai"]
      }
    }
  ]
}
```

## 🚀 快速开始

1. 运行: `fix-environment-permanent.bat`
2. 重启终端
3. 测试: `claude "你好，我是通过月之暗面API连接的Claude"`

如果仍有问题，请使用 `start-claude-correct.bat` 临时启动。
