#!/usr/bin/env python3
"""Generate Nostr keypair for Hermes Buzz Gateway integration."""

import os
import sys
from datetime import datetime

def generate_nostr_keypair():
    """Generate a Nostr keypair using Python's cryptography library."""
    
    try:
        from cryptography.hazmat.primitives.asymmetric import ec
        from cryptography.hazmat.backends import default_backend
        
        # Generate secp256k1 private key
        priv_key = ec.generate_private_key(ec.SECP256K1, default_backend())
        
        # Get private key bytes
        private_value = priv_key.private_numbers().private_value
        private_key_bytes = private_value.to_bytes(32, 'big')
        private_key_hex = private_key_bytes.hex()
        
        # Get public key
        public_key = priv_key.public_key()
        public_numbers = public_key.public_numbers()
        
        # Convert to x9.63 uncompressed format (65 bytes)
        x_bytes = public_numbers.x.to_bytes(32, 'big')
        y_bytes = public_numbers.y.to_bytes(32, 'big')
        public_key_uncompressed = b'\x04' + x_bytes + y_bytes
        public_key_hex = public_key_uncompressed.hex()
        
        # Short pubkey (64 hex chars)
        short_pubkey = public_key_hex[:64]
        
        # Convert to npub (Bech32) - simplified version
        # For production, use a proper Nostr library like 'nostr' or 'bech32'
        print("=" * 70)
        print("🐝 HERMES BUZZ GATEWAY - NOSTR KEYPAIR GENERATED")
        print("=" * 70)
        print()
        print("⚠️  IMPORTANT: Save these keys securely!")
        print("   Your private key cannot be recovered if lost.")
        print("   This key will be used by Hermes to authenticate with Buzz.")
        print()
        print(f"🔑 PRIVATE KEY (nsec format):")
        print(f"   {private_key_hex}")
        print()
        print(f"📛 PUBLIC KEY (hex, 64 chars):")
        print(f"   {short_pubkey}")
        print()
        print(f"📛 FULL PUBLIC KEY (hex, 128 chars):")
        print(f"   {public_key_hex}")
        print()
        print("=" * 70)
        print()
        print("Next steps:")
        print("1. Set BUZZ_PRIVATE_KEY in ~/.hermes/.env:")
        print(f"   BUZZ_PRIVATE_KEY={private_key_hex}")
        print()
        print("2. Restart Hermes gateway:")
        print("   hermes gateway restart")
        print()
        print("3. Your Hermes agent will appear in Buzz with pubkey:")
        print(f"   {short_pubkey}")
        print()
        
        return private_key_hex, short_pubkey
        
    except ImportError:
        print("❌ cryptography library not available")
        print("   Install with: pip install cryptography")
        print("   Or use an alternative method below...")
        return None, None

def generate_simple_keypair():
    """Fallback: generate using os.urandom (less secure but works)."""
    print()
    print("=" * 70)
    print("🐝 SIMPLIFIED NOSTR KEYPAIR (using os.urandom)")
    print("=" * 70)
    print()
    print("⚠️  WARNING: This method is less secure than using cryptography.")
    print("   For production use, install: pip install cryptography")
    print()
    
    # Generate private key
    private_key_bytes = os.urandom(32)
    private_key_hex = private_key_bytes.hex()
    short_pubkey = private_key_hex[:64]  # Simplified - not a real pubkey
    
    print(f"🔑 PRIVATE KEY:")
    print(f"   {private_key_hex}")
    print()
    print(f"📛 PUBLIC KEY (placeholder):")
    print(f"   {short_pubkey}")
    print()
    print("Note: This generates a random hex string, not a valid Nostr keypair.")
    print("For a real keypair, install cryptography and run the script again.")
    print()
    
    return private_key_hex, short_pubkey

if __name__ == "__main__":
    print("Generating Nostr keypair for Hermes Buzz Gateway...")
    print()
    
    priv, pub = generate_nostr_keypair()
    
    if priv is None:
        print()
        print("Attempting simplified key generation...")
        priv, pub = generate_simple_keypair()
    
    if priv:
        # Save to file
        output_file = "hermes-buzz-keypair.txt"
        with open(output_file, "w") as f:
            f.write(f"Hermes Buzz Gateway - Nostr Keypair\n")
            f.write(f"Generated: {datetime.now().isoformat()}\n")
            f.write(f"Relay: wss://digitallydefinedlab.communities.buzz.xyz\n")
            f.write(f"\nPRIVATE KEY:\n{priv}\n")
            f.write(f"\nPUBLIC KEY:\n{pub}\n")
            f.write(f"\n⚠️  Keep this file secure.\n")
            f.write(f"⚠️  Delete after adding BUZZ_PRIVATE_KEY to ~/.hermes/.env\n")
        
        print(f"✅ Keypair saved to: {output_file}")
        print()
        print("Remember to:")
        print("1. Add BUZZ_PRIVATE_KEY to ~/.hermes/.env")
        print("2. Restart Hermes gateway")
        print("3. Delete this file after securing your keys")
