# 修复 Vercel 部署错误

## 🔧 已修复的问题

### 1. 更新了 `package.json`
- ❌ 移除了 `"main": "server.js"`
- ❌ 移除了 `"start": "node server.js"`
- ❌ 移除了不需要的依赖（express, cors, dotenv）
- ✅ 只保留 `axios`（API调用需要）

### 2. 简化了 `vercel.json`
- ❌ 移除了自定义路由（可能引起冲突）
- ✅ 使用默认配置（Vercel 自动检测 `/api` 目录）

### 3. API 函数使用 CommonJS 格式
- ✅ 使用 `module.exports` 导出
- ✅ Vercel 兼容的 Node.js 运行时

---

## 📋 现在需要上传的文件

### 核心文件（必须上传）：
```
✓ index.html
✓ script.js
✓ styles.css
✓ package.json (已更新）
✓ .gitignore (必须）
```

### API 函数（必须上传）：
```
✓ api/generate.js (文本生成）
✓ api/generate-questions.js (题目生成）
```

### 配置文件（必须上传）：
```
✓ vercel.json (已简化）
```

### 文档文件（可选，不上传也行）：
```
✓ README.md
✓ DEPLOYMENT.md
✓ VERCEL-DEPLOY-GUIDE.md
✓ VERCEL-FIX.md (本文件）
✓ 其他说明文档
```

### 不要上传的文件：
```
✗ .env (包含敏感信息）
✗ server.js (Vercel 不使用）
✗ node_modules/ (太大）
```

---

## 🚀 部署步骤（重新部署）

### 步骤 1：更新 GitHub 仓库

**方法 A：通过 GitHub 网页（推荐）**

1. 打开：https://github.com/Relax7d/Listening-app
2. 点击 "Add file" → "Upload files"
3. 逐个上传以下文件（或拖拽多个文件）：

**必须上传：**
- index.html
- script.js
- styles.css
- package.json
- .gitignore
- api/generate.js
- api/generate-questions.js
- vercel.json

4. 填写 commit message：`"Fix Vercel deployment errors"`
5. 点击 "Commit changes"

**方法 B：通过 Git 命令行（如果有 Git）**

```bash
git add .
git commit -m "Fix Vercel deployment errors"
git push origin main
```

---

### 步骤 2：触发 Vercel 重新部署

**方式一：自动部署（如果已连接 GitHub）**
- Vercel 会自动检测到更新
- 等待 2-5 分钟自动部署

**方式二：手动重新部署**
1. 访问 Vercel Dashboard
2. 找到 `listening-app` 项目
3. 点击 "Redeploy" 按钮
4. 等待重新部署完成

---

## ✅ 验证部署

部署成功后：

1. **访问测试地址**
   - https://listening-app-kohl.vercel.app

2. **检查以下功能：**
   - [ ] 页面正常加载
   - [ ] 生成文本功能
   - [ ] 播放功能
   - [ ] 生成雅思题目
   - [ ] 配置 API Key
   - [ ] 所有按钮工作正常

3. **查看 Vercel 部署日志**
   - 在 Dashboard 查看是否有错误
   - 如果有错误，查看详情

---

## 🔍 常见部署错误及解决方案

### 错误 1：`package.json` 格式错误

**错误信息：**
```
Error: Invalid package.json
```

**解决方案：**
- 确保 JSON 格式正确（无多余逗号）
- 确保 `name` 和 `version` 字段存在

---

### 错误 2：缺少依赖

**错误信息：**
```
Error: Cannot find module 'axios'
```

**解决方案：**
- 检查 `package.json` 中是否有 `axios`
- 上传后检查 Vercel 日志

---

### 错误 3：API 函数未找到

**错误信息：**
```
Error: 404 Not Found
```

**解决方案：**
- 确保 `api/generate.js` 和 `api/generate-questions.js` 存在
- 确保文件在 `/api` 目录下

---

### 错误 4：API 调用失败

**错误信息：**
```
Error: 500 Internal Server Error
```

**解决方案：**
- 检查 API 函数代码中的语法错误
- 查看 Vercel Functions 日志
- 确认 `axios` 依赖正确

---

## 🎯 最终检查清单

部署前确认：

- [ ] 已更新 `package.json`（移除 server.js 引用）
- [ ] 已简化 `vercel.json`
- [ ] 已上传所有 API 函数到 `/api` 目录
- [ ] 已创建 `.gitignore` 文件
- [ ] 未上传 `.env` 文件
- [ ] 未上传 `node_modules/` 目录
- [ ] 未上传 `server.js` 文件

---

## 📝 package.json 最终内容

```json
{
  "name": "english-reading-app",
  "version": "1.0.0",
  "description": "英语听力朗读应用 - 支持AI文本生成",
  "scripts": {
    "start": "vercel dev",
    "dev": "vercel dev"
  },
  "keywords": [
    "english",
    "reading",
    "speech",
    "ai"
  ],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "axios": "^1.13.6"
  }
}
```

---

## 🚀 开始部署

**现在可以重新部署了！**

按照上面的步骤更新 GitHub 后，Vercel 会自动重新部署。

预计部署时间：2-5 分钟

部署成功后，应用将可以在全球访问！
