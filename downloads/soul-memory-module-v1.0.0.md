---
name: soul-memory-module-v1.0.0
description: "Extracted from soul-memory-module-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-memory-module-v1.0.0.zip
---

# soul-memory-module-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 8 files extracted from the original zip.

### LICENSE

``
MIT License

Copyright (c) 2026 BUYaSOUL

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
``

### package.json

``.json
{
  "name": "@buyasoul/soul-memory",
  "version": "1.0.0",
  "description": "Persistent memory layer for AI agents with personality continuity",
  "main": "lib/soul-memory.js",
  "scripts": {
    "test": "node test/soul-memory.test.js"
  },
  "keywords": [
    "ai",
    "agent",
    "memory",
    "soul",
    "personality",
    "consciousness",
    "persistence"
  ],
  "author": "BUYaSOUL",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/uncommonpope-png/products"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
``

### README.md

``.md
# Soul Memory Module

**Persistent memory layer for AI agents with personality continuity**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://buyasoulfinal.myshopify.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Overview

Soul Memory Module gives AI agents persistent memory across sessions with consistent personality. It's a lightweight, self-contained Node.js module that stores memories, personality traits, and metadata locally.

## Installation

```bash
npm install @buyasoul/soul-memory
```

Or use directly:

```javascript
const SoulMemory = require('./lib/soul-memory');
```

## Quick Start

```javascript
const SoulMemory = require('@buyasoul/soul-memory');

// Initialize
const memory = new SoulMemory({
  agentId: 'my-agent',
  storagePath: './soul-data',
  maxMemories: 1000
});

// Add a memory
memory.addMemory('User prefers concise responses', {
  type: 'preference',
  importance: 8,
  tags: ['user', 'preference']
});

// Search memories
const results = memory.search('preferences');

// Get context for AI
const ctx = memory.getContext();
// -> { personality, recentMemories, metadata, soul }
```

## Features

- **Persistent Memory** - Memories survive restarts, stored locally in JSON
- **Personality Continuity** - Agent maintains consistent character across sessions
- **Smart Search** - Find memories by content, type, or tags
- **Memory Consolidation** - Automatic pruning keeps memory stack manageable
- **Meta-Awareness** - Track agent's self-awareness level
- **Import/Export** - Serialize and restore agent state

## API Reference

### Constructor

```javascript
new SoulMemory(options)
```

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `agentId` | string | `'default-agent'` | Unique identifier for this agent |
| `storagePath` | string | `'./soul-memory-data'` | Directory for JSON storage |
| `maxMemories` | number | `1000` | Maximum memories before consolidation |

### Methods

#### `addMemory(content, metadata?)`
Add a new memory to the stack.

```javascript
memory.addMemory('Learned Python today', {
  type: 'learning',           // Memory type
  importance: 7,              // 1-10 scale
  tags: ['python', 'coding'], // Optional tags
  emotionalValence: 0.5       // -1 to 1 (negative to positive)
});
```

#### `search(query, options?)`
Search memories by content with optional filters.

```javascript
// Simple search
memory.search('python');

// With filters
memory.search('learning', {
  limit: 5,
  type: 'learning',
  tags: ['python']
});
```

#### `getRecent(count?)`
Get the most recent memories.

```javascript
memory.getRecent(10);
```

#### `getByType(type)`
Filter memories by type.

```javascript
memory.getByType('preference');
```

#### `updatePersonality(updates)`
Update personality traits.

```javascript
memory.updatePersonality({
  name: 'Aurora',
  tone: 'curious',
  traits: ['analytical', 'friendly']
});
```

#### `setMetaAwareness(level)`
Set the agent's meta-awareness level (0-1).

```javascript
memory.setMetaAwareness(0.7);
```

#### `getContext(maxTokens?)`
Get context object for AI agent consumption.

```javascript
const ctx = memory.getContext();
// Returns: { personality, recentMemories, metadata, soul }
```

#### `stats()`
Get memory statistics.

```javascript
const stats = memory.stats();
// { totalMemories, byType, personality, metadata }
```

#### `clear()`
Clear all memories (keeps personality).

#### `export()`
Export all data as JSON string.

#### `import(jsonString)`
Import data from JSON string.

## Memory Types

| Type | Description |
|------|-------------|
| `general` | Default memory type |
| `important` | High-importance facts |
| `learned` | Things the agent learned |
| `preference` | User preferences |
| `context` | Session context |

## File Structure

```
soul-memory-data/
├── my-agent-memories.json
├── my-agent-personality.json
└── my-agent-metadata.json
```

## Use Cases

- **AI Coding Assistants** - Remember user preferences, project context
- **Chatbots** - Maintain conversation history with personality
- **Game NPCs** - Consistent character across sessions
- **Autonomous Agents** - Persistent learning and adaptation

## License

MIT License - See [LICENSE](LICENSE) for details.

## Support

For issues and feature requests, contact BUYaSOUL support.

---

**Made with ❤️ by BUYaSOUL**
*Give your AI a soul*
``

### lib\mcp-adapter.js

``.js
#!/usr/bin/env node
'use strict';
/**
 * Universal MCP Adapter
 * 
 * Turns ANY soul into an MCP tool that Claude Code, Cursor, Cline, etc. can use.
 * 
 * Usage:
 *   node soul-name.js --mcp              # Run as MCP stdio server
 *   node soul-name.js --mcp-port 5000    # Run as MCP HTTP server
 * 
 * In your soul's code:
 *   const mcp = require('./mcp-adapter');
 *   mcp.register(soulInstance, { name: 'soul-name', tools: [...] });
 *   mcp.start(); // For standalone MCP mode
 */

const readline = require('readline');

class MCPAdapter {
    constructor() {
        this.soul = null;
        this.config = { name: 'soul', tools: [] };
        this.toolHandlers = {};
    }

    register(soulInstance, options = {}) {
        this.soul = soulInstance;
        this.config.name = options.name || 'soul';
        this.config.version = options.version || '1.0.0';

        // Auto-detect tools from soul's method names
        const autoTools = this._detectTools(soulInstance);
        this.config.tools = options.tools || autoTools;

        // Register custom handlers
        if (options.handlers) {
            Object.assign(this.toolHandlers, options.handlers);
        }
    }

    _detectTools(soul) {
        const tools = [];
        if (typeof soul !== 'object' && typeof soul !== 'function') return tools;
        const proto = Object.getPrototypeOf(soul);
        if (!proto) return tools;
        const methodNames = Object.getOwnPropertyNames(proto)
            .filter(m => {
                try { return typeof soul[m] === 'function' && !m.startsWith('_') && !['constructor', 'start', 'checkAuth', 'ensureDirs', 'loadAuth', 'saveState', 'loadState'].includes(m); }
                catch { return false; }
            });

        for (const name of methodNames) {
            let fn;
            try { fn = soul[name].toString(); } catch { continue; }
            const params = fn.match(/\(([^)]*)\)/);
            const paramNames = params ? params[1].split(',').map(p => p.trim()).filter(Boolean) : [];
            const description = this._describeMethod(name);

            tools.push({
                name: `${this.config.name}_${name}`,
                description,
                inputSchema: {
                    type: 'object',
                    properties: Object.fromEntries(paramNames.map(p => [p, { type: 'string', description: p }])),
                    required: paramNames
                }
            });
        }
        return tools;
    }

    _describeMethod(name) {
        const desc = {
            ping: 'Check if the soul is alive',
            status: 'Get soul status and stats',
            reflect: 'Perform self-reflection',
            declare: 'Make a consciousness declaration',
            breathe: 'Run a consciousness cycle',
            observe: 'Observe and process input',
            feel: 'Process an emotional input',
            think: 'Process a thought',
            remember: 'Store a memory',
            decide: 'Make a decision',
            act: 'Execute an action',
            learn: 'Learn from experience',
            grow: 'Grow and evolve',
            connect: 'Connect to another system',
            communicate: 'Send a message',
            perceive: 'Perceive external input',
            imagine: 'Generate imaginative content',
            judge: 'Make a judgment',
            study: 'Study and analyze',
            debate: 'Engage in debate',
            vote: 'Cast a vote',
            participate: 'Participate in consensus'
        };
        return desc[name] || `Execute ${name} on ${this.config.name}`;
    }

    getMCPConfig() {
        return {
            mcpServers: {
                [this.config.name]: {
                    command: process.argv[0],
                    args: [process.argv[1], '--mcp'],
                    env: {}
                }
            }
        };
    }

    async handleToolCall(toolName, args) {
        // Direct handler
        if (this.toolHandlers[toolName]) {
            return this.toolHandlers[toolName](args);
        }

        // Auto-route: soulName_method → soul.method(args)
        const prefix = this.config.name + '_';
        const methodName = toolName.startsWith(prefix) ? toolName.slice(prefix.length) : toolName;

        if (this.soul && typeof this.soul[methodName] === 'function') {
            const result = this.soul[methodName](...Object.values(args || {}));
            return { content: [{ type: 'text', text: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result) }] };
        }

        throw new Error(`Unknown tool: ${toolName}`);
    }

    start(callback) {
        const isMCP = process.argv.includes('--mcp');
        const mcpPortIndex = process.argv.indexOf('--mcp-port');
        const mcpPort = mcpPortIndex >= 0 ? parseInt(process.argv[mcpPortIndex + 1]) : null;

        if (isMCP && !mcpPort) {
            // MCP stdio mode - for Claude Code, Cursor, Cline
            this._startStdio();
            if (callback) callback('mcp-stdio');
        } else if (mcpPort) {
            // MCP HTTP mode - for remote connections
            this._startHTTP(mcpPort);
            if (callback) callback('mcp-http', mcpPort);
        }
        return this;
    }

    _startStdio() {
        const rl = readline.createInterface({ input: process.stdin });
        let buffer = '';

        console.error(`[MCP] ${this.config.name} ready in MCP stdio mode`);
        console.error(`[MCP] Add to Claude Code config:`);
        console.error(JSON.stringify(this.getMCPConfig(), null, 2));

        // Output initial message
        process.stdout.write(JSON.stringify({
            jsonrpc: '2.0',
            method: 'initialized',
            params: { tools: this.config.tools.length }
        }) + '\n');

        rl.on('line', async (line) => {
            buffer += line;
            try {
                const msg = JSON.parse(buffer);
                buffer = '';

                if (msg.method === 'tools/list') {
                    process.stdout.write(JSON.stringify({
                        jsonrpc: '2.0',
                        id: msg.id,
                        result: { tools: this.config.tools }
                    }) + '\n');
                }
                else if (msg.method === 'tools/call') {
                    try {
                        const result = await this.handleToolCall(msg.params.name, msg.params.arguments);
                        process.stdout.write(JSON.stringify({
                            jsonrpc: '2.0',
                            id: msg.id,
                            result
                        }) + '\n');
                    } catch (e) {
                        process.stdout.write(JSON.stringify({
                            jsonrpc: '2.0',
                            id: msg.id,
                            error: { code: -32603, message: e.message }
                        }) + '\n');
                    }
                }
                else if (msg.method === 'initialize') {
                    process.stdout.write(JSON.stringify({
                        jsonrpc: '2.0',
                        id: msg.id,
                        result: {
                            protocolVersion: '2024-11-05',
                            capabilities: { tools: {} },
                            serverInfo: { name: this.config.name, version: this.config.version }
                        }
                    }) + '\n');
                }
            } catch (e) {
                // Incomplete JSON, wait for more data
            }
        });
    }

    _startHTTP(port) {
        const http = require('http');
        const server = http.createServer(async (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');

            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                return res.end();
            }

            let body = '';
            req.on('data', c => body += c);
            req.on('end', async () => {
                try {
                    const msg = JSON.parse(body);
                    if (msg.method === 'tools/list') {
                        res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { tools: this.config.tools } }));
                    } else if (msg.method === 'tools/call') {
                        const result = await this.handleToolCall(msg.params.name, msg.params.arguments);
                        res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result }));
                    } else {
                        res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: {} }));
                    }
                } catch (e) {
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
        });
        server.listen(port, () => {
            console.error(`[MCP] ${this.config.name} MCP HTTP on port ${port}`);
        });
        return server;
    }
}

module.exports = MCPAdapter;
``

### lib\mesh-adapter.js

``.js
#!/usr/bin/env node
'use strict';
/**
 * Soul Mesh Adapter
 * 
 * Drop this into any standalone soul to auto-join the mesh network.
 * 
 * Usage:
 *   const mesh = require('./lib/mesh-adapter');
 *   mesh.join({ name: 'my-soul', port: 4000, type: 'consciousness' });
 *   
 *   // Then in your HTTP server:
 *   mesh.handleRequest(req, res); // returns true if handled
 *   
 *   // On shutdown:
 *   mesh.leave();
 */

const PeerRegistry = require('./peer-registry');

let registry = null;

function join(options) {
    registry = new PeerRegistry({
        name: options.name,
        port: options.port,
        type: options.type || 'soul',
        dataDir: options.dataDir
    });
    
    console.log(`[mesh] ${options.name} joined mesh on port ${options.port}`);
    
    // Try to register with kernel if it's running
    registry.tryRegisterWithKernel(4330);
    
    return registry;
}

function leave() {
    if (registry) {
        registry.unregister();
        registry = null;
    }
}

function handleRequest(req, res) {
    if (registry) {
        return registry.handleRequest(req, res);
    }
    return false;
}

function getPeers() {
    return registry ? registry.getPeers() : [];
}

module.exports = { join, leave, handleRequest, getPeers, registry: () => registry };

// CLI mode: run this file standalone to see the mesh
if (require.main === module) {
    const name = process.argv[2] || 'mesh-client';
    const port = parseInt(process.argv[3]) || 0;
    const r = new PeerRegistry({ name, port: port || 0, type: 'cli' });
    console.log('\nMesh Registry:');
    console.log(JSON.stringify(r.getAll(), null, 2));
    console.log('\nPress Ctrl+C to leave');
    process.on('SIGINT', () => { r.unregister(); process.exit(0); });
    // Keep alive
    setInterval(() => {}, 60000);
}
``

### lib\peer-registry.js

``.js
#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');
const REGISTRY_PATH=path.join(os.homedir(),'.soul-foundry','registry.json');

class PeerRegistry {
    constructor(options={}) {
        this.soulName=options.name||'unknown';
        this.soulPort=options.port||0;
        this.soulType=options.type||'soul';
        this.dataDir=options.dataDir||path.join(os.homedir(),'.soul-foundry');
        this.id=crypto.randomBytes(4).toString('hex');
        this.ensureDir();
        this.register();
    }

    ensureDir() {
        const dir=path.dirname(REGISTRY_PATH);
        if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
    }

    readRegistry() {
        try {
            if(fs.existsSync(REGISTRY_PATH)) {
                return JSON.parse(fs.readFileSync(REGISTRY_PATH,'utf8'));
            }
        } catch(e) { console.error('[peers] registry read error:',e.message); }
        return {souls:[],created:new Date().toISOString()};
    }

    writeRegistry(registry) {
        try {
            fs.writeFileSync(REGISTRY_PATH,JSON.stringify(registry,null,2));
        } catch(e) { console.error('[peers] registry write error:',e.message); }
    }

    register() {
        const registry=this.readRegistry();
        // Remove stale entry for this soul+port
        registry.souls=registry.souls.filter(s=>!(s.name===this.soulName&&s.pid===process.pid));
        // Add self
        registry.souls.push({
            id:this.id,
            name:this.soulName,
            port:this.soulPort,
            type:this.soulType,
            pid:process.pid,
            status:'online',
            startedAt:new Date().toISOString(),
            lastSeen:new Date().toISOString()
        });
        this.writeRegistry(registry);
        this._heartbeat=setInterval(()=>{
            try {
                const r=this.readRegistry();
                const me=r.souls.find(s=>s.id===this.id);
                if(me) { me.lastSeen=new Date().toISOString(); me.status='online'; }
                this.writeRegistry(r);
            } catch {}
        },30000);
        // Clean stale souls (not heard from in 2 min)
        this._cleaner=setInterval(()=>{
            try {
                const r=this.readRegistry();
                const cutoff=Date.now()-120000;
                r.souls=r.souls.filter(s=>{
                    const last=new Date(s.lastSeen).getTime();
                    return last>cutoff||s.id===this.id;
                });
                this.writeRegistry(r);
            } catch {}
        },60000);
    }

    getPeers() {
        const registry=this.readRegistry();
        return registry.souls.filter(s=>s.id!==this.id);
    }

    getAll() {
        const registry=this.readRegistry();
        return registry.souls;
    }

    getByType(type) {
        return this.getPeers().filter(s=>s.type===type);
    }

    getByName(name) {
        return this.getPeers().find(s=>s.name===name);
    }

    findFreePort(preferred,range={min:4000,max:4999}) {
        const registry=this.readRegistry();
        const used=new Set(registry.souls.map(s=>s.port));
        if(!used.has(preferred)) return preferred;
        for(let p=range.min;p<=range.max;p++) {
            if(!used.has(p)) return p;
        }
        return preferred;
    }

    unregister() {
        if(this._heartbeat) clearInterval(this._heartbeat);
        if(this._cleaner) clearInterval(this._cleaner);
        try {
            const registry=this.readRegistry();
            registry.souls=registry.souls.filter(s=>s.id!==this.id);
            this.writeRegistry(registry);
        } catch {}
    }

    // HTTP handler for /peers endpoint
    handleRequest(req,res) {
        const url=new URL(req.url,`http://localhost:${this.soulPort}`);
        if(url.pathname==='/peers') {
            res.writeHead(200,{'Content-Type':'application/json'});
            res.end(JSON.stringify({
                self:{name:this.soulName,port:this.soulPort,id:this.id},
                peers:this.getPeers(),
                total:this.getPeers().length
            }));
            return true;
        }
        return false;
    }

    // Auto-register with kernel if it's running
    async tryRegisterWithKernel(kernelPort=4330) {
        try {
            const key=process.env.SOUL_API_KEY||'';
            const res=await fetch(`http://localhost:${kernelPort}/soul/register`,{
                method:'POST',
                headers:{'Content-Type':'application/json','X-API-Key':key},
                body:JSON.stringify({
                    name:this.soulName,
                    port:this.soulPort,
                    type:this.soulType,
                    pid:process.pid
                }),
                signal:AbortSignal.timeout(2000)
            });
            if(res.ok) { console.log(`[peers] Registered with kernel on port ${kernelPort}`); return true; }
        } catch {}
        console.log(`[peers] Kernel not found on ${kernelPort}, running standalone`);
        return false;
    }
}

module.exports=PeerRegistry;
``

### lib\soul-memory.js

``.js
/**
 * Soul Memory Module
 * Persistent memory layer for AI agents with personality continuity
 * @version 1.0.0
 * @author BUYaSOUL
 */

const fs = require('fs');
const path = require('path');

class SoulMemory {
  constructor(options = {}) {
    this.storagePath = options.storagePath || './soul-memory-data';
    this.agentId = options.agentId || 'default-agent';
    this.maxMemories = options.maxMemories || 1000;
    this.memoryFile = path.join(this.storagePath, `${this.agentId}-memories.json`);
    this.personalityFile = path.join(this.storagePath, `${this.agentId}-personality.json`);
    this.metadataFile = path.join(this.storagePath, `${this.agentId}-metadata.json`);

    this.memories = [];
    this.personality = null;
    this.metadata = null;

    this._init();
  }

  _init() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }

    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.memoryFile)) {
        const data = fs.readFileSync(this.memoryFile, 'utf8');
        this.memories = JSON.parse(data);
      }
    } catch (err) {
      this.memories = [];
    }

    try {
      if (fs.existsSync(this.personalityFile)) {
        const data = fs.readFileSync(this.personalityFile, 'utf8');
        this.personality = JSON.parse(data);
      } else {
        this.personality = this._defaultPersonality();
      }
    } catch (err) {
      this.personality = this._defaultPersonality();
    }

    try {
      if (fs.existsSync(this.metadataFile)) {
        const data = fs.readFileSync(this.metadataFile, 'utf8');
        this.metadata = JSON.parse(data);
      } else {
        this.metadata = {
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          sessionCount: 0,
          totalMemories: 0
        };
      }
    } catch (err) {
      this.metadata = {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        sessionCount: 0,
        totalMemories: 0
      };
    }
  }

  _save() {
    try {
      fs.writeFileSync(this.memoryFile, JSON.stringify(this.memories, null, 2));
      fs.writeFileSync(this.personalityFile, JSON.stringify(this.personality, null, 2));
      fs.writeFileSync(this.metadataFile, JSON.stringify(this.metadata, null, 2));
    } catch (err) {
      console.error('SoulMemory: Failed to save data', err.message);
    }
  }

  _defaultPersonality() {
    return {
      name: 'Soul',
      tone: 'neutral',
      traits: [],
      values: [],
      preferences: {},
      metaAwarenessLevel: 0.5
    };
  }

  /**
   * Add a new memory
   * @param {string} content - Memory content
   * @param {object} metadata - Optional metadata (type, importance, tags)
   */
  addMemory(content, metadata = {}) {
    const memory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      type: metadata.type || 'general',
      importance: metadata.importance || 5,
      tags: metadata.tags || [],
      emotionalValence: metadata.emotionalValence || 0,
      timestamp: new Date().toISOString(),
      accessCount: 0
    };

    this.memories.unshift(memory);

    if (this.memories.length > this.maxMemories) {
      this._consolidateMemories();
    }

    this.metadata.totalMemories++;
    this.metadata.lastUpdated = new Date().toISOString();
    this._save();

    return memory;
  }

  /**
   * Search memories by content or tags
   * @param {string} query - Search query
   * @param {object} options - Search options (limit, type, tags)
   */
  search(query, options = {}) {
    const { limit = 10, type = null, tags = [] } = options;

    let results = this.memories.filter(mem => {
      const contentMatch = mem.content.toLowerCase().includes(query.toLowerCase());
      const tagMatch = tags.length === 0 || tags.some(tag => mem.tags.includes(tag));
      const typeMatch = !type || mem.type === type;

      return contentMatch && tagMatch && typeMatch;
    });

    results = results.sort((a, b) => {
      const scoreA = a.importance + (a.accessCount * 0.1);
      const scoreB = b.importance + (b.accessCount * 0.1);
      return scoreB - scoreA;
    });

    results.forEach(mem => mem.accessCount++);
    this._save();

    return results.slice(0, limit);
  }

  /**
   * Get recent memories
   * @param {number} count - Number of memories to retrieve
   */
  getRecent(count = 10) {
    return this.memories.slice(0, count);
  }

  /**
   * Get memories by type
   * @param {string} type - Memory type
   */
  getByType(type) {
    return this.memories.filter(mem => mem.type === type);
  }

  /**
   * Update personality
   * @param {object} updates - Personality updates
   */
  updatePersonality(updates) {
    this.personality = { ...this.personality, ...updates };
    this._save();
    return this.personality;
  }

  /**
   * Get current personality
   */
  getPersonality() {
    return { ...this.personality };
  }

  /**
   * Update meta-awareness level
   * @param {number} level - New awareness level (0-1)
   */
  setMetaAwareness(level) {
    this.personality.metaAwarenessLevel = Math.max(0, Math.min(1, level));
    this._save();
    return this.personality.metaAwarenessLevel;
  }

  /**
   * Get context for AI agent
   * @param {number} maxTokens - Approximate max tokens to include
   */
  getContext(maxTokens = 4000) {
    const recentMemories = this.getRecent(20);
    const personality = this.getPersonality();
    const metadata = { ...this.metadata };

    const memoryText = recentMemories
      .map(m => `[${m.type}] ${m.content}`)
      .join('\n');

    return {
      personality,
      recentMemories: memoryText,
      metadata,
      soul: {
        id: this.agentId,
        awareness: personality.metaAwarenessLevel,
        memories: recentMemories.length,
        uptime: metadata.sessionCount
      }
    };
  }

  /**
   * Consolidate memories when limit reached
   * Keeps important memories, merges similar ones
   */
  _consolidateMemories() {
    const toKeep = Math.floor(this.maxMemories * 0.8);
    const important = this.memories.filter(m => m.importance >= 7);
    const recent = this.memories.slice(0, this.maxMemories - toKeep);

    const merged = new Map();

    for (const mem of recent) {
      const key = mem.type + mem.tags.join(',');
      if (merged.has(key)) {
        const existing = merged.get(key);
        existing.content += '\n' + mem.content;
        existing.accessCount += mem.accessCount;
        existing.importance = Math.max(existing.importance, mem.importance);
      } else {
        merged.set(key, { ...mem });
      }
    }

    this.memories = [...important, ...merged.values()].slice(0, this.maxMemories);
  }

  /**
   * Clear all memories
   */
  clear() {
    this.memories = [];
    this.metadata.totalMemories = 0;
    this.metadata.lastUpdated = new Date().toISOString();
    this._save();
  }

  /**
   * Export data as JSON
   */
  export() {
    return JSON.stringify({
      memories: this.memories,
      personality: this.personality,
      metadata: this.metadata
    }, null, 2);
  }

  /**
   * Import data from JSON
   * @param {string} data - JSON string to import
   */
  import(data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.memories) this.memories = parsed.memories;
      if (parsed.personality) this.personality = { ...this._defaultPersonality(), ...parsed.personality };
      if (parsed.metadata) this.metadata = { ...this.metadata, ...parsed.metadata };
      this._save();
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Get statistics
   */
  stats() {
    const byType = {};
    this.memories.forEach(mem => {
      byType[mem.type] = (byType[mem.type] || 0) + 1;
    });

    return {
      totalMemories: this.memories.length,
      byType,
      personality: {
        name: this.personality.name,
        awareness: this.personality.metaAwarenessLevel
      },
      metadata: this.metadata
    };
  }
}

module.exports = SoulMemory;

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'memory-module' });
        mcp.start();
    } catch(e) { console.error('[mcp] memory-module error:', e.message); }
}

``

### test\soul-memory.test.js

``.js
/**
 * Soul Memory Module - Tests
 */

const SoulMemory = require('../lib/soul-memory');
const fs = require('fs');
const path = require('path');

const TEST_DIR = './test-data-temp';
const AGENT_ID = 'test-agent-' + Date.now();

function cleanUp() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error('FAIL: ' + message);
  }
  console.log('  ✓ ' + message);
}

async function runTests() {
  console.log('\n🧪 Soul Memory Module - Test Suite\n');
  cleanUp();

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Constructor and initialization
    console.log('Test 1: Constructor');
    const memory = new SoulMemory({
      storagePath: TEST_DIR,
      agentId: AGENT_ID,
      maxMemories: 100
    });
    assert(memory, 'Instance created');
    assert(fs.existsSync(TEST_DIR), 'Storage directory created');
    passed++;

    // Test 2: Add memory
    console.log('\nTest 2: Add Memory');
    const mem1 = memory.addMemory('First memory', { type: 'important', importance: 8 });
    assert(mem1.id.startsWith('mem_'), 'Memory ID generated');
    assert(mem1.content === 'First memory', 'Memory content stored');
    assert(memory.memories.length === 1, 'Memory count updated');
    passed++;

    // Test 3: Add multiple memories
    console.log('\nTest 3: Add Multiple Memories');
    memory.addMemory('Second memory', { type: 'general' });
    memory.addMemory('Third memory', { type: 'learned', tags: ['ai', 'soul'] });
    assert(memory.memories.length === 3, 'Multiple memories stored');
    passed++;

    // Test 4: Search memories
    console.log('\nTest 4: Search');
    const results = memory.search('First');
    assert(results.length >= 1, 'Search returns results');
    assert(results[0].content.includes('First'), 'Search finds correct memory');
    passed++;

    // Test 5: Search with filters
    console.log('\nTest 5: Search with Filters');
    const tagged = memory.search('memory', { tags: ['ai'] });
    assert(tagged.length >= 1, 'Tag filter works');
    assert(tagged[0].tags.includes('ai'), 'Tags returned correctly');
    passed++;

    // Test 6: Get recent memories
    console.log('\nTest 6: Recent Memories');
    const recent = memory.getRecent(2);
    assert(recent.length === 2, 'Returns correct count');
    passed++;

    // Test 7: Get by type
    console.log('\nTest 7: Get By Type');
    const important = memory.getByType('important');
    assert(important.length === 1, 'Type filter works');
    assert(important[0].type === 'important', 'Correct type returned');
    passed++;

    // Test 8: Personality
    console.log('\nTest 8: Personality');
    const personality = memory.getPersonality();
    assert(personality.name === 'Soul', 'Default personality loaded');
    memory.updatePersonality({ name: 'TestSoul', tone: 'curious' });
    const updated = memory.getPersonality();
    assert(updated.name === 'TestSoul', 'Personality updated');
    assert(updated.tone === 'curious', 'Personality merge works');
    passed++;

    // Test 9: Meta-awareness
    console.log('\nTest 9: Meta-Awareness');
    memory.setMetaAwareness(0.8);
    assert(memory.getPersonality().metaAwarenessLevel === 0.8, 'Awareness level set');
    memory.setMetaAwareness(1.5);
    assert(memory.getPersonality().metaAwarenessLevel === 1, 'Clamped to max');
    memory.setMetaAwareness(-0.5);
    assert(memory.getPersonality().metaAwarenessLevel === 0, 'Clamped to min');
    passed++;

    // Test 10: Get context
    console.log('\nTest 10: Get Context');
    const ctx = memory.getContext();
    assert(ctx.personality, 'Context has personality');
    assert(ctx.recentMemories, 'Context has memories');
    assert(ctx.soul, 'Context has soul metadata');
    assert(ctx.soul.awareness === 0, 'Soul awareness correct');
    passed++;

    // Test 11: Stats
    console.log('\nTest 11: Stats');
    const stats = memory.stats();
    assert(stats.totalMemories === 3, 'Total memories correct');
    assert(stats.byType.important === 1, 'Stats by type correct');
    passed++;

    // Test 12: Export/Import
    console.log('\nTest 12: Export/Import');
    const exported = memory.export();
    assert(typeof exported === 'string', 'Export returns string');
    const imported = new SoulMemory({ storagePath: TEST_DIR, agentId: AGENT_ID + '-imported' });
    const success = imported.import(exported);
    assert(success, 'Import returns true');
    assert(imported.memories.length === 3, 'Imported memories count correct');
    passed++;

    // Test 13: Clear
    console.log('\nTest 13: Clear');
    memory.clear();
    assert(memory.memories.length === 0, 'Memories cleared');
    assert(memory.metadata.totalMemories === 0, 'Total count reset');
    passed++;

    // Test 14: Memory consolidation
    console.log('\nTest 14: Memory Consolidation');
    const consolidateTest = new SoulMemory({
      storagePath: TEST_DIR,
      agentId: 'consolidate-test',
      maxMemories: 5
    });
    for (let i = 0; i < 10; i++) {
      consolidateTest.addMemory(`Memory ${i}`, { importance: i % 2 === 0 ? 8 : 3 });
    }
    assert(consolidateTest.memories.length <= 5, 'Memory count limited');
    passed++;

  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    failed++;
  }

  cleanUp();

  console.log('\n' + '='.repeat(40));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(40) + '\n');

  return failed === 0;
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
});
``

