---
name: cli-from-scratch
description: Build a CLI from Scratch
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
---# Build a CLI from Scratch

> *"A CLI is just: parse args → validate → execute → output."*

---

## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                       CLI ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   INPUT: "myapp --config prod.yaml -v build --watch"             │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  ARGUMENT PARSER                                         │  │
│   │     --config prod.yaml → {config: "prod.yaml"}          │  │
│   │     -v → {verbose: true}                                │  │
│   │     build --watch → {command: "build", watch: true}     │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  COMMAND ROUTER                                          │  │
│   │     "build" → build_handler                              │  │
│   │     "deploy" → deploy_handler                            │  │
│   │     "init" → init_handler                                │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  OUTPUT FORMATTER                                         │  │
│   │     Success: green ✓ "Deployed!"                        │  │
│   │     Error: red ✗ "Config not found"                      │  │
│   │     Info: blue ℹ "Building..."                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Build Steps (4 Steps, ~80 Lines)

### Step 1: Argument Parser (20 lines)

```python
"""Step 1: Simple argument parser."""

from dataclasses import dataclass
from typing import List, Optional

@dataclass
class Arg:
    name: str
    short: Optional[str] = None
    value: Optional[str] = None
    is_flag: bool = False

class Parser:
    def __init__(self):
        self.args = {}

    def parse(self, argv: List[str]) -> dict:
        """Parse command line arguments."""
        result = {}
        i = 0

        while i < len(argv):
            arg = argv[i]

            if arg.startswith('--'):
                # Long option
                name = arg[2:]
                if '=' in name:
                    k, v = name.split('=', 1)
                    result[k] = v
                else:
                    # Check if next arg is value
                    if i + 1 < len(argv) and not argv[i+1].startswith('-'):
                        result[name] = argv[i + 1]
                        i += 1
                    else:
                        result[name] = True
                i += 1

            elif arg.startswith('-'):
                # Short option
                name = arg[1:]
                if i + 1 < len(argv) and not argv[i+1].startswith('-'):
                    result[name] = argv[i + 1]
                    i += 1
                else:
                    for c in name:
                        result[c] = True
                i += 1

            else:
                # Positional argument
                result['_'].append(arg)
                i += 1

        if '_' not in result:
            result['_'] = []

        return result

# Test
parser = Parser()
result = parser.parse(['--config', 'prod.yaml', '-v', 'build', '--watch'])
print(result)  # {'config': 'prod.yaml', 'v': True, '_': ['build'], 'watch': True}
```

---

### Step 2: Command Router (25 lines)

```python
"""Step 2: Command router with subcommands."""

from dataclasses import dataclass
from typing import Callable, Dict

@dataclass
class Command:
    name: str
    handler: Callable
    description: str
    args: Dict[str, str] = None  # arg -> description

class CLI:
    def __init__(self, name: str):
        self.name = name
        self.commands: Dict[str, Command] = {}
        self.global_flags = {}

    def command(self, name: str, description: str = ""):
        """Decorator to register command."""
        def decorator(func):
            self.commands[name] = Command(name, func, description)
            return func
        return decorator

    def add_flag(self, flag: str, description: str):
        """Add global flag."""
        self.global_flags[flag] = description

    def run(self, argv: list):
        """Parse and execute command."""
        # Separate global flags from command
        args = []
        cmd_args = []
        for arg in argv:
            if arg.startswith('-') and cmd_args == []:
                args.append(arg)
            else:
                cmd_args.append(arg)

        # Parse global flags
        parser = Parser()
        parsed = parser.parse(args)
        verbose = parsed.get('v') or parsed.get('verbose')
        debug = parsed.get('d') or parsed.get('debug')

        if not cmd_args:
            self.print_help()
            return 1

        cmd_name = cmd_args[0]
        if cmd_name == 'help':
            self.print_help()
            return 0

        if cmd_name not in self.commands:
            print(f"Unknown command: {cmd_name}")
            self.print_help()
            return 1

        return self.commands[cmd_name].handler(cmd_args[1:], parsed)

    def print_help(self):
        print(f"{self.name}\nCommands:")
        for name, cmd in self.commands.items():
            print(f"  {name:15} {cmd.description}")


# Create CLI
cli = CLI("myapp")

@cli.command('build', 'Build the project')
def build_handler(args, flags):
    print("Building...")
    return 0

@cli.command('deploy', 'Deploy to production')
def deploy_handler(args, flags):
    print("Deploying...")
    return 0
```

---

### Step 3: Output Styling (20 lines)

```python
"""Step 3: Styled terminal output."""

class Style:
    # ANSI color codes
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'

class Output:
    def __init__(self, verbose=False):
        self.verbose = verbose

    def success(self, msg):
        print(f"{Style.GREEN}✓{Style.RESET} {msg}")

    def error(self, msg):
        print(f"{Style.RED}✗{Style.RESET} {msg}")

    def warning(self, msg):
        print(f"{Style.YELLOW}⚠{Style.RESET} {msg}")

    def info(self, msg):
        print(f"{Style.BLUE}ℹ{Style.RESET} {msg}")

    def debug(self, msg):
        if self.verbose:
            print(f"{Style.CYAN}DEBUG:{Style.RESET} {msg}")

    def header(self, msg):
        print(f"\n{Style.BOLD}{msg}{Style.RESET}")
        print("=" * len(msg))

    def table(self, headers: list, rows: list):
        """Print a table."""
        col_widths = [len(h) for h in headers]
        for row in rows:
            for i, cell in enumerate(row):
                col_widths[i] = max(col_widths[i], len(str(cell)))

        # Header
        print(" | ".join(f"{h:<{w}}" for h, w in zip(headers, col_widths)))
        print("-+-".join("-" * w for w in col_widths))

        # Rows
        for row in rows:
            print(" | ".join(f"{str(c):<{w}}" for c, w in zip(row, col_widths)))

# Test
out = Output(verbose=True)
out.success("Deployed to production")
out.error("Failed to connect")
out.warning("Config is deprecated")
out.info("Building...")
out.debug("Starting process...")
out.table(["Name", "Status", "Age"], [
    ["Alice", "Active", "2h"],
    ["Bob", "Inactive", "5h"]
])
```

---

### Step 4: Interactive Prompt (15 lines)

```python
"""Step 4: Interactive CLI with prompts."""

import getpass

class Prompt:
    @staticmethod
    def text(question, default=None):
        """Ask for text input."""
        if default:
            result = input(f"{question} [{default}]: ").strip()
            return result or default
        return input(f"{question}: ").strip()

    @staticmethod
    def password(question):
        """Ask for password (no echo)."""
        return getpass.getpass(f"{question}: ")

    @staticmethod
    def confirm(question, default=True):
        """Ask yes/no question."""
        suffix = "[Y/n]" if default else "[y/N]"
        result = input(f"{question} {suffix}: ").strip().lower()
        if not result:
            return default
        return result in ['y', 'yes']

    @staticmethod
    def select(question, options, default=None):
        """Ask to select from options."""
        for i, opt in enumerate(options, 1):
            print(f"  {i}. {opt}")
        choice = input(f"{question}: ").strip()
        if not choice and default:
            return default
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(options):
                return options[idx]
        except ValueError:
            pass
        return None

# Test
name = Prompt.text("Your name", "Anonymous")
secret = Prompt.password("API Key")
deploy = Prompt.confirm("Deploy to production?", default=False)
env = Prompt.select("Select environment", ["dev", "staging", "prod"], "dev")

print(f"Name: {name}, Env: {env}, Deploy: {deploy}")
```

---

## Bridge to Production

| Our CLI | Click / Clap |
|---------|--------------|
| Simple parsing | Full flag support |
| Manual validation | Auto validation |
| No help generation | Auto --help |
| No completion | Shell completion |
| No progress bar | Rich progress |

**Production systems to study:**
- [Click documentation](https://click.palletsprojects.com/)
- [Command line apps in Rust](https://rust-cli.github.io/book/)
- [Building a CLI in Go](https://flaviocopes.com/go-tutorial-cowsay/)

---

## Checklist

- [ ] Step 1: Argument parser
- [ ] Step 2: Command router
- [ ] Step 3: Styled output
- [ ] Step 4: Interactive prompts
- [ ] Add: shell completion
- [ ] Add: config file support