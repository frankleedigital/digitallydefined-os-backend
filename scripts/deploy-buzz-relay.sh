#!/bin/bash
# Deploy Buzz Relay - Quick Start Script
# For self-hosted Nostr-based collaboration platform

set -e

echo "🐝 Buzz Relay Deployment Script"
echo "================================"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

echo "✓ Docker detected: $(docker --version)"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose not found."
    exit 1
fi

echo "✓ Docker Compose detected"
echo ""

# Clone Buzz repository
if [ ! -d "buzz" ]; then
    echo "📦 Cloning Buzz repository..."
    git clone https://github.com/block/buzz.git
    cd buzz
else
    cd buzz
    echo "✓ Buzz repository already exists"
fi

# Navigate to deploy/compose
cd deploy/compose 2>/dev/null || {
    echo "❌ Could not find deploy/compose directory"
    exit 1
}

# Copy environment file
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from example..."
    cp .env.example .env
    echo ""
    echo "⚠️  Edit .env and replace all CHANGE_ME values"
    echo "   Key settings:"
    echo "   - RELAY_OWNER_PUBKEY: Your Nostr public key"
    echo "   - DATABASE_URL: PostgreSQL connection"
    echo "   - REDIS_URL: Redis connection"
    echo ""
    echo "💡 Generate a keypair with:"
    echo "   python3 -c \"from cryptography.hazmat.primitives.asymmetric import ec; priv = ec.generate_private_key(ec.SECP256K1, None); print(priv.private_numbers().private_value.to_bytes(32, 'big').hex())\""
fi

# Start services
echo ""
echo "🚀 Starting Buzz relay services..."
docker compose up -d

echo ""
echo "✅ Buzz relay is starting!"
echo ""
echo "📊 Check status:"
echo "   docker compose ps"
echo ""
echo "🔗 Access the relay:"
echo "   http://localhost:3000"
echo ""
echo "📋 Add yourself as member:"
echo "   docker compose exec relay buzz-admin add-member --pubkey <YOUR_PUBKEY>"
echo ""
echo "🐝 Ready to connect Hermes!"
