# OpenScreen Automation Skill

Automate OpenScreen (screen recorder) via PowerShell UI automation and keyboard shortcuts.

## App Info

- **Install Path**: `C:\Users\uncom\AppData\Local\Programs\openscreen\Openscreen.exe`
- **Recordings**: `C:\Users\uncom\AppData\Roaming\openscreen\recordings`

## Launch OpenScreen

```powershell
Start-Process "C:\Users\uncom\AppData\Local\Programs\openscreen\Openscreen.exe"
```

## Keyboard Shortcuts

OpenScreen uses these shortcuts (customize in Settings):

| Action | Default Shortcut |
|--------|------------------|
| Start Recording | `Ctrl+Shift+R` |
| Stop Recording | `Ctrl+Shift+R` (same toggle) |
| Pause/Resume | `Ctrl+Shift+P` |
| Cancel Recording | `Escape` |

## PowerShell UI Automation

### Start Recording
```powershell
Add-Type -AssemblyName System.Windows.Forms

# Launch OpenScreen
Start-Process "C:\Users\uncom\AppData\Local\Programs\openscreen\Openscreen.exe"
Start-Sleep -Seconds 3

# Press record shortcut
[System.Windows.Forms.SendKeys]::SendWait("^+r")  # Ctrl+Shift+R
```

### Stop Recording
```powershell
# Press stop shortcut (same as start - toggles)
[System.Windows.Forms.SendKeys]::SendWait("^+r")
Start-Sleep -Seconds 2
```

### Get Latest Recording
```powershell
$recordingsDir = "$env:APPDATA\openscreen\recordings"
$latest = Get-ChildItem $recordingsDir -Filter "*.mp4" | 
          Sort-Object LastWriteTime -Descending | 
          Select-Object -First 1
$latest.FullName
```

## Full Automation Script

```powershell
# record.ps1 - Automated screen recording
param(
    [int]$DurationSeconds = 10,
    [string]$OutputPath = ".\recording.mp4"
)

Add-Type -AssemblyName System.Windows.Forms

# Launch OpenScreen
Write-Host "Launching OpenScreen..."
Start-Process "C:\Users\uncom\AppData\Local\Programs\openscreen\Openscreen.exe"
Start-Sleep -Seconds 3

# Start recording
Write-Host "Starting recording..."
[System.Windows.Forms.SendKeys]::SendWait("^+r")
Start-Sleep -Seconds 1

# Record for specified duration
Write-Host "Recording for $DurationSeconds seconds..."
Start-Sleep -Seconds $DurationSeconds

# Stop recording
Write-Host "Stopping recording..."
[System.Windows.Forms.SendKeys]::SendWait("^+r")
Start-Sleep -Seconds 3

# Get latest recording
$recordingsDir = "$env:APPDATA\openscreen\recordings"
$latest = Get-ChildItem $recordingsDir -Filter "*.mp4" | 
          Sort-Object LastWriteTime -Descending | 
          Select-Object -First 1

if ($latest) {
    Copy-Item $latest.FullName $OutputPath
    Write-Host "Recording saved to: $OutputPath"
} else {
    Write-Host "No recording found"
}
```

## Window Selection

To record a specific window:
1. Launch OpenScreen
2. Click "Select Window" in the UI
3. Click on the target window
4. Press Ctrl+Shift+R to start

## Tips

- Run OpenScreen as Administrator for system audio capture
- Grant screen recording permissions when prompted
- Check Settings > Shortcuts to customize key bindings
- Recordings are saved to `%APPDATA%\openscreen\recordings`
