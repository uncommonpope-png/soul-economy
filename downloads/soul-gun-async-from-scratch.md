---
name: async-from-scratch
description: Build an Async Runtime From Scratch
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
---# Build an Async Runtime From Scratch

---
name: async-from-scratch
description: Use when user wants to understand how async/await works, build an async runtime, or learn about futures, the event loop, and cooperative multitasking. Triggers on: "build async runtime", "async", "await", "event loop", "future".
---

## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                  ASYNC RUNTIME ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Your code: async fn foo() { await bar(); }                    │
│        │                                                        │
│        ▼ Compiler desugars to state machine                      │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  Future state machine:                                    │  │
│   │     Start { url }                                         │  │
│   │     AwaitingFetch { fetch_future }                        │  │
│   │     AwaitingProcess { process_future }                     │  │
│   │     Done                                                   │  │
│   └──────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼ Executor polls futures                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  EXECUTOR                                                 │  │
│   │     ready_queue ← task wakes (I/O ready, timer fired)     │  │
│   │     pop task → future.poll(cx)                            │  │
│   │     if Pending: re-add to queue                           │  │
│   │     if Ready: complete, remove from queue                 │  │
│   └──────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼ Reactor waits for OS events                            │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  REACTOR (epoll / kqueue / IOCP)                         │  │
│   │     register(fd, token) → interest in READ/WRITE          │  │
│   │     epoll_wait() → events → wake tasks                    │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---
Your code runs on a single thread. You have thousands of tasks (async functions), but only one can run at a time. The async runtime manages the "event loop"—it pauses a task when it hits an await, polls the future, and switches to the next ready task when the current one blocks. No OS threads needed. No preemption. Cooperative multitasking.

## Step 1: Futures as State Machines
A `Future` is an enum of states. When you `.await`, you're not blocking the thread—you're returning `Poll::Pending` and storing a waker. The runtime calls you again when the underlying I/O is ready.

```rust
trait Future {
    type Output;
    fn poll(&mut self, cx: &mut Context) -> Poll<Self::Output>;
}

enum Poll<T> {
    Ready(T),
    Pending,
}

// Very simplified: a join of two futures
enum JoinFuture<F1, F2> {
    First { future1: F1, future2: F2, state: JoinState },
    Second { future1: F1, future2: F2 },
    Done,
}

enum JoinState { First, Second }

impl<F1: Future, F2: Future> Future for JoinFuture<F1, F2> {
    type Output = (F1::Output, F2::Output);

    fn poll(&mut self, cx: &mut Context) -> Poll<Self::Output> {
        match self {
            JoinFuture::First { future1, future2, state } => {
                match future1.poll(cx) {
                    Poll::Ready(out1) => {
                        match future2.poll(cx) {
                            Poll::Ready(out2) => Poll::Ready((out1, out2)),
                            Poll::Pending => {
                                *self = JoinFuture::Second { future1, future2 };
                                Poll::Pending
                            }
                        }
                    }
                    Poll::Pending => Poll::Pending,
                }
            }
            JoinFuture::Second { future1, future2 } => {
                match future2.poll(cx) {
                    Poll::Ready(out2) => Poll::Ready(((), out2)),
                    Poll::Pending => Poll::Pending,
                }
            }
            JoinFuture::Done => unreachable!(),
        }
    }
}
```

## Step 2: The Executor (Event Loop)
The executor keeps polling futures, tracking which tasks are ready:

```rust
struct Executor {
    ready: VecDeque<Task>,  // runnable tasks
    task_index: HashMap<TaskId, Task>,  // all tasks
}

impl Executor {
    fn block_on(&mut self, future: impl Future<Output=()>) {
        let mut future = Box::pin(future);
        let waker = waker_fn();
        let mut cx = Context::from_waker(&waker);

        loop {
            match future.poll(&mut cx) {
                Poll::Ready(_) => break,
                Poll::Pending => {
                    // In a real executor, we'd park the task here
                    // and wait for I/O events
                }
            }
        }
    }

    fn run(&mut self) {
        while let Some(mut task) = self.ready.pop_front() {
            let waker = task.waker();
            let mut cx = Context::from_waker(&waker);
            match task.future.poll(&mut cx) {
                Poll::Ready(_) => task.complete(),
                Poll::Pending => self.ready.push_back(task),
            }
        }
    }
}
```

## Step 3: The Reactor (I/O Event Loop)
Use `epoll` (Linux) or `kqueue` (macOS) to wait for I/O readiness. Register file descriptors with the OS event notification mechanism, then poll for events:

```rust
use std::os::unix::io::{RawFd, AsRawFd};

struct Reactor {
    registry: Registry,  // epoll instance
    tasks: HashMap<RawFd, TaskId>,
}

impl Reactor {
    fn add_interest(&mut self, fd: RawFd, token: TaskId) {
        self.registry.register(fd, token, Event::READ | Event::WRITE);
    }

    fn wait(&mut self) -> Vec<Event> {
        self.registry.poll(Some(Duration::from_millis(100)))
    }

    fn dispatch(&mut self, events: Vec<Event>, executor: &mut Executor) {
        for event in events {
            let task_id = event.token();
            executor.wake_task(task_id);
        }
    }
}
```

## Step 4: Timer / Sleep (waker registration)
To make `sleep(Duration::from_secs(5))` work, register a timer. When the timer fires, wake the task:

```rust
struct SleepFuture {
    deadline: Instant,
}

impl Future for SleepFuture {
    type Output = ();
    fn poll(&mut self, cx: &mut Context) -> Poll<()> {
        if Instant::now() >= self.deadline {
            Poll::Ready(())
        } else {
            // Register with the reactor's timer wheel
            reactor.add_timer(self.deadline, cx.waker().clone());
            Poll::Pending
        }
    }
}
```

## Step 5: async/await Syntax desugaring
The compiler transforms `async fn foo() -> T` into a state machine enum. And `await` becomes a `match future.poll(cx) { Poll::Ready(v) => v, Poll::Pending => return Poll::Pending }`:

```rust
// What you write:
async fn fetch_and_process(url: &str) -> Result<String> {
    let data = fetch(url).await?;
    process(data).await
}

// Compiles to something like:
enum FetchAndProcessFuture {
    Start { url: String },
    AwaitingFetch { fetch_future: FetchFuture },
    AwaitingProcess { process_future: ProcessFuture },
    Done,
}

impl Future for FetchAndProcessFuture {
    type Output = Result<String>;
    fn poll(&mut self, cx: &mut Context) -> Poll<Self::Output> {
        loop {
            match self {
                FetchAndProcessFuture::Start { url } => {
                    *self = FetchAndProcessFuture::AwaitingFetch {
                        fetch_future: fetch(url)
                    };
                }
                FetchAndProcessFuture::AwaitingFetch { fetch_future } => {
                    match fetch_future.poll(cx) {
                        Poll::Ready(data) => {
                            *self = FetchAndProcessFuture::AwaitingProcess {
                                process_future: process(data?)
                            };
                        }
                        Poll::Pending => return Poll::Pending,
                    }
                }
            }
        }
    }
}
```

## Architecture
```
async fn foo()
    → compiler generates enum state_machine
    → each .await point is a match branch

await future
    → future.poll(cx)
    → if Pending: register waker, return Pending
    → if Ready(v): continue

event loop
    → poll ready tasks
    → for each task: future.poll()
    → tasks that return Pending get parked
    → park = add to waiting set (I/O or timer)

reactor
    → OS async I/O (epoll/kqueue/IOCP)
    → register interest FD → deadline info
    → wait for events
    → wake corresponding tasks
```

## Bridge to Production
- **Mini version**: Single-threaded, cooperative, ~1000 lines. Production async runtimes (Tokio, async-std) are multi-threaded, work-stealing, lock-free, have hundreds of thousands lines of code.
- **Production concerns**: Work-stealing thread pools, pinned tasks (move semantics), cancellation propagation,backpressure, spawn vs spawn_blocking, structured concurrency, async traits, tracing/debugging, hierarchical tracing spans, resource governors, rate limiting.

## Checklist
- [ ] Step 1: Futures as state machines
- [ ] Step 2: Executor (event loop)
- [ ] Step 3: Reactor (I/O event loop with epoll/kqueue)
- [ ] Step 4: Timer/sleep (waker registration)
- [ ] Step 5: async/await desugaring
- [ ] Add: work-stealing thread pool
- [ ] Add: async channels and mutex

## Reference Tutorials
- [Writing an async executor](https://www.osohq.com/post/writing-an-async-executor-from-scratch)
- [Desugaring async/await for rust novices](https://tmandry.gitlab.io/posts/desugaring-async-await/)
- [Async/Await demystified](https://github.com/TaKO-8KI/async_demystified)
- [Build your own async runtime](https://github.com/tokio-rs/tokio/issues/4986)
- [Building an async runtime in Rust](https://github.com/Aandreba/blaze)
