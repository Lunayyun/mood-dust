# Moon Dust

一个带有心情日记、冥想、社区分享和账号资源管理功能的 Flask + SQLite 项目。

## GitHub Pages

GitHub Pages 只能托管静态文件，适合预览以下页面：

- `mood_dust.html`
- `meditation.html`
- `community.html`
- `account_management.html`

当前项目的登录、日记、社区同步、账号管理和 AI 接口依赖 Flask 服务与 SQLite，不能仅靠 GitHub Pages 运行。要完整部署，请将后端部署到支持 Python 的服务，并将前端 API 地址配置为后端地址。

## 本地运行

1. 复制 `.env.example` 为 `.env`，填写随机的 `SECRET_KEY` 和 `JWT_SECRET_KEY`。
2. 安装依赖：`pip install flask flask-cors sqlalchemy pyjwt requests`
3. 启动服务：`python app.py`
4. 打开 `http://127.0.0.1:5000/`

本地数据库文件 `mood_dust.db`、日志和密钥不会提交到公开仓库。

## 安全说明

- 不要提交 `.env`、数据库文件、日志文件或任何真实 API Key。
- 之前曾暴露过的 API Key 应在对应服务控制台撤销并重新生成。
- 生产环境请使用强随机密钥、HTTPS、正式 WSGI 服务和独立数据库。

## GitHub Pages 发布

仓库中的 `.github/workflows/pages.yml` 会将静态前端文件发布到 GitHub Pages。Pages 版本不包含可运行的 Flask 后端。
