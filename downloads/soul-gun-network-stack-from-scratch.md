---
name: network-stack-from-scratch
description: Build a Network Stack from Scratch
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
---# Build a Network Stack from Scratch

---

## The Build Steps (4 Steps, ~80 Lines)

### Step 1: Ethernet Frame (15 lines)

```python
"""Step 1: Parse Ethernet frames."""
import struct

class EthernetFrame:
    FORMAT = '!6s6sH'  # dst_mac, src_mac, ethertype

    def __init__(self, dst_mac, src_mac, ethertype, payload):
        self.dst_mac = dst_mac
        self.src_mac = src_mac
        self.ethertype = ethertype  # 0x0800 = IPv4, 0x0806 = ARP
        self.payload = payload

    def to_bytes(self):
        return struct.pack(self.FORMAT, self.dst_mac, self.src_mac, self.ethertype) + self.payload

    @staticmethod
    def from_bytes(data):
        dst, src, ethertype = struct.unpack(EthernetFrame.FORMAT, data[:14])
        return EthernetFrame(dst, src, ethertype, data[14:])

    @staticmethod
    def mac_to_bytes(mac_str):
        return bytes(int(x, 16) for x in mac_str.split(':'))

    @staticmethod
    def mac_to_str(mac_bytes):
        return ':'.join(f'{b:02x}' for b in mac_bytes)

# Test
frame = EthernetFrame(b'\x00\x11\x22\x33\x44\x55', b'\x66\x77\x88\x99\xaa\xbb', 0x0800, b'payload')
print(f"MAC: {EthernetFrame.mac_to_str(frame.src_mac)}")
```

---

### Step 2: IPv4 Packet (25 lines)

```python
"""Step 2: Parse and construct IPv4 packets."""

class IPv4Packet:
    def __init__(self, src_ip, dst_ip, protocol, payload, ttl=64):
        self.version = 4
        self.ihl = 5
        self.tos = 0
        self.total_length = 20 + len(payload)
        self.id = 0
        self.flags_offset = 0
        self.ttl = ttl
        self.protocol = protocol  # 6=TCP, 17=UDP
        self.src_ip = src_ip
        self.dst_ip = dst_ip
        self.payload = payload

    def header_bytes(self):
        ver_ihl = (self.version << 4) | self.ihl
        return struct.pack('!BBHHHBBH4s4s',
            ver_ihl, self.tos, self.total_length,
            self.id, self.flags_offset,
            self.ttl, self.protocol, 0,
            self._ip_to_bytes(self.src_ip),
            self._ip_to_bytes(self.dst_ip)
        )

    @staticmethod
    def _ip_to_bytes(ip_str):
        return bytes(int(x) for x in ip_str.split('.'))

    @staticmethod
    def _bytes_to_ip(bytes_ip):
        return '.'.join(str(b) for b in bytes_ip)

    def checksum(self):
        """Calculate header checksum."""
        header = self.header_bytes()
        s = 0
        for i in range(0, len(header), 2):
            w = (header[i] << 8) + header[i+1]
            s += w
        s = (s >> 16) + (s & 0xffff)
        s += s >> 16
        return ~s & 0xffff

    def to_bytes(self):
        header = bytearray(self.header_bytes())
        # Set checksum
        chksum = self.checksum()
        header[10] = chksum >> 8
        header[11] = chksum & 0xff
        return bytes(header) + self.payload
```

---

### Step 3: TCP Segment (20 lines)

```python
"""Step 3: TCP segments."""

class TCPSegment:
    def __init__(self, src_port, dst_port, seq, ack, flags, payload):
        self.src_port = src_port
        self.dst_port = dst_port
        self.seq = seq
        self.ack = ack
        self.flags = flags  # SYN=2, ACK=16, FIN=1
        self.window = 65535
        self.checksum = 0
        self.urgent = 0
        self.payload = payload

    def to_bytes(self):
        data_offset = 5 << 4  # 20 bytes header, no options
        return struct.pack('!HHLLBBHHH',
            self.src_port, self.dst_port,
            self.seq, self.ack,
            data_offset, self.flags,
            self.window, self.checksum, self.urgent
        ) + self.payload

    @staticmethod
    def from_bytes(data):
        src_port, dst_port, seq, ack, doff_flags, flags, window, _, _ = \
            struct.unpack('!HHLLBBHHH', data[:20])
        return TCPSegment(
            src_port, dst_port, seq, ack, flags,
            data[doff_flags >> 4 * 4:]
        )

class Connection:
    def __init__(self, src_ip, src_port, dst_ip, dst_port):
        self.src_ip, self.src_port = src_ip, src_port
        self.dst_ip, self.dst_port = dst_ip, dst_port
        self.seq = 0
        self.ack = 0
        self.state = 'CLOSED'

    def syn_sent(self):
        self.state = 'SYN_SENT'
        return self._make_segment(2, b'')  # SYN

    def syn_ack(self, seg):
        self.ack = seg.seq + 1
        self.seq = 0
        self.state = 'SYN_RCVD'
        return self._make_segment(18, b'')  # SYN+ACK

    def _make_segment(self, flags, payload):
        return TCPSegment(self.src_port, self.dst_port, self.seq, self.ack, flags, payload)
```

---

### Step 4: Socket Interface (20 lines)

```python
"""Step 4: Simple socket abstraction."""

class Socket:
    def __init__(self):
        self.connection = None
        self.buffer = b''

    def connect(self, ip, port):
        """Connect to remote host."""
        self.connection = Connection('0.0.0.0', 12345, ip, port)
        segment = self.connection.syn_sent()
        # In real code: send to network
        return segment

    def send(self, data):
        """Send data."""
        if not self.connection:
            raise Exception("Not connected")

        self.connection.seq += len(data)
        segment = TCPSegment(
            self.connection.src_port, self.connection.dst_port,
            self.connection.seq, self.connection.ack,
            24,  # PSH+ACK
            data
        )
        return segment

    def receive(self, segment):
        """Handle incoming segment."""
        self.buffer += segment.payload
        self.connection.ack = segment.seq + len(segment.payload)
        ack_seg = self._make_ack()
        return ack_seg

    def _make_ack(self):
        return TCPSegment(
            self.connection.src_port, self.connection.dst_port,
            self.connection.seq, self.connection.ack,
            16,  # ACK
            b''
        )

# Test
sock = Socket()
syn = sock.connect('192.168.1.1', 80)
print(f"SYN sent: {syn.src_port} -> {syn.dst_port}")
```

---

## Checklist

- [ ] Step 1: Ethernet frame parsing
- [ ] Step 2: IPv4 packet
- [ ] Step 3: TCP segment
- [ ] Step 4: Socket interface