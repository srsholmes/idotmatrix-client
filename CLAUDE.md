# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tauri v2 desktop app for controlling iDotMatrix programmable pixel art LED displays (16x16, 32x32, and 64x64) over BLE. The Rust CLI serves as a sidecar binary.

- **Tauri app** (`src/` + `src-tauri/`) — React frontend with Rust sidecar
- **Rust CLI / Sidecar** (`rust-cli/`) — Complete, ~3MB binary, supports `--json` output

## Reference Repos

- Python client: `/Users/srsholmes/Work/junk/python3-idotmatrix-client`
- Python library: `/Users/srsholmes/Work/junk/python3-idotmatrix-library`
- Predecessor CLI: `/Users/srsholmes/Work/junk/idotmatrix`

## Commands

### Tauri App

```bash
bun install                  # Install frontend dependencies
bun run dev                  # Start Vite dev server (port 1420)
bun run build                # Build frontend for production
npx tauri dev                # Run Tauri app in dev mode
npx tauri build              # Build .app/.dmg
```

### Sidecar Build

```bash
./scripts/build-sidecar.sh   # Build rust-cli and copy to src-tauri/binaries/
```

### Rust CLI

```bash
cd rust-cli
cargo build --release        # Build optimized binary
cargo test                   # Run all 35 tests
cargo run -- <args>          # Run CLI in dev mode
cargo run -- --json <cmd>    # JSON output mode (for sidecar use)
```

## Architecture

### Frontend (src/)

- **React + TypeScript + Vite + Tailwind CSS v4**
- `src/lib/sidecar.ts` — Wraps `@tauri-apps/plugin-shell` sidecar calls, always passes `--json`
- `src/hooks/useDevice.ts` — Device context (address, size, busy state)
- `src/hooks/useSidecar.ts` — Hook for executing sidecar commands with loading/error state
- `src/components/commands/` — One component per device command (18 panels)
- `src/components/layout/` — Sidebar, Header, MainContent
- `src/components/shared/` — Reusable widgets (ColorInput, SliderInput, ImagePreview, etc.)

### Rust CLI / Sidecar (rust-cli/)

- **Protocol layer** (`src/protocol/commands/`) — Pure functions returning `Vec<u8>`
- **Transport layer** (`src/transport/`) — BtleplugTransport for BLE
- **Imaging layer** (`src/imaging/`) — Image/GIF resize with NeuQuant quantization
- **CLI layer** (`src/cli/`) — clap derive macros
- **Output layer** (`src/output.rs`) — JSON serialization types for `--json` mode

### Sidecar JSON Protocol

All sidecar calls use `--json` flag. Response types:
- Scan: `{"devices":[{"name":"...","address":"...","rssi":-45}]}`
- Success: `{"success":true,"message":"Screen on"}`
- Preview: `{"preview":"<base64>","width":64,"height":64,"bytes":2984,"format":"gif"}`
- Progress: `{"stage":"uploading","chunk":1,"total_chunks":3}`
- Error: `{"error":"Connection timeout"}`

## Critical Protocol Details

- **Images must be sent as GIF format** — the device rejects PNG
- **GIF encoding must use a 256-color global color table** — use NeuQuant + gif crate
- **Image/GIF payloads**: 4096-byte data chunks with 16-byte headers
- **CRC32**: Unsigned, little-endian

## BLE Transport Details

- **BLE writes chunked at MTU size** (~509 bytes)
- **1000ms delay** between protocol chunks (including last before disconnect)
- The `btleplug::corebluetooth::internal` disconnect error is harmless

## Tech Stack

| Component | Technology |
|---|---|
| App framework | Tauri v2 |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Sidecar | Rust CLI (`idm`) |
| BLE | btleplug (in sidecar) |
| Image processing | image + color_quant + gif crates |
| CLI | clap (derive) |
| Tests | cargo test (35 tests) |
| File dialog | @tauri-apps/plugin-dialog |
| Sidecar invocation | @tauri-apps/plugin-shell |
| File I/O | @tauri-apps/plugin-fs |
