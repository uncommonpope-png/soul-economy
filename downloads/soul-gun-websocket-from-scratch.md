---
name: websocket-from-scratch
description: Build WebSocket protocol from scratch — handshake, framing, bidirectional messaging.
domain: computer-science
language: python
version: 0.1.0
author: profit-prime
---

# WebSocket From Scratch

> *"The connection that stays open hears everything."*

Build the WebSocket protocol from first principles — no libraries, just raw sockets.

## Step 1: HTTP Upgrade Handshake
Implement the HTTP upgrade request/response that establishes a WebSocket connection. Parse headers, compute the Sec-WebSocket-Accept hash.

## Step 2: Frame Parsing
Implement the WebSocket frame format — opcodes, masking, payload length encoding, fragmentation.

## Step 3: Bidirectional Messaging
Build a simple chat server that broadcasts messages to all connected clients. Handle ping/pong keepalive.
