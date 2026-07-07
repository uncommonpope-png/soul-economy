---
name: metagpt
description: Build a Memory Allocator From Scratch
domain: computer-science
language: python
stars: "0"
topics: ["computer-science"]
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
---# Build a Memory Allocator From Scratch

---
name: memory-allocator-from-scratch
description: Use when user wants to understand how memory allocators work, build a malloc/free implementation, or learn about heap management, fragmentation, and free lists. Triggers on: "build memory allocator", "malloc", "heap management", "fragmentation".
---

## The Mental Model
Your program has a heap—a big chunk of free memory. `malloc()` asks for a slice. `free()` returns it. The allocator's job: keep track of which bytes are used/free, find a free block that fits, split it if needed, coalesce adjacent free blocks on free. Speed and memory utilization are the competing goals.

## Step 1: The Free List
Track free blocks in a linked list. Each block has a header (size + next pointer) and a footer.

```c
typedef struct block_header {
    size_t size;
    struct block_header* next;
    int free;
} block_header_t;

void* heap_start = NULL;
block_header_t* free_list = NULL;

void init_allocator() {
    heap_start = sbrk(1024 * 1024);  // 1MB heap
    free_list = (block_header_t*) heap_start;
    free_list->size = 1024 * 1024 - sizeof(block_header_t);
    free_list->next = NULL;
    free_list->free = 1;
}

#define HEADER_SIZE sizeof(block_header_t)
```

## Step 2: Basic malloc
Find the first free block that's large enough. Split it if there's room left for another allocation.

```c
void* malloc(size_t size) {
    if (size == 0) return NULL;
    size = (size + 7) & ~7;  // align to 8 bytes

    block_header_t* current = free_list;
    while (current) {
        if (current->free && current->size >= size + HEADER_SIZE) {
            // Split block
            size_t remaining = current->size - size - HEADER_SIZE;
            current->free = 0;
            current->size = size;

            if (remaining > HEADER_SIZE) {
                block_header_t* new_block = (block_header_t*)((char*)current + HEADER_SIZE + size);
                new_block->size = remaining;
                new_block->free = 1;
                new_block->next = current->next;
                current->next = new_block;
            }
            return (void*)((char*)current + HEADER_SIZE);
        }
        current = current->next;
    }

    // No free block found - expand heap
    block_header_t* new_block = sbrk(size + HEADER_SIZE);
    new_block->size = size;
    new_block->free = 0;
    new_block->next = NULL;
    return (void*)((char*)new_block + HEADER_SIZE);
}
```

## Step 3: Coalescing and free()
On free(), coalesce with adjacent free blocks to prevent fragmentation.

```c
void free(void* ptr) {
    if (!ptr) return;
    block_header_t* block = (block_header_t*)((char*)ptr - HEADER_SIZE);
    block->free = 1;

    // Coalesce with next block
    block_header_t* current = free_list;
    while (current) {
        block_header_t* next = current->next;
        if (next && current->free && next->free) {
            current->size += HEADER_SIZE + next->size;
            current->next = next->next;
            next = current;
        }
        current = current->next;
    }
}
```

## Step 4: Add Alignment and Metadata
Real allocators store metadata in the block itself (not just the free list). This enables free() without needing a pointer to the header. Also add alignment for SIMD types.

> **POSIX dependency**: `sbrk()` and `posix_memalign()` are POSIX. On Windows, use `VirtualAlloc()` instead.

```python
# For Windows, replace sbrk with VirtualAlloc:
# void* ptr = VirtualAlloc(NULL, size + HEADER_SIZE, MEM_COMMIT, PAGE_READWRITE);
```

```c
// Aligned allocator (for SSE/AVX)
void* aligned_malloc(size_t size, size_t alignment) {
    void* ptr;
    void* header_ptr;
    size_t header_size = sizeof(size_t);
    size_t total = header_size + size + alignment;

    if (posix_memalign(&ptr, alignment, total) != 0) return NULL;
    header_ptr = (char*)ptr + alignment - ((size_t)ptr % alignment) - header_size;
    *(size_t*)header_ptr = (size_t)ptr;
    return (void*)((char*)header_ptr + header_size);
}

// Header pointer tracking:
// The data pointer returned by malloc = (block_header + 1).
// To free: ptr_to_header = (char*)ptr - HEADER_SIZE.
// This works because the header is stored immediately before the returned pointer.
```

## Step 5: Segregated Free Lists
Instead of one big free list, use multiple lists for different size classes (8-16, 16-32, 32-64, etc.). This is O(1) lookup instead of O(n)—like how `std::vector` growth is amortized O(1) vs `std::list` being O(1) per insert but O(n) per search.

```c
#define NUM_CLASSES 10
block_header_t* size_classes[NUM_CLASSES];

void init_size_classes() {
    size_t class_size = 16;
    for (int i = 0; i < NUM_CLASSES; i++) {
        size_classes[i] = NULL;
        class_size *= 2;
    }
}

block_header_t* get_class(size_t size) {
    int class_idx = 0;
    size_t class_size = 16;
    while (class_size < size && class_idx < NUM_CLASSES - 1) {
        class_size *= 2;
        class_idx++;
    }
    return size_classes[class_idx];
}

void* malloc(size_t size) {
    block_header_t* free_list = get_class(size);
    // Search within class, split if needed...
}
```

## Architecture
```
malloc(size)
  → align size
  → find first-fit free block (OR search segregated class)
  → if found: split block (header update, new free block if room)
  → if not found: ask OS for more memory (sbrk/mmap)
  → return data pointer (= header + HEADER_SIZE)

free(ptr)
  → find block header (= ptr - HEADER_SIZE)
  → mark free
  → coalesce adjacent free blocks
  → maybe return excess memory to OS

Headers stored IN the heap (not just free list):
  [size|free|next] + data
```

## Bridge to Production
- **Mini version**: Simple metadata + one or few free lists + basic coalescing. Production allocators (jemalloc, tcmalloc, ptmalloc) use segregated size classes, thread-local caches (arenas), memory pooling for frequently allocated sizes, and never return memory to the OS.
- **Production concerns**: fragmentation minimization (best-fit, split policies), thread safety (lock-free data structures), cache line alignment (false sharing prevention), debugging features (guard pages, double-free detection), profiling hooks, memory pooling, mmap for large allocations (>128KB), and introspection (mallinfo, /proc mappings).

## Reference Tutorials
- [Implementing malloc from scratch](https://danluu.com/malloc-creacy/)
- [A malloc tutorial](https://write-only.io/posts/malloc/)
- [Writing a Memory Allocator](https://avacassimjr.github.io/posts/memory-allocator)
- [Writing a memory allocator in C](https://arjunbiniamgiel.medium.com/writing-a-memory-allocator-d3346102cd1d)
- [Write your own memory allocator (Stack Overflow)](https://stackoverflow.blog/2020/09/18/write-your-own-memory-allocator/)
