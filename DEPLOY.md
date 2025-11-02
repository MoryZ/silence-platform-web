# 云服务器部署指南

## 前提条件

1. **云服务器**（Linux，推荐 Ubuntu 20.04+ 或 CentOS 7+）
2. **Nginx** 已安装
3. **Node.js** 16+ 和 **npm** 已安装
4. **域名**（可选，也可以使用 IP 访问）

## 部署方案

### 方案一：在服务器上构建和部署（推荐）

#### 1. 准备服务器环境

```bash
# 安装 Node.js 和 npm（如果未安装）
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 安装 Nginx（如果未安装）
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y nginx

# CentOS/RHEL
sudo yum install -y nginx
```

#### 2. 上传项目代码到服务器

```bash
# 方式一：使用 Git
git clone <your-repo-url> /var/www/silence-platform-web-source
cd /var/www/silence-platform-web-source

# 方式二：使用 SCP 上传
scp -r . user@your-server-ip:/var/www/silence-platform-web-source
```

#### 3. 执行部署脚本

```bash
# 进入项目目录
cd /var/www/silence-platform-web-source

# 给脚本添加执行权限
chmod +x deploy.sh

# 修改脚本中的配置
# - DEPLOY_DIR: 部署目录路径
# - DOMAIN: 你的域名

# 执行部署
./deploy.sh
```

#### 4. 配置域名和 DNS

如果使用域名，需要：

1. **配置 DNS A 记录**：将域名指向服务器 IP
2. **修改 Nginx 配置**：将 `nginx.production.conf` 中的 `your-domain.com` 替换为你的实际域名
3. **测试域名解析**：
   ```bash
   ping your-domain.com
   ```

### 方案二：本地构建后上传

#### 1. 本地构建

```bash
# 安装依赖
npm install

# 构建生产版本
npm run build
```

#### 2. 上传到服务器

```bash
# 使用 SCP 上传 dist 目录
scp -r dist user@your-server-ip:/var/www/silence-platform-web/

# 或者使用 rsync（推荐，支持断点续传）
rsync -avz --progress dist/ user@your-server-ip:/var/www/silence-platform-web/dist/
```

#### 3. 配置 Nginx

```bash
# 复制配置文件
sudo cp nginx.production.conf /etc/nginx/sites-available/silence-platform-web.conf

# 修改配置中的域名和路径
sudo nano /etc/nginx/sites-available/silence-platform-web.conf

# 创建软链接（Debian/Ubuntu）
sudo ln -s /etc/nginx/sites-available/silence-platform-web.conf /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl reload nginx
```

## 配置文件说明

### Nginx 配置 (`nginx.production.conf`)

关键配置点：

1. **静态文件目录**：`root /var/www/silence-platform-web/dist;`
2. **API 代理**：所有 `/auth/api/v1`、`/config/api/v1`、`/job/api/v1`、`/mq/api/v1` 请求代理到 `http://115.190.196.117:9000`
3. **Vue Router History 模式**：`try_files $uri $uri/ /index.html;`

### 网关配置

确保你的网关（`115.190.196.117:9000`）已经配置好路由规则：

- `/auth/api/v1/*` → 认证服务
- `/config/api/v1/*` → 配置服务
- `/job/api/v1/*` → 任务服务
- `/mq/api/v1/*` → 消息队列服务

## HTTPS 配置（生产环境推荐）

### 1. 获取 SSL 证书

```bash
# 使用 Let's Encrypt（免费）
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 2. 修改 Nginx 配置

取消注释 `nginx.production.conf` 中的 HTTPS 配置块，并配置证书路径。

### 3. 自动续期

```bash
# 测试自动续期
sudo certbot renew --dry-run

# 添加到 crontab（自动续期）
sudo crontab -e
# 添加：0 0 1 * * certbot renew --quiet
```

## 防火墙配置

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 监控和日志

### 查看 Nginx 日志

```bash
# 访问日志
sudo tail -f /var/log/nginx/silence-platform-web-access.log

# 错误日志
sudo tail -f /var/log/nginx/silence-platform-web-error.log
```

### 监控 Nginx 状态

```bash
# 检查 Nginx 运行状态
sudo systemctl status nginx

# 检查端口监听
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

## 常见问题

### 1. 502 Bad Gateway

- 检查网关服务是否运行：`curl http://115.190.196.117:9000/health`
- 检查 Nginx 配置中的 proxy_pass 地址是否正确
- 查看 Nginx 错误日志

### 2. 404 Not Found（刷新页面后）

- 确保配置了 `try_files $uri $uri/ /index.html;`
- 检查 Vue Router 是否使用 History 模式

### 3. CORS 错误

- 检查 Nginx 配置中的 CORS 头设置
- 检查网关服务是否配置了 CORS

### 4. 静态资源加载失败

- 检查文件权限：`sudo chown -R www-data:www-data /var/www/silence-platform-web/dist`
- 检查 Nginx 配置中的 root 路径是否正确
- 检查文件是否已上传

## 回滚版本

如果部署出现问题，可以快速回滚：

```bash
# 查看备份
ls -la /var/www/backups/silence-platform-web/

# 回滚到指定备份
sudo rm -rf /var/www/silence-platform-web/dist
sudo cp -r /var/www/backups/silence-platform-web/backup-YYYYMMDD-HHMMSS /var/www/silence-platform-web/dist
sudo systemctl reload nginx
```

## 自动化部署（CI/CD）

可以使用 GitHub Actions、GitLab CI 或其他 CI/CD 工具自动化部署流程。

示例 GitHub Actions workflow（`.github/workflows/deploy.yml`）：

```yaml
name: Deploy to Server

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - name: Deploy to server
        uses: easingthemes/ssh-deploy@v4
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          SOURCE: "dist/"
          TARGET: "/var/www/silence-platform-web/dist"
```

## 注意事项

1. **安全**：生产环境建议启用 HTTPS
2. **备份**：定期备份重要数据
3. **监控**：配置日志监控和错误告警
4. **更新**：定期更新依赖包和系统补丁
5. **性能**：根据实际情况调整 Nginx 的 worker 进程数和连接数

