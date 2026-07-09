---
name: bot-from-scratch
description: Build a Bot from Scratch
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
---# Build a Bot from Scratch

> *"A bot is just: receive message → parse → process → respond."*

---

## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                       BOT ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   PLATFORM (Discord/Telegram/Slack)                             │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  WEBHOOK SERVER                                          │  │
│   │     POST /webhook → receive event                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  MESSAGE PARSER                                           │  │
│   │     Extract: sender, channel, content, timestamp          │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  COMMAND ROUTER                                          │  │
│   │     "/help" → help_handler                                │  │
│   │     "/weather NYC" → weather_handler                      │  │
│   │     "default" → fallback_handler                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  RESPONSE GENERATOR                                       │  │
│   │     Generate: text, embed, image, buttons                 │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   SEND via API                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Build Steps (4 Steps, ~80 Lines)

### Step 1: Message Structure (15 lines)

```python
"""Step 1: Define message structure."""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class Message:
    content: str
    sender: str
    sender_id: str
    channel: str
    channel_id: str
    timestamp: datetime
    raw: dict  # Original platform data

    def is_command(self):
        """Check if message starts with command prefix."""
        return self.content.startswith('/')

    def get_command(self):
        """Parse command and arguments."""
        parts = self.content[1:].split(maxsplit=1)
        cmd = parts[0].lower()
        args = parts[1] if len(parts) > 1 else ""
        return cmd, args

class MessageBuilder:
    @staticmethod
    def from_discord(data):
        """Parse Discord webhook payload."""
        return Message(
            content=data.get('content', ''),
            sender=data['author']['username'],
            sender_id=data['author']['id'],
            channel=data['guild']['name'],
            channel_id=data['guild']['id'],
            timestamp=datetime.now(),
            raw=data
        )

    @staticmethod
    def from_telegram(data):
        """Parse Telegram webhook payload."""
        return Message(
            content=data['message']['text'],
            sender=data['message']['from']['first_name'],
            sender_id=data['message']['from']['id'],
            channel=data['message']['chat']['title'],
            channel_id=data['message']['chat']['id'],
            timestamp=datetime.now(),
            raw=data
        )
```

---

### Step 2: Command Router (20 lines)

```python
"""Step 2: Command router with handlers."""

class CommandRouter:
    def __init__(self, prefix='/'):
        self.prefix = prefix
        self.handlers = {}

    def command(self, name):
        """Decorator to register command handler."""
        def decorator(func):
            self.handlers[name.lower()] = func
            return func
        return decorator

    def handle(self, message):
        """Route message to appropriate handler."""
        if not message.is_command():
            return self.handle_default(message)

        cmd, args = message.get_command()

        if cmd in self.handlers:
            return self.handlers[cmd](message, args)
        else:
            return f"Unknown command: {cmd}. Try /help"

    def handle_default(self, message):
        """Handle non-command messages."""
        return f"You said: {message.content}"


# Create bot
router = CommandRouter()

@router.command('help')
def help_handler(msg, args):
    return """Available commands:
    /help - Show this help
    /ping - Check bot is alive
    /weather <city> - Get weather
    /roll - Roll dice"""

@router.command('ping')
def ping_handler(msg, args):
    return "Pong!"

@router.command('weather')
def weather_handler(msg, args):
    if not args:
        return "Usage: /weather <city>"
    return f"Weather for {args}: 72°F, partly cloudy"

@router.command('roll')
def roll_handler(msg, args):
    import random
    result = random.randint(1, 6)
    return f"🎲 You rolled {result}!"
```

---

### Step 3: HTTP Server (25 lines)

```python
"""Step 3: Simple webhook server."""

import socket
import json

class BotServer:
    def __init__(self, port=8080):
        self.port = port
        self.router = CommandRouter()

    def parse_http(self, raw):
        """Parse HTTP request."""
        lines = raw.decode().split('\r\n')
        request_line = lines[0].split()
        method = request_line[0]
        path = request_line[1]

        # Parse body
        body_start = lines.index('')
        body = '\r\n'.join(lines[body_start+1:])
        return method, path, body

    def handle_request(self, raw):
        """Handle incoming HTTP request."""
        method, path, body = self.parse_http(raw)

        if method == 'POST' and path == '/webhook':
            # Parse platform-specific payload
            data = json.loads(body)

            # Normalize to our Message format
            msg = MessageBuilder.from_discord(data)

            # Route to handler
            response = self.router.handle(msg)

            # Return response
            return json.dumps({'content': response})

        return json.dumps({'error': 'Not found'})

    def start(self):
        """Start HTTP server."""
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(('0.0.0.0', self.port))
        server.listen(5)

        print(f"Bot server running on port {self.port}")

        while True:
            client, addr = server.accept()
            raw = client.recv(4096)
            if raw:
                response = self.handle_request(raw)
                client.send(f"HTTP/1.1 200 OK\r\nContent-Length: {len(response)}\r\n\r\n{response}".encode())
            client.close()

# Run
bot = BotServer()
bot.start()
```

---

### Step 4: State and Persistence (20 lines)

```python
"""Step 4: Bot state management."""

import json
import os

class BotState:
    def __init__(self, state_file='bot_state.json'):
        self.state_file = state_file
        self.data = {}
        self.load()

    def load(self):
        """Load state from file."""
        if os.path.exists(self.state_file):
            with open(self.state_file, 'r') as f:
                self.data = json.load(f)
        else:
            self.data = {
                'users': {},      # user_id -> user data
                'servers': {},    # server_id -> server data
                'counters': {}    # user_id -> message count
            }

    def save(self):
        """Persist state to file."""
        with open(self.state_file, 'w') as f:
            json.dump(self.data, f, indent=2)

    def get_user(self, user_id):
        """Get or create user data."""
        if user_id not in self.data['users']:
            self.data['users'][user_id] = {
                'commands': 0,
                'joined_at': str(datetime.now()),
            }
        return self.data['users'][user_id]

    def increment_command(self, user_id):
        """Track command usage."""
        user = self.get_user(user_id)
        user['commands'] = user.get('commands', 0) + 1
        self.save()

# Enhanced router with state
class StatefulRouter(CommandRouter):
    def __init__(self):
        super().__init__()
        self.state = BotState()

    def handle(self, message):
        result = super().handle(message)
        self.state.increment_command(message.sender_id)
        return result

# Test
router = StatefulRouter()
print(router.state.data)
```

---

## Bridge to Production

| Our Bot | Discord.py / discord.js |
|---------|-------------------------|
| Raw sockets | WebSocket gateway |
| No rate limiting | Automatic rate limiting |
| No embeds | Rich embeds, components |
| No voice | Voice channels |
| No persistence | Database + Redis |

**Production systems to study:**
- [Discord.py Guide](https://discordpy.readthedocs.io/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Slack Bolt](https://slack.dev/bolt-python/)

---

## Checklist

- [ ] Step 1: Message parsing
- [ ] Step 2: Command routing
- [ ] Step 3: Webhook server
- [ ] Step 4: State management
- [ ] Add: embeds and rich content
- [ ] Add: button interactions