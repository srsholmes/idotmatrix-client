# iDotMatrix TypeScript Client - Implementation Plan

## Status

### Completed
- [x] Phase 1: Project setup, deps, config (bun, tsconfig, biome, vitest)
- [x] Phase 2: All protocol command builders ported from Python reference
- [x] Phase 2: Transport layer (IBLETransport interface, NobleTransport, MockTransport)
- [x] Phase 2: CLI with all subcommands (scan, screen, image, gif, clock, countdown, chronograph, scoreboard, color, pixel, reset)
- [x] Phase 3: Image processing with Sharp (resize, PNG encoding)
- [x] Phase 4: GIF processing with Sharp (animated resize, re-encoding)
- [x] Unit tests: 44 tests passing across 11 test files

### Remaining
- [ ] Phase 5: Text bitmap rendering (needs bitmap font or opentype.js)
- [ ] Phase 5: Error handling polish, retry logic
- [ ] Phase 5: `bun build --compile` testing
- [ ] Phase 6 (Future): Tauri GUI

## Architecture

```
src/
  index.ts                          # CLI entry point
  cli/
    index.ts                        # Commander setup + subcommand registration
    commands/                       # One file per CLI command
  protocol/
    constants.ts                    # UUIDs, chunk sizes, device prefix
    types.ts                        # Shared types
    commands/                       # Pure byte-encoding functions (no I/O)
  transport/
    types.ts                        # IBLETransport interface
    noble-transport.ts              # @stoprocent/noble implementation
    mock-transport.ts               # Mock for testing
  imaging/
    resize.ts                       # Sharp-based image resizing
    png.ts                          # PNG loading
    gif.ts                          # GIF frame processing
  utils/
    logger.ts, delay.ts, crc32.ts
tests/
  protocol/                        # 44 unit tests for all command byte outputs
```

## BLE Protocol Reference

See Python reference library at `/Users/srsholmes/Work/junk/python3-idotmatrix-library/` for original implementation.

Key characteristics:
- Write: `0000fa02-0000-1000-8000-00805f9b34fb`
- Read: `0000fa03-0000-1000-8000-00805f9b34fb`
- Device name prefix: `IDM-`
