# iDotMatrix Client

Control iDotMatrix programmable pixel art LED displays (16x16, 32x32, 64x64) over Bluetooth Low Energy.

Includes a **Rust CLI** for direct terminal use and a **Tauri desktop app** with a full GUI.

## Rust CLI

A standalone ~3MB binary with no runtime dependencies.

### Build

```bash
cd rust-cli
cargo build --release
# Binary at rust-cli/target/release/idm
```

### Quick Start

```bash
# Scan for nearby devices
idm scan

# Set device address for all commands
export IDOTMATRIX_ADDRESS=IDM-2E8006
# Or pass it explicitly: idm --address IDM-2E8006 <command>

# Upload an image (auto-resized, supports files and URLs)
idm image upload photo.jpg --size 64
idm image upload https://example.com/pic.jpg --size 32

# Preview resized image locally without uploading
idm image preview photo.jpg --size 64 --output preview.png

# Upload animated GIF
idm gif upload animation.gif --size 64

# Create animated carousel from multiple images
idm carousel upload img1.jpg img2.jpg img3.jpg --size 64 --delay 3000
```

### All Commands

**Screen**
```bash
idm screen on                    # Turn display on
idm screen off                   # Turn display off
idm screen brightness 80         # Set brightness (5-100%)
idm screen flip on               # Flip display 180 degrees
idm screen freeze                # Toggle freeze
```

**Display**
```bash
idm color ff0000                 # Fill screen with solid color
idm pixel 10 20 00ff00           # Set single pixel at (x, y)
idm effect --style 3 ff0000 00ff00 0000ff  # Visual effect with colors
idm speed 128                    # Set animation speed (0-255)
```

**Clock & Timers**
```bash
idm clock set --style 3 --color ff0000   # Set clock mode
idm clock set --12h --no-date            # 12-hour format, no date
idm clock sync                           # Sync device time
idm countdown start -m 5 -s 30          # Start countdown (5m 30s)
idm countdown pause                      # Pause countdown
idm chronograph start                    # Start stopwatch
idm chronograph pause                    # Pause stopwatch
idm scoreboard 42 17                     # Display scoreboard
idm time-indicator on                    # Toggle time indicator
```

**Text**
```bash
idm text "Hello World"                              # Scrolling text
idm text "Alert!" --mode 5 --color ff0000           # Blinking red text
idm text "Smooth" --mode 1 --speed 50 --font-size 24  # Custom scroll
```

Text modes: 0=replace, 1=marquee, 2=reversed, 3=rise, 4=lower, 5=blink, 6=fade, 7=tetris, 8=fill

**Settings**
```bash
idm password 1234                # Set device password
idm reset                        # Reset device to defaults
```

**Flags**
```bash
idm --json scan                  # JSON output (for programmatic use)
idm --verbose screen on          # Debug logging
```

### JSON Mode

Pass `--json` for machine-readable output. Used by the Tauri desktop app.

```bash
idm --json scan
# {"devices":[{"address":"IDM-2E8006","name":"IDM-2E8006","rssi":-57}]}

idm --json --address IDM-2E8006 color ff0000
# {"success":true,"message":"Color set to #ff0000"}

idm --json image preview photo.jpg --size 64
# {"preview":"R0lGODlh...","width":64,"height":64,"bytes":2797,"format":"gif"}
```

## Desktop App (Tauri)

A native desktop GUI built with Tauri v2, React, and Tailwind CSS. The Rust CLI runs as a sidecar binary.

### Prerequisites

- [Bun](https://bun.sh)
- [Rust](https://rustup.rs) (1.88+)

### Setup

```bash
bun install

# Build the sidecar binary
./scripts/build-sidecar.sh
```

### Development

```bash
bun run tauri dev
```

### Build

```bash
bun run tauri build
# Output: macOS .dmg in src-tauri/target/release/bundle/
```

### Features

- Scan and connect to devices
- Screen controls (on/off, brightness, flip, freeze)
- Fullscreen color picker
- Image upload with pixelated preview at device resolution
- Animated GIF upload with preview
- Multi-image carousel with configurable delay
- Pixel art canvas editor (16x16, 32x32, 64x64 grids)
- Clock mode with style, color, and format options
- Countdown timer and stopwatch
- Scoreboard display
- Visual effects with multiple color stops
- Scrolling text with 9 animation modes
- Speed control
- Device reset and password management

## Project Structure

```
rust-cli/           Rust CLI + sidecar binary
  src/
    cli/            Command definitions (clap)
    protocol/       BLE protocol encoding (pure functions)
    transport/      BLE transport layer (btleplug)
    imaging/        Image/GIF resize + quantization
    output.rs       JSON output types
src/                React frontend (Tauri app)
  components/
    layout/         Sidebar, Header, MainContent
    commands/       18 command panel components
    shared/         Reusable widgets
  hooks/            useDevice, useSidecar
  lib/              Sidecar wrapper, types, constants
src-tauri/          Tauri backend
scripts/            Build scripts
```

## Credits

Protocol reverse-engineered by [derkalle4/python3-idotmatrix-client](https://github.com/derkalle4/python3-idotmatrix-client).
