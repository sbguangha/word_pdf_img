#!/bin/bash

# SSL证书自动配置脚本 (Let's Encrypt)

echo "🔒 配置SSL证书..."

# 检查域名参数
if [ -z "$1" ]; then
    read -p "请输入您的域名 (例如: formatmagic.com): " DOMAIN
else
    DOMAIN=$1
fi

if [ -z "$DOMAIN" ]; then
    echo "❌ 域名不能为空"
    exit 1
fi

echo "📦 安装Certbot..."
apt update
apt install -y certbot python3-certbot-nginx

echo "🔐 申请SSL证书..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

echo "⏰ 设置自动续期..."
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

echo "✅ SSL证书配置完成！"
echo "🌐 HTTPS地址: https://$DOMAIN"

# 测试证书
echo "🧪 测试SSL证书..."
certbot certificates
