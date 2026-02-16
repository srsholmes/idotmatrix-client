# iDotMatrix TypeScript Client

## Project Overview
TypeScript CLI client for controlling iDotMatrix programmable pixel art LED displays (32x32 and 64x64) over BLE. Port of the Python community client.

## Reference Repos
- Python client: `/Users/srsholmes/Work/junk/python3-idotmatrix-client`
- Python library: `/Users/srsholmes/Work/junk/python3-idotmatrix-library`

## Tech Stack
- Runtime: Bun
- BLE: @stoprocent/noble
- Image processing: Sharp
- CLI: Commander
- Tests: Vitest
- Lint/Format: Biome

## Commands
- `bun run dev` — Run the CLI
- `bun test` — Run tests (vitest)
- `bun run lint` — Lint with Biome
- `bun run format` — Format with Biome

## Architecture
- `src/protocol/` — Pure byte-encoding functions, no I/O
- `src/transport/` — BLE abstraction (IBLETransport interface)
- `src/imaging/` — Sharp-based image/GIF processing
- `src/cli/` — Commander CLI commands
- `src/utils/` — Logger, delay, CRC32 helpers
