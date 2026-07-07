---
name: operating-system-from-scratch
description: Build a Operating System From Scratch
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
---# Build a Operating System From Scratch

## Mental Model
A CPU executes instructions in a loop: fetch-decode-execute. That's it. Everything else—processes, memory, files, network—is anOS constructing the illusion of a well-behaved machine on top of raw hardware. The OS is a layer between hardware and programs, providing controlled access to hardware resources.

## Step 1: The Bootstrapping Problem
When your computer powers on, the CPU is in "real mode"—16-bit addressing, no memory protection, no multitasking. The BIOS loads the first 512 bytes from your boot disk into memory at address `0x7C00` and jumps there. This is your boot sector. You need to:
1. Set up a stack
2. Switch to 32-bit protected mode
3. Start the kernel

```nasm
; boot.asm - 512 bytes or less, stored in the boot sector
[BITS 16]
org 0x7C00

start:
    cli
    mov ax, 0x07C0
    mov ds, ax
    mov ax, 0x0000      ; stack at 0x0000:0x7C00
    mov ss, ax
    mov sp, 0x7C00
    sti

    ; Load kernel from disk (sectors 2+)
    mov bx, 0x1000      ; kernel loads at 0x10000
    mov dl, 0x80        ; boot drive
    mov ah, 0x02        ; read sectors
    mov al, 32          ; read 32 sectors (kernel size)
    mov ch, 0           ; cylinder 0
    mov cl, 2           ; start at sector 2
    mov dh, 0           ; head 0
    int 0x13
    jc disk_error

    ; Switch to protected mode
    cli
    mov eax, cr0
    or eax, 1           ; set PE bit
    mov cr0, eax
    jmp 0x10:$           ; far jump to 32-bit code segment

%include "pm_switch.asm"
times 510-($-$$) db 0
dw 0xAA55
```

## Step 2: Switch to Protected Mode (32-bit)
Protected mode gives you 4GB address space and memory protection via segments and paging. After the switch, you'll need a Global Descriptor Table (GDT).

```nasm
[BITS 32]
[gdt]
gdt_start:
    dq 0                 ; null descriptor
    dq 0x00CF9A000000FFFF ; code segment (base=0, limit=4GB, present, exec, readable)
    dq 0x00CF92000000FFFF ; data segment (base=0, limit=4GB, present, rw)
gdt_end:

gdtr:
    dw gdt_end - gdt_start - 1
    dd gdt_start

code_seg equ 0x08
data_seg equ 0x10

protect_mode_entry:
    mov ax, data_seg
    mov ds, ax
    mov es, ax
    mov fs, ax
    mov gs, ax
    mov ss, ax
    mov esp, 0x90000

    jmp 0x10000  ; jump to kernel at 0x10000

; Padding to 512 bytes
times 510-($-$$) db 0
dw 0xAA55
```

## Step 3: Set Up the Kernel and Print to Screen
Now in 32-bit mode, you can write C. But first, basic I/O. The VGA text buffer is at `0xB8000`—write characters with attributes.

```c
// kernel.c
#define VGA_MEMORY 0xB8000
#define VGA_WIDTH 80

void clear_screen() {
    volatile unsigned short* vga = (unsigned short*) VGA_MEMORY;
    for (int i = 0; i < VGA_WIDTH * 25; i++) {
        vga[i] = (unsigned short)(' ' | 0x0F00);  // white on black
    }
}

void print_string(const char* str) {
    volatile unsigned short* vga = (unsigned short*) VGA_MEMORY;
    int i = 0;
    while (str[i]) {
        vga[i] = (unsigned short)(str[i] | 0x0F00);
        i++;
    }
}

void kernel_main() {
    clear_screen();
    print_string("Welcome to MyOS");
    while (1) {}  // halt
}
```

## Step 4: Interrupts and the Keyboard
The Programmable Interrupt Controller (PIC) manages hardware interrupts. The keyboard controller sends IRQ1. When a key is pressed, the CPU jumps to the interrupt handler vector.

```c
// IDT entry (Interrupt Descriptor Table)
struct idt_entry {
    unsigned short offset_lower;
    unsigned short selector;
    unsigned char zero;
    unsigned char type_attr;
    unsigned short offset_upper;
} __attribute__((packed));

void init_idt() {
    // Remap PIC to 0x20-0x2F (IRQs 0-15)
    outb(0x20, 0x11);  // ICW1: init
    outb(0xA0, 0x11);
    outb(0x21, 0x20);  // ICW2: IRQ0 → interrupt 0x20
    outb(0xA1, 0x28);
    outb(0x21, 0x04);  // ICW3: master IRQ2 has slave
    outb(0xA1, 0x02);
    outb(0x21, 0x01);  // ICW4: 8086 mode
    outb(0xA1, 0x01);
    outb(0x21, 0xFC);  // mask all except keyboard (IRQ1)
    outb(0xA1, 0xFF);
}

// Keyboard handler: read from PS/2 port 0x60
__asm__("keyboard_handler:");
__asm__("pusha");
__asm__("in al, 0x60");  // read scan code
__asm__("mov bl, al");
__asm__("cmp bl, 0x3B");  // '1' key
__asm__("je handle_key");
__asm__("popa");
__asm__("iret");
```

## Step 5: Paging (Memory Protection)
Paging translates every virtual address through a page table. The CPU accesses CR3 (page directory), and walks the tables to find the physical frame.

```c
// page.c - identity mapping + virtual memory
#define PAGE_DIR 0x200000  // page directory at 2MB
#define PAGE_TABLE (PAGE_DIR + 0x1000)

void init_paging() {
    // Zero the page directory
    unsigned int* pd = (unsigned int*) PAGE_DIR;
    for (int i = 0; i < 1024; i++) pd[i] = 0;

    // First page table: identity map first 4MB
    unsigned int* pt = (unsigned int*) PAGE_TABLE;
    for (int i = 0; i < 1024; i++) {
        pt[i] = (i * 0x1000) | 3;  // present + writable
    }

    // Point first PDE to first PTE
    pd[0] = (unsigned int)PAGE_TABLE | 3;

    // Enable paging: set CR4.PGE, load CR3, set CR0.PG
    __asm__("mov eax, %0" ::"r"(PAGE_DIR));
    __asm__("mov cr3, eax");
    __asm__("mov eax, cr0");
    __asm__("or eax, 0x80000000");
    __asm__("mov cr0, eax");
}
```

## Step 6: Processes and Context Switching
A process is just a program in execution. Context switching saves registers, stack pointer, instruction pointer—so you can switch between "processes" at interrupt time.

```c
struct process {
    unsigned int eip, esp, ebp;
    unsigned int eax, ebx, ecx, edx;
    unsigned int esi, edi;
    unsigned int registers;
    unsigned int page_dir;
    unsigned int isrunning;
} __attribute__((packed));

struct process processes[10];
int current_process = 0;

void schedule() {
    // Simple scheduler: round-robin
    current_process = (current_process + 1) % NUM_PROCESSES;
}

__asm__("context_switch:");
__asm__("pusha");
__asm__("mov eax, 0x10");     // load kernel data segment
__asm__("mov ds, ax");
__asm__("mov es, ax");
__asm__("mov [current_esp], esp");
__asm__("mov eax, [current_process]");
__asm__("imul eax, eax, sizeof_process");
__asm__("add eax, processes");
__asm__("mov [eax + PROCESS_ESP], esp");
__asm__("call schedule");
__asm__("mov eax, [current_process]");
__asm__("imul eax, eax, sizeof_process");
__asm__("add eax, processes");
__asm__("mov esp, [eax + PROCESS_ESP]");
__asm__("popa");
__asm__("iret");
```

## Architecture
```
Power On → BIOS → MBR Boot Sector (0x7C00, 512 bytes)
    → Switch to Protected Mode (set CR0.PE)
    → Load GDT → Enable Paging (CR0.PG)
    → Jump to Kernel (0x10000)
        → VGA text output
        → IDT setup (interrupt descriptors)
        → PIT timer interrupt (for scheduling)
        → Keyboard interrupt (PS/2 port 0x60)
        → Paging (CR3)
        → Process management (task state segment)
        → System calls (int 0x80)
        → VFS (virtual file system)
        → ATA/PATA disk driver
        → heap allocator (kmalloc)
        → init process (userland)
```

## Bridge to Production
- **Mini version**: Bare metal, no hardware abstraction layer, no memory allocator, no filesystem, no user/kernel mode separation, no drivers beyond basic I/O. Real OS kernels (Linux, macOS XNU) have millions of lines: SMP, virtual memory, file systems (ext4, APFS, Btrfs), network stacks, device drivers, system call interfaces.
- **Production concerns**: Separate kernel and user address spaces, system call interface, virtualization, device drivers (PCI, USB), SMP / multi-core scheduling, copy-on-write fork, demand paging, journaling filesystem.

## Reference Tutorials
- [osdev.org Bare Bones tutorial](https://wiki.osdev.org/Bare_Bones)
- [Writing a Simple OS (mikeos)](http://mikeos.sourceforge.net/)
- [Writing an OS in Rust (Philipp Opiolka)](https://github.com/phil-opp/blog_os)
- [How to develop an OS from scratch (ByteThunder)](https://github.com/dreamos82/How-to-Develop-an-Operating-System-from-Scratch)
- [Building a RISC-V OS from scratch](https://github.com/sw170901/riscv-os)
