#!/bin/bash

echo "🔧 Configuring PostgreSQL for Docker access..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

echo "✅ PostgreSQL is running"

# Find PostgreSQL configuration files
POSTGRES_CONF=$(find /etc -name "postgresql.conf" 2>/dev/null | head -1)
PG_HBA_CONF=$(find /etc -name "pg_hba.conf" 2>/dev/null | head -1)

if [ -z "$POSTGRES_CONF" ] || [ -z "$PG_HBA_CONF" ]; then
    echo "❌ Could not find PostgreSQL configuration files"
    exit 1
fi

echo "📁 Found PostgreSQL config: $POSTGRES_CONF"
echo "📁 Found pg_hba.conf: $PG_HBA_CONF"

# Create backup of configuration files
echo "💾 Creating backups..."
sudo cp "$POSTGRES_CONF" "$POSTGRES_CONF.backup.$(date +%Y%m%d_%H%M%S)"
sudo cp "$PG_HBA_CONF" "$PG_HBA_CONF.backup.$(date +%Y%m%d_%H%M%S)"

# Configure listen_addresses
echo "🔧 Configuring listen_addresses..."
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$POSTGRES_CONF"

# Add Docker network access to pg_hba.conf
echo "🔧 Adding Docker network access to pg_hba.conf..."
echo "# Docker network access" | sudo tee -a "$PG_HBA_CONF"
echo "host    all             all             172.16.0.0/12          md5" | sudo tee -a "$PG_HBA_CONF"
echo "host    all             all             192.168.0.0/16         md5" | sudo tee -a "$PG_HBA_CONF"

# Restart PostgreSQL
echo "🔄 Restarting PostgreSQL..."
sudo systemctl restart postgresql

# Wait for PostgreSQL to start
echo "⏳ Waiting for PostgreSQL to start..."
sleep 5

# Test connection
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✅ PostgreSQL is running and configured for Docker access"
    echo ""
    echo "📋 Configuration summary:"
    echo "   - listen_addresses = '*' (accepts connections from any IP)"
    echo "   - Added Docker network ranges to pg_hba.conf"
    echo "   - PostgreSQL restarted successfully"
    echo ""
    echo "🚀 You can now run: docker compose up backend"
else
    echo "❌ PostgreSQL failed to start. Check the logs:"
    echo "   sudo journalctl -u postgresql -f"
    exit 1
fi
