---
name: soulguns-ts
description: Soulguns TypeScript Patterns
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
---# Soulguns TypeScript Patterns

## 1. Project & Monorepo Structure

### 1.1 Layered Monolith (VSCode pattern)

Strict dependency layering where each layer can only import from layers below it:

```
base/        → No deps on anything else in the project
platform/    → Depends on base/
editor/      → Depends on base/, platform/
workbench/   → Depends on base/, platform/, editor/
code/        → Depends on everything above (entry points)
```

**Source:** `microsoft/vscode` — `src/vs/` directory layout.

### 1.2 Package-per-domain Monorepo (NestJS pattern)

Each package is a standalone npm module with its own `package.json`, `tsconfig.build.json`, and barrel exports:

```
packages/
  common/        # Shared interfaces, decorators, enums
  core/          # DI system, scanner, injector
  platform-express/  # Express adapter
  testing/       # Test utilities
```

Each has its own `index.ts` barrel file. Enables tree-shaking and selective imports.

**Source:** `nestjs/nest` — `packages/` directory layout.

### 1.3 Aggregate Root Registration (VSCode pattern)

Use a single top-level file that imports everything via side-effects. No individual module imports another module directly:

```typescript
// workbench.common.main.ts (conceptual)
import './services/themes/browser/workbenchThemeService.js';
import './contrib/notebook/browser/notebook.contribution.js';
registerSingleton(IMarkerService, MarkerService, InstantiationType.Delayed);
```

**Source:** `microsoft/vscode` — `workbench.common.main.ts`.

### 1.4 pnpm + Turborepo (Next.js pattern)

For large monorepos, use pnpm workspaces with Turborepo for task orchestration:

```
pnpm-workspace.yaml  # Defines workspace packages
turbo.json           # Task DAG: build, dev, test, typescript
```

Root tsconfig is intentionally **loose**; each package overrides with strict settings.

```jsonc
// Root tsconfig.json
{ "strict": false, "allowJs": true, "moduleResolution": "bundler" }

// packages/next/tsconfig.json
{ "extends": "../../tsconfig.json", "strict": true, "verbatimModuleSyntax": true }
```

**Source:** `vercel/next.js` — root + per-package tsconfigs.

---

## 2. Dependency Injection Patterns

### 2.1 Metadata Watermark (NestJS)

Use `Reflect.defineMetadata` with boolean flags to tag classes as "processed" rather than modifying the class:

```typescript
export function Injectable(): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(INJECTABLE_WATERMARK, true, target);
    return target;
  };
}

// Check at runtime:
const isInjectable = !!Reflect.getMetadata(INJECTABLE_WATERMARK, metatype);
```

**Source:** `nestjs/nest` — `packages/common/decorators/core/injectable.decorator.ts`

### 2.2 ServiceIdentifier with Dual Decorator/Token (VSCode)

A function that doubles as both a parameter decorator and a type token:

```typescript
export function createDecorator<T>(serviceId: string): ServiceIdentifier<T> {
  const id = function (target: Function, key: string, index: number) {
    storeServiceDependency(id, target, index);
  } as ServiceIdentifier<T>;
  id.toString = () => serviceId;
  return id;
}

// Usage — defines both the token AND the inject decorator:
export const ILoggerService = createDecorator<ILoggerService>('loggerService');

// In constructor:
constructor(@ILoggerService private readonly logger: ILoggerService) {}
```

**Source:** `microsoft/vscode` — `src/vs/platform/instantiation/common/instantiation.ts`

### 2.3 Structural Branding (_serviceBrand)

Prevent accidental structural type matching with a brand marker:

```typescript
export type BrandedService = { _serviceBrand: undefined };

export interface ILoggerService {
  readonly _serviceBrand: undefined;
  log(message: string): void;
}
```

**Source:** `microsoft/vscode` — `src/vs/platform/instantiation/common/instantiation.ts`

### 2.4 WeakMap Per-Context Instances

Store request-scoped instances using `WeakMap<ContextId, T>` to allow natural garbage collection:

```typescript
export class InstanceWrapper<T = any> {
  private readonly values = new WeakMap<ContextId, InstancePerContext<T>>();
  // Singleton at STATIC_CONTEXT key, request-scoped at others
}
```

**Source:** `nestjs/nest` — `packages/core/injector/instance-wrapper.ts`

---

## 3. Error Handling Patterns

### 3.1 Named Error Classes + Branded Source

Custom errors with `this.name` set, plus non-configurable symbol-branding for error source tracking:

```typescript
export class InvariantError extends Error {
  constructor(message: string) {
    super(`Invariant: ${message}`);
    this.name = 'InvariantError';
  }
}

// Brand error source with Symbol.for (cross-realm safe)
const errorSourceSymbol = Symbol.for('NextjsError');
export function decorateServerError(err: any, source: 'server' | 'edge'): void {
  Object.defineProperty(err, errorSourceSymbol, {
    writable: false, enumerable: false, configurable: false, value: source,
  });
}
```

**Source:** `vercel/next.js` — `packages/next/src/shared/lib/`

### 3.2 Error Normalizer (Next.js)

Always ensure thrown values are proper Error instances:

```typescript
export function getProperError(err: unknown): Error {
  if (typeof err === 'object' && err !== null && 'name' in err && 'message' in err) {
    return err as Error;
  }
  return new Error(typeof err === 'string' ? err : String(err));
}
```

**Source:** `vercel/next.js` — `packages/next/src/lib/is-error.ts`

### 3.3 Deep Error Hierarchy with Metadata (n8n)

Layer errors for different concerns:

```
BaseError (abstract)
  ├── level: ErrorLevel
  ├── description: string | null
  ├── tags: ErrorTags
  ├── extra?: object
  │
  ├── ApplicationError
  │    └── ExecutionBaseError
  │         ├── timestamp: number
  │         ├── context: IDataObject
  │         │
  │         ├── ExpressionError
  │         ├── WorkflowOperationError
  │         └── NodeError (abstract)
  │              ├── NodeApiError    # HTTP API errors
  │              └── NodeOperationError  # Business logic errors
  │
  ├── OperationalError
  ├── UserError          # User-facing
  └── UnexpectedError    # Programming bugs
```

**Source:** `n8n-io/n8n` — `packages/workflow/src/errors/`

### 3.4 Result<T, E> Discriminated Union (n8n)

Avoid try-catch for expected failures — use a Result type:

```typescript
export type ResultOk<T> = { ok: true; result: T };
export type ResultError<E> = { ok: false; error: E };
export type Result<T, E> = ResultOk<T> | ResultError<E>;

export const createResultOk = <T>(data: T): ResultOk<T> => ({ ok: true, result: data });
export const createResultError = <E = unknown>(error: E): ResultError<E> => ({ ok: false, error });

// Convert try-catch → Result
export const toResult = <T, E extends Error = Error>(fn: () => T): Result<T, E> => {
  try { return createResultOk(fn()); }
  catch (e) { return createResultError(ensureError(e) as E); }
};
```

**Source:** `n8n-io/n8n` — `packages/workflow/src/result.ts`

---

## 4. Event & Pipeline Architecture

### 4.1 Event as Callable Interface (VSCode)

`Event<T>` is an interface that IS a function (subtype of function interface):

```typescript
export interface Event<T> {
  (listener: (e: T) => unknown, thisArgs?: any, disposables?: IDisposable[]): IDisposable;
}

export class Emitter<T> {
  constructor(private _options?: EmitterOptions);
  get event(): Event<T>;   // Subscribe function (lazily created)
  fire(event: T): void;    // Emit
  dispose(): void;
}
```

Lazy lifecycle hooks via `EmitterOptions`:
```typescript
export interface EmitterOptions {
  onWillAddFirstListener?: Function;   // Activate underlying resource
  onDidRemoveLastListener?: Function;  // Deactivate
  onListenerError?: (e: any) => void;
}
```

**Source:** `microsoft/vscode` — `src/vs/base/common/event.ts`

### 4.2 Observable-Based Interceptor Pipeline (NestJS)

Wrap handler in `Observable` for composable async flows:

```typescript
export interface NestInterceptor<T = any, R = any> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<R> | Promise<Observable<R>>;
}
// CallHandler.handle() returns Observable — enables tap, map, catchError, timeout, retry
```

**Source:** `nestjs/nest` — `packages/common/interfaces/features/nest-interceptor.interface.ts`

### 4.3 Context Polymorphism (NestJS)

Single interface works across HTTP, WS, and RPC via `switchTo*()` methods:

```typescript
export interface ArgumentsHost {
  getArgs<T extends Array<any> = any[]>(): T;
  switchToHttp(): HttpArgumentsHost;
  switchToRpc(): RpcArgumentsHost;
  switchToWs(): WsArgumentsHost;
  getType<TContext extends string = ContextType>(): TContext;
}
```

**Source:** `nestjs/nest` — `packages/common/interfaces/features/arguments-host.interface.ts`

---

## 5. Advanced TypeScript Type Patterns

### 5.1 Discriminated Unions for State Machines

Use `kind` or `type` discriminators:

```typescript
export type InlineValue =
  | { type: 'text'; range: IRange; text: string }
  | { type: 'variable'; variableName: string; caseSensitiveLookup: boolean }
  | { type: 'expression'; expression: string; range: IRange };

// Deep discriminated union:
export type InlineCompletionEndOfLifeReason =
  | { kind: 'accepted'; alternativeAction: boolean }
  | { kind: 'rejected' }
  | { kind: 'ignored'; supersededBy?: InlineCompletion; userTypingDisagreed: boolean };
```

**Source:** `microsoft/vscode` — `src/vs/editor/common/languages.ts`

### 5.2 `const enum` with Bitflags

Zero-cost enums for performance-critical code:

```typescript
export const enum Extensions {
  TypeScript  = 1 << 0,  // .ts, .tsx, .mts, .cts
  JavaScript  = 1 << 1,  // .js, .jsx, .mjs, .cjs
  Declaration = 1 << 2,  // .d.ts
  Json        = 1 << 3,  // .json
  ImplementationFiles = TypeScript | JavaScript,
}
```

**Source:** `microsoft/TypeScript` — `src/compiler/moduleNameResolver.ts`

### 5.3 Branded Primitive Types

Compile-time type safety for primitives that shouldn't be mixed:

```typescript
export type Path = string & { __pathBrand: any };
export type FileName = string & { __fileNameBrand: any };
```

**Source:** `microsoft/TypeScript` — `src/compiler/types.ts`

### 5.4 DeepReadonly (Recursive Conditional Type)

```typescript
export type DeepReadonly<T> = T extends (infer R)[]
  ? ReadonlyArray<DeepReadonly<R>>
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;
```

**Source:** `vercel/next.js` — `packages/next/src/shared/lib/deep-readonly.ts`

### 5.5 Extracting Leading Non-Service Args (TS Conditional Types)

Given a constructor with trailing branded parameters, extract the leading non-service ones:

```typescript
export type GetLeadingNonServiceArgs<TArgs extends any[]> =
  TArgs extends [] ? []
  : TArgs extends [...infer TFirst, BrandedService] ? GetLeadingNonServiceArgs<TFirst>
  : TArgs;

// Usage:
createInstance<Ctor extends new (...args: any[]) => unknown>(
  ctor: Ctor,
  ...args: GetLeadingNonServiceArgs<ConstructorParameters<Ctor>>
): InstanceType<Ctor>;
```

**Source:** `microsoft/vscode` — `src/vs/platform/instantiation/common/instantiation.ts`

### 5.6 Type Guards with `is`

```typescript
export function isResourceLocatorValue(value: unknown): value is INodeParameterResourceLocator {
  return Boolean(
    typeof value === 'object' && value &&
    'mode' in value && 'value' in value && '__rl' in value
  );
}
```

**Source:** `n8n-io/n8n` — `packages/workflow/src/type-guards.ts`

### 5.7 Module Augmentation for Cross-Package Types (n8n)

Extend interfaces from other packages without modifying them:

```typescript
declare module 'n8n-workflow' {
  interface IWorkflowExecuteAdditionalData {
    hooks?: ExecutionLifecycleHooks;
    externalSecretsProxy: ExternalSecretsProxy;
  }
}
```

**Source:** `n8n-io/n8n` — `packages/core/src/execution-engine/index.ts`

### 5.8 as const + Union Extraction (NestJS)

```typescript
export const ENHANCER_KEY_TO_SUBTYPE_MAP = {
  [GUARDS_METADATA]: 'guard',
  [INTERCEPTORS_METADATA]: 'interceptor',
} as const;

export type EnhancerSubtype = (typeof ENHANCER_KEY_TO_SUBTYPE_MAP)[keyof typeof ENHANCER_KEY_TO_SUBTYPE_MAP];
// Result: 'guard' | 'interceptor'
```

**Source:** `nestjs/nest` — `packages/common/constants.ts`

---

## 6. Decorator & Metadata Patterns

### 6.1 Dual-Purpose Decorators (Class + Method)

One decorator that works on both class and method by checking the descriptor:

```typescript
export function UseGuards(...guards: CanActivate[]): MethodDecorator & ClassDecorator {
  return (target: any, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) => {
    if (descriptor) {
      extendArrayMetadata(GUARDS_METADATA, guards, descriptor.value);
      return descriptor;
    }
    extendArrayMetadata(GUARDS_METADATA, guards, target);
    return target;
  };
}
```

**Source:** `nestjs/nest` — `packages/common/decorators/core/use-guards.decorator.ts`

### 6.2 Extend Array Metadata (Accumulating Decorators)

Merge into existing metadata arrays instead of replacing:

```typescript
export function extendArrayMetadata<T extends Array<unknown>>(
  key: string, metadata: T, target: Function
) {
  const previousValue = Reflect.getMetadata(key, target) || [];
  const newValue = [...previousValue, ...metadata];
  Reflect.defineMetadata(key, newValue, target);
}
```

**Source:** `nestjs/nest` — `packages/common/utils/extend-metadata.util.ts`

### 6.3 Controller Decorator with Overloaded Signatures

```typescript
export function Controller(): ClassDecorator;
export function Controller(prefix: string | string[]): ClassDecorator;
export function Controller(options: ControllerOptions): ClassDecorator;
export function Controller(prefixOrOptions?: string | string[] | ControllerOptions): ClassDecorator {
  // Normalize all overloads into unified options
  const meta = normalizeControllerOptions(prefixOrOptions);
  return (target: object) => {
    Reflect.defineMetadata(CONTROLLER_WATERMARK, true, target);
    Reflect.defineMetadata(PATH_METADATA, meta.path, target);
    Reflect.defineMetadata(SCOPE_OPTIONS_METADATA, meta.scopeOptions, target);
  };
}
```

**Source:** `nestjs/nest` — `packages/common/decorators/core/controller.decorator.ts`

### 6.4 Namespace-Double-Duty Decorator (VSCode)

Service identifier doubles as decorator AND token:

```typescript
export const ILoggerService = createDecorator<ILoggerService>('loggerService');
// As decorator:  @ILoggerService private logger
// As token:     container.get(ILoggerService)
```

---

## 7. Module & Plugin Systems

### 7.1 Forward Reference for Circular Dependencies (NestJS)

Use thunk pattern `() => Type` for circular imports:

```typescript
export type ForwardReference<T = any> = { forwardRef: T };

// Usage:
@Module({ imports: [forwardRef(() => OtherModule)] })
export class MyModule {}
```

### 7.2 Dynamic Modules with Global Flag (NestJS)

```typescript
export interface DynamicModule extends ModuleMetadata {
  module: Type<any>;
  global?: boolean;  // When true, module globally scoped
}
```

### 7.3 Node Type Registration + Versioning (n8n)

Nodes implement `INodeType` with optional execute/poll/trigger methods. Versions handled via `VersionedNodeType`:

```typescript
export class VersionedNodeType implements IVersionedNodeType {
  currentVersion: number;
  nodeVersions: Record<number, INodeType>;

  getNodeType(version?: number): INodeType {
    return version ? this.nodeVersions[version] : this.nodeVersions[this.currentVersion];
  }
}
```

**Source:** `n8n-io/n8n` — `packages/workflow/src/versioned-node-type.ts`

### 7.4 Plugin Loading with Multiple Strategies (n8n)

`NodeLoader` interface with different implementations (lazy directory, package directory, custom):

```typescript
@Service()
export class LoadNodesAndCredentials {
  loaders: Record<string, NodeLoader> = {};

  async init() {
    // 1. Load from bundled packages (n8n-nodes-base)
    // 2. Load from custom directories (N8N_CUSTOM_EXTENSIONS)
    // 3. Load from module registry (community packages)
  }
}
```

---

## 8. Workflow & Execution Engine Patterns

### 8.1 Array-Based Work Queue (n8n)

Use a stack-based execution loop instead of recursive calls:

```typescript
class WorkflowExecute {
  processRunExecutionData(workflow: Workflow): PCancelable<IRun> {
    while (this.nodeExecutionStack.length > 0) {
      const node = this.nodeExecutionStack.shift();
      const result = await this.runNode(node);
      // Route outputs to downstream nodes via addNodeToBeExecuted()
    }
  }
}
```

### 8.2 Multi-Input Waiting Pattern (n8n)

For nodes with multiple inputs, collect all inputs before enqueuing:

```typescript
function addNodeToBeExecuted(nodeName: string, inputs: number, data: any) {
  if (inputs > 1) {
    // Store in waitingExecution map
    // Check if all inputs received
    // If yes: push to execution stack
    // If no: wait
  } else {
    executionStack.push({ nodeName, data });
  }
}
```

### 8.3 Cancellable Promise (n8n)

Use `PCancelable` for cancellable async operations, paired with `AbortController`:

```typescript
run(workflow: Workflow): PCancelable<IRun> {
  const abortController = new AbortController();
  return new PCancelable((resolve, reject, onCancel) => {
    onCancel(() => abortController.abort());
    // ... async execution loop
  });
}
```

---

## 9. Config & API Design Patterns

### 9.1 Two-File Config Split (Next.js)

Separate type definitions/defaults from runtime logic:

```
config-shared.ts   # Pure types: NextConfig, NextConfigComplete, ExperimentalConfig
config.ts          # Runtime loading, validation (Zod), merging with defaults
```

Types: `NextConfig` (user-facing, partial), `NextConfigComplete` (fully resolved via `Required<T>`).

### 9.2 DetachedPromise (Next.js)

Custom `Promise.withResolvers` for pre-ES2024 environments:

```typescript
export class DetachedPromise<T = any> {
  public readonly resolve!: (value: T | PromiseLike<T>) => void;
  public readonly reject!: (reason: any) => void;
  public readonly promise!: Promise<T>;

  constructor() {
    this.promise = new Promise<T>((res, rej) => {
      this.resolve = res;
      this.reject = rej;
    });
  }
}
```

### 9.3 Batcher (Next.js) — Generic Request Coalescing

```typescript
export class Batcher<K, V, C extends string | number | null> {
  private pending: Map<C, Promise<V>> = new Map();

  static create<K, V>(): Batcher<K, V, string | number | null>;
  static create<K, V, C>(options: { cacheKeyFn: (key: K) => C }): Batcher<K, V, C>;
}
```

---

## 10. Testing Patterns

### 10.1 Module/Provider Override in Tests (NestJS)

```typescript
const module = await Test.createTestingModule({
  providers: [UserService],
})
  .overrideProvider(UserRepository)
  .useValue({ find: () => Promise.resolve([]) })
  .compile();
```

### 10.2 Mock Factory Pattern (NestJS)

```typescript
const module = await Test.createTestingModule({ providers: [UserService] })
  .useMocker(token => {
    if (token === UserRepository) return { find: () => Promise.resolve([]) };
  })
  .compile();
```

### 10.3 Multi-Root Jest Config (Next.js)

```typescript
module.exports = {
  testMatch: ['**/*.test.{ts,tsx,js,jsx}'],
  roots: ['<rootDir>', '<rootDir>/../packages/next/src'],
};
```

### 10.4 Inline Tests (Next.js)

Co-locate `.test.ts` files next to source:

```
packages/next/src/lib/batcher.ts
packages/next/src/lib/batcher.test.ts
```

---

## 11. Performance Patterns

### 11.1 Reentrant Timer (TypeScript Compiler)

Nested-safe instrumentation with enter/exit semantics:

```typescript
export function createTimer(measureName: string, startMark: string, endMark: string): Timer {
  let enterCount = 0;
  return {
    enter() { if (++enterCount === 1) mark(startMark); },
    exit() { if (--enterCount === 0) { mark(endMark); measure(measureName, startMark, endMark); } },
  };
}

// Null-object pattern for disabled state:
export const nullTimer: Timer = { enter: noop, exit: noop };
```

**Source:** `microsoft/TypeScript` — `src/compiler/performance.ts`

### 11.2 Table-Driven Dispatch (TypeScript Compiler)

Use data tables keyed by enum instead of inheritance or switch statements:

```typescript
// forEachChild dispatched via a table keyed by SyntaxKind
const forEachChildTable: ((node: Node) => Node | undefined)[] = [];
// Populated with per-SyntaxKind visitor functions
```

**Source:** `microsoft/TypeScript` — `src/compiler/parser.ts`

### 11.3 Singleton via WeakMap + Proxy (NestJS)

Combined Proxy delegation + singleton management:

```typescript
private createAdapterProxy<T>(app: NestApplication, adapter: HttpServer): T {
  return new Proxy(app, {
    get: (receiver, prop) => {
      if (prop in app) return app[prop];
      return adapter[prop]; // Delegate unknown properties to adapter
    }
  }) as unknown as T;
}
```

---

## 12. IPC & Remote Communication

### 12.1 Channel-Based RPC (VSCode)

Generic channel interface for process communication:

```typescript
export interface IChannel {
  call<T>(command: string, arg?: any, cancellationToken?: CancellationToken): Promise<T>;
  listen<T>(event: string, arg?: any): Event<T>;
}
```

### 12.2 Proxy Auto-Wrapping (VSCode)

Auto-wrap a service into a channel using JavaScript `Proxy`:

```typescript
// Server side: wrap service → channel
ProxyChannel.fromService(service, disposables);
// Client side: wrap channel → typed proxy
ProxyChannel.toService<ILanguageFeaturesService>(channel);
```

**Source:** `microsoft/vscode` — `src/vs/base/parts/ipc/common/ipc.ts`

---

## Repos Mined

| Repo | Stars | Key Contribution |
|------|-------|-----------------|
| microsoft/vscode | 167k | DI, Event system, Proxy IPC, branded types, layered monolith |
| vercel/next.js | 139k | Error handling, config split, monorepo tooling, testing |
| microsoft/TypeScript | 108k | Pipeline arch, bitflags, branded primitives, performance instrumentation |
| nestjs/nest | 75k | Decorator patterns, DI, module system, interceptor pipeline |
| n8n-io/n8n | 59k | Workflow engine, error hierarchy, Result<T,E>, node plugin system |
