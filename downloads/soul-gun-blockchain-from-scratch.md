---
name: blockchain-from-scratch
description: Build a Blockchain from Scratch
domain: computer-science
language: python
stars: "0"
topics: ["computer-science", "from-scratch", "build-your-own-x", "education"]
version: 0.1.0
author: profit-prime
input_schema:
  type: object
  properties: {}
  required: []
output_schema:
  type: object
  properties: {}
  required: []
---# Build a Blockchain from Scratch

> *"A blockchain is just a linked list where each block knows its parent, secured by cryptography."*

---

## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   GENESIS BLOCK                                                 │
│   ┌─────────────────────────────────────────────────────┐       │
│   │  index: 0                                           │       │
│   │  prev:  "00000000000000000000000000000000"          │       │
│   │  data: "Genesis Block"                               │       │
│   │  hash: "4a5e1e4baab89f3a33718c"                      │       │
│   │  nonce: 2083236893                                  │       │
│   └─────────────────────────────────────────────────────┘       │
│        ▲                                                        │
│        │ links via prev_hash                                    │
│        │                                                        │
│   BLOCK 1                                                        │
│   ┌─────────────────────────────────────────────────────┐       │
│   │  index: 1                                           │       │
│   │  prev:  "4a5e1e4baab89f3a33718c"                     │       │
│   │  data: {"from": "Alice", "to": "Bob", "amt": 50}   │       │
│   │  hash: "1a2b3c..."                                  │       │
│   │  nonce: 1234567                                     │       │
│   └─────────────────────────────────────────────────────┘       │
│        ▲                                                        │
│        │                                                        │
│   BLOCK 2                                                        │
│   ┌─────────────────────────────────────────────────────┐       │
│   │  index: 2                                           │       │
│   │  prev:  "1a2b3c..."                                  │       │
│   │  data: {"from": "Bob", "to": "Charlie", "amt": 25} │       │
│   │  hash: "7d8e9f..."                                   │       │
│   │  nonce: 987654                                       │       │
│   └─────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Build Steps (4 Steps, ~70 Lines)

### Step 1: Block Structure (15 lines)

```python
"""Step 1: Define the block structure."""
import hashlib
import time
import json

class Block:
    def __init__(self, index, data, prev_hash):
        self.index = index
        self.timestamp = time.time()
        self.data = data
        self.prev_hash = prev_hash
        self.hash = self.compute_hash()

    def compute_hash(self):
        """Hash all block contents."""
        content = (
            str(self.index) +
            str(self.timestamp) +
            str(self.data) +
            str(self.prev_hash)
        )
        return hashlib.sha256(content.encode()).hexdigest()

    def to_dict(self):
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "prev_hash": self.prev_hash,
            "hash": self.hash
        }

# Test
genesis = Block(0, "Genesis Block", "0" * 64)
print(f"Genesis hash: {genesis.hash}")
print(f"Genesis data: {genesis.data}")
```

---

### Step 2: Chain Management (20 lines)

```python
"""Step 2: Build the blockchain chain."""

GENESIS_HASH = "0" * 64

class Blockchain:
    def __init__(self):
        self.chain = [self.genesis()]

    def genesis(self):
        """Create the first block."""
        return Block(0, {"message": "Genesis Block"}, GENESIS_HASH)

    def add_block(self, data):
        """Add a new block to the chain."""
        prev = self.chain[-1]
        block = Block(len(self.chain), data, prev.hash)
        if self.is_valid(block, prev):
            self.chain.append(block)
            return block
        raise ValueError("Invalid block!")

    def is_valid(self, block, prev):
        """Check if block is valid."""
        return (
            block.index == prev.index + 1 and
            block.prev_hash == prev.hash and
            block.hash == block.compute_hash()
        )

    def get_block(self, index):
        if 0 <= index < len(self.chain):
            return self.chain[index]
        return None

# Test
chain = Blockchain()
b1 = chain.add_block({"sender": "Alice", "recipient": "Bob", "amount": 50})
b2 = chain.add_block({"sender": "Bob", "recipient": "Charlie", "amount": 25})
print(f"Chain length: {len(chain.chain)}")
print(f"Block 1: {b1.hash[:16]}...")
print(f"Block 2: {b2.hash[:16]}...")
```

---

### Step 3: Proof of Work (20 lines)

```python
"""Step 3: Add proof of work - mining."""

class MineableBlock(Block):
    def __init__(self, index, data, prev_hash, difficulty=4):
        super().__init__(index, data, prev_hash)
        self.difficulty = difficulty
        self.nonce = 0
        self.mine(difficulty)

    def compute_hash_with_nonce(self):
        content = (
            str(self.index) +
            str(self.timestamp) +
            str(self.data) +
            str(self.prev_hash) +
            str(self.nonce)
        )
        return hashlib.sha256(content.encode()).hexdigest()

    def mine(self, difficulty):
        """Find nonce such that hash starts with '0'*difficulty."""
        target = "0" * difficulty
        while True:
            self.hash = self.compute_hash_with_nonce()
            if self.hash[:difficulty] == target:
                print(f"Mined block {self.index} with nonce {self.nonce}, hash {self.hash[:16]}...")
                return
            self.nonce += 1

class MiningChain(Blockchain):
    def add_block(self, data, difficulty=4):
        prev = self.chain[-1]
        block = MineableBlock(len(self.chain), data, prev.hash, difficulty)
        self.chain.append(block)
        return block

# Test (use low difficulty for demo)
chain = MiningChain()
print("Mining block 1...")
b1 = chain.add_block({"sender": "Alice", "to": "Bob", "amount": 10}, difficulty=3)
print(f"Hash: {b1.hash}")
```

---

### Step 4: Transactions and Wallets (15 lines)

```python
"""Step 4: Add transactions and basic wallet using only stdlib."""

import hmac
import secrets

class Transaction:
    def __init__(self, sender, recipient, amount):
        self.sender = sender
        self.recipient = recipient
        self.amount = amount
        self.signature = None

    def sign(self, private_key):
        """Sign transaction with HMAC-SHA256 using private key."""
        data = f"{self.sender}{self.recipient}{self.amount}"
        self.signature = hmac.new(
            private_key.encode(), data.encode(), 'sha256'
        ).hexdigest()

    def verify(self, public_key):
        """Verify signature using public key as HMAC key."""
        if not self.signature:
            return False
        data = f"{self.sender}{self.recipient}{self.amount}"
        expected = hmac.new(
            public_key.encode(), data.encode(), 'sha256'
        ).hexdigest()
        return hmac.compare_digest(self.signature, expected)

class Wallet:
    def __init__(self):
        self.private_key = secrets.token_hex(32)
        self.public_key = secrets.token_hex(32)
        self.address = secrets.token_hex(20)

    def send(self, to, amount, chain):
        tx = Transaction(self.address, to, amount)
        tx.sign(self.private_key)
        chain.add_block(tx.to_dict())
        return tx

# Test
wallet_alice = Wallet()
wallet_bob = Wallet()
chain = MiningChain()

print("Mining genesis...")
tx = wallet_alice.send(wallet_bob.address, 100, chain)
print(f"Sent {tx.amount} from {tx.sender[:8]}... to {tx.recipient[:8]}...")
```

---

## Bridge to Production

| Our Chain | Bitcoin |
|-----------|---------|
| Single node | P2P network |
| No UTXO set | Unspent transaction outputs |
| Simple PoW | ASIC-resistant (SHA-256) |
| No merkle tree | Merkle tree for light clients |
| No fees | Transaction fees |
| Centralized | Decentralized consensus |

**Production systems to study:**
- [Learn Blockchains by Building One](https://hackernoon.com/learn-blockchains-by-building-one-117428612f46)
- [Naivecoin: Building a Cryptocurrency](https://lhartikk.github.io/)

---

## Checklist

- [ ] Step 1: Block structure works
- [ ] Step 2: Chain validation works
- [ ] Step 3: Mining produces valid proof
- [ ] Step 4: Transactions sign/verify
- [ ] Add: UTXO model
- [ ] Add: P2P networking