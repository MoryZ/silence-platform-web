# Nginx 配置说明

## 方案说明

将所有的 API 请求通过统一的网关（9000端口）进行路由，使用域名访问而不显示端口。

## 配置步骤

### 1. 配置本地 hosts 文件（开发环境）

编辑 `C:\Windows\System32\drivers\etc\hosts`（Windows）或 `/etc/hosts`（Mac/Linux），添加：

```
127.0.0.1 api.localhost
```

### 2. 配置 Nginx

#### 方式一：使用网关统一路由（推荐）

将 `nginx.example.conf` 中的配置复制到你的 nginx 配置文件（通常在 `/etc/nginx/sites-available/` 或 `/etc/nginx/conf.d/`）。

然后重启 nginx：

```bash
# 测试配置
nginx -t

# 重启 nginx
sudo systemctl restart nginx  # Linux
# 或
brew services restart nginx   # Mac
```

#### 方式二：直接修改 vite.config.ts 使用 localhost:9000

如果不需要通过域名访问，可以直接在 `vite.config.ts` 中使用：

```typescript
target: 'http://localhost:9000',
```

### 3. 网关配置

确保你的网关（9000端口）已经配置好路由规则，能够根据路径前缀（如 `/auth/api/v1`、`/config/api/v1`）路由到对应的后端服务。

### 4. 生产环境配置

生产环境建议：

1. 使用真实的域名（如 `api.yourdomain.com`）
2. 配置 SSL 证书（HTTPS）
3. 配置防火墙规则
4. 使用负载均衡（如果需要）

示例：

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:9000;
        # ... 其他配置同上
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## 注意事项

1. 确保网关服务运行在 `localhost:9000`
2. 确保 nginx 服务正常运行
3. 开发环境使用 `api.localhost`，生产环境使用真实域名
4. 如果需要跨域，确保网关或 nginx 已配置 CORS

