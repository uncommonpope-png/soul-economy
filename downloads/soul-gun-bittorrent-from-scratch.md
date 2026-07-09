---
name: bittorrent-from-scratch
description: Build a BitTorrent Client From Scratch
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
---# Build a BitTorrent Client From Scratch

---
name: bittorrent-from-scratch
description: Use when user wants to understand how BitTorrent works, build a torrent client, or learn about peer-to-peer networking, bencode, and the wire protocol. Triggers on: "build bittorrent", "torrent", "peer-to-peer", "bencode", "wire protocol".
---

## The Mental Model
You download a file. How? You get it from one source. BitTorrent lets you download pieces from many sources simultaneously. Each peer has pieces; you have pieces. You trade: give me your pieces, I'll give you mine. The `.torrent` file is a blueprint—a map of piece hashes. The tracker is a matchmaker: it introduces you to peers who have pieces you need.

## Step 1: Understand the .torrent File
A `.torrent` file is bencode-encoded (not JSON—look it up). It contains:
- `info`: file(s), piece length, SHA1 hashes of pieces
- `announce`: tracker URL
- Optional: `announce-list` (backup trackers)

```
(info dictionary):
  name: "myfile.zip"
  length: 1048576
  piece length: 262144 (256KB)
  pieces: <binary 20-byte hashes concatenated>
```

## Step 2: Decode bencode (the file format)
No JSON here. Rules:
- Integers: `i<number>e` → `i42e` means `42`
- Strings: `<length>:<content>` → `4:test` means `"test"`
- Lists: `l<items>e` → `li1ei2ei3ee` means `[1, 2, 3]`
- Dicts: `d<key><value>e` (keys must be bencode strings, sorted)

```python
def bencode_decode(data, pos=0):
    if data[pos] == ord('i'):
        end = data.index(ord('e'), pos)
        return int(data[pos+1:end]), end+1
    if data[pos] == ord('l'):
        pos += 1
        items = []
        while data[pos] != ord('e'):
            item, pos = bencode_decode(data, pos)
            items.append(item)
        return items, pos+1
    if data[pos] == ord('d'):
        pos += 1
        d = {}
        while data[pos] != ord('e'):
            key, pos = bencode_decode(data, pos)
            value, pos = bencode_decode(data, pos)
            d[key] = value
        return d, pos+1
    # String
    colon = data.index(ord(':'), pos)
    length = int(data[pos:colon])
    return data[colon+1:colon+1+length].decode(), colon+1+length
```

## Step 3: Connect to the Tracker
The tracker URL + query params = HTTP GET request. Example:
```
http://tracker.example.com:8080/announce?
  info_hash=<20-byte SHA1 of bencoded info dict>&
  peer_id=<20-byte client ID>&
  port=6881&
  uploaded=0&
  downloaded=0&
  left=<file_size>&
  compact=1
```

Parse the response (also bencode). The `peers` field contains binary peer structs (6 bytes each: 4-byte IP + 2-byte port).

```python
def fetch_peers(torrent, peer_id, port=6881):
    import urllib.parse, urllib.request, hashlib
    info_hash = hashlib.sha1(bencode_encode(torrent['info'])).digest()
    params = urllib.parse.urlencode({
        'info_hash': info_hash,
        'peer_id': peer_id,
        'port': port,
        'uploaded': 0,
        'downloaded': 0,
        'left': torrent['info']['length'],
        'compact': 1,
    })
    url = torrent['announce'] + '?' + params
    response = urllib.request.urlopen(url).read()
    tracker_response, _ = bencode_decode(response)
    return parse_peers(tracker_response['peers'])
```

## Step 4: Implement the Wire Protocol
This is where the real work happens. You speak BitTorrent over TCP.

### Message Types (by byte ID):
- `choke` (0), `unchoke` (1), `interested` (2), `not interested` (3)
- `have` (4) + 4-byte piece index
- `bitfield` (5) + variable-length bitfield
- `request` (6) + index(4) + begin(4) + length(4)
- `piece` (7) + index(4) + begin(4) + block
- `cancel` (8)

### Handshake (always first):
```
<pstrlen><pstr><reserved><info_hash><peer_id>
18 (1 byte) + "BitTorrent protocol" (19 bytes) + 8 reserved bytes + 20 + info_hash + 20 + peer_id
```

```python
def handshake(sock, info_hash, peer_id):
    pstr = b"BitTorrent protocol"
    reserved = b'\x00\x00\x00\x00\x00\x00\x00\x00'
    msg = bytes([len(pstr)]) + pstr + reserved + info_hash + peer_id
    sock.send(msg)
    response = sock.recv(68)
    return response[28:48] == info_hash

def recv_message(sock):
    length_bytes = recv_exact(sock, 4)
    length = struct.unpack('>I', length_bytes)[0]
    if length == 0:
        return None  # keep-alive
    msg_id = sock.recv(1)
    payload = sock.recv(length - 1)
    return msg_id, payload
```

## Step 5: Download Pieces from Multiple Peers
Piece selection strategy (rarest-first):
- Track which pieces each peer has (from `have` messages)
- For each active unchoked peer, count piece frequency
- Request missing pieces from whoever has them
- Request blocks (16KB chunks) not whole pieces simultaneously from multiple peers
- Verify each piece's SHA1 hash before marking complete

```python
def download_piece(sock, index, begin, length):
    msg_id = b'\x06'  # request
    msg = struct.pack('>IBIII', 13, 6, index, begin, length)
    sock.send(msg)

def recv_piece_data(sock):
    msg_id, payload = recv_message(sock)
    if msg_id == b'\x07':  # piece
        index, begin = struct.unpack('>II', payload[:8])
        data = payload[8:]
        return index, begin, data
```

## Architecture
```
.torrent file → bencode decode → tracker URL + info_hash + piece_hashes
                                           ↓
                                    HTTP tracker request
                                           ↓
                                    peer list (IP:port)
                                           ↓
                                    TCP connections (1..N)
                                           ↓
                                   Wire protocol handshakes
                                           ↓
                      choked/unchoked/interested + bitfield
                                           ↓
                          Download blocks (parallel from multiple peers)
                                           ↓
                     Verify SHA1 per piece → write to disk → seed
```

## Bridge to Production
- **Mini version**: Single file, central tracker only, sequential piece fetching. Real BitTorrent clients use DHT (Kademlia) for trackerless torrents, peer exchange (PEX), and multi-torrent management.
- **Production concerns**: Piece selection (rarest-first + endgame mode), bandwidth allocation, seeding ratio, NAT traversal (UPnP, hole punching), encryption (BEP 46).

## Checklist
- [ ] Step 1: .torrent file (bencode) parsing
- [ ] Step 2: Bencode decoder
- [ ] Step 3: Tracker HTTP request
- [ ] Step 4: Wire protocol (handshake, messages)
- [ ] Step 5: Piece downloading and verification
- [ ] Add: DHT (Kademlia) for trackerless torrents
- [ ] Add: peer exchange (PEX)

## Reference Tutorials
- [Building a BitTorrent client from scratch in Go](https://blog.kunterblatt.com/view/2022/02/27/Building-a-BitTorrent-Client-from-Scratch-in-Go/)
- [Write your own bittorrent client](https://allanhandle.github.io/posts/writing-a-bittorrent-client/)
- [Part 1: BitTorrent](https://maraboupdf.notion.site/Part-1-BitTorrent-a67f5f84cc4c4768bd14f1def3ccf7b0)
