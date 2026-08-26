#!/bin/bash
# Configure Hermes Gateway for Buzz Integration
# Sets up Hermes as a first-class messaging platform in Buzz

set -e

echo "🐝 Configuring Hermes Gateway for Buzz"
echo "========================================"
echo ""

# Check if Hermes is available
if ! command -v hermes &> /dev/null; then
    echo "❌ Hermes not found in PATH"
    exit 1
fi

echo "✓ Hermes detected: $(hermes --version)"
echo ""

# Check if Buzz CLI is available
BUZZ_CLI=""
for path in ~/.local/bin/buzz ~/bin/buzz /usr/local/bin/buzz; do
    if [ -f "$path" ]; then
        BUZZ_CLI="$path"
        break
    fi
done

if [ -z "$BUZZ_CLI" ]; then
    echo "⚠️  Buzz CLI not found in common locations"
    echo "   Hermes will use the buzz-cli skill from ~/.buzz/"
    echo ""
fi

# Get relay URL from user's Buzz config
RELAY_URL="wss://digitallydefinedlab.communities.buzz.xyz"
echo "✓ Relay URL: $RELAY_URL"
echo ""

# Configure Hermes gateway for Buzz
echo "📝 Configuring Hermes gateway..."
echo ""

# Create config snippet for Buzz platform
cat << 'EOF' > /tmp/buzz-gateway-config.yaml
gateway:
  platforms:
    buzz:
      enabled: true
      extra:
        relay_url: wss://digitallydefinedlab.communities.buzz.xyz
        channels: []  # Empty = watch all joined channels
        home_channel: ""  # Set to your main channel UUID
        poll_interval: 4
        cli_path: ""  # Auto-discover
        credentials_file: ""  # Use BUZZ_PRIVATE_KEY env var
        allowed_users: []
        require_mention: false
        allow_all_users: true
EOF

echo "✓ Gateway config created at /tmp/buzz-gateway-config.yaml"
echo ""
echo "Next steps:"
echo "1. Run: hermes gateway setup"
echo "2. Select 'Buzz' when prompted"
echo "3. Follow the wizard to configure your Nostr identity"
echo ""
echo "Or manually add to ~/.hermes/config.yaml:"
echo ""
echo "---"
cat /tmp/buzz-gateway-config.yaml
echo "---"
echo ""
echo "💡 Tip: Make sure BUZZ_PRIVATE_KEY is set in your environment or ~/.hermes/.env"
echo ""
