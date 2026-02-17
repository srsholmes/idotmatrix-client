# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dual-implementation CLI client for controlling iDotMatrix programmable pixel art LED displays (32x32 and 64x64) over BLE. Ported from the Python community client.

- **TypeScript version** (`src/`) — Complete, uses Bun runtime
- **Rust version** (`rust-cli/`) — Complete, produces a ~3MB standalone binary for Tauri sidecar use

## Reference Repos

- Python client: `/Users/srsholmes/Work/junk/python3-idotmatrix-client`
- Python library: `/Users/srsholmes/Work/junk/python3-idotmatrix-library`

## Commands

### TypeScript

```bash
bun run dev -- <args>        # Run the CLI
bun test                     # Run tests (vitest)
bun run lint                 # Lint with Biome
bun run format               # Format with Biome
```

### Rust

```bash
cd rust-cli
cargo build --release        # Build optimized binary
cargo test                   # Run all 35 tests
cargo run -- <args>          # Run CLI in dev mode
cargo test <test_name>       # Run a single test
```

## Architecture

Both implementations share the same layered architecture:

- **Protocol layer** (`src/protocol/commands/`, `rust-cli/src/protocol/commands/`) — Pure functions that return byte arrays (`Uint8Array`/`Vec<u8>`). No I/O. All commands follow `[length, 0x00, command_id, ...params]` format.
- **Transport layer** (`src/transport/`, `rust-cli/src/transport/`) — BLE abstraction. TypeScript uses `IBLETransport` interface with `NobleTransport` and `MockTransport`. Rust uses `BtleplugTransport`.
- **Imaging layer** (`src/imaging/`, `rust-cli/src/imaging/`) — Image/GIF resize with "contain" fit (aspect-preserving, black padding). TypeScript uses Sharp; Rust uses the `image` crate with manual NeuQuant quantization.
- **CLI layer** (`src/cli/`, `rust-cli/src/cli/`) — Command definitions. TypeScript uses Commander; Rust uses clap with derive macros.

## Critical Protocol Details

- **Images must be sent as GIF format** — the device rejects PNG. Convert images to GIF before creating payloads.
- **GIF encoding must use a 256-color global color table** — the device ignores local color tables. The Rust `image` crate's default GIF encoder produces local palettes; use `color_quant::NeuQuant` + `gif` crate directly.
- **Image/GIF payloads**: 4096-byte data chunks, each with a 16-byte header containing `[length, 0x01, 0x00, flag, total_len, crc32, 0x05, 0x00, 0x0D]`. Flag is `0x00` for first chunk, `0x02` for subsequent.
- **Text packets**: Characters rendered to 16x32 monochrome bitmaps (LSB-first bit packing), separated by `0x05 0xFF 0xFF 0xFF`, with 14-byte metadata and 16-byte header containing CRC32.
- **CRC32**: Unsigned, little-endian, computed over entire file data (images/GIFs) or metadata+bitmaps (text).

## BLE Transport Details

- **BLE writes must be chunked at MTU size** (~509 bytes = 512 MTU - 3 ATT overhead). The device reassembles chunks using the protocol header's length field.
- **Protocol-level chunks** (4096-byte image/GIF data) need 1000ms delay between each, including after the last chunk before disconnect.
- **Simple commands** (<509 bytes) can be sent as a single write without chunking.
- The `btleplug::corebluetooth::internal` disconnect error in Rust is harmless — it's event channel cleanup.

## Tech Stack

| | TypeScript | Rust |
|---|---|---|
| Runtime | Bun | Native binary |
| BLE | @stoprocent/noble | btleplug |
| Image processing | Sharp | image + color_quant + gif crates |
| CLI | Commander | clap |
| Tests | Vitest | cargo test |
| Lint/Format | Biome | — |
| Font rendering | — | ab_glyph (embedded Rain-DRM3.otf) |
