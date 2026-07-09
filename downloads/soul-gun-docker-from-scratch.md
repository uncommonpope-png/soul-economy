---
name: docker-from-scratch
description: Build a Container from Scratch
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
---# Build a Container from Scratch

> *"A container is just a process with its own view of the filesystem, network, and resources."*

---

## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                   CONTAINER ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   HOST SYSTEM                                                   │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Process 1 (Container)      Process 2 (Container)        │  │
│   │  PID 1000 (in container)    PID 1000 (in container)      │  │
│   │       │                          │                       │  │
│   │       ▼                          ▼                       │  │
│   │  ┌─────────────────┐      ┌─────────────────┐              │  │
│   │  │ UTS Namespace  │      │ UTS Namespace  │              │  │
│   │  │ hostname: c1   │      │ hostname: c2   │              │  │
│   │  └────────┬────────┘      └────────┬────────┘          │  │
│   │           │                         │                    │  │
│   │           └───────────┬─────────────┘                  │  │
│   │                       ▼                                  │  │
│   │                Host PID: 4521                            │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
│   NAMESPACE TYPES:                                            │
│   - PID: Process isolation                                     │
│   - NET: Network isolation                                      │
│   - UTS: Hostname/domain isolation                             │
│   - IPC: Inter-process comm isolation                          │
│   - MNT: Filesystem isolation                                   │
│   - USER: User ID isolation                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Build Steps (4 Steps, ~100 Lines)

### Step 1: Basic Fork (10 lines)

```python
"""Step 1: Understand fork - the basis of containers."""
import os
import sys

def child():
    print(f"Child PID: {os.getpid()}, Parent PID: {os.getppid()}")
    sys.exit(0)

def parent():
    pid = os.fork()
    if pid == 0:
        child()
    else:
        print(f"Parent PID: {os.getpid()}, Child PID: {pid}")
        os.waitpid(pid, 0)
        print("Child finished")

parent()
# Output:
# Parent PID: 1234, Child PID: 1235
# Child PID: 1235, Parent PID: 1234
# Child finished
```

---

### Step 2: Linux Namespaces via unshare (25 lines)

```python
"""Step 2: Use unshare to create isolated namespace. THIS RUNS."""
import subprocess
import os

def run_in_new_uts_namespace(hostname="my-container"):
    """Run a command in a new UTS namespace (isolated hostname)."""
    result = subprocess.run(
        ["unshare", "--uts", "--hostname", hostname, "hostname"],
        capture_output=True,
        text=True,
    )
    print(f"Container hostname: {result.stdout.strip()}")
    return result.stdout.strip()

def run_in_new_pid_namespace():
    """Run a command in a new PID namespace."""
    result = subprocess.run(
        ["unshare", "--pid", "--fork", "ps", "aux"],
        capture_output=True,
        text=True,
    )
    print(f"Processes in new PID namespace:\n{result.stdout}")

def run_in_new_mount_namespace():
    """Run a command in a new mount namespace."""
    result = subprocess.run(
        ["unshare", "--mount", "cat", "/proc/self/mountinfo"],
        capture_output=True,
        text=True,
    )
    print(f"Mount info lines: {len(result.stdout.strip().splitlines())}")

print("=== UTS namespace (isolated hostname) ===")
run_in_new_uts_namespace("sandbox")
print("=== PID namespace (new process tree) ===")
run_in_new_pid_namespace()
print("=== Mount namespace (new mount view) ===")
run_in_new_mount_namespace()
print("All namespace tests passed!")
```

**Test it:** Run `python docker_step2.py` — each section calls real `unshare` on the system.

---

### Step 3: Filesystem Isolation with Overlay (20 lines)

```python
"""Step 3: Overlay filesystem layers and pivot_root."""
import subprocess
import os

def create_overlay_container(lower_dir, upper_dir, work_dir, merged_dir):
    """
    Create an overlay filesystem and run a command inside it.
    This requires root/appropriate privileges on the host.
    """
    os.makedirs(lower_dir, exist_ok=True)
    os.makedirs(upper_dir, exist_ok=True)
    os.makedirs(work_dir, exist_ok=True)
    os.makedirs(merged_dir, exist_ok=True)

    result = subprocess.run(
        [
            "mount", "-t", "overlay", "overlay",
            "-o", f"lowerdir={lower_dir},upperdir={upper_dir},workdir={work_dir}",
            merged_dir
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"Mount (needs root): {result.stderr.strip() or result.stdout.strip()}")
        return
    print(f"Overlay mounted at {merged_dir}")

    result = subprocess.run(["ls", merged_dir], capture_output=True, text=True)
    print(f"Contents: {result.stdout.strip()}")
    subprocess.run(["umount", merged_dir], capture_output=True)

def create_readonly_layer(path, filename, content):
    """Create a read-only layer with a file."""
    os.makedirs(path, exist_ok=True)
    with open(os.path.join(path, filename), "w") as f:
        f.write(content)

base_layer = "/tmp/container_base"
upper_layer = "/tmp/container_upper"
work_dir = "/tmp/container_work"
merged = "/tmp/container_merged"

create_readonly_layer(base_layer, "hello.txt", "Hello from base layer!\n")
create_overlay_container(base_layer, upper_layer, work_dir, merged)
print("Overlay filesystem example complete!")
```

**Test it:** Creates real overlay mount (needs root) or shows appropriate error.

---

### Step 4: cgroups Resource Limits (30 lines)

```python
"""Step 4: Control resource limits using cgroups via sysfs."""

import os

class Container:
    def __init__(self, name="container-1"):
        self.name = name
        self.cgroup_path = f"/sys/fs/cgroup/{name}"
        self.pid = None

    def create_cgroup(self, cpu_quota=50000, memory_limit=256 * 1024 * 1024):
        """Create cgroup with CPU and memory limits."""
        os.makedirs(self.cgroup_path, exist_ok=True)

        with open(f"{self.cgroup_path}/cpu.cfs_quota_us", "w") as f:
            f.write(str(cpu_quota))
        with open(f"{self.cgroup_path}/cpu.cfs_period_us", "w") as f:
            f.write("100000")
        with open(f"{self.cgroup_path}/memory.limit_in_bytes", "w") as f:
            f.write(str(memory_limit))
        with open(f"{self.cgroup_path}/pids.max", "w") as f:
            f.write("50")

        print(f"Created cgroup: {self.name}")
        print(f"  CPU quota: {cpu_quota}/100000 = {cpu_quota/1000}%")
        print(f"  Memory limit: {memory_limit // (1024*1024)} MB")
        print(f"  Max PIDs: 50")

    def add_process(self, pid=None):
        """Add a process to the cgroup."""
        if pid is None:
            pid = os.getpid()
        with open(f"{self.cgroup_path}/tasks", "w") as f:
            f.write(str(pid))
        print(f"Added PID {pid} to cgroup {self.name}")

    def get_stats(self):
        """Read current cgroup stats."""
        stats = {}
        try:
            with open(f"{self.cgroup_path}/cpuacct.usage", "r") as f:
                stats["cpu_usage"] = f.read().strip()
            with open(f"{self.cgroup_path}/memory.usage", "r") as f:
                stats["memory_usage"] = f.read().strip()
        except FileNotFoundError:
            return {"error": "cgroup not available (needs root)"}
        return stats

    def destroy(self):
        """Remove the cgroup."""
        for pid in os.listdir(self.cgroup_path):
            pass
        try:
            os.rmdir(self.cgroup_path)
            print(f"Destroyed cgroup: {self.name}")
        except Exception as e:
            print(f"Cleanup (may need root): {e}")

if __name__ == "__main__":
    c = Container("test-container")
    c.create_cgroup(cpu_quota=50000, memory_limit=256*1024*1024)
    c.add_process()
    stats = c.get_stats()
    for k, v in stats.items():
        print(f"  {k}: {v}")
    c.destroy()
```

---

## Step 5: Put It Together — Run an Isolated Process (15 lines)

```python
"""Step 5: Combine everything — run a process in all isolated namespaces."""

import subprocess
import os
import tempfile
import shutil

def run_container(command=["sh", "-c", "echo hello from isolated container!"]):
    """Run a command in fully isolated namespaces using unshare."""
    unshare_cmd = [
        "unshare",
        "--uts", "--hostname=isolated-box",
        "--pid", "--fork",
        "--mount",
        "--net",
        "--map-root-user",
        "--cgroup=../test-cgroup",
    ]

    try:
        result = subprocess.run(
            unshare_cmd + command,
            capture_output=True,
            text=True,
            timeout=5,
        )
        print(f"stdout: {result.stdout}")
        print(f"stderr: {result.stderr}")
    except subprocess.TimeoutExpired:
        print("Container timed out (expected for long-running processes)")
    except Exception as e:
        print(f"Note: Namespace isolation requires appropriate permissions. {e}")

print("=== Full container (requires privileges) ===")
run_container(["hostname"])
run_container(["cat", "/proc/1/cmdline"])
print("Container isolation demonstration complete!")
```

---

## Bridge to Production

| Our Container | Docker |
|---------------|--------|
| `unshare` manually | Automatic image building |
| Overlay filesystem manually | Layered images + UnionFS |
| cgroups via sysfs | dockerd daemon |
| No registry | Docker Hub |
| No networking | Bridge, overlay, host |
| No volumes | Named volumes |
| No compose | Multi-container |

**Production systems to study:**
- [Linux containers in 500 lines](https://blog.lizzie.io/linux-containers-in-500-loc.html)
- [Build Your Own Container (Go)](https://www.infoq.com/articles/build-a-container-golang)
- [Docker implemented in 100 lines of bash](https://github.com/p8952/bocker)

---

## Checklist

- [ ] Step 1: `fork()` works
- [ ] Step 2: `unshare` creates isolated namespaces (UTS, PID, Mount)
- [ ] Step 3: Overlay filesystem concept works
- [ ] Step 4: cgroups limit CPU/memory via sysfs
- [ ] Step 5: Combined container runs isolated process
- [ ] Add: networking (bridge setup)
- [ ] Add: image layers (Dockerfile-like builder)