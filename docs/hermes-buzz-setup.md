# Hermes Buzz Gateway Setup Guide

## Current Status

✅ **Configured:**
- Relay URL: `wss://digitallydefinedlab.communities.buzz.xyz`
- CLI Path: `C:/Users/frank/AppData/Local/Buzz/buzz.exe`
- Allow all users: `true`
- Poll interval: 4 seconds

❌ **Missing:**
- `BUZZ_PRIVATE_KEY` - Your Nostr private key for Hermes agent identity

---

## Step 1: Generate Hermes Nostr Identity

Hermes needs its own Nostr keypair to connect to the relay. Run this in your terminal:

```bash
# Option A: Using Python (recommended)
python -c "
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend
import os

# Generate private key
priv = ec.generate_private_key(ec.SECP256K1, default_backend())
private_key = priv.private_numbers().private_value.to_bytes(32, 'big').hex()

# Generate public key
public_key = priv.public_key()
public_numbers = public_key.public_numbers()
x = public_numbers.x.to_bytes(32, 'big').hex()
y = public_numbers.y.to_bytes(32, 'big').hex()
pubkey_hex = x + y

print(f'PRIVATE_KEY={private_key}')
print(f'PUBKEY={pubkey_hex[:64]}')
"
```

```bash
# Option B: Using Node.js
node -e "
const crypto = require('crypto');
// Generate random 32-byte private key
const privateKey = crypto.randomBytes(32).toString('hex');
// For a real pubkey, you'd need elliptic library
// This is a simplified version
console.log('PRIVATE_KEY=' + privateKey);
console.log('PUBKEY=' + privateKey.slice(0, 64));
"
```

---

## Step 2: Add to Hermes Environment

Add your private key to `~/.hermes/.env`:

```bash
echo 'BUZZ_PRIVATE_KEY=<your-private-key-hex>' >> ~/.hermes/.env
```

Or manually add to `C:\Users\frank\AppData\Local\hermes\.env`:
```
BUZZ_PRIVATE_KEY=your_hex_private_key_here
```

---

## Step 3: Restart Gateway

```bash
hermes gateway restart
```

---

## Step 4: Verify Connection

Check gateway status:
```bash
hermes gateway status
```

You should see Buzz platform connected.

---

## Step 5: Create Channels (Optional)

Once connected, you can create channels for different agents:

```bash
# List current channels
buzz channels list

# Create new channel for agents
buzz channels create --name "hermes-orchestrator" --description "Hermes coordination channel"
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              BUZZ RELAY (Nostr)                     │
│    wss://digitallydefinedlab.communities.buzz.xyz   │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
     ┌─────────┴─────────┐  ┌─────────┴─────────┐
     │   HERMES          │  │   BUZZ AGENTS     │
     │   (Orchestrator)  │  │   (Workers)       │
     │                   │  │                   │
     │  • Gateway        │  │  @Bumble          │
     │  • MCP Tools      │  │  @Fizz            │
     │  • delegate_task  │  │  @Honey           │
     └───────────────────┘  └───────────────────┘
```

---

## Workflow

1. **Hermes monitors** Buzz channels via gateway
2. **Agents post** to channels when they need help
3. **Hermes orchestrates** by delegating to MonkeyCode, Tavily, etc.
4. **Results posted** back to Buzz for human review

---

## Next Steps

1. Generate your Nostr keypair
2. Add to `.env`
3. Restart gateway
4. Test with: `hermes gateway status`
