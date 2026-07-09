---
name: emulator-from-scratch
description: Build an Emulator from Scratch
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
---# Build an Emulator from Scratch

> *"An emulator is just a fetch-decode-execute loop that pretends to be different hardware."*

---

## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMULATOR ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  EMULATOR LOOP                                           │  │
│   │                                                         │  │
│   │  while running:                                         │  │
│   │    opcode = fetch()      // Read 2 bytes from PC       │  │
│   │    decode(opcode)        // Figure out what it means   │  │
│   │    execute(opcode)       // Do the thing               │  │
│   │    update_timers()       // Decrement delay/sound      │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
│   MEMORY LAYOUT (CHIP-8):                                       │
│   ┌────────────────────────────────────────────────────┐       │
│   │  0x000-0x1FF  Reserved (interpreter)                │       │
│   │  0x200-0xE9F  Program RAM                             │       │
│   │  0xEA0-0xEFF  Call stack, work registers              │       │
│   │  0xF00-0xFFF  Display refresh (64x32 monochrome)    │       │
│   └────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Build Steps (5 Steps, ~130 Lines)

### Step 1: Memory and Registers (15 lines)

```python
"""Step 1: Define CHIP-8 memory and registers."""
import numpy as np

class Chip8:
    def __init__(self):
        self.memory = np.zeros(4096, dtype=np.uint8)
        self.V = np.zeros(16, dtype=np.uint8)
        self.I = 0
        self.PC = 0x200
        self.SP = 0
        self.DT = 0
        self.ST = 0
        self.stack = np.zeros(16, dtype=np.uint16)
        self.display = np.zeros((32, 64), dtype=np.uint8)
        self.keys = np.zeros(16, dtype=np.uint8)
        self.running = True
        self.load_fonts()

    def load_fonts(self):
        fonts = [
            [0xF0, 0x90, 0x90, 0x90, 0xF0],  # 0
            [0x20, 0x60, 0x20, 0x20, 0x70],  # 1
            [0xF0, 0x10, 0xF0, 0x80, 0xF0],  # 2
            [0xF0, 0x10, 0xF0, 0x10, 0xF0],  # 3
            [0x90, 0x90, 0xF0, 0x10, 0x10],  # 4
            [0xF0, 0x80, 0xF0, 0x10, 0xF0],  # 5
            [0xF0, 0x80, 0xF0, 0x90, 0xF0],  # 6
            [0xF0, 0x10, 0x20, 0x40, 0x40],  # 7
            [0xF0, 0x90, 0xF0, 0x90, 0xF0],  # 8
            [0xF0, 0x90, 0xF0, 0x10, 0xF0],  # 9
            [0xF0, 0x90, 0xF0, 0x90, 0x90],  # A
            [0xE0, 0x90, 0xE0, 0x90, 0xE0],  # B
            [0xF0, 0x80, 0x80, 0x80, 0xF0],  # C
            [0xF0, 0x90, 0x90, 0x90, 0xF0],  # D
            [0xF0, 0x80, 0xF0, 0x80, 0xF0],  # E
            [0xF0, 0x80, 0xF0, 0x80, 0x80],  # F
        ]
        for i, font in enumerate(fonts):
            for j, byte in enumerate(font):
                self.memory[i * 5 + j] = byte

    def load_rom(self, rom_data):
        for i, byte in enumerate(rom_data):
            self.memory[0x200 + i] = byte
```

---

### Step 2: Fetch and Decode (15 lines)

```python
"""Step 2: Implement fetch and decode."""

    def fetch(self):
        opcode = (self.memory[self.PC] << 8) | self.memory[self.PC + 1]
        self.PC = (self.PC + 2) & 0xFFFF
        return opcode

    def decode(self, opcode):
        return {
            'opcode': opcode,
            'nnn': opcode & 0x0FFF,
            'nn': opcode & 0x00FF,
            'n': opcode & 0x000F,
            'x': (opcode >> 8) & 0x000F,
            'y': (opcode >> 4) & 0x000F,
            'msb': (opcode >> 12) & 0x000F,
        }

if __name__ == "__main__":
    chip8 = Chip8()
    chip8.memory[0x200] = 0x60
    chip8.memory[0x201] = 0x14
    opcode = chip8.fetch()
    decoded = chip8.decode(opcode)
    print(f"Opcode: {hex(opcode)}, Vx={decoded['x']}, nn={hex(decoded['nn'])}")
    assert decoded['x'] == 0 and decoded['nn'] == 0x14
    print("Fetch/decode test: OK")
```

---

### Step 3: Execute Opcodes - Part 1 (0x0xxx, 0x1xxx, 0x2xxx, 0x3xxx, 0x6xxx, 0x7xxx, 0xAnnn, 0xDxnyn) (30 lines)

```python
"""Step 3: Execute opcodes - basic set."""

    def execute(self, opcode):
        d = self.decode(opcode)
        msb = d['msb']

        if msb == 0x0:
            if d['nn'] == 0xE0:        # CLS
                self.display = np.zeros((32, 64), dtype=np.uint8)
                return True
            if d['nn'] == 0xEE:        # RET
                self.SP = (self.SP - 1) & 0xF
                self.PC = self.stack[self.SP]
                return True

        elif msb == 0x1:               # JP addr
            self.PC = d['nnn']
            return False

        elif msb == 0x2:               # CALL addr
            self.stack[self.SP] = self.PC
            self.SP = (self.SP + 1) & 0xF
            self.PC = d['nnn']
            return False

        elif msb == 0x3:               # SE Vx, byte
            if self.V[d['x']] == d['nn']:
                self.PC = (self.PC + 2) & 0xFFFF
            return True

        elif msb == 0x4:               # SNE Vx, byte
            if self.V[d['x']] != d['nn']:
                self.PC = (self.PC + 2) & 0xFFFF
            return True

        elif msb == 0x5 and d['n'] == 0:  # SE Vx, Vy
            if self.V[d['x']] == self.V[d['y']]:
                self.PC = (self.PC + 2) & 0xFFFF
            return True

        elif msb == 0x6:               # LD Vx, byte
            self.V[d['x']] = d['nn']
            return True

        elif msb == 0x7:               # ADD Vx, byte
            self.V[d['x']] = (self.V[d['x']] + d['nn']) & 0xFF
            return True

        elif msb == 0xA:               # LD I, addr
            self.I = d['nnn']
            return True

        elif msb == 0xB:               # JP V0, addr
            self.PC = (d['nnn'] + self.V[0]) & 0xFFFF
            return False

        elif msb == 0xC:               # RND Vx, byte
            import random
            self.V[d['x']] = random.randint(0, 255) & d['nn']
            return True

        elif msb == 0xD:               # DRW Vx, Vy, nibble
            x = self.V[d['x']] % 64
            y = self.V[d['y']] % 32
            height = d['n']
            self.V[0xF] = 0
            for row in range(height):
                if y + row >= 32:
                    break
                sprite = self.memory[self.I + row]
                for col in range(8):
                    if sprite & (0x80 >> col):
                        px = (x + col) % 64
                        py = (y + row) % 32
                        if self.display[py, px]:
                            self.V[0xF] = 1
                        self.display[py, px] ^= 1

        return True
```

---

### Step 4: Execute Opcodes - Part 2 (0x8xxx arithmetic/logical) (25 lines)

```python
"""Step 4: 0x8xxx logical and arithmetic opcodes."""

    def execute_8xxx(self, opcode):
        d = self.decode(opcode)
        x, y, n = d['x'], d['y'], d['n']

        if n == 0x0:                   # LD Vx, Vy
            self.V[x] = self.V[y]
        elif n == 0x1:                 # OR Vx, Vy
            self.V[x] |= self.V[y]
        elif n == 0x2:                 # AND Vx, Vy
            self.V[x] &= self.V[y]
        elif n == 0x3:                 # XOR Vx, Vy
            self.V[x] ^= self.V[y]
        elif n == 0x4:                 # ADD Vx, Vy (with carry)
            result = self.V[x] + self.V[y]
            self.V[0xF] = 1 if result > 0xFF else 0
            self.V[x] = result & 0xFF
        elif n == 0x5:                 # SUB Vx, Vy (with borrow)
            self.V[0xF] = 1 if self.V[x] >= self.V[y] else 0
            self.V[x] = (self.V[x] - self.V[y]) & 0xFF
        elif n == 0x6:                 # SHR Vx (or SHR Vy)
            self.V[0xF] = self.V[x] & 1
            self.V[x] >>= 1
        elif n == 0x7:                 # SUBN Vx, Vy (with borrow)
            self.V[0xF] = 1 if self.V[y] > self.V[x] else 0
            self.V[x] = (self.V[y] - self.V[x]) & 0xFF
        elif n == 0xE:                 # SHL Vx (or SHL Vy)
            self.V[0xF] = (self.V[x] >> 7) & 1
            self.V[x] = (self.V[x] << 1) & 0xFF
        return True

    def execute(self, opcode):
        d = self.decode(opcode)
        msb = d['msb']
        if msb == 0x8 and d['n'] != 0x0:
            return self.execute_8xxx(opcode)
        # ... rest of execute from Step 3 ...
```

---

### Step 5: 0xFxxx Timer, Random, and I/O Opcodes + Main Loop (30 lines)

```python
"""Step 5: Timer, I/O, and main loop."""

    def execute_fxxx(self, opcode):
        d = self.decode(opcode)
        x, nn = d['x'], d['nn']

        if nn == 0x07:                 # LD Vx, DT
            self.V[x] = self.DT
        elif nn == 0x0A:               # LD Vx, K (wait for key)
            key_pressed = None
            for i in range(16):
                if self.keys[i]:
                    key_pressed = i
                    break
            if key_pressed is None:
                self.PC = (self.PC - 2) & 0xFFFF
            else:
                self.V[x] = key_pressed
        elif nn == 0x15:               # LD DT, Vx
            self.DT = self.V[x]
        elif nn == 0x18:               # LD ST, Vx
            self.ST = self.V[x]
        elif nn == 0x1E:               # ADD I, Vx
            self.I = (self.I + self.V[x]) & 0xFFFF
        elif nn == 0x29:               # LD F, Vx (sprite for digit)
            self.I = self.V[x] * 5
        elif nn == 0x33:                # LD B, Vx (BCD)
            vx = self.V[x]
            self.memory[self.I] = (vx // 100) & 0xFF
            self.memory[self.I + 1] = ((vx // 10) % 10) & 0xFF
            self.memory[self.I + 2] = vx % 10
        elif nn == 0x55:               # LD [I], Vx
            for i in range(x + 1):
                self.memory[self.I + i] = self.V[i]
        elif nn == 0x65:               # LD Vx, [I]
            for i in range(x + 1):
                self.V[i] = self.memory[self.I + i]
        return True

    def run_cycle(self):
        if self.PC >= 4096:
            return False
        opcode = self.fetch()
        d = self.decode(opcode)
        if d['msb'] == 0xF:
            result = self.execute_fxxx(opcode)
        else:
            result = self.execute(opcode)
        if result:
            self.PC = self.PC
        if self.DT > 0:
            self.DT -= 1
        if self.ST > 0:
            self.ST -= 1
        return True

    def run(self, instructions=1000):
        count = 0
        while self.running and count < instructions:
            if not self.run_cycle():
                break
            count += 1

    def render(self):
        img = np.zeros((32, 64, 3), dtype=np.uint8)
        img[self.display == 1] = [255, 255, 255]
        return img

if __name__ == "__main__":
    chip8 = Chip8()
    chip8.load_rom(bytes([0x60, 0x14, 0x61, 0x10, 0xD1, 0x01]))
    chip8.run(10)
    assert chip8.V[0] == 0x14 and chip8.V[1] == 0x10
    print(f"Display pixel at (20, 1): {chip8.display[1, 20]}")
    print("Chip-8 emulator test: OK")
```

---

### ROM Loading from File (5 lines)

```python
"""Load a ROM from file."""

def load_rom(filename):
    with open(filename, 'rb') as f:
        return f.read()

# Usage:
# chip8 = Chip8()
# rom = load_rom('game.ch8')
# chip8.load_rom(rom)
# chip8.run()
```

---

## Bridge to Production

| Our CHIP-8 | Real Emulators |
|------------|----------------|
| 64x32 display | Variable resolution |
| 60 Hz timing | Cycle-accurate |
| ~20 opcodes | 100+ opcodes |
| No sound | FM synthesis |
| No save states | Save/load |
| No Super-CHIP | Extended instruction set |

**Production systems to study:**
- [How to write an emulator (CHIP-8)](http://www.multigesture.net/articles/how-to-write-an-emulator-chip-8-interpreter/)
- [Write your Own Virtual Machine (LC3)](https://justinmeiners.github.io/lc3-vm/)
- [GameBoy Emulation in JavaScript](http://imrannazar.com/GameBoy-Emulation-in-JavaScript)

---

## Checklist

- [ ] Step 1: Memory and registers initialized correctly
- [ ] Step 2: Fetch and decode work
- [ ] Step 3: Basic opcodes (0x0xxx, 1xxx, 2xxx, 3xxx, 6xxx, 7xxx, Annnn, Dxyn)
- [ ] Step 4: 0x8xxx logical/arithmetic (OR, AND, XOR, ADD, SUB, SHL, SHR)
- [ ] Step 5: 0xFxxx timer/I/O + main loop
- [ ] All code blocks consistent (all indented methods in class)
- [ ] ROM loading from file works
- [ ] Test: Load a program, run 10 cycles, verify register state