# Claude Code 完全重装指南

## 🎯 目标
完全卸载现有的Claude Code，清理所有配置，然后重新安装并正确配置月之暗面API。

## 📁 提供的脚本文件

| 文件名 | 用途 | 使用方法 |
|--------|------|----------|
| `reinstall-claude-oneclick.bat` | **一键重装** (推荐) | 双击运行 |
| `uninstall-claude-complete.ps1` | 完全卸载 | PowerShell运行 |
| `install-claude-fresh.ps1` | 全新安装 | PowerShell运行 |

## 🚀 方法1: 一键重装 (推荐)

### 步骤
1. **右键点击** `reinstall-claude-oneclick.bat`
2. **选择** "以管理员身份运行"
3. **输入** `y` 确认
4. **等待** 脚本完成
5. **重启** PowerShell或命令提示符
6. **测试**: `claude --version`

## 🔧 方法2: 手动分步操作

### 第1步: 完全卸载
```powershell
# 以管理员身份运行PowerShell
powershell.exe -ExecutionPolicy Bypass -File "uninstall-claude-complete.ps1"
```

### 第2步: 全新安装
```powershell
# 继续在PowerShell中运行
powershell.exe -ExecutionPolicy Bypass -File "install-claude-fresh.ps1"
```

### 第3步: 重启终端并测试
```bash
# 重新打开PowerShell
claude --version
claude "你好，测试连接"
```

## 🧹 卸载脚本会清理的内容

### 文件和目录
- `~/.claude/` - Claude配置目录
- `~/.claude.json` - Claude配置文件
- `~/.claude-code-router/` - Router配置
- npm全局安装的claude包
- 所有claude相关的可执行文件

### 环境变量
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_API_URL`
- `CLAUDE_API_KEY`
- `CLAUDE_BASE_URL`
- `CLAUDE_CODE_SSE_PORT`

### 系统PATH
- 清理PATH中的claude相关路径
- 清理npm全局路径

## 🔧 安装脚本会配置的内容

### 环境变量设置
```
ANTHROPIC_BASE_URL=https://api.moonshot.cn/v1
ANTHROPIC_API_KEY=sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti
```

### Router配置
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
        "moonshot-v1-128k",
        "kimi-latest"
      ],
      "transformer": {
        "use": ["openai"]
      }
    }
  ],
  "Router": {
    "default": "kimi2,moonshot-v1-8k",
    "background": "kimi2,moonshot-v1-8k", 
    "think": "kimi2,moonshot-v1-32k",
    "longContext": "kimi2,moonshot-v1-128k",
    "webSearch": "kimi2,moonshot-v1-32k"
  }
}
```

## ✅ 验证安装成功

### 1. 检查版本
```bash
claude --version
# 应该显示版本号，如: 1.0.59 (Claude Code)
```

### 2. 检查环境变量
```bash
echo $env:ANTHROPIC_BASE_URL
# 应该显示: https://api.moonshot.cn/v1
```

### 3. 测试连接
```bash
claude "你好，请介绍一下你自己"
# 应该能正常连接并回复
```

## 🚨 故障排除

### 问题1: 找不到claude命令
**解决方案:**
1. 重启PowerShell
2. 检查PATH环境变量
3. 重新运行安装脚本

### 问题2: API连接失败
**解决方案:**
1. 检查网络连接
2. 验证API密钥有效性
3. 确认环境变量设置正确

### 问题3: 权限错误
**解决方案:**
1. 以管理员身份运行脚本
2. 检查PowerShell执行策略
3. 手动设置环境变量

## 📞 获取帮助

如果重装后仍有问题，请提供以下信息：
1. 操作系统版本
2. Node.js版本 (`node --version`)
3. npm版本 (`npm --version`)
4. 错误信息截图
5. 环境变量设置 (`echo $env:ANTHROPIC_BASE_URL`)

## 🎉 成功标志

重装成功后，你应该能看到：
- ✅ `claude --version` 显示版本号
- ✅ 环境变量正确设置
- ✅ API连接测试成功
- ✅ Claude能正常回复消息
