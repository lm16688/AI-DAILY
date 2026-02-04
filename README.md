# 🤖 AI Daily - 每日 AI 资讯聚合

自动抓取全球 AI 新闻，每日更新，支持中英文源。

## 功能特性

- ✅ 自动抓取 TechCrunch、MIT Technology Review 等英文源
- ✅ 支持机器之心、36氪等中文科技媒体
- ✅ 智能分类：行业动态、AI工具、研究前沿、商业应用、安全伦理
- ✅ 自动生成小红书笔记
- ✅ 每日自动更新（GitHub Actions）
- ✅ 备用数据机制（API 失败时自动切换）

## 快速开始

### 1. 注册 NewsAPI（免费）
- 访问 [newsapi.org](https://newsapi.org)
- 注册获取 API Key（免费版 100 请求/天）

### 2. Fork 本仓库
- 点击右上角 Fork 按钮

### 3. 设置 Secrets
- 进入仓库 Settings → Secrets and variables → Actions
- 点击 New repository secret
- Name: `NEWS_API_KEY`
- Value: 你的 NewsAPI Key

### 4. 启用 GitHub Pages
- Settings → Pages
- Source: Deploy from a branch
- Branch: gh-pages (如果没有，先运行一次 Actions)

### 5. 手动运行更新
- Actions 标签 → Update AI Daily News
- 点击 Run workflow

### 6. 访问网站
- 等待 Actions 运行完成
- 访问 `https://你的用户名.github.io/ai-daily/`

## 项目结构
