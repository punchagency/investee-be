#!/bin/bash

# ============================================
# Supabase Self-Hosted Setup Script for VPS
# ============================================
# Run this script on your VPS (Ubuntu 22.04)
# Usage: chmod +x setup-supabase-vps.sh && ./setup-supabase-vps.sh
# ============================================

set -e

echo "=========================================="
echo "Supabase Self-Hosted Setup"
echo "=========================================="

# Get VPS IP address
VPS_IP=$(curl -s ifconfig.me)
echo "Detected VPS IP: $VPS_IP"

# Create directory for Supabase
SUPABASE_DIR="$HOME/supabase"
echo "Setting up Supabase in: $SUPABASE_DIR"

# Clone Supabase self-hosted repository
if [ -d "$SUPABASE_DIR" ]; then
    echo "Supabase directory exists, pulling latest..."
    cd "$SUPABASE_DIR"
    git pull
else
    echo "Cloning Supabase repository..."
    git clone --depth 1 https://github.com/supabase/supabase "$SUPABASE_DIR"
fi

cd "$SUPABASE_DIR/docker"

# Generate secure secrets
echo "Generating secure secrets..."
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
JWT_SECRET=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
DASHBOARD_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)

# Generate JWT tokens using the secret
# ANON_KEY: role=anon, exp=10 years from now
# SERVICE_ROLE_KEY: role=service_role, exp=10 years from now
ANON_KEY=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64 -w 0 | tr -d '=' | tr '/+' '_-').$(echo -n '{"role":"anon","iss":"supabase","iat":'$(date +%s)',"exp":'$(($(date +%s) + 315360000))'}' | base64 -w 0 | tr -d '=' | tr '/+' '_-')
SERVICE_ROLE_KEY=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64 -w 0 | tr -d '=' | tr '/+' '_-').$(echo -n '{"role":"service_role","iss":"supabase","iat":'$(date +%s)',"exp":'$(($(date +%s) + 315360000))'}' | base64 -w 0 | tr -d '=' | tr '/+' '_-')

# Sign the JWTs (simplified - for production use proper JWT library)
# Note: These are unsigned JWTs - Supabase will work but for production, use proper signing
echo "Note: For production, regenerate JWT keys using https://supabase.com/docs/guides/self-hosting#api-keys"

# Copy and configure .env
cp .env.example .env

# Update .env with generated values
sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|g" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env
sed -i "s|DASHBOARD_USERNAME=.*|DASHBOARD_USERNAME=admin|g" .env
sed -i "s|DASHBOARD_PASSWORD=.*|DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD|g" .env

# Set URLs for IP-based access
sed -i "s|SITE_URL=.*|SITE_URL=http://$VPS_IP:3000|g" .env
sed -i "s|API_EXTERNAL_URL=.*|API_EXTERNAL_URL=http://$VPS_IP:8000|g" .env
sed -i "s|SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=http://$VPS_IP:8000|g" .env

# Disable email confirmation for easier testing
sed -i "s|ENABLE_EMAIL_AUTOCONFIRM=.*|ENABLE_EMAIL_AUTOCONFIRM=true|g" .env

# Update Kong to listen on all interfaces
sed -i "s|KONG_HTTP_PORT=.*|KONG_HTTP_PORT=8000|g" .env

echo "=========================================="
echo "Starting Supabase services..."
echo "=========================================="

docker compose pull
docker compose up -d

# Wait for services to start
echo "Waiting for services to initialize (60 seconds)..."
sleep 60

# Check service status
echo "=========================================="
echo "Service Status:"
echo "=========================================="
docker compose ps

echo ""
echo "=========================================="
echo "SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "Access Supabase Studio at: http://$VPS_IP:3000"
echo "  Username: admin"
echo "  Password: $DASHBOARD_PASSWORD"
echo ""
echo "API URL: http://$VPS_IP:8000"
echo ""
echo "=========================================="
echo "SAVE THESE CREDENTIALS (shown only once):"
echo "=========================================="
echo ""
echo "PostgreSQL Password: $POSTGRES_PASSWORD"
echo "JWT Secret: $JWT_SECRET"
echo "Dashboard Password: $DASHBOARD_PASSWORD"
echo ""
echo "Database Connection String:"
echo "postgresql://postgres:$POSTGRES_PASSWORD@localhost:5432/postgres"
echo ""
echo "=========================================="
echo "For your Investee .env file:"
echo "=========================================="
echo ""
echo "VITE_SUPABASE_URL=http://$VPS_IP:8000"
echo "VITE_SUPABASE_ANON_KEY=<get from Supabase Studio > Settings > API>"
echo ""
echo "SUPABASE_URL=http://$VPS_IP:8000"
echo "SUPABASE_SERVICE_ROLE_KEY=<get from Supabase Studio > Settings > API>"
echo "DATABASE_URL=postgresql://postgres:$POSTGRES_PASSWORD@$VPS_IP:5432/postgres"
echo ""
echo "=========================================="
echo "IMPORTANT: Open these ports in your firewall:"
echo "=========================================="
echo "- Port 3000 (Supabase Studio)"
echo "- Port 8000 (Supabase API)"
echo "- Port 5432 (PostgreSQL - only if external access needed)"
echo ""
echo "To open ports with ufw:"
echo "  sudo ufw allow 3000"
echo "  sudo ufw allow 8000"
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop: docker compose down"
echo "To restart: docker compose up -d"
