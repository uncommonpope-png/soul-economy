---
name: processor-from-scratch
description: Build a Processor (CPU) From Scratch
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
---# Build a Processor (CPU) From Scratch

## Mental Model
A CPU is a finite state machine with registers, ALU operations, and memory access. Instructions flow through a fetch-decode-cycle. The "processor" in software emulates this. You're building a virtual machine that interprets binary instruction encodings and updates registers and memory.

## Step 1: Define the Instruction Set
Pick a minimal instruction set. Each instruction is encoded in 32 bits. A classic choice is a RISC-like subset:

```
[opcode:6][rs:5][rt:5][rd:5][shamt:5][funct:6]
[opcode:6][rs:5][rt:5][immediate:16]
[opcode:6][address:26]
```

Instructions you need:
- `add rd, rs, rt` (0b100000)
- `sub rd, rs, rt` (0b100010)
- `lw rt, offset(rs)` (0b100011)
- `sw rt, offset(rs)` (0b101011)
- `beq rs, rt, offset` (0b000100)
- `j target` (0b000010)
- `addi rt, rs, imm` (0b001000)

## Step 2: Registers and Memory
```c
typedef struct CPU {
    uint32_t pc;        // program counter
    uint32_t regs[32];  // general purpose registers ($0-$31)
    uint32_t memory[1024 * 1024];  // 4MB memory (byte-addressed)
} CPU_t;

void init_cpu(CPU_t* cpu) {
    memset(cpu, 0, sizeof(CPU_t));
    cpu->regs[0] = 0;  // $zero is always 0
}
```

## Step 3: Instruction Fetch-Decode-Execute
```c
#define OP(inst) (((inst) >> 26) & 0x3F)
#define RS(inst) (((inst) >> 21) & 0x1F)
#define RT(inst) (((inst) >> 16) & 0x1F)
#define RD(inst) (((inst) >> 11) & 0x1F)
#define IMM(inst) ((int16_t)((inst) & 0xFFFF))
#define JUMP(inst) ((inst) & 0x3FFFFFF)
#define SIGN_EXTEND(x) ((int32_t)(int16_t)(x))

void step(CPU_t* cpu) {
    // Fetch
    uint32_t instruction = cpu->memory[cpu->pc / 4];
    cpu->pc += 4;

    uint8_t op = OP(instruction);
    uint8_t rs = RS(instruction), rt = RT(instruction), rd = RD(instruction);
    int16_t imm = IMM(instruction);

    // Decode & Execute
    switch (op) {
        case 0x00: { // R-type
            uint8_t funct = instruction & 0x3F;
            switch (funct) {
                case 0x20: // add
                    cpu->regs[rd] = cpu->regs[rs] + cpu->regs[rt];
                    break;
                case 0x22: // sub
                    cpu->regs[rd] = cpu->regs[rs] - cpu->regs[rt];
                    break;
            }
            break;
        }
        case 0x08: // addi
            cpu->regs[rt] = cpu->regs[rs] + SIGN_EXTEND(imm);
            break;
        case 0x23: { // lw (word)
            uint32_t addr = cpu->regs[rs] + SIGN_EXTEND(imm);
            cpu->regs[rt] = cpu->memory[addr / 4];
            break;
        }
        case 0x2B: { // sw
            uint32_t addr = cpu->regs[rs] + SIGN_EXTEND(imm);
            cpu->memory[addr / 4] = cpu->regs[rt];
            break;
        }
        case 0x04: // beq
            if (cpu->regs[rs] == cpu->regs[rt])
                cpu->pc += SIGN_EXTEND(imm) * 4;
            break;
        case 0x02: // j
            cpu->pc = JUMP(instruction) * 4;
            break;
    }
}
```

## Step 4: Add Branch and Jump Logic
Control flow adds complexity because you need to handle pipeline stalls and delay slots:

```c
// Branch delay slot: the instruction after a branch executes regardless
void step(CPU_t* cpu) {
    uint32_t instruction = cpu->memory[cpu->pc / 4];
    cpu->pc += 4;

    // Execute the fetched instruction...
    // For branches: target is already calculated, we update PC AFTER decode
}
```

## Step 5: Add an Assembler
Turn assembly text into binary instruction encoding:

```c
int assemble_instruction(const char* mnemonic, char** args, uint32_t* out) {
    if (strcmp(mnemonic, "add") == 0) {
        uint8_t rd = atoi(args[0] + 1);
        uint8_t rs = atoi(args[1] + 1);
        uint8_t rt = atoi(args[2] + 1);
        *out = (0 << 26) | (rs << 21) | (rt << 16) | (rd << 11) | (0 << 6) | 0x20;
        return 0;
    }
    if (strcmp(mnemonic, "addi") == 0) {
        uint8_t rt = atoi(args[0] + 1);
        uint8_t rs = atoi(args[1] + 1);
        int16_t imm = atoi(args[2]);
        *out = (0x08 << 26) | (rs << 21) | (rt << 16) | (uint16_t)imm;
        return 0;
    }
    if (strcmp(mnemonic, "beq") == 0) {
        uint8_t rs = atoi(args[0] + 1);
        uint8_t rt = atoi(args[1] + 1);
        int16_t imm = atoi(args[2]);
        *out = (0x04 << 26) | (rs << 21) | (rt << 16) | (uint16_t)imm;
        return 0;
    }
    return -1;
}
```

## Architecture
```
Assembly text
    → Assembler (parse mnemonic + operands)
    → Binary instruction encoding
    → Load into memory
    → CPU loop:
        → Fetch (memory[PC/4])
        → Decode (extract opcode, registers, immediate)
        → Execute (ALU op or memory access)
        → Write back (update register/memory)
        → PC update
```

## Bridge to Production
- **Mini version**: Single-cycle, single-scalar, integer-only, simplified R-type + I-type + J-type. Real CPUs are deeply pipelined (5-20 stages), superscalar (multiple instructions per cycle), out-of-order execution, branch prediction, caches (L1/L2/L3), SIMD units, floating point, MMU, interrupt controllers.
- **Production concerns**: Pipeline hazards (structural, data, control), forwarding paths, branch prediction (2-bit saturating counters), register renaming (ROB), reorder buffer, speculative execution, cache coherency (MESI).

## Reference Tutorials
- [Nand2Tetris VM Implementer (Part 1)](https://www.nand2tetris.org/)
- [Writing a CPU emulator in Rust](https://github.com/eisenbiegler/erector)
- [Build a CPU from scratch (digital)](https://www.motionbank.org/work/work/build-a-cpu-from-transistors.html)
- [LC-3 assembler](https://weberna.github.io/blog/2018/02/27/code/lc-3-assembler/)
- [CPU from Scratch (Adam Talcott)](https://github.com/ATalcott/CPU_from_scratch)
- [nand2tetris CPU design](https://github.com/hemanta1994/nand2tetris_cpu_design)
