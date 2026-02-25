# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tauri v2 desktop app + Rust CLI for controlling iDotMatrix programmable pixel art LED displays (16x16, 32x32, 64x64) over Bluetooth Low Energy. The Rust CLI doubles as the Tauri sidecar binary.

- **Desktop app** (`src/` + `src-tauri/`) — React frontend, Tauri v2 shell
- **Rust CLI / Sidecar** (`rust-cli/`) — Standalone ~3MB binary with `--json` output mode

## Commands

```bash
# Tauri app
bun install                      # Install frontend deps
npx tauri dev                    # Run app in dev mode
npx tauri build                  # Build .app/.dmg

# Sidecar
./scripts/build-sidecar.sh      # Build rust-cli, copy to src-tauri/binaries/

# Rust CLI
cd rust-cli
cargo build --release            # Build optimized binary
cargo test                       # Run all 35 tests
cargo run -- <args>              # Run CLI in dev mode
cargo run -- --json <cmd>        # JSON output (sidecar mode)
```

## Architecture

### Frontend (`src/`)

React 19 + TypeScript + Vite + Tailwind CSS v4.

- `lib/sidecar.ts` — Wraps `@tauri-apps/plugin-shell`, always passes `--json`, streams stdout line-by-line
- `hooks/useDevice.ts` — Device context (address, size, devices, busy state)
- `hooks/useSidecar.ts` — Command execution hook with loading/error/progress state, `runningRef` prevents concurrent calls
- `components/commands/` — 17 command panels (one per device feature)
- `components/layout/` — Sidebar, Header (scan + device selector + size), MainContent
- `components/shared/` — ColorInput, SliderInput, FileDropZone, ImagePreview, CommandOutput

### Tauri Backend (`src-tauri/`)

Minimal shell — just initializes plugins (shell, dialog, fs). No custom Rust commands; all device communication goes through the sidecar.

- Sidecar scope defined in `capabilities/default.json`, NOT in `plugins.shell`
- FS writes scoped to `$TEMP/**` only (for canvas export)

### Rust CLI / Sidecar (`rust-cli/`)

- `protocol/commands/` — Pure functions returning `Vec<u8>`, no I/O
- `transport/ble.rs` — BtleplugTransport (scan, connect, write, disconnect)
- `imaging/` — Image/GIF resize with NeuQuant quantization + gif crate
- `cli/mod.rs` — clap derive definitions, 19 commands
- `output.rs` — JSON types (ScanOutput, SuccessOutput, PreviewOutput, ProgressOutput, ErrorOutput)
- `main.rs` — Command dispatch, connect/disconnect lifecycle, `safe_disconnect()` ignores harmless macOS errors

### Sidecar JSON Protocol

Frontend passes `--json` on every call. Responses (one JSON object per stdout line):

- Scan: `{"devices":[{"name":"IDM-2E8006","address":"IDM-2E8006","rssi":-57}]}`
- Success: `{"success":true,"message":"Color set to #ff0000"}`
- Preview: `{"preview":"<base64 GIF>","width":64,"height":64,"bytes":2797,"format":"gif"}`
- Progress: `{"stage":"uploading","chunk":1,"total_chunks":3}`
- Error: `{"error":"Connection timeout"}`

## Critical Protocol Details

- **Images sent as GIF** — device rejects PNG. Convert all images to GIF before creating payloads.
- **256-color global color table required** — device ignores local color tables. Use `color_quant::NeuQuant` + `gif` crate directly (not `image` crate's GIF encoder).
- **Payload format**: 4096-byte data chunks, each with 16-byte header containing length, flag, total_len, CRC32, and `[0x05, 0x00, 0x0D]`.
- **CRC32**: Unsigned, little-endian, over entire file data (images/GIFs) or metadata+bitmaps (text).

## BLE Transport Details

- Chunk BLE writes at MTU size (~509 bytes = 512 MTU - 3 ATT overhead)
- 1000ms delay between protocol-level chunks (including after last chunk before disconnect)
- On macOS, `btleplug` disconnect produces a harmless CoreBluetooth event channel error — `safe_disconnect()` handles this
- On macOS, BLE addresses are all zeros — scan returns device name as identifier, connect matches by name

## Tech Stack

| Component | Technology |
|---|---|
| App framework | Tauri v2 |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Sidecar | Rust CLI (`idm`) |
| BLE | btleplug |
| Image processing | image + color_quant + gif crates |
| CLI parsing | clap (derive) |
| Tests | cargo test (35 tests) |
| Plugins | @tauri-apps/plugin-shell, plugin-dialog, plugin-fs |
