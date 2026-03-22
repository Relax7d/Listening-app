# Vercel API 部署修复指南

## 问题诊断

当前问题是 Vercel 部署后前端可以访问，但后端 API 无法调用。这通常是因为：

1. Vercel 没有正确识别 `/api` 目录中的 serverless functions
2. 路由配置不正确
3. 环境变量未配置

## 已完成的修复

### 1. 更新 vercel.json 配置
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/*.js",
      "use": "@vercel/node"
    },
    {
      "src": "*.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

### 2. 更新 package.json
```json
{
  "scripts": {
    "dev": "vercel dev",
    "build": "vercel build",
    "start": "vercel start"
  }
}
```

### 3. 前端已配置环境检测
```javascript
const apiBaseUrl = window.location.hostname.includes('vercel.app')
    ? '/api'
    : 'http://localhost:3000/api';
```

## 重新部署步骤

### 方案 A：通过 GitHub 自动部署（推荐）

1. **提交所有更改到 GitHub**
   ```bash
   git add .
   git commit -m "Fix Vercel API deployment configuration"
   git push
   ```

2. **在 Vercel 控制台配置环境变量**
   - 访问 https://vercel.com/dashboard
   - 找到你的项目 `listening-app-kohl`
   - 进入 Settings → Environment Variables
   - 添加以下环境变量：
     - `DEFAULT_API_KEY`: 你的 DeepSeek API Key
     - `DEFAULT_PROVIDER`: `deepseek`（或其他提供商）

3. **触发重新部署**
   - Vercel 会自动检测到新的提交
   - 在 Deployments 页面点击 "Redeploy" 按钮
   - 等待部署完成

### 方案 B：使用 Vercel CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署到生产环境**
   ```bash
   vercel --prod
   ```

## 验证部署

部署完成后，访问你的网站：
```
https://listening-app-kohl.vercel.app
```

### 测试 API 端点

1. **测试文本生成 API**
   - 在浏览器打开开发者工具（F12）
   - 进入 Console 标签
   - 执行：
   ```javascript
   fetch('/api/generate', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       apiKey: 'your_api_key',
       provider: 'deepseek',
       theme: 'test',
       difficulty: 'intermediate'
     })
   }).then(r => r.json()).then(console.log)
   ```

2. **检查 Network 标签**
   - 生成内容时，查看 Network 标签
   - 确认 `/api/generate` 和 `/api/generate-questions` 请求成功
   - 状态码应该是 200

## 常见问题

### 1. API 返回 404 或 500

**原因**：serverless functions 未正确部署

**解决方案**：
- 检查 `/api` 目录中的文件是否是 CommonJS 格式（使用 `module.exports`）
- 确保 vercel.json 配置正确
- 查看 Vercel 部署日志

### 2. CORS 错误

**原因**：跨域请求被阻止

**解决方案**：
- API 文件中已添加 CORS 头：
  ```javascript
  res.setHeader('Access-Control-Allow-Origin', '*');
  ```
- 前端使用相对路径 `/api` 而不是绝对路径

### 3. 环境变量未加载

**原因**：Vercel 环境变量未配置

**解决方案**：
- 在 Vercel 控制台的 Environment Variables 中配置
- 部署后重新部署才能生效

## 项目结构

```
listening-app/
├── api/                    # Serverless Functions（Vercel 自动识别）
│   ├── generate.js        # 文本生成 API
│   └── generate-questions.js  # 题目生成 API
├── index.html             # 前端页面
├── script.js              # 前端脚本
├── styles.css             # 样式文件
├── package.json           # 依赖配置
├── vercel.json            # Vercel 配置
└── .env.example           # 环境变量示例
```

## 本地开发

使用 Vercel CLI 进行本地开发：

```bash
# 启动本地开发服务器
vercel dev

# 应用将在 http://localhost:3000 运行
# API 端点将在 http://localhost:3000/api/* 可用
```

## 部署后检查清单

- [ ] 前端页面可以访问
- [ ] API 端点返回 200 状态码
- [ ] 能够生成文本内容
- [ ] 能够生成题目
- [ ] 播放功能正常工作
- [ ] 所有难度级别可用
- [ ] 题目数量限制正常工作

## 联系与支持

如果部署后仍有问题，请：

1. 查看 Vercel 部署日志
2. 检查浏览器控制台错误
3. 访问 https://vercel.com/docs 了解更多
