---
name: soulguns-architecture
description: | Clean Architecture template, CQRS with MediatR, FluentValidation |
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
| langchain-ai/langgraph | 33.7k★ | Python | StateGraph, BSP execution, durable execution, checkpointing, interrupts |
| jasontaylordev/CleanArchitecture | 20.1k★ | C# | Clean Architecture template, CQRS with MediatR, FluentValidation |
| ddd-by-examples/library | 5.8k★ | Java | Full DDD: aggregates, event storming, hexagonal arch, policies, type system |
| eventuate-tram/eventuate-tram-sagas | 1.1k★ | Java | Saga orchestration, compensating transactions, saga participants |

---

## 1. Clean / Hexagonal Architecture

### 1.1 Layered Structure (CleanArchitecture Template)

```
src/
├── Domain/              # Entities, Value Objects, Aggregates, Domain Events
│   └── Entities/
├── Application/         # Use Cases, CQRS Commands/Queries, DTOs, Interfaces
│   ├── Common/
│   ├── Commands/
│   └── Queries/
├── Infrastructure/      # Persistence, External Services, Identity
│   ├── Data/
│   └── Services/
└── Web/                 # API Controllers, Middleware
```

**Dependency rule:** Domain → (none), Application → Domain, Infrastructure → Application, Web → Application.

### 1.2 Hexagonal (Ports & Adapters) — ddd-by-examples

Bounded context with complex logic gets hexagonal architecture; CRUD contexts get simple layered.

```
lending/                      # bounded context
├── book/
│   ├── application/          # use cases, commands
│   ├── infrastructure/       # ports implementations (DB, HTTP)
│   └── model/                # domain model — pure, no framework deps
├── patron/
│   ├── application/
│   ├── infrastructure/
│   └── model/
├── dailysheet/
│   ├── infrastructure/
│   └── model/
└── patronprofile/
    ├── infrastructure/
    ├── model/
    └── web/                  # read model for queries
```

**Pattern:** Package by bounded context, then by layer within context. Domain model packages are pure Java/TS — zero framework imports. Infrastructure implements ports defined as interfaces in the application layer.

### 1.3 Functional Interface as Port

```java
@FunctionalInterface
public interface FindAvailableBook {
    Option<AvailableBook> findAvailableBookBy(BookId bookId);
}

// Implementation in infrastructure layer
@AllArgsConstructor
class BookDatabaseRepository implements FindAvailableBook {
    private final JdbcTemplate jdbcTemplate;

    @Override
    public Option<AvailableBook> findAvailableBookBy(BookId bookId) {
        return Match(findBy(bookId)).of(
            Case($Some($(instanceOf(AvailableBook.class))), Option::of),
            Case($(), Option::none)
        );
    }
}
```

**Key insight:** Use `@FunctionalInterface` to declare ports — pure abstractions of infrastructure capabilities. Implementations live in infrastructure layer.

### 1.4 Architecture Enforcement with ArchUnit

```java
@ArchTest
public static final ArchRule model_should_not_depend_on_infrastructure =
    noClasses()
        .that().resideInAPackage("..model..")
        .should().dependOnClassesThat()
        .resideInAPackage("..infrastructure..");

@ArchTest
public static final ArchRule model_should_not_depend_on_spring =
    noClasses()
        .that().resideInAPackage("..io.pillopl.library.lending..model..")
        .should().dependOnClassesThat()
        .resideInAPackage("org.springframework..");
```

**Pattern:** Write architecture tests to enforce dependency rules at compile time. Run them in CI.

---

## 2. Domain-Driven Design (Tactical Patterns)

### 2.1 Type System State Modeling

Model each domain state as a separate class instead of enum-based state:

```java
// Instead of: class Book { enum Status { AVAILABLE, ON_HOLD, CHECKED_OUT } }
// Use separate types:
public class AvailableBook { ... }
public class BookOnHold { ... }
public class CheckedOutBook { ... }
```

**Benefits:**
- Compiler-enforced invariants — you can only `placeOnHold(AvailableBook book)`, not any Book
- Single Responsibility at class level
- State transitions are explicit functions:

```
placeOnHold:    AvailableBook → BookHoldFailed | BookPlacedOnHold
cancelHold:     BookOnHold → BookHoldCancelingFailed | BookHoldCanceled
checkOut:       BookOnHold → CheckedOutBook
```

### 2.2 Aggregate Pattern

Aggregates protect invariants and communicate via domain events:

```java
public class Patron {
    public Either<BookHoldFailed, BookPlacedOnHoldEvents> placeOnHold(AvailableBook book) {
        return placeOnHold(book, HoldDuration.openEnded());
    }
}
```

**Rules from ddd-by-examples:**
- Aggregates should be as small as needed to protect invariants
- Prefer eventual consistency between aggregates (promoted)
- Idiomatic communication: aggregates return events as results

### 2.3 Policy Functions (Business Rules)

Business rules are modeled as pure functions that return `Either<Rejection, Allowance>`:

```java
PlacingOnHoldPolicy onlyResearcherPatronsCanHoldRestrictedBooksPolicy =
    (AvailableBook toHold, Patron patron, HoldDuration holdDuration) -> {
        if (toHold.isRestricted() && patron.isRegular()) {
            return left(Rejection.withReason("Regular patrons cannot hold restricted books"));
        }
        return right(new Allowance());
    };
```

**Pattern:** Policies are pluggable, testable pure functions. Compose them to apply multiple rules.

### 2.4 Immutable Domain Objects

All business concepts are immutable:
- Full encapsulation and state protection
- Thread-safe by design
- Side effects are explicit and controlled

---

## 3. CQRS (Command Query Responsibility Segregation)

### 3.1 Command Pattern (CleanArchitecture via MediatR)

```csharp
public record CreateTodoItemCommand : IRequest<int>
{
    public string Title { get; init; }
    public string? Note { get; init; }
    public PriorityLevel Priority { get; init; }
}

public class CreateTodoItemCommandHandler : IRequestHandler<CreateTodoItemCommand, int>
{
    private readonly IApplicationDbContext _context;

    public async Task<int> Handle(CreateTodoItemCommand request, CancellationToken cancellationToken)
    {
        var entity = new TodoItem
        {
            Title = request.Title,
            Note = request.Note,
            Priority = request.Priority,
        };
        _context.TodoItems.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
```

**Pipeline (MediatR):** Command → Validation (FluentValidation) → Handler → Domain Events → Persistence

### 3.2 Separate Read/Write Models (ddd-by-examples)

Identified through Event Storming:
- **Write side (Commands):** Patron, Book, DailySheet — domain model with full business logic
- **Read side (Queries):** PatronProfile — projection, no complex domain logic

```
lending/
├── patron/          # write model — aggregate, domain events
├── dailysheet/      # write model — aggregate
└── patronprofile/   # read model — query-only, can use different persistence
```

### 3.3 Immediate vs Eventual Consistency

Same test, different consistency model:

```groovy
// Immediate consistency — events published and read in same transaction
def 'should synchronize Patron, Book and DailySheet with events'() {
    when: patronRepo.publish(placedOnHold(book))
    then: bookRepository.findBy(book.bookId).get() instanceof BookOnHold
    and:  dailySheetIsUpdated()  // same DB read
}

// Eventual consistency — poll for async propagation
void dailySheetIsUpdated() {
    pollingConditions.eventually {
        assert countOfHoldsInDailySheet() == 1
    }
}
```

**Key insight:** Same test body, different assertions. Infrastructure handles the switching via `DomainEvents` interface implementations:
- `JustForwardDomainEventPublisher` — Spring `ApplicationEventPublisher` (immediate)
- `StoreAndForwardDomainEventPublisher` — saves to `EventsStorage`, publishes via `@Scheduled` (eventual)

---

## 4. Event-Driven Architecture

### 4.1 Domain Events from Aggregates

Aggregates return events as results of commands:

```java
public class Patron {
    public Either<BookHoldFailed, BookPlacedOnHoldEvents> placeOnHold(AvailableBook book) {
        // ...validation policies run here...
        BookPlacedOnHold event = new BookPlacedOnHold(patronId, book.bookId(), Instant.now());
        return right(BookPlacedOnHoldEvents.events(event));
    }
}
```

### 4.2 Event Storage Pattern

```java
public class StoreAndForwardDomainEventPublisher implements DomainEvents {
    private final JustForwardDomainEventPublisher justForward;
    private final EventsStorage eventsStorage;

    @Override
    public void publish(DomainEvent event) {
        eventsStorage.save(event);
    }

    @Scheduled(fixedRate = 3000L)
    @Transactional
    public void publishAllPeriodically() {
        List<DomainEvent> domainEvents = eventsStorage.toPublish();
        domainEvents.forEach(justForward::publish);
        eventsStorage.published(domainEvents);
    }
}
```

### 4.3 Event Sourcing Read Model Projection

```java
// Read model is rebuilt from events
// PatronProfile is a projection of Patron + Book + DailySheet events
public class PatronProfile {
    // ... query-only, denormalized for fast reads
}
```

---

## 5. Saga Pattern (Orchestration)

### 5.1 Saga Definition (Eventuate Tram)

```java
public class CreateOrderSaga implements SimpleSaga<CreateOrderSagaData> {
    private SagaDefinition<CreateOrderSagaData> sagaDefinition =
        step()
            .withCompensation(this::reject)          // step 1: compensating
        .step()
            .invokeParticipant(this::reserveCredit)  // step 2: forward
        .step()
            .invokeParticipant(this::approve)        // step 3: forward
        .build();

    private CommandWithDestination reserveCredit(CreateOrderSagaData data) {
        return send(new ReserveCreditCommand(data.getOrderId()))
                .to("customerService")
                .build();
    }
}
```

### 5.2 Saga Participant

```java
public class CustomerCommandHandler {
    public CommandHandlers commandHandlerDefinitions() {
        return SagaCommandHandlersBuilder
                .fromChannel("customerService")
                .onMessage(ReserveCreditCommand.class, this::reserveCredit)
                .build();
    }

    public Message reserveCredit(CommandMessage<ReserveCreditCommand> cm) {
        // process command, return success or failure
    }
}
```

### 5.3 Saga Manager

```java
public class OrderService {
    @Autowired
    private SagaManager<CreateOrderSagaData> createOrderSagaManager;

    @Transactional
    public Order createOrder(OrderDetails orderDetails) {
        Order order = Order.createOrder(orderDetails);
        orderRepository.save(order);
        CreateOrderSagaData data = new CreateOrderSagaData(order.getId(), orderDetails);
        createOrderSagaManager.create(data, Order.class, order.getId());
        return order;
    }
}
```

**Pattern:** Saga orchestrator defines ordered steps with compensating transactions. Saga Manager handles creation, persistence, and execution. Participants listen on channels.

---

## 6. BSP Execution (Bulk Synchronous Parallel)

### 6.1 StateGraph (LangGraph)

```python
from langgraph.graph import START, StateGraph
from typing_extensions import TypedDict

class State(TypedDict):
    text: str

def node_a(state: State) -> dict:
    return {"text": state["text"] + "a"}

def node_b(state: State) -> dict:
    return {"text": state["text"] + "b"}

graph = StateGraph(State)
graph.add_node("node_a", node_a)
graph.add_node("node_b", node_b)
graph.add_edge(START, "node_a")
graph.add_edge("node_a", "node_b")
```

**Pattern:** Nodes are pure functions `(State) -> dict`. Edges define execution flow. Each superstep processes all ready nodes in parallel, then synchronizes state.

### 6.2 Durable Execution

LangGraph provides built-in support for long-running agents that persist through failures:
- Automatic checkpointing of state at each superstep
- Resume from exact point of failure
- Human-in-the-loop via interrupts (inspect/modify state at any point)

### 6.3 Checkpointing

```python
# State is automatically checkpointed at each step
# On failure, execution resumes from the last checkpoint
```

### 6.4 Interrupts (Human-in-the-Loop)

```python
# Pause execution, inspect state, modify it, then resume
# LangGraph supports this natively through checkpointing
```

### 6.5 LangGraph Architecture (Pregel-inspired)

LangGraph is inspired by Google's [Pregel](https://research.google/pubs/pub37252/) and [Apache Beam](https://beam.apache.org/):
- **Superstep model:** All nodes compute in parallel, then synchronize
- **Message passing:** Nodes communicate through state updates
- **Checkpointing:** State persists between supersteps for fault tolerance

This BSP model is directly applicable to BUYaSOUL Core's 34 chambers — each chamber can be a node in a state graph, with edges defining the execution flow between chambers.

---

## 7. System Composition Patterns

### 7.1 Modular Monolith (ddd-by-examples)

```java
@SpringBootConfiguration
@EnableAutoConfiguration
public class LibraryApplication {
    public static void main(String[] args) {
        new SpringApplicationBuilder()
                .parent(LibraryApplication.class)
                .child(LendingConfig.class).web(WebApplicationType.SERVLET)
                .sibling(CatalogueConfiguration.class).web(WebApplicationType.NONE)
                .run(args);
    }
}
```

**Pattern:** Each bounded context has its own application context/DI container. Removes runtime coupling — step toward microservices. Explicit configuration classes (no component scan in domain).

### 7.2 Package Structure = Architecture

```
library/
├── catalogue/          # CRUD context — simple logic, no hex arch
├── commons/
│   ├── aggregates/
│   ├── commands/
│   └── events/
└── lending/            # Complex domain — hexagonal architecture
    ├── book/
    ├── patron/
    ├── dailysheet/
    ├── librarybranch/
    └── patronprofile/
```

**Pattern:** The package structure IS the architecture diagram. Bounded contexts are top-level packages. Within each context, sub-packages reflect domain objects. Architecture gap is minimized — what you see in the code matches the diagram.

### 7.3 Application Context Separation (CleanArchitecture)

```csharp
// Separate DI registrations per layer
// Domain: no DI
// Application: adds MediatR, FluentValidation
// Infrastructure: adds EF Core, identity
// Web: adds controllers, middleware
```

---

## 8. Validation Pipeline

### 8.1 FluentValidation (CleanArchitecture)

```csharp
public class CreateTodoItemCommandValidator : AbstractValidator<CreateTodoItemCommand>
{
    public CreateTodoItemCommandValidator()
    {
        RuleFor(v => v.Title)
            .MaximumLength(200)
            .NotEmpty();
    }
}
```

**Pattern:** Validation as a pipeline behavior — runs before command handler via MediatR pipeline.

### 8.2 Cross-Cutting Concerns via Pipeline

```csharp
// MediatR pipeline behaviors:
// 1. ValidationBehavior — validates command
// 2. PerformanceBehavior — logs slow handlers
// 3. UnhandledExceptionBehavior — global error handling
```

---

## 9. Testing Patterns

### 9.1 BDD-Style Testing with DSL (ddd-by-examples)

```groovy
def 'should make book available when hold canceled'() {
    given:
        BookDSL bookOnHold = aCirculatingBook()
            .with(anyBookId())
            .locatedIn(anyBranch())
            .placedOnHoldBy(anyPatron())
    and:
        BookHoldCanceledEvent event = the bookOnHold.isCancelledBy(anyPatron())

    when:
        AvailableBook availableBook = the bookOnHold.reactsTo(event)

    then:
        availableBook.bookId == bookOnHold.bookId
        availableBook.libraryBranch == bookOnHold.libraryBranchId
}
```

**Pattern:** Build a domain-specific language (DSL) for tests that reads like business sentences. Tests express stories from Example Mapping sessions.

### 9.2 Polling for Eventual Consistency

```groovy
void dailySheetIsUpdated() {
    pollingConditions.eventually {
        assert countOfHoldsInDailySheet() == 1
    }
}
```

---

## 10. Architectural Decision Records

Store decisions in `docs/decisions/`:

```
docs/decisions/
├── 0001-use-mediatr-for-cqrs.md
├── 0002-use-fluentvalidation-for-validation.md
└── 0003-use-ef-core-for-persistence.md
```

---

## Key Decisions

- Clean Architecture and Hexagonal Architecture are complementary — use hexagonal for complex bounded contexts, layered for simple CRUD
- **Package by bounded context, then by layer** — minimizes architecture-code gap, enables microservice extraction
- **Type system over enums** for state — compiler-enforced invariants, self-documenting transitions
- **Domain events as return values** from aggregates — makes side effects explicit, enables immediate or eventual consistency
- **Policy functions** for business rules — pluggable, testable, composable
- **BSP execution model** (LangGraph/Pregel) for stateful workflows — checkpointing, interrupts, durable execution
- **Modular monolith first** — bounded contexts as separate DI containers, then extract to microservices
- **Architecture tests** (ArchUnit) to enforce dependency rules in CI
- **CQRS** when read and write models differ in complexity or shape — single aggregate for writes, projections for reads
