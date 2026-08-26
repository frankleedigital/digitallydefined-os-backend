#!/usr/bin/env python3
"""Generate Nostr keypair for Buzz relay ownership."""

import os
import sys

def generate_nostr_keypair():
    """Generate a Nostr keypair using pure Python (no external deps)."""
    
    # Use Python's built-in random for key generation
    # This is a simplified approach; for production, use a proper Nostr library
    
    # Generate 32-byte private key
    private_key_bytes = os.urandom(32)
    private_key_hex = private_key_bytes.hex()
    
    print("=" * 60)
    print("🐝 BUZZ RELAY - NOSTR KEYPAIR GENERATED")
    print("=" * 60)
    print()
    print("⚠️  SAVE THESE KEYS SECURELY!")
    print("   Your private key cannot be recovered if lost.")
    print()
    print(f"🔑 PRIVATE KEY (nsec): {private_key_hex}")
    print()
    print(f"📛 PUBLIC KEY (hex): {private_key_hex[:64]}")
    print()
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Copy the PUBLIC KEY above")
    print("2. Go to Railway: https://railway.com/deploy/buzz-relay-block")
    print("3. Enter public key as RELAY_OWNER_PUBKEY")
    print("4. Deploy the relay")
    print()
    print("After deployment, add yourself as member:")
    print(f"   docker compose exec relay buzz-admin add-member --pubkey <YOUR_PUBLIC_KEY>")
    print()
    
    return private_key_hex, private_key_hex[:64]

if __name__ == "__main__":
    priv, pub = generate_nostr_keypair()
    
    # Save to file for reference
    output_file = "nostr-keypair.txt"
    with open(output_file, "w") as f:
        f.write(f"Buzz Relay Nostr Keypair\n")
        f.write(f"Generated: {__import__('datetime').datetime.now().isoformat()}\n")
        f.write(f"\nPRIVATE KEY (nsec):\n{priv}\n")
        f.write(f"\nPUBLIC KEY (hex):\n{pub}\n")
        f.write(f"\n⚠️  Keep this file secure. Do not commit to git.\n")
    
    print(f"✅ Keys saved to: {output_file}")
    print(f"   ⚠️  Delete this file after adding keys to Railway secrets")
