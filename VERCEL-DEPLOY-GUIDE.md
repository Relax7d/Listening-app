# Vercel 部署指南

## ✅ 已完成的改造

已将项目从传统Node.js服务器改造为 Vercel 无服务器架构（Serverless Functions）。

### 改造内容：

1. **创建 API 目录和函数**
   - `/api/generate.js` - 文本生成API
   - `/api/generate-questions.js` - 题目生成API

2. **添加 Vercel 配置**
   - `vercel.json` - Vercel 部署配置

3. **修改前端 API 调用**
   - 自动检测运行环境（Vercel/本地）
   - 使用相对路径调用 API

---

## 🚀 部署步骤

### 步骤 1：上传文件到 GitHub

将以下文件上传到您的仓库 `Relax7d/Listening-app`：

**核心文件：**
```
✓ index.html
✓ script.js
✓ styles.css
✓ package.json
✓ .gitignore
```

**新增文件：**
```
✓ api/generate.js
✓ api/generate-questions.js
✓ vercel.json
```

**文档文件（可选）：**
```
✓ README.md
✓ DEPLOYMENT.md
✓ VERCEL-DEPLOY-GUIDE.md (本文件)
✓ 其他说明文档
```

**不要上传：**
```
✗ .env (不要上传API Key)
✗ node_modules/
```

---

### 步骤 2：在 Vercel 导入项目

1. **访问 Vercel Dashboard**
   - 打开 https://vercel.com/dashboard

2. **添加新项目**
   - 点击 "Add New" → "Project"
   - 选择 "Import Git Repository"
   - 搜索并选择 `Relax7d/Listening-app`
   - 点击 "Import"

3. **配置环境变量（可选）**
   - 在项目设置中添加 `DEFAULT_API_KEY` 和 `DEFAULT_PROVIDER`
   - 或者让用户自己配置 API Key（推荐）

4. **自动部署**
   - Vercel 会自动检测并部署
   - 等待 2-5 分钟完成部署

5. **获取公网地址**
   - 部署成功后会显示类似：
   - `https://listening-app-kohl.vercel.app`

---

## 🔧 环境变量配置（可选）

### Vercel 环境变量设置：

在 Vercel Dashboard → Settings → Environment Variables 中添加：

```
DEFAULT_API_KEY = your_api_key_here
DEFAULT_PROVIDER = deepseek
```

**注意：**
- ⚠️ 不要在生产环境暴露 API Key
- ✅ 推荐让用户自己配置（已实现）
- 🔒 环境变量仅在 Vercel 环境中使用

---

## ✅ 功能验证

部署完成后，访问公网地址测试：

### 测试清单：

- [ ] 网页正常打开
- [ ] 生成英文文本功能
- [ ] 播放功能正常
- [ ] 生成雅思题目功能
- [ ] 难度级别控制
- [ ] 题目数量选择（5/10/15道）
- [ ] 题目验证功能
- [ ] API Key 配置功能

---

## 📊 部署说明

### Vercel 的优势：

✅ **免费套餐**
- 100GB 带宽/月
- 无限部署
- 自动 HTTPS
- 全球 CDN 加速

✅ **Serverless Functions**
- 按需执行，不闲置收费
- 自动扩展
- 无需管理服务器

✅ **Git 集成**
- 推送代码自动部署
- 预览环境
- 回滚支持

---

## 🔍 故障排除

### 问题 1：API 调用失败

**原因：** 未配置 API Key

**解决：**
- 让用户在页面中点击"配置"按钮
- 输入自己的 API Key

---

### 问题 2：部署后功能异常

**原因：** API 路径错误

**解决：**
- 检查浏览器控制台错误
- 确认 `/api/generate.js` 文件存在
- 查看 Vercel 部署日志

---

### 问题 3：生成速度慢

**原因：** Serverless Functions 冷启动

**解决：**
- 首次调用较慢（正常）
- 后续调用会加快
- Vercel 会自动优化

---

## 📝 注意事项

1. **不要使用 `server.js`**
   - Vercel 使用 `/api` 目录中的函数
   - `server.js` 不再需要

2. **保留本地开发环境**
   - 本地仍可运行 `node server.js`
   - 通过 `http://localhost:3000` 访问

3. **版本控制**
   - 每次推送到 GitHub 会自动部署
   - 建议打 tag 标记重要版本

---

## 🎉 完成

现在您可以将应用分享给全世界使用了！

**分享链接：** `https://listening-app-kohl.vercel.app`

让用户：
1. 访问该链接
2. 配置自己的 API Key
3. 开始使用雅思听力练习

---

**需要帮助？**
- 查看 Vercel 部署日志
- 检查浏览器控制台错误
- 确认环境变量配置正确
