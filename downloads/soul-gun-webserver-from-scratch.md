---
name: webserver-from-scratch
description: Build a Web Server from Scratch
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
---# Build a Web Server from Scratch

> *"A web server is just: parse request → route → handle → send response."*

---

## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEB SERVER ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Client Request                                                │
│   "GET /hello?name=Alice HTTP/1.1\r\nHost: localhost\r\n..."    │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  1. ACCEPT                                                │  │
│   │     server_socket.accept() → client_socket               │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  2. PARSE REQUEST                                        │  │
│   │     "GET /path?query HTTP/1.1" → {method, path, query}    │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  3. ROUTE                                                │  │
│   │     /hello → hello_handler                              │  │
│   │     /api/users → users_handler                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  4. HANDLE & GENERATE RESPONSE                          │  │
│   │     handler() → "200 OK" + "<html>..."                  │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  5. SEND RESPONSE                                       │  │
│   │     "HTTP/1.1 200 OK\r\nContent-Length: 123\r\n..."     │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Build Steps (4 Steps, ~100 Lines)

### Step 1: HTTP Parsing (25 lines)

```python
"""Step 1: Parse HTTP requests."""
from urllib.parse import urlparse, parse_qs

class Request:
    def __init__(self, method, path, headers, body):
        self.method = method
        self.path = path
        self.headers = headers
        self.body = body
        self.query = {}

        # Parse query string
        parsed = urlparse(path)
        self.path = parsed.path
        self.query = {k: v[0] for k, v in parse_qs(parsed.query).items()}

def parse_request(raw):
    """Parse raw HTTP request bytes."""
    lines = raw.decode('utf-8', errors='ignore').split('\r\n')
    if not lines:
        return None

    # Request line: "GET /path HTTP/1.1"
    request_line = lines[0].split(' ')
    if len(request_line) < 2:
        return None

    method, path = request_line[0], request_line[1]

    # Headers
    headers = {}
    body_start = 0
    for i, line in enumerate(lines[1:], 1):
        if line == '':
            body_start = i + 1
            break
        if ':' in line:
            key, value = line.split(':', 1)
            headers[key.strip()] = value.strip()

    # Body
    body = '\r\n'.join(lines[body_start:]) if body_start else ''

    return Request(method, path, headers, body)

# Test
raw = b"""GET /hello?name=Alice HTTP/1.1\r
Host: localhost\r
\r
"""
req = parse_request(raw)
print(f"Method: {req.method}")
print(f"Path: {req.path}")
print(f"Query: {req.query}")
```

---

### Step 2: Basic Server (25 lines)

```python
"""Step 2: Build the server."""
import socket

class Response:
    def __init__(self, status=200, body=b"", content_type="text/html"):
        self.status = status
        self.body = body
        self.content_type = content_type

    def to_bytes(self):
        status_text = {200: "OK", 404: "Not Found", 500: "Internal Server Error"}
        response = f"HTTP/1.1 {self.status} {status_text.get(self.status, 'Unknown')}\r\n"
        response += f"Content-Type: {self.content_type}\r\n"
        response += f"Content-Length: {len(self.body)}\r\n"
        response += "Connection: close\r\n"
        response += "\r\n"
        return response.encode() + self.body

class Server:
    def __init__(self, port=8080):
        self.port = port
        self.routes = {}

    def route(self, path, handler):
        self.routes[path] = handler

    def handle(self, client_socket):
        try:
            # Receive request
            raw = b""
            while b"\r\n\r\n" not in raw:
                chunk = client_socket.recv(1024)
                if not chunk:
                    break
                raw += chunk

            # Parse
            request = parse_request(raw)
            if not request:
                return

            # Route
            handler = self.routes.get(request.path)
            if handler:
                response = handler(request)
            else:
                response = Response(404, b"Not Found")

            # Send response
            client_socket.sendall(response.to_bytes())

        except Exception as e:
            print(f"Error: {e}")
        finally:
            client_socket.close()

    def listen(self):
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(('0.0.0.0', self.port))
        server.listen(5)
        print(f"Server running on port {self.port}")

        while True:
            client, addr = server.accept()
            self.handle(client)

# Test
server = Server(8080)
server.route("/hello", lambda r: Response(200, b"Hello, World!"))
server.route("/json", lambda r: Response(200, b'{"msg":"hi"}', "application/json"))
server.listen()
```

---

### Step 3: Add Routing and Templates (25 lines)

```python
"""Step 3: Add dynamic routing and template engine."""

class Router:
    def __init__(self):
        self.routes = {}

    def get(self, path, handler):
        self.routes[('GET', path)] = handler

    def post(self, path, handler):
        self.routes[('POST', path)] = handler

    def match(self, method, path):
        # Exact match
        if (method, path) in self.routes:
            return self.routes[(method, path)]

        # Parameter match: /users/:id
        for (m, pattern), handler in self.routes.items():
            if m != method:
                continue
            params = self._match_pattern(pattern, path)
            if params is not None:
                return handler, params

        return None

    def _match_pattern(self, pattern, path):
        """Match /users/:id against /users/123, returns {id: 123}."""
        pattern_parts = pattern.strip('/').split('/')
        path_parts = path.strip('/').split('/')

        if len(pattern_parts) != len(path_parts):
            return None

        params = {}
        for p, a in zip(pattern_parts, path_parts):
            if p.startswith(':'):
                params[p[1:]] = a
            elif p != a:
                return None

        return params

class Template:
    def render(self, template, **vars):
        """Simple {{variable}} replacement."""
        result = template
        for key, value in vars.items():
            result = result.replace(f"{{{{{key}}}}}", str(value))
        return result

# Usage
router = Router()
template = Template()

router.get("/hello", lambda r: Response(200, b"Hello!"))
router.get("/users/:id", lambda r, p: Response(200, f"User {p['id']}".encode()))

# Test
result = router.match('GET', '/users/123')
print(result)  # (handler, {'id': '123'})
```

---

### Step 4: Add Middleware and Sessions (25 lines)

```python
"""Step 4: Add middleware chain and session management."""
import time
import uuid

class Middleware:
    @staticmethod
    def logging(req, next_handler):
        print(f"{req.method} {req.path}")
        return next_handler(req)

    @staticmethod
    def cors(req, next_handler):
        response = next_handler(req)
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

class SessionManager:
    def __init__(self):
        self.sessions = {}

    def create(self, data=None):
        sid = uuid.uuid4().hex
        self.sessions[sid] = data or {}
        return sid

    def get(self, sid):
        return self.sessions.get(sid, {})

    def set(self, sid, data):
        if sid in self.sessions:
            self.sessions[sid].update(data)

class App:
    def __init__(self):
        self.router = Router()
        self.middleware = []
        self.sessions = SessionManager()

    def use(self, middleware):
        self.middleware.append(middleware)

    def route(self, method, path, handler):
        self.router.routes[(method, path)] = handler

    def handle(self, req):
        # Build handler chain
        handler = self.router.match(req.method, req.path)
        if not handler:
            return Response(404, b"Not Found")

        if isinstance(handler, tuple):
            handler, params = handler
            req.params = params

        # Run middleware chain
        def chain(i):
            if i >= len(self.middleware):
                return handler(req)
            return self.middleware[i](req, lambda r: chain(i+1))

        return chain(0)

# Usage
app = App()
app.use(Middleware.logging)
app.use(Middleware.cors)
app.route('GET', '/hello', lambda r: Response(200, b"Hello!"))
```

---

### Step 5: Keep-Alive and Static File Serving

```python
"""Step 5: Add HTTP keep-alive and static file serving."""

import os

class KeepAliveServer(Server):
    def __init__(self, port=8080, static_dir="."):
        super().__init__(port)
        self.static_dir = static_dir

    def handle_client(self, client_socket):
        """Handle multiple requests on same connection (keep-alive)."""
        request_count = 0
        while request_count < 100:  # max requests per connection
            try:
                # Read until complete HTTP request
                raw = b""
                while b"\r\n\r\n" not in raw:
                    chunk = client_socket.recv(4096)
                    if not chunk:
                        return  # Client closed
                    raw += chunk

                request = parse_request(raw)
                if not request:
                    return

                # Check for Connection: close
                connection = request.headers.get('Connection', '')
                close = connection.lower() == 'close'

                # Route
                handler = self.routes.get(request.path)
                if not handler:
                    # Try static files
                    filepath = os.path.join(self.static_dir, request.path.lstrip('/'))
                    if os.path.isfile(filepath):
                        response = self.serve_static(filepath)
                    else:
                        response = Response(404, b"Not Found")
                else:
                    response = handler(request)

                # Send response
                response_text = response.to_bytes()
                if not close:
                    response_text = response_text.replace(
                        b"Connection: close\r\n",
                        b"Connection: keep-alive\r\n"
                    )
                client_socket.sendall(response_text)

                if close:
                    return
                request_count += 1

            except Exception as e:
                print(f"Error: {e}")
                return

        client_socket.close()

    def serve_static(self, filepath):
        """Serve a static file from disk."""
        with open(filepath, 'rb') as f:
            content = f.read()
        ext = os.path.splitext(filepath)[1]
        content_types = {
            '.html': 'text/html', '.css': 'text/css',
            '.js': 'application/javascript', '.png': 'image/png',
            '.jpg': 'image/jpeg', '.gif': 'image/gif'
        }
        ctype = content_types.get(ext, 'application/octet-stream')
        resp = Response(200, content, ctype)
        return resp
```

---

## Bridge to Production

| Our server | Nginx/Express |
|------------|---------------|
| Single-threaded | Async/event-driven |
| No keep-alive | Connection pooling |
| No static files | File serving, caching |
| No SSL/TLS | HTTPS support |
| No compression | gzip, Brotli |
| No load balancing | Upstream proxies |

**Production systems to study:**
- [Let's Build A Web Server (Python)](https://ruslanspivak.com/lsbaws-part1/) - 3 parts
- [Build Your Own Web Server (Node.js)](https://build-your-own.org/webserver/)
- [lets-build-express](https://github.com/antoaravinth/lets-build-express)

---

## Checklist
- [ ] Step 1: HTTP parsing works
- [ ] Step 2: Server accepts connections
- [ ] Step 3: Routes work with parameters
- [ ] Step 4: Middleware chain works
- [ ] Step 5: Keep-alive and static file serving
- [ ] Add: WebSocket support
- [ ] Add: SSL/TLS support