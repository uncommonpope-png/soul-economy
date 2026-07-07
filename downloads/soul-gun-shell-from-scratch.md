---
name: shell-from-scratch
description: Build a Shell from Scratch
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
---# Build a Shell from Scratch

> *"A shell is just a loop: read → parse → execute → repeat."*

---

## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        SHELL ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User Input                                                     │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  PARSE                                                      │  │
│   │     "ls -la | grep foo > out.txt &"                       │  │
│   │          │                                                 │  │
│   │          ▼                                                 │  │
│   │     [CMD("ls -la"), PIPE, CMD("grep foo"), REDIR, BG]     │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  EXECUTE                                                    │  │
│   │     │                                                      │  │
│   │     ├─► fork() → child: execvp("ls", ["ls", "-la"])      │  │
│   │     │                                                      │  │
│   │     ├─► pipe() → connect stdout to next stdin            │  │
│   │     │                                                      │  │
│   │     └─► wait() → collect exit status                     │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   Output                                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Build Steps (4 Steps, ~80 Lines)

### Step 1: The REPL (15 lines)

```python
"""Step 1: Simple REPL - read and print."""
import sys

def main():
    print("minishell - type 'exit' to quit")

    while True:
        try:
            line = input("minishell> ").strip()
            if not line:
                continue

            if line == "exit":
                print("Goodbye!")
                break

            # Echo for now
            print(f"You entered: {line}")

        except EOFError:
            print("\nGoodbye!")
            break

if __name__ == "__main__":
    main()
```

---

### Step 2: Add Command Execution (20 lines)

```python
"""Step 2: Execute external commands using subprocess."""
import subprocess
import shlex

def parse_line(line):
    """Split into command and args."""
    return shlex.split(line)

def execute(cmd):
    """Run a single command."""
    args = parse_line(cmd)
    if not args:
        return

    # Built-in: exit
    if args[0] == "exit":
        return False  # Signal to exit

    if args[0] == "cd":
        import os
        os.chdir(args[1] if len(args) > 1 else os.path.expanduser("~"))
        return True

    # External command
    try:
        result = subprocess.run(args, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, end="", file=sys.stderr)
    except FileNotFoundError:
        print(f"Command not found: {args[0]}", file=sys.stderr)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

    return True

def main():
    while True:
        try:
            line = input("minishell> ").strip()
            if not line:
                continue

            if not execute(line):
                break

        except KeyboardInterrupt:
            print("^C")
        except EOFError:
            print("\nBye!")
            break

if __name__ == "__main__":
    main()
```

**Test it:**
```bash
python shell2.py
minishell> ls -la
minishell> pwd
minishell> cd /tmp
minishell> exit
```

---

### Step 3: Add Fork/Exec (25 lines, C-style in Python)

```python
"""Step 3: Implement actual fork/exec using os.fork and os.execvp."""
import os
import subprocess
import shlex
import signal

class MiniShell:
    def __init__(self):
        self.running = []

    def parse_pipeline(self, line):
        """Parse into commands for pipeline."""
        commands = []
        for part in line.split("|"):
            args = shlex.split(part.strip())
            if args:
                commands.append(args)
        return commands

    def execute(self, line):
        """Execute a pipeline of commands."""
        commands = self.parse_pipeline(line)
        if not commands:
            return True

        if commands[0][0] == "exit":
            return False

        if commands[0][0] == "cd":
            os.chdir(commands[0][1] if len(commands[0]) > 1 else os.path.expanduser("~"))
            return True

        # Build pipeline
        num_cmds = len(commands)
        pipes = [os.pipe() for _ in range(num_cmds - 1)]

        pids = []
        for i, cmd in enumerate(commands):
            pid = os.fork()
            if pid == 0:
                # Child
                if i > 0:
                    os.dup2(pipes[i-1][0], 0)  # stdin from prev
                if i < num_cmds - 1:
                    os.dup2(pipes[i][1], 1)  # stdout to next

                for p in pipes:
                    os.close(p[0])
                    os.close(p[1])

                try:
                    os.execvp(cmd[0], cmd)
                except FileNotFoundError:
                    os._exit(127)

            pids.append(pid)

        # Parent: close pipes and wait
        for p in pipes:
            os.close(p[0])
            os.close(p[1])

        for pid in pids:
            os.waitpid(pid, 0)

        return True

def main():
    shell = MiniShell()
    while True:
        try:
            line = input("minishell> ").strip()
            if not line:
                continue
            if not shell.execute(line):
                break
        except KeyboardInterrupt:
            print("^C")
        except EOFError:
            break

if __name__ == "__main__":
    main()
```

**Test it:**
```bash
python shell3.py
minishell> echo hello world
hello world
minishell> cat /etc/passwd | grep root
root:x:0:0:root:/root:/bin/bash
minishell> exit
```

---

### Step 4: Add Background Jobs & Job Control (20 lines)

```python
"""Step 4: Add job control - background jobs, fg, jobs."""

import os
import signal

class Job:
    def __init__(self, jid, pid, cmd):
        self.jid = jid
        self.pid = pid
        self.cmd = cmd
        self.completed = False

class ShellWithJobs:
    def __init__(self):
        self.jobs = []
        self.next_jid = 1

    def run(self, cmd, background=False):
        pid = os.fork()
        if pid == 0:
            os.execvp(cmd[0], cmd)
            os._exit(127)

        if background:
            job = Job(self.next_jid, pid, cmd)
            self.jobs.append(job)
            self.next_jid += 1
            print(f"[{job.jid}] {pid}")
        else:
            os.waitpid(pid, 0)

    def list_jobs(self):
        for job in self.jobs:
            pid, status = os.waitpid(job.pid, os.WNOHANG)
            if pid == 0:
                print(f"[{job.jid}] Running: {' '.join(job.cmd)}")
            else:
                print(f"[{job.jid}] Done")

    def wait_job(self, jid):
        for job in self.jobs:
            if job.jid == jid:
                os.waitpid(job.pid, 0)
                job.completed = True

# Test
shell = ShellWithJobs()
shell.run(["sleep", "5"], background=True)  # Background job
shell.list_jobs()
shell.wait_job(1)  # Wait for job 1
```

---

### Step 5: Redirections (>, <, 2>)

```python
"""Step 5: Add I/O redirections."""

import os

class ShellWithRedirections:
    def __init__(self):
        self.jobs = []

    def parse_redirections(self, args):
        """Parse command with redirections: cmd > out.txt 2> err.txt < in.txt"""
        stdin_redirect = None
        stdout_redirect = None
        stderr_redirect = None

        filtered = []
        i = 0
        while i < len(args):
            if args[i] == '>':
                stdout_redirect = args[i + 1]
                i += 2
            elif args[i] == '2>':
                stderr_redirect = args[i + 1]
                i += 2
            elif args[i] == '<':
                stdin_redirect = args[i + 1]
                i += 2
            else:
                filtered.append(args[i])
                i += 1

        return filtered, stdin_redirect, stdout_redirect, stderr_redirect

    def execute_with_redir(self, args):
        """Execute command with redirections."""
        args, stdin_file, stdout_file, stderr_file = self.parse_redirections(args)
        if not args or args[0] == "exit":
            return False

        if args[0] == "cd":
            os.chdir(args[1] if len(args) > 1 else os.path.expanduser("~"))
            return True

        pid = os.fork()
        if pid == 0:
            # Handle stdin redirect
            if stdin_file:
                fd = os.open(stdin_file, os.O_RDONLY)
                os.dup2(fd, 0)
                os.close(fd)

            # Handle stdout redirect
            if stdout_file:
                fd = os.open(stdout_file, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
                os.dup2(fd, 1)
                os.close(fd)

            # Handle stderr redirect
            if stderr_file:
                fd = os.open(stderr_file, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
                os.dup2(fd, 2)
                os.close(fd)

            os.execvp(args[0], args)
            os._exit(127)

        os.waitpid(pid, 0)
        return True

# Test
# echo hello > /tmp/out.txt
# grep foo < /tmp/in.txt > /tmp/out.txt 2> /tmp/err.txt
```

---

## Bridge to Production

| Our minishell | bash/zsh |
|---------------|----------|
| Basic pipes | Complex redirections, here-docs |
| No job control | fg, bg, jobs, Ctrl+Z |
| No completion | Tab completion |
| No history | History, search |
| No aliases | Alias system |
| No globbing | *, ?, [] expansion |

**Production systems to study:**
- [Write a Shell in C](https://brennan.io/2015/01/16/write-a-shell-in-c/) - The classic
- [Let's build a shell](https://github.com/kamalmarhubi/shell-workshop)

---

## Checklist
- [ ] Step 1: REPL works
- [ ] Step 2: External commands execute
- [ ] Step 3: Pipes work (cmd1 | cmd2)
- [ ] Step 4: Background jobs work
- [ ] Step 5: Redirections (> < 2>)
- [ ] Add: environment variables
- [ ] Add: tab completion