---
name: load-balancer-from-scratch
description: Build a Load Balancer From Scratch
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
---# Build a Load Balancer From Scratch

## Mental Model
A load balancer is a reverse proxy. Clients send requests to the LB (its public IP). The LB picks a backend server, forwards the request, waits for the response, sends it back to the client. The intelligence is in the server selection algorithm—are you sending traffic where capacity actually exists?

## Step 1: TCP Proxy (The Simplest LB)
The most basic approach: accept connections, forward bytes to a backend, forward bytes back. This is a raw TCP relay. HTTP parsing is optional—the LB doesn't need to understand the application protocol for raw TCP.

```python
import socket, threading

class LoadBalancer:
    def __init__(self, backends):
        self.backends = backends  # [(host, port), ...]
        self.current = 0

    def forward(self, client_sock):
        backend_sock = socket.socket()
        backend_sock.connect(self.backends[self.current])
        self.current = (self.current + 1) % len(self.backends)

        def relay(src, dst):
            try:
                while True:
                    data = src.recv(4096)
                    if not data:
                        break
                    dst.sendall(data)
            except:
                pass
            finally:
                src.close()
                dst.close()

        t1 = threading.Thread(target=relay, args=(client_sock, backend_sock))
        t2 = threading.Thread(target=relay, args=(backend_sock, client_sock))
        t1.start(); t2.start()
        t1.join(); t2.join()

    def listen(self, port):
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(('', port))
        server.listen(128)
        while True:
            client, _ = server.accept()
            threading.Thread(target=self.forward, args=(client,)).start()
```

## Step 2: Health Checks
Dead backends waste connections. Ping backends periodically—if they're not responding, remove them from the pool temporarily.

```python
import time, urllib.request

class HealthChecker:
    def __init__(self, check_interval=5):
        self.backends = {}
        self.check_interval = check_interval
        self.lock = threading.Lock()

    def register(self, host, port, url='/health'):
        self.backends[(host, port)] = {
            'host': host, 'port': port,
            'url': url, 'alive': True,
            'last_check': 0, 'consecutive_failures': 0
        }

    def check_all(self):
        now = time.time()
        for key, backend in list(self.backends.items()):
            if now - backend['last_check'] < self.check_interval:
                continue
            backend['last_check'] = now
            try:
                sock = socket.socket()
                sock.settimeout(3)
                sock.connect((backend['host'], backend['port']))
                if backend['url']:
                    sock.sendall(b'GET ' + backend['url'].encode() + b' HTTP/1.1\r\n\r\n')
                    resp = sock.recv(1024)
                    alive = b'HTTP/1.1 200' in resp or b'HTTP/1.0 200' in resp
                else:
                    alive = True
                sock.close()
                backend['consecutive_failures'] = 0
                backend['alive'] = True
            except:
                backend['consecutive_failures'] += 1
                if backend['consecutive_failures'] >= 3:
                    backend['alive'] = False

    def get_alive_backends(self):
        with self.lock:
            return [(b['host'], b['port']) for b in self.backends.values() if b['alive']]
```

## Step 3: Load Balancing Algorithms
Round-robin is simple but treats servers equally regardless of capacity. Weighted round-robin gives more traffic to beefier machines. Least connections picks the server with fewest active connections.

```python
def round_robin(self, backends):
    return backends[self.current % len(backends)]

def weighted_round_robin(self, backends_weights):
    # Weighted selection: [(host, port, weight), ...]
    total = sum(w for _, _, w in backends_weights)
    r = random.randint(0, total - 1)
    cumulative = 0
    for backend, weight in backends_weights:
        cumulative += weight
        if r < cumulative:
            return backend
    return backends_weights[0][0]

def least_connections(self, backends, active_conns):
    # Pick backend with fewest active connections
    return min(backends, key=lambda b: active_conns.get(b, 0))
```

## Step 4: HTTP-aware LB (Layer 7)
When you need to inspect HTTP headers, routes, or cookies, you need to parse HTTP. Pass requests that match a host header to that host's backend. Maintain session affinity via sticky cookies.

```python
def parse_http_request(data):
    lines = data.split(b'\r\n')
    first = lines[0].decode()
    method, path, version = first.split(' ')
    headers = {}
    for line in lines[1:]:
        if line == b'':
            break
        k, v = line.decode().split(': ', 1)
        headers[k] = v
    return method, path, version, headers

def route(self, request, backends):
    _, path, _, headers = request
    host = headers.get('Host', '')
    for route, backend in self.routes:
        if host == route:
            return backend
    return self.round_robin(backends)
```

## Step 5: Rate Limiting
Protect backends from overload using a token bucket or sliding window:

```python
from collections import deque
import time

class TokenBucket:
    def __init__(self, rate, capacity):
        self.rate = rate
        self.capacity = capacity
        self.tokens = capacity
        self.last_refill = time.time()

    def allow_request(self):
        now = time.time()
        self.tokens = min(self.capacity, self.tokens + (now - self.last_refill) * self.rate)
        self.last_refill = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False

class SlidingWindowRateLimiter:
    def __init__(self, max_requests, window_seconds):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests = deque()

    def allow(self, client_ip):
        now = time.tonthreads
        cutoff = now - self.window
        while self.requests and self.requests[0] < cutoff:
            self.requests.popleft()
        if len(self.requests) < self.max_requests:
            self.requests.append(now)
            return True
        return False
```

## Architecture
```
Client request
  → TCP listener (SO_REUSEADDR)
  → Read HTTP (optional, for Layer 7)
  → Rate limiter (token bucket / sliding window)
  → Routing table / sticky session check
  → Backend selection algorithm (round-robin, least-conn, weighted)
  → Health-checked pool (skip unhealthy)
  → Connect to backend, relay request
  → Wait for response
  → Return response to client
  → Update connection counts

Health checker (separate thread):
  → Periodic TCP checks / HTTP requests
  → Mark unhealthy if failures exceed threshold
  → Restore after N successful checks
```

## Bridge to Production

| Our mini-LB | Production Load Balancer |
|-------------|--------------------------|
| Thread-per-connection | epoll/kqueue/IOCP (O(1) connection handling) |
| Single-process | Multi-process / multi-thread pool |
| No connection state | Connection draining, keep-alive pooling |
| Basic health checks | SSL handshake checks, transitive health |
| Round-robin only | Consistent hashing, least-connections, weighted |
| No SSL termination | TLS offload, certificate management |
| No retry policies | Circuit breakers, automatic retry with jitter |
| No session affinity | Cookie-based sticky sessions |

> **Gap to fill**: Our implementation uses one thread per connection. Production LBs (HAProxy, nginx, AWS ALB) use `epoll`/`kqueue`/`IOCP` for O(1) scalable connection management instead.

**Production systems to study:**
- [Building a load balancer in Go](https://www.1delta.com/code/building-a-load-balancer-in-go/)
- [Writing a load balancer from scratch in Go](https://dev.to/izzomarzz/writing-a-load-balancer-from-scratch-in-golang-4afh)
- [Load Balancing 101 (DigitalOcean)](https://www.digitalocean.com/community/tutorials/load-balancing-101)

## Checklist
- [ ] Step 1: TCP proxy (round-robin)
- [ ] Step 2: Health checks
- [ ] Step 3: Load balancing algorithms
- [ ] Step 4: HTTP-aware routing (Layer 7)
- [ ] Step 5: Rate limiting (token bucket, sliding window)
- [ ] Add: SSL termination
- [ ] Add: circuit breakers
