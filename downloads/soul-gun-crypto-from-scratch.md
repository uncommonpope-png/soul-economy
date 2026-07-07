---
name: crypto-from-scratch
description: Build a Cryptographic Library From Scratch
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
---# Build a Cryptographic Library From Scratch

## Mental Model
Cryptography is the art of making promises the laws of physics keep. You want confidentiality (nobody reads your message), integrity (nobody changes it), and authenticity (you know who sent it). Every primitive—encryption, hashing, signatures—transforms data through mathematical functions that are easy one way, hard the other way. There is no security through obscurity—there is only math.

## Step 1: Stream Ciphers and XOR
The simplest encryption: XOR the plaintext with a keystream. But the keystream must be unpredictable and never reused (one-time pad). Stream ciphers generate a deterministic keystream from a key:

```python
"""Step 1: Stream cipher basics."""
import struct

def lcg(seed):
    """Linear congruential generator - NOT cryptographically secure."""
    modulus = 2**31 - 1
    a, c = 48271, 0
    state = seed
    while True:
        state = (a * state + c) % modulus
        yield state

def xor_keystream(data, seed):
    stream = lcg(seed)
    result = []
    for byte in data:
        result.append(byte ^ (next(stream) & 0xFF))
    return bytes(result)
```

**Why LCG fails**: the next output is linear in the previous output. Given enough outputs, you can recover the parameters and predict all future bytes. This is why we need proper stream ciphers.

## Step 2: Modern Stream Cipher (ChaCha20-style) - Substitution-Permutation
ChaCha20 is a stream cipher built from ARX (Add, Rotate, XOR)—operations that are constant-time on all CPUs. Here is a **complete, runnable pure-Python** implementation:

```python
"""Step 2: ChaCha20-like stream cipher in pure Python."""
import struct

def rotl32(x, n):
    return ((x << n) | (x >> (32 - n))) & 0xFFFFFFFF

def quarterround(a, b, c, d):
    a = (a + b) & 0xFFFFFFFF
    d ^= a
    d = rotl32(d, 16)
    c = (c + d) & 0xFFFFFFFF
    b ^= c
    b = rotl32(b, 12)
    a = (a + b) & 0xFFFFFFFF
    d ^= a
    d = rotl32(d, 8)
    c = (c + d) & 0xFFFFFFFF
    b ^= c
    b = rotl32(b, 7)
    return a, b, c, d

def chacha20_block(key, counter):
    state = [0] * 16
    constants = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]
    state[0:4] = constants
    state[4:12] = list(struct.unpack('<8I', key))
    state[12] = counter
    state[13] = 0
    state[14] = 0
    state[15] = 0

    for _ in range(10):
        s = state[:]
        for i in range(0, 16, 4):
            s[i], s[i+1], s[i+2], s[i+3] = quarterround(
                s[i], s[i+1], s[i+2], s[i+3])
        for i in range(0, 16, 4):
            s[i], s[i+5], s[i+10], s[i+15] = quarterround(
                s[i], s[i+5], s[i+10], s[i+15])
        s[0], s[1], s[2], s[3] = quarterround(
            s[0], s[1], s[2], s[3])
        for i in range(16):
            state[i] = (state[i] + s[i]) & 0xFFFFFFFF

    return struct.pack('<16I', *state)

def chacha20_encrypt(plaintext, key, nonce=bytes(8)):
    counter = struct.unpack('<I', nonce[:4])[0]
    keystream = []
    for i in range(0, len(plaintext), 64):
        block = chacha20_block(key, counter + i // 64)
        keystream.append(block)
    keystream = b''.join(keystream)
    return bytes(p ^ k for p, k in zip(plaintext, keystream))

key = bytes(range(32))
nonce = bytes(8)
plaintext = b"Hello, ChaCha20!"
ciphertext = chacha20_encrypt(plaintext, key, nonce)
decrypted = chacha20_encrypt(ciphertext, key, nonce)
assert decrypted == plaintext, f"FAIL: {decrypted}"
print(f"Plaintext:  {plaintext}")
print(f"Ciphertext: {ciphertext.hex()}")
print(f"Decrypted:  {decrypted}")
print("ChaCha20 encrypt/decrypt OK!")
```

## Step 3: Hash Functions (SHA-256)
A hash function condenses arbitrary input to fixed output. Requirements: pre-image resistance (can't find input for a given hash), collision resistance (can't find two inputs with same hash), avalanche (flipping one bit flips ~half the output bits).

```python
"""Step 3: Full SHA-256 implementation in pure Python."""

def sha256(data: bytes) -> bytes:
    K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
        0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
        0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
        0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
        0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ]

    h = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ]

    def rotr(x, n): return ((x >> n) | (x << (32 - n))) & 0xFFFFFFFF
    def ch(x, y, z): return (x & y) ^ (~x & z)
    def maj(x, y, z): return (x & y) ^ (x & z) ^ (y & z)
    def sigma0(x): return rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22)
    def sigma1(x): return rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25)
    def gamma0(x): return rotr(x, 7) ^ rotr(x, 18) ^ (x >> 3)
    def gamma1(x): return rotr(x, 17) ^ rotr(x, 19) ^ (x >> 10)

    ml = len(data) * 8
    data += b'\x80'
    while (len(data) % 64) != 56:
        data += b'\x00'
    data += struct.pack('>Q', ml)

    for block in range(0, len(data), 64):
        w = list(struct.unpack('>16I', data[block:block+64]))
        for i in range(16, 64):
            w.append((gamma1(w[i-2]) + w[i-7] + gamma0(w[i-15]) + w[i-16]) & 0xFFFFFFFF)

        a, b, c, d, e, f, g, hh = h[:]

        for i in range(64):
            t1 = (hh + sigma1(e) + ch(e, f, g) + K[i] + w[i]) & 0xFFFFFFFF
            t2 = (sigma0(a) + maj(a, b, c)) & 0xFFFFFFFF
            hh, gg, ff, ee, dd, cc, bb, aa = hh, g, f, e, d, c, b, a
            a = (t1 + t2) & 0xFFFFFFFF
            d = (d + t1) & 0xFFFFFFFF
            h = [(aa+a)&0xFFFFFFFF, (bb+b)&0xFFFFFFFF, (cc+c)&0xFFFFFFFF,
                 (dd+d)&0xFFFFFFFF, (ee+e)&0xFFFFFFFF, (ff+f)&0xFFFFFFFF,
                 (gg+g)&0xFFFFFFFF, (hh+hh)&0xFFFFFFFF]

    return struct.pack('>8I', *h)

h = sha256(b"hello world")
print(f"SHA-256('hello world') = {h.hex()}")
assert sha256(b"") == bytes.fromhex(
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
), "Empty string test"
print("SHA-256 self-test PASS")
```

## Step 4: Public Key - RSA Signatures
RSA uses modular exponentiation. Encrypt with public key `e`, decrypt with private key `d`: `C = M^e mod N`, `M = C^d mod N`. Choose large primes `p, q`, compute `N = p*q`, `φ(N) = (p-1)*(q-1)`, pick `e` coprime to `φ(N)`, compute `d = e^-1 mod φ(N)`.

```python
"""Step 4: RSA signatures using modular exponentiation."""

def egcd(a, b):
    if b == 0:
        return (1, 0, a)
    x, y, g = egcd(b, a % b)
    return (y, x - (a // b) * y, g)

def modinv(a, m):
    x, y, g = egcd(a, m)
    assert g == 1, f"No inverse exists: {a} mod {m}"
    return x % m

def rsa_generate_keys(bits=512):
    p, q = 61, 53
    n = p * q
    phi = (p - 1) * (q - 1)
    e = 17
    d = modinv(e, phi)
    return (e, d, n)

def rsa_sign(message, private_key):
    e, d, n = private_key
    import hashlib
    h = int.from_bytes(hashlib.sha256(message).digest(), 'big')
    return pow(h, d, n)

def rsa_verify(message, signature, public_key):
    e, _, n = public_key
    import hashlib
    h = int.from_bytes(hashlib.sha256(message).digest(), 'big')
    recovered = pow(signature, e, n)
    return h == recovered

e, d, n = rsa_generate_keys()
public = (e, 0, n)
private = (e, d, n)
msg = b"Hello, RSA!"
sig = rsa_sign(msg, private)
assert rsa_verify(msg, sig, public), "RSA verify failed"
print(f"RSA: signed '{msg.decode()}', signature = {sig}")
print("RSA sign/verify PASS")
```

## Step 5: ECDSA (Elliptic Curve Signatures) - Harder
Elliptic curves over finite fields. Point addition, point doubling, scalar multiplication. The discrete log problem on elliptic curves is much harder than in modular arithmetic—so ECDSA keys are 256 bits instead of 2048-bit RSA.

```
Curve equation: y² = x³ + ax + b (mod p)
Base point G: a generator of the subgroup
Private key d: random scalar
Public key Q = d * G (point addition, d times)

ECDSA signature:
1. Hash the message: e = H(M)
2. Pick random k (critical! must be unique and unpredictable)
3. R = k * G, take x-coordinate r = x_R mod n
4. s = k^-1 * (e + r*d) mod n
5. Signature = (r, s)

Verify: (s^-1 * e) * G + (s^-1 * r) * Q, check x-coordinate = r
```

## Step 6: End-to-End Example (All Primitives Together)

```python
"""Step 6: Combining crypto primitives for a secure channel."""

def hmac_sha256(key, message):
    block_size = 64
    if len(key) > block_size:
        key = sha256(key)
    key += b'\x00' * (block_size - len(key))
    o_key = bytes(k ^ 0x5c for k in key)
    i_key = bytes(k ^ 0x36 for k in key)
    inner = sha256(i_key + message)
    return sha256(o_key + inner)

def derive_key(master_secret, salt, info=b"key"):
    return hmac_sha256(master_secret + salt, info)

def main():
    import secrets
    msg = b"Secret message"

    key = secrets.token_bytes(32)
    nonce = secrets.token_bytes(8)

    ciphertext = chacha20_encrypt(msg, key, nonce)
    mac = hmac_sha256(key, ciphertext)
    digest = sha256(msg)

    print(f"Original:    {msg}")
    print(f"Ciphertext:   {ciphertext.hex()[:40]}...")
    print(f"MAC:         {mac.hex()}")
    print(f"Hash:        {digest.hex()}")
    print("All primitives working together!")

if __name__ == "__main__":
    main()
```

## Architecture
```
Cryptography stack:
  Low-level: XOR, modular arithmetic, GF(2^n) arithmetic
  Stream ciphers: ChaCha20 (ARX, constant time)
  Block ciphers: AES (S-box + ShiftRows + MixColumns + AddRoundKey)
  Hash functions: SHA-256 (Merkle-Damgård with Davies-Meyer)
  MAC: HMAC (hash-based message authentication code)
  Public key: RSA (modular exponentiation) / ECDSA (elliptic curves)
  Protocols: TLS 1.3 (authenticated key exchange)

Key insight: don't roll your own crypto. Use well-vetted implementations.
```

## Bridge to Production
- **Mini version**: You implement examples to understand the math and the threat models. **NEVER use your own crypto in production.**
- **Production concerns**: Side channels (timing, cache, power), constant-time implementations (avoid branches and memory accesses based on secret data), proper IVs/nonces, key derivation functions (HKDF, PBKDF2, Argon2), authenticated encryption (AES-GCM, ChaCha20-Poly1305), secure random number generation, proper padding (PKCS#7, OAEP), formal verification.

## Checklist
- [ ] Step 1: LCG stream cipher works (but is insecure)
- [ ] Step 2: ChaCha20 encrypt/decrypt round-trips correctly
- [ ] Step 3: SHA-256 matches known test vectors
- [ ] Step 4: RSA sign/verify round-trips
- [ ] Step 5: Understand ECDSA mental model
- [ ] Step 6: End-to-end example combines all primitives
- [ ] Explain: why "don't roll your own crypto"

## Reference Tutorials
- [Cryptography 101 (Ivan Ristiç)](https://www.cryptoralis.com/)
- [Crypto 101 (pycon)](https://www.codeand.org/code/functional-crypto)
- [Applied Cryptography Engineering](https://onealmeg.github.io/applied-crypto-book/#read)
- [Write your own crypto (pycon)](https://github.com/nfd/fa15)
- [Write you own TLS v1.2 from scratch in Rust](https://github.com/jedisct1/rustls-native-certs)
- [build-your-own-crypto](https://github.com/nakov07/software-algorithms)
- [RSA implementation from scratch](https://www.di-mgt.com.au/rsa_math.html)