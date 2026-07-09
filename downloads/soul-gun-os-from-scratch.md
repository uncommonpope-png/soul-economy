---
name: os-from-scratch
description: Build an Operating System from Scratch
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
---# Build an Operating System from Scratch

> *"An OS is just: bootstrap → memory management → process scheduler → hardware abstraction."*

---

## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPERATING SYSTEM ARCHITECTURE                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   BOOT PROCESS                                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  BIOS/UEFI → MBR/Boot Sector → Bootloader → Kernel       │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
│   KERNEL LAYERS                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  ┌─────────────────────────────────────────────────────┐ │  │
│   │  │  System Calls (read, write, fork, exec, exit)      │ │  │
│   │  ├─────────────────────────────────────────────────────┤ │  │
│   │  │  Process Manager (schedule, context switch)        │ │  │
│   │  ├─────────────────────────────────────────────────────┤ │  │
│   │  │  Memory Manager (virtual memory, paging)           │ │  │
│   │  ├─────────────────────────────────────────────────────┤ │  │
│   │  │  Device Drivers (disk, network, display)          │ │  │
│   │  ├─────────────────────────────────────────────────────┤ │  │
│   │  │  Hardware Abstraction (interrupts, I/O ports)      │ │  │
│   │  └─────────────────────────────────────────────────────┘ │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Build Steps (5 Steps, ~100 Lines)

### Step 1: Boot Sector (15 lines)

```asm
; Step 1: x86 Boot Sector (16-bit real mode)
; Assemble with: nasm -f bin boot.asm -o boot.bin

[BITS 16]           ; 16-bit mode
[ORG 0x7C00]        ; BIOS loads us at 0x7C00

start:
    mov ax, 0       ; Set up segments
    mov ds, ax
    mov es, ax
    mov ss, ax
    mov sp, 0x7C00  ; Stack grows down

    ; Print message
    mov si, message
    call print_string

    ; Hang
    jmp $

print_string:
    lodsb           ; Load byte from SI
    cmp al, 0       ; Check for null
    je .done
    mov ah, 0x0E    ; BIOS tty output
    int 0x10        ; Call BIOS interrupt
    jmp print_string
.done:
    ret

message db "Hello, OS!", 0x0D, 0x0A, 0

; Fill rest with zeros, then boot signature
times 510-($-$$) db 0
dw 0xAA55           ; Boot signature
```

---

### Step 2: GDT and Protected Mode (25 lines)

```asm
; Step 2: Set up GDT and switch to protected mode

[BITS 16]
[ORG 0x7C00]

; GDT Entry (8 bytes each)
gdt_start:
    ; Null descriptor (required)
    dq 0

    ; Code segment descriptor
    dw 0xFFFF       ; Limit
    dw 0x0000       ; Base (low)
    db 0x00         ; Base (mid)
    db 10011010b    ; Access byte
    db 11001111b    ; Flags + Limit (high)
    db 0x00         ; Base (high)

    ; Data segment descriptor
    dw 0xFFFF
    dw 0x0000
    db 0x00
    db 10010010b    ; Access byte
    db 11001111b
    db 0x00

gdt_end:

gdtr:
    dw gdt_end - gdt_start - 1
    dd gdt_start

protected_mode:
    cli             ; Disable interrupts

    ; Load GDT
    lgdt [gdtr]

    ; Enable protected mode
    mov eax, cr0
    or eax, 1
    mov cr0, eax

    ; Far jump to set CS
    jmp 0x08:protected_start

[BITS 32]
protected_start:
    mov ax, 0x10    ; Data segment selector
    mov ds, ax
    mov es, ax
    mov fs, ax
    mov gs, ax
    mov ss, ax

    ; Set up stack
    mov esp, 0x7C00

    ; Print character
    mov edi, 0xB8000 ; VGA text memory
    mov al, 'O'
    mov ah, 0x0F    ; White on black
    stosw

    jmp $
```

---

### Step 3: Memory Manager (30 lines)

```c
// Step 3: Simple memory manager

#define KERNEL_START 0x00100000
#define KERNEL_END   0x01000000

typedef struct block {
    size_t size;
    int free;
    struct block* next;
} block_t;

block_t* head = NULL;
size_t total_mem = 0;

void init_memory(size_t mem_size) {
    total_mem = mem_size;
    head = (block_t*)KERNEL_START;
    head->size = mem_size - sizeof(block_t);
    head->free = 1;
    head->next = NULL;
}

void* kmalloc(size_t size) {
    block_t* curr = head;

    while (curr) {
        if (curr->free && curr->size >= size) {
            // Split block if big enough
            if (curr->size > size + sizeof(block_t) + 16) {
                block_t* new_block = (block_t*)((char*)curr + sizeof(block_t) + size);
                new_block->size = curr->size - size - sizeof(block_t);
                new_block->free = 1;
                new_block->next = curr->next;

                curr->size = size;
                curr->next = new_block;
            }
            curr->free = 0;
            return (void*)((char*)curr + sizeof(block_t));
        }
        curr = curr->next;
    }
    return NULL;  // No space
}

void kfree(void* ptr) {
    if (!ptr) return;
    block_t* block = ((block_t*)ptr) - 1;
    block->free = 1;

    // Merge with next if free
    if (block->next && block->next->free) {
        block->size += sizeof(block_t) + block->next->size;
        block->next = block->next->next;
    }
}
```

---

### Step 4: Process Scheduler (15 lines)

```c
// Step 4: Simple round-robin scheduler

#define MAX_PROCESSES 16

typedef struct process {
    int pid;
    int state;           // 0=running, 1=ready, 2=blocked
    void* stack;
    void* registers;     // CPU registers for context switch
} process_t;

process_t processes[MAX_PROCESSES];
int current_pid = -1;
int num_processes = 0;

void schedule() {
    // Round-robin: find next ready process
    int start = current_pid;
    do {
        current_pid = (current_pid + 1) % MAX_PROCESSES;
        if (processes[current_pid].state == 1) {  // Ready
            switch_to(processes[current_pid].registers);
            return;
        }
    } while (current_pid != start);
}

void yield() {
    // Give up CPU
    processes[current_pid].state = 1;  // Ready
    schedule();
}

void wake_up(int pid) {
    if (pid >= 0 && pid < MAX_PROCESSES) {
        processes[pid].state = 1;  // Ready
    }
}
```

---

### Step 5: System Calls (15 lines)

```c
// Step 5: System call interface

// System call numbers
#define SYS_READ    0
#define SYS_WRITE   1
#define SYS_EXIT    2
#define SYS_FORK    3

int syscall(int num, int arg1, int arg2, int arg3) {
    int result;
    __asm__ volatile (
        "int $0x80"
        : "=a" (result)
        : "a" (num), "b" (arg1), "c" (arg2), "d" (arg3)
    );
    return result;
}

// In kernel interrupt handler:
void syscall_handler(registers_t* regs) {
    switch (regs->eax) {
        case SYS_READ:
            regs->eax = sys_read(regs->ebx, (void*)regs->ecx, regs->edx);
            break;
        case SYS_WRITE:
            regs->eax = sys_write(regs->ebx, (void*)regs->ecx, regs->edx);
            break;
        case SYS_EXIT:
            sys_exit(regs->ebx);
            break;
    }
}

// Usage
int main() {
    char buf[100];
    syscall(SYS_READ, 0, (int)buf, 100);
    syscall(SYS_WRITE, 1, (int)buf, 100);
    syscall(SYS_EXIT, 0, 0, 0);
}
```

---

## Bridge to Production

| Our OS | Linux |
|--------|-------|
| Single core | SMP/Multi-core |
| No filesystem | ext4, btrfs |
| No networking | TCP/IP stack |
| No userspace | Processes, init |
| Real mode | Protected + long mode |

**Production systems to study:**
- [Writing an OS in Rust](https://os.phil-opp.com/)
- [Kernel 101](https://arjunsreedharan.org/post/82710718100/kernel-101-lets-write-a-kernel)
- [Little Book About OS Development](https://littleosbook.github.io/)

---

## Checklist

- [ ] Step 1: Boot sector works
- [ ] Step 2: Protected mode
- [ ] Step 3: Memory manager
- [ ] Step 4: Scheduler
- [ ] Step 5: System calls
- [ ] Add: filesystem
- [ ] Add: networking