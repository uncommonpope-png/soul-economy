---
name: soulguns-mcp
description: 1. Protocol Architecture
domain: computer-science
language: python
stars: "0"
topics: ["soulguns", "architecture", "typescript", "design-patterns"]
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
----|-------|----------|-----------------|
| modelcontextprotocol/typescript-sdk | 12.6k★ | TypeScript | Official TS SDK v2 — `McpServer`, transports, middleware |
| PrefectHQ/fastmcp | 25.4k★ | Python | FastMCP framework — decorators, apps, providers, 70% of all MCP servers |
| modelcontextprotocol/servers | 86.6k★ | TS/Python | Reference servers — Everything, Fetch, Filesystem, Git, Memory, Time |
| modelcontextprotocol/inspector | 10k★ | TypeScript | MCP Inspector — UI + CLI testing tool, auth, transport support |
| modelcontextprotocol/ext-apps | ~3k★ | TypeScript | Apps extension — AppBridge, postMessage protocol, host SDK |

---

## 1. Protocol Architecture

### 1.1 JSON-RPC 2.0 Foundation

MCP is built on JSON-RPC 2.0 with three message types:

- **Request** — `{ jsonrpc: "2.0", id, method, params }` — expects a response
- **Notification** — `{ jsonrpc: "2.0", method, params }` — no response expected
- **Response** — `{ jsonrpc: "2.0", id, result }` or `{ jsonrpc: "2.0", id, error }` — matches request id

### 1.2 Lifecycle

1. **Initialize** — Client sends `initialize` with capabilities + protocol version; server responds with its capabilities
2. **Initialized notification** — Client confirms initialization complete
3. **Operation** — Normal tool/resource/prompt exchange
4. **Shutdown** — Clean disconnect

```typescript
// SDK handles lifecycle automatically
const server = new McpServer({ name: 'my-server', version: '1.0.0' });
```

### 1.3 Capability Negotiation

```typescript
const server = new McpServer(
  { name: 'db-server', version: '1.0.0' },
  {
    capabilities: {
      logging: {},
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);
```

Client capabilities (sampling, roots, elicitation) are checked at runtime via `ctx.mcpReq` methods — no need to pre-declare.

---

## 2. Transport Patterns

### 2.1 Transport Selection (Everything Server Pattern)

Use command-line arg to select transport at startup:

```typescript
const args = process.argv.slice(2);
const scriptName = args[0] || "stdio";

async function run() {
  switch (scriptName) {
    case "stdio":
      await import("./transports/stdio.js");
      break;
    case "sse":
      await import("./transports/sse.js");
      break;
    case "streamableHttp":
      await import("./transports/streamableHttp.js");
      break;
  }
}
```

### 2.2 stdio Transport (Local/Desktop)

```typescript
const server = new McpServer({ name: 'my-server', version: '1.0.0' });
const transport = new StdioServerTransport();
await server.connect(transport);

process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});
```

### 2.3 Streamable HTTP (Remote/Production)

```typescript
import { randomUUID } from 'node:crypto';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';

const transport = new NodeStreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),  // stateful
  // sessionIdGenerator: undefined  // stateless mode
  enableJsonResponse: true  // plain JSON instead of SSE streams
});
await server.connect(transport);
```

**Stateful vs Stateless:**
- Stateful (`sessionIdGenerator` set): Supports resumability, server-initiated requests
- Stateless (`undefined`): Simpler, no session tracking

### 2.4 Multi-Session HTTP Server

```typescript
const httpServer = app.listen(3000);
const transports = new Map();

process.on('SIGINT', async () => {
  httpServer.close();
  for (const [sessionId, transport] of transports) {
    await transport.close();
    transports.delete(sessionId);
  }
  process.exit(0);
});
```

---

## 3. Server Creation Patterns

### 3.1 TypeScript SDK v2 — McpServer

```typescript
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

const server = new McpServer({ name: 'greeting-server', version: '1.0.0' });

server.registerTool(
  'greet',
  {
    description: 'Greet someone by name',
    inputSchema: z.object({ name: z.string() }),
    outputSchema: z.object({ greeting: z.string() }),
  },
  async ({ name }) => ({
    content: [{ type: 'text', text: `Hello, ${name}!` }],
    structuredContent: { greeting: `Hello, ${name}!` },
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
```

### 3.2 FastMCP Python — Decorator Pattern

```python
from fastmcp import FastMCP

mcp = FastMCP("Demo")

@mcp.tool
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b

if __name__ == "__main__":
    mcp.run()
```

FastMCP automatically generates:
- JSON Schema from Python type hints
- Documentation from docstrings
- Validation from type annotations
- Both stdio and Streamable HTTP support

### 3.3 Server Instructions Pattern

```typescript
const server = new McpServer(
  { name: 'db-server', version: '1.0.0' },
  {
    instructions:
      'Always call list_tables before running queries. Use validate_schema before migrate_schema for safe migrations. Results are limited to 1000 rows.'
  }
);
```

Instructions describe cross-tool relationships and constraints — clients add them to system prompt.

---

## 4. Tool Patterns

### 4.1 Tool Registration with Annotations

```typescript
server.registerTool(
  'delete-file',
  {
    description: 'Delete a file from the project',
    inputSchema: z.object({ path: z.string() }),
    annotations: {
      title: 'Delete File',
      destructiveHint: true,
      idempotentHint: true,
      readOnlyHint: false,
    },
  },
  async ({ path }) => {
    return { content: [{ type: 'text', text: `Deleted ${path}` }] };
  }
);
```

**Annotation hints:**
- `readOnlyHint` — tool doesn't modify state
- `destructiveHint` — tool may cause data loss
- `idempotentHint` — multiple identical calls have same effect

### 4.2 Error Handling — Tool-Level vs Protocol-Level

```typescript
// Return isError: true — LLM sees the error and can self-correct
server.registerTool(
  'fetch-data',
  {
    description: 'Fetch data from a URL',
    inputSchema: z.object({ url: z.string() }),
  },
  async ({ url }) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        return {
          content: [{ type: 'text', text: `HTTP ${res.status}: ${res.statusText}` }],
          isError: true,  // LLM-visible
        };
      }
      return { content: [{ type: 'text', text: await res.text() }] };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Failed: ${error.message}` }],
        isError: true,
      };
    }
  }
);
```

**Key insight:** `isError: true` returns are LLM-visible (tool self-correction). Thrown exceptions become protocol-level errors (hidden from LLM). SDK auto-converts thrown exceptions to `isError: true`.

### 4.3 ResourceLink Outputs

```typescript
server.registerTool(
  'list-files',
  {
    description: 'Returns files as resource links without embedding content',
  },
  async (): Promise<CallToolResult> => {
    const links: ResourceLink[] = [
      { type: 'resource_link', uri: 'file:///projects/readme.md', name: 'README', mimeType: 'text/markdown' },
      { type: 'resource_link', uri: 'file:///projects/config.json', name: 'Config', mimeType: 'application/json' },
    ];
    return { content: links };
  }
);
```

### 4.4 Structured Content (SDK v2)

```typescript
server.registerTool(
  'calculate-bmi',
  {
    inputSchema: z.object({ weightKg: z.number(), heightM: z.number() }),
    outputSchema: z.object({ bmi: z.number() }),
  },
  async ({ weightKg, heightM }) => {
    const output = { bmi: weightKg / (heightM * heightM) };
    return {
      content: [{ type: 'text', text: JSON.stringify(output) }],
      structuredContent: output,  // typed, machine-parseable
    };
  }
);
```

**Note:** Use `type` alias (not `interface`) for structured content types — interfaces lack implicit index signatures in TS.

### 4.5 Input Schema — Standard Schema (SDK v2)

SDK v2 uses [Standard Schema](https://standardschema.dev/) — bring Zod v4, Valibot, ArkType, or any compatible library:

```typescript
import * as z from 'zod/v4';  // Zod v4 (recommended)
// import { v } from 'valibot';
// import { type } from 'arktype';
```

### 4.6 FastMCP Python Tool with Pydantic

```python
from pydantic import BaseModel, Field
from typing import Literal

class ContactModel(BaseModel):
    name: str = Field(title="Full Name", min_length=1)
    email: str = Field(title="Email")
    category: Literal["Customer", "Vendor", "Partner", "Other"] = "Other"

@mcp.tool
def create_contact(data: ContactModel) -> str:
    """Create a new contact"""
    return f"Created: {data.name}"
```

---

## 5. Resource Patterns

### 5.1 Static Resources

```typescript
server.registerResource(
  'config',
  'config://app',
  {
    title: 'Application Config',
    description: 'Application configuration data',
    mimeType: 'text/plain',
  },
  async uri => ({
    contents: [{ uri: uri.href, text: 'App configuration here' }],
  })
);
```

### 5.2 Dynamic Resources with Templates

```typescript
server.registerResource(
  'user-profile',
  new ResourceTemplate('user://{userId}/profile', {
    list: async () => ({
      resources: [
        { uri: 'user://123/profile', name: 'Alice' },
        { uri: 'user://456/profile', name: 'Bob' },
      ],
    }),
  }),
  {
    title: 'User Profile',
    description: 'User profile data',
    mimeType: 'application/json',
  },
  async (uri, { userId }) => ({
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify({ userId, name: 'Example User' }),
      },
    ],
  })
);
```

**Pattern:** Always provide a `list` callback on templates for client discovery.

---

## 6. Prompt Patterns

### 6.1 Prompt Registration

```typescript
server.registerPrompt(
  'review-code',
  {
    title: 'Code Review',
    description: 'Review code for best practices and potential issues',
    argsSchema: z.object({ code: z.string() }),
  },
  ({ code }) => ({
    messages: [
      {
        role: 'user' as const,
        content: { type: 'text' as const, text: `Please review this code:\n\n${code}` },
      },
    ],
  })
);
```

### 6.2 Argument Completions

```typescript
server.registerPrompt(
  'review-code',
  {
    argsSchema: z.object({
      language: completable(
        z.string().describe('Programming language'),
        value => ['typescript', 'javascript', 'python', 'rust', 'go']
          .filter(lang => lang.startsWith(value))
      ),
    }),
  },
  ({ language }) => ({
    messages: [{ role: 'user', content: { type: 'text', text: `Review ${language} code` } }],
  })
);
```

---

## 7. Advanced Features

### 7.1 Sampling (Server-Initiated LLM Call)

```typescript
server.registerTool(
  'summarize',
  { inputSchema: z.object({ text: z.string() }) },
  async ({ text }, ctx) => {
    const response = await ctx.mcpReq.requestSampling({
      messages: [{ role: 'user', content: { type: 'text', text: `Please summarize:\n\n${text}` } }],
      maxTokens: 500,
    });
    return { content: [{ type: 'text', text: `Model (${response.model}): ${JSON.stringify(response.content)}` }] };
  }
);
```

### 7.2 Elicitation (User Input at Runtime)

```typescript
server.registerTool(
  'collect-feedback',
  { inputSchema: z.object({}) },
  async (_args, ctx) => {
    const result = await ctx.mcpReq.elicitInput({
      mode: 'form',  // or 'url' for sensitive data
      message: 'Please share your feedback:',
      requestedSchema: {
        type: 'object',
        properties: {
          rating: { type: 'number', title: 'Rating (1-5)', minimum: 1, maximum: 5 },
          comment: { type: 'string', title: 'Comment' },
        },
        required: ['rating'],
      },
    });
    if (result.action === 'accept') {
      return { content: [{ type: 'text', text: `Thanks! ${JSON.stringify(result.content)}` }] };
    }
    return { content: [{ type: 'text', text: 'Cancelled.' }] };
  }
);
```

**Security rule:** Never collect secrets via form elicitation — use `mode: 'url'` for sensitive data.

### 7.3 Progress Notifications

```typescript
server.registerTool(
  'process-files',
  { inputSchema: z.object({ files: z.array(z.string()) }) },
  async ({ files }, ctx) => {
    const progressToken = ctx.mcpReq._meta?.progressToken;
    for (let i = 0; i < files.length; i++) {
      if (progressToken !== undefined) {
        await ctx.mcpReq.notify({
          method: 'notifications/progress',
          params: { progressToken, progress: i + 1, total: files.length, message: `Processed ${files[i]}` },
        });
      }
    }
    return { content: [{ type: 'text', text: `Processed ${files.length} files` }] };
  }
);
```

### 7.4 Logging

```typescript
const server = new McpServer(
  { name: 'my-server', version: '1.0.0' },
  { capabilities: { logging: {} } }
);

server.registerTool(
  'fetch-data',
  { inputSchema: z.object({ url: z.string() }) },
  async ({ url }, ctx) => {
    await ctx.mcpReq.log('info', `Fetching ${url}`);
    const res = await fetch(url);
    await ctx.mcpReq.log('debug', `Response status: ${res.status}`);
    return { content: [{ type: 'text', text: await res.text() }] };
  }
);
```

### 7.5 Roots (Client Workspace Discovery)

```typescript
server.registerTool(
  'list-workspace-files',
  { inputSchema: z.object({}) },
  async (_args, _ctx) => {
    const { roots } = await server.server.listRoots();
    const summary = roots.map(r => `${r.name ?? r.uri}: ${r.uri}`).join('\n');
    return { content: [{ type: 'text', text: summary }] };
  }
);
```

---

## 8. FastMCP Python — High-Level Server Pattern

### 8.1 Server Creation

```python
from fastmcp import FastMCP

mcp = FastMCP(
    "My Server",
    instructions="Always call list_tables before running queries.",
)

@mcp.tool
def my_tool(x: int) -> str:
    """Tool description"""
    return f"Result: {x}"

@mcp.resource("config://app")
def get_config() -> str:
    return "config data"

@mcp.prompt
def review_code(code: str) -> list[dict]:
    return [{"role": "user", "content": f"Review: {code}"}]

if __name__ == "__main__":
    mcp.run()  # Auto-detects transport, supports both stdio and HTTP
```

### 8.2 Context Access

```python
from fastmcp import Context

@mcp.tool
async def my_tool(x: int, ctx: Context) -> str:
    ctx.info(f"Processing {x}")
    ctx.debug(f"Input: {x}")
    # ctx.request_sampling(...)
    # ctx.elicit_input(...)
    # ctx.report_progress(...)
    return f"Result: {x}"
```

### 8.3 Tool Settings

```python
@mcp.tool(
    name="custom_name",
    description="Override description",
    title="My Tool",
    tags=["utility"],
    timeout=30,
)
def my_tool() -> str:
    ...
```

---

## 9. Interactive Apps (FastMCP + Prefab)

### 9.1 Basic Interactive Tool

```python
from fastmcp import FastMCP

mcp = FastMCP("Dashboard")

@mcp.tool(app=True)  # renders as UI
def team_directory() -> DataTable:
    return DataTable(
        columns=["Name", "Role", "Department"],
        rows=[{"Name": "Alice", "Role": "Engineer", "Department": "Platform"}],
        search=True,
    )
```

### 9.2 FastMCPApp Pattern (UI ↔ Backend)

```python
from fastmcp import FastMCP, FastMCPApp
from prefab_ui.actions import SetState, ShowToast
from prefab_ui.actions.mcp import CallTool
from prefab_ui.app import PrefabApp
from prefab_ui.components import ...

app = FastMCPApp("Notes")

@app.tool()  # backend-only (hidden from model)
def add_note(title: str, body: str) -> list[dict]:
    """Save a note"""
    notes_db.append({"title": title, "body": body})
    return list(notes_db)

@app.ui()  # entry point (model-visible)
def notes_app() -> PrefabApp:
    with Column(gap=6) as view:
        Heading("Notes")
        with Form(on_submit=CallTool("add_note", on_success=SetState("notes", RESULT))):
            Input(name="title", required=True)
            Button("Add Note")
    return PrefabApp(view=view, state={"notes": list(notes_db)})

mcp = FastMCP("Notes Server", providers=[app])
```

**Key insight:** `FastMCPApp` provides stable global tool identifiers that survive server composition/namespacing — `CallTool(add_note)` with function reference bypasses namespace prefixing.

### 9.3 Provider Pattern

```python
mcp = FastMCP("Platform", providers=[contacts_app, inventory_app, billing_app])

# Or programmatic
mcp.add_provider(inventory_app)
```

### 9.4 Custom HTML Apps

```python
from fastmcp.apps import AppConfig, ResourceCSP

@mcp.tool(app=AppConfig(resource_uri="ui://my-app/view.html"))
def generate_qr(text: str = "https://gofastmcp.com") -> str:
    return json.dumps({"text": text})

@mcp.resource("ui://my-app/view.html")
def view() -> str:
    return """
    <!DOCTYPE html>
    <html>
    <body>
      <div id="root"></div>
      <script type="module">
        import { App } from "https://unpkg.com/@modelcontextprotocol/ext-apps@0.4.0/app-with-deps";
        const app = new App({ name: "My App", version: "1.0.0" });
        app.ontoolresult = ({ content }) => { ... };
        await app.connect();
      </script>
    </body>
    </html>
    """
```

---

## 10. Security Patterns

### 10.1 DNS Rebinding Protection

```typescript
// Express middleware with auto-protection
import { createMcpExpressApp } from '@modelcontextprotocol/express';

const app = createMcpExpressApp();  // Auto-detects localhost, enables protection
// const app = createMcpExpressApp({ host: '0.0.0.0', allowedHosts: ['localhost', '127.0.0.1'] });
```

```typescript
// Hono middleware
import { createMcpHonoApp } from '@modelcontextprotocol/hono';
```

### 10.2 Inspector Authentication

```typescript
// Random session token generated at startup
npx @modelcontextprotocol/inspector node build/index.js
// Opens http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=<token>
```

### 10.3 App Sandboxing

```python
@mcp.resource(
    "ui://my-app/view.html",
    app=AppConfig(
        csp=ResourceCSP(
            resource_domains=["https://unpkg.com"],
            connect_domains=["https://api.example.com"],
        ),
        permissions=ResourcePermissions(
            clipboard_write={},
        ),
    ),
)
def my_view() -> str:
    ...
```

---

## 11. Testing & Debugging

### 11.1 MCP Inspector — UI Mode

```bash
npx @modelcontextprotocol/inspector node build/index.js

# With env vars
npx @modelcontextprotocol/inspector -e API_KEY=$KEY node build/index.js

# Custom ports
CLIENT_PORT=8080 SERVER_PORT=9000 npx @modelcontextprotocol/inspector node build/index.js

# With config file
npx @modelcontextprotocol/inspector --config mcp.json --server myserver
```

### 11.2 MCP Inspector — CLI Mode

```bash
# List tools
npx @modelcontextprotocol/inspector --cli node build/index.js --method tools/list

# Call a tool
npx @modelcontextprotocol/inspector --cli node build/index.js --method tools/call --tool-name mytool --tool-arg key=value

# Remote server
npx @modelcontextprotocol/inspector --cli https://my-mcp-server.example.com --transport http --method tools/list
```

### 11.3 Everything Server as Test Harness

The `@modelcontextprotocol/server-everything` package is designed as a test server for MCP client builders, exercising all protocol features (prompts, tools, resources, sampling, etc.).

---

## 12. Middleware & Framework Integration

### 12.1 Middleware Packages (SDK v2)

Thin adapters that wire MCP into specific runtimes:

```typescript
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { createMcpHonoApp } from '@modelcontextprotocol/hono';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
```

**Rule:** Middleware packages should NOT introduce new MCP functionality or business logic — they are purely adapters.

### 12.2 Web Standard Transport

For Cloudflare Workers, Deno, Bun:

```typescript
const server = new McpServer({ name: 'my-server', version: '1.0.0' });
// Use Hono middleware with Web Standard compatible transport
// See examples/server/src/honoWebStandardStreamableHttp.ts
```

---

## 13. Project Structure (Everything Server)

```
src/everything/
├── index.ts              # Entry point — transport arg dispatch
├── transports/
│   ├── stdio.ts          # stdio transport setup
│   ├── sse.ts            # SSE transport setup
│   └── streamableHttp.ts # Streamable HTTP setup
├── server/
│   └── index.ts          # createServer() — registers all tools/resources/prompts
├── tools/                # Tool implementations
├── resources/            # Resource implementations
├── prompts/              # Prompt implementations
├── __tests__/            # Tests
└── docs/                 # Architecture docs
```

**Pattern:** Separate transport selection (CLI arg dispatch) from server creation (tool/resource registration). The `createServer()` function returns `{ server, cleanup }` for clean lifecycle management.

---

## 14. Client Patterns

### 14.1 SDK v2 Client

```typescript
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const transport = new StdioClientTransport({ command: 'npx', args: ['server-package'] });
const client = new Client({ name: 'my-client', version: '1.0.0' });

await client.connect(transport);

// List tools
const { tools } = await client.listTools();

// Call a tool
const result = await client.callTool({ name: 'greet', arguments: { name: 'World' } });
```

### 14.2 FastMCP Python Client

```python
from fastmcp import FastMCPClient

async with FastMCPClient("http://localhost:8000/mcp") as client:
    tools = await client.list_tools()
    result = await client.call_tool("greet", {"name": "World"})
```

---

## 15. Deployment Patterns

### 15.1 Multi-Node Deployment

Three patterns (from SDK docs):
- **Stateless** — No session tracking, each request is independent
- **Persistent storage** — Sessions stored in DB, supports horizontal scaling
- **Distributed routing** — Session-aware proxy routes to correct node

### 15.2 Docker

```dockerfile
FROM node:22-slim
COPY . /app
WORKDIR /app
RUN npm install && npm run build
CMD ["node", "build/index.js"]
```

---

## Key Decisions

- SDK v2 (main branch, pre-alpha) splits into `@modelcontextprotocol/server` + `@modelcontextprotocol/client` (vs v1's monolithic `@modelcontextprotocol/sdk`)
- SDK v2 uses **Standard Schema** — bring your own validation library (Zod v4, Valibot, ArkType)
- FastMCP 1.0 was incorporated into official MCP Python SDK; standalone FastMCP continues as the dominant framework (~1M downloads/day, 70% of all MCP servers)
- `Streamable HTTP` is the recommended transport for remote servers (replaces deprecated SSE)
- `stdio` remains the standard for local/desktop integrations
- MCP Apps extension enables interactive UIs via `structuredContent` + sandboxed iframe + `postMessage` protocol
