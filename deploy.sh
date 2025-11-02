#!/bin/bash

# 云服务器部署脚本
# 使用方法: ./deploy.sh

set -e  # 遇到错误立即退出

echo "🚀 开始部署 Silence Platform Web..."

# 配置变量（根据实际情况修改）
DEPLOY_DIR="/var/www/silence-platform-web"
BACKUP_DIR="/var/www/backups/silence-platform-web"
NGINX_CONFIG="/etc/nginx/sites-available/silence-platform-web.conf"
DOMAIN="${1:-your-domain.com}"  # 支持命令行参数传入域名，默认使用 your-domain.com

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装，请先安装 npm${NC}"
    exit 1
fi

# 1. 构建项目
echo -e "${YELLOW}📦 正在构建项目...${NC}"
npm install
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 构建失败，dist 目录不存在${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 构建完成${NC}"

# 2. 创建部署目录
echo -e "${YELLOW}📁 创建部署目录...${NC}"
sudo mkdir -p $DEPLOY_DIR
sudo mkdir -p $BACKUP_DIR

# 3. 备份旧版本（如果存在）
if [ -d "$DEPLOY_DIR/dist" ]; then
    echo -e "${YELLOW}💾 备份旧版本...${NC}"
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    sudo mv $DEPLOY_DIR/dist $BACKUP_DIR/$BACKUP_NAME
    echo -e "${GREEN}✅ 旧版本已备份到: $BACKUP_DIR/$BACKUP_NAME${NC}"
fi

# 4. 部署新版本
echo -e "${YELLOW}🚀 部署新版本...${NC}"
sudo cp -r dist $DEPLOY_DIR/
sudo chown -R www-data:www-data $DEPLOY_DIR/dist
sudo chmod -R 755 $DEPLOY_DIR/dist

echo -e "${GREEN}✅ 部署完成${NC}"

# 5. 配置 Nginx（如果配置文件不存在）
if [ ! -f "$NGINX_CONFIG" ]; then
    echo -e "${YELLOW}⚙️  配置 Nginx...${NC}"
    sudo cp nginx.production.conf $NGINX_CONFIG
    
    # 替换配置文件中的域名和路径
    sudo sed -i "s|your-domain.com|$DOMAIN|g" $NGINX_CONFIG
    sudo sed -i "s|/var/www/silence-platform-web/dist|$DEPLOY_DIR/dist|g" $NGINX_CONFIG
    
    # 创建软链接（Debian/Ubuntu）
    if [ ! -f "/etc/nginx/sites-enabled/silence-platform-web.conf" ]; then
        sudo ln -s $NGINX_CONFIG /etc/nginx/sites-enabled/
    fi
    
    echo -e "${GREEN}✅ Nginx 配置完成${NC}"
fi

# 6. 测试 Nginx 配置
echo -e "${YELLOW}🔍 测试 Nginx 配置...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx 配置正确${NC}"
else
    echo -e "${RED}❌ Nginx 配置有误，请检查${NC}"
    exit 1
fi

# 7. 重启 Nginx
echo -e "${YELLOW}🔄 重启 Nginx...${NC}"
sudo systemctl reload nginx

echo -e "${GREEN}✅ Nginx 已重启${NC}"

# 8. 清理旧备份（保留最近 5 个备份）
echo -e "${YELLOW}🧹 清理旧备份...${NC}"
cd $BACKUP_DIR
ls -t | tail -n +6 | xargs -r sudo rm -rf
echo -e "${GREEN}✅ 清理完成${NC}"

echo -e "${GREEN}🎉 部署成功！${NC}"
echo -e "${GREEN}访问地址: http://$DOMAIN${NC}"

