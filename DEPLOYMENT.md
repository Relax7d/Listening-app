# ListenAI - 部署指南

## 方案一：局域网共享（最简单，适合多人同时使用）

### 步骤：

1. **获取本机IP地址**
   - Windows: 打开命令提示符，输入 `ipconfig`，查找 "IPv4 地址"
   - 例如: `192.168.1.100`

2. **启动服务器**
   ```bash
   node server.js
   ```

3. **其他人访问**
   - 在同一WiFi下的其他设备浏览器中输入:
   - `http://192.168.1.100:3000` (替换为你的IP)

4. **注意事项**
   - 电脑必须保持开机和服务器运行
   - 防火墙可能需要允许3000端口

---

## 方案二：云服务器部署（适合永久访问）

### 推荐使用免费的云服务：

#### 1. Render.com (免费套餐)
- 注册账号: https://render.com
- 新建 Web Service
- 连接GitHub仓库（需要先上传代码）
- 配置:
  - Runtime: Node.js
  - Build Command: `npm install`
  - Start Command: `node server.js`
  - Port: 3000

#### 2. Railway.app (免费额度)
- 注册账号: https://railway.app
- 点击 "New Project" → "Deploy from GitHub repo"
- Railway会自动检测Node.js项目并配置
- 部署后获得公网访问地址

#### 3. Vercel (需修改配置)
- Vercel主要用于前端，需要改造为无服务器架构
- 不推荐，因为本项目有后端API

---

## 方案三：使用CloudBase/其他云服务（推荐）

如果需要数据库和用户认证，可以使用云服务：

1. 在IDE中点击"集成"菜单
2. 选择 CloudBase 或 其他服务
3. 按提示配置部署

---

## 配置说明

### 环境变量设置（可选）

创建 `.env` 文件：
```
PORT=3000
DEFAULT_API_KEY=your_api_key_here
DEFAULT_PROVIDER=deepseek
```

### API Key 安全

如果部署到公网，建议：
1. 不要将API Key硬编码在代码中
2. 使用环境变量存储
3. 让用户自己配置API Key（已有此功能）

---

## 上传代码到GitHub（云部署需要）

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/listenai.git
git push -u origin main
```

---

## 用户使用说明

### 方法一：用户提供自己的API Key（推荐）
- 用户点击"配置"按钮
- 输入自己的API Key
- 立即可用

### 方法二：使用共享API Key（需自行配置）
- 修改 `server.js` 中的默认API Key
- ⚠️ **注意风险**：Key会被所有用户共享，可能超出额度

---

## 快速开始（推荐流程）

### 给朋友分享：
1. 确保你和朋友在同一WiFi下
2. 运行 `node server.js`
3. 告诉朋友: `http://你的IP:3000`
4. 朋友打开后配置自己的API Key即可使用

### 长期使用：
1. 将代码上传到GitHub
2. 使用 Render/Railway 免费部署
3. 分享部署后的公网地址
4. 让用户自己配置API Key

---

## 常见问题

### Q: 为什么我的朋友访问不了？
- 检查防火墙设置
- 确认IP地址正确
- 确保服务器正在运行

### Q: API Key会被盗用吗？
- 如果使用"方案一"且用户自己配置Key，不会
- 如果使用默认共享Key，会有风险

### Q: 部署到云端需要花钱吗？
- Render/Railway 有免费套餐，足够个人使用
- 流量较大时可能产生费用

---

## 推荐方案

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| 临时测试/演示 | 方案一 | 无需配置，立即可用 |
| 小团队长期使用 | 方案二（Railway） | 免费且稳定 |
| 需要用户管理 | 方案三（CloudBase） | 支持数据库和认证 |
