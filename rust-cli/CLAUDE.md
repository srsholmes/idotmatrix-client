# CLAUDE.md — rust-cli

Rust CLI and Tauri sidecar binary for iDotMatrix LED displays.

## Commands

```bash
cargo build --release        # Build optimized binary (~3MB)
cargo test                   # Run all 35 tests
cargo run -- <args>          # Run in dev mode
cargo run -- --json <cmd>    # JSON output for sidecar use
```

## Structure

```
src/
  main.rs               Command dispatch, connect/disconnect lifecycle
  output.rs             JSON output types (Serialize structs + print helpers)
  cli/mod.rs            clap derive definitions (19 commands)
  protocol/
    commands/            Pure functions returning Vec<u8> — no I/O
      chronograph.rs, clock.rs, common.rs, countdown.rs,
      effect.rs, fullscreen_color.rs, gif.rs, graffiti.rs,
      image.rs, scoreboard.rs, text.rs
    constants.rs         UUIDs, delays, device name prefix
    types.rs             Color, DiscoveredDevice (with Serialize)
  transport/
    ble.rs               BtleplugTransport (scan, connect, write, disconnect)
  imaging/
    mod.rs               URL detection, async fetch_image()
    resize.rs            resize_image_to_gif, resize_gif, create_carousel (NeuQuant + gif crate)
```

## Key Design Decisions

- **Protocol commands are pure functions** — take params, return `Vec<u8>`. No network, no state. Easy to test.
- **`--json` flag** — global clap flag. When set, all output goes to stdout as one-JSON-per-line. stderr gets debug logs. Frontend parses stdout.
- **`safe_disconnect()`** — ignores btleplug disconnect errors (harmless on macOS CoreBluetooth). Prevents the disconnect error from poisoning JSON output after a successful command.
- **macOS BLE addresses** — CoreBluetooth reports `00:00:00:00:00:00` for all devices. Scan returns the device name as the identifier. Connect matches by name.
- **async `fetch_image()`** — uses async reqwest (not blocking) to avoid tokio runtime panic.

## Protocol Notes

- All commands: `[length_u16_le, 0x00, command_id, ...params]`
- Images/GIFs must be GIF format with 256-color global color table (device rejects PNG and local color tables)
- Image payload: 4096-byte data chunks, 16-byte header with `[length, 0x01, 0x00, flag, total_len, crc32, 0x05, 0x00, 0x0D]`
- Text: characters rendered to 16x32 monochrome bitmaps (LSB-first), separated by `0x05 0xFF 0xFF 0xFF`
- BLE writes chunked at 509 bytes (MTU 512 - 3 ATT overhead), 1000ms delay between protocol chunks

## Dependencies

| Crate | Purpose |
|---|---|
| btleplug | BLE communication |
| clap | CLI argument parsing |
| image | Image decoding/resizing |
| color_quant | NeuQuant quantization for 256-color GIF |
| gif | GIF encoding with global color table |
| reqwest | HTTP image download (async) |
| serde + serde_json | JSON output serialization |
| base64 | Preview image encoding |
| crc32fast | CRC32 for protocol headers |
| ab_glyph | Font rendering for text command |
| chrono | Time sync |
