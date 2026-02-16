# Rust Rewrite Complexity Analysis — iDotMatrix CLI

## Context

The TypeScript CLI for iDotMatrix is working (image, GIF, carousel, screen control, etc.). The goal is to assess rewriting it in Rust to produce a small standalone binary that can be used as a **Tauri sidecar**. A Bun-compiled binary would include the entire Bun runtime (~50-80MB), whereas a Rust binary would be ~2-5MB stripped.

---

## Current TypeScript Codebase Summary

| Layer | Files | Total Lines | What It Does |
|-------|-------|-------------|--------------|
| Protocol commands | 10 files | ~330 | Byte array builders (trivial logic) |
| BLE transport | 3 files | ~285 | Noble scan/connect/write with chunking |
| Image processing | 3 files | ~80 | Sharp resize + sharp-gif2 carousel |
| CLI commands | 11 files | ~640 | Commander subcommands wiring |
| Utils | 3 files | ~27 | Logger, delay, CRC32 wrapper |
| **Total** | **30 files** | **~1,360 lines** |

---

## Rust Equivalent Dependencies

| TypeScript Dep | Rust Equivalent | Maturity |
|---------------|-----------------|----------|
| `@stoprocent/noble` (BLE) | `btleplug` | Excellent — async, cross-platform (macOS/Linux/Windows) |
| `sharp` (image resize) | `image` crate | Excellent — PNG/JPEG/GIF decode, resize, compose |
| `sharp-gif2` (animated GIF) | `gif` crate (or `image` built-in) | Good — `image` can encode animated GIFs natively |
| `commander` (CLI) | `clap` | Excellent — industry standard |
| `crc-32` | `crc32fast` | Excellent — SIMD-accelerated |

All Rust equivalents are mature and well-maintained. No risky dependencies.

---

## Complexity by Component

### 1. Protocol Commands — Easy
~330 lines of byte array construction. This is the easiest part — it's just `Vec<u8>` building with little-endian writes. Rust is arguably *better* at this than TypeScript (no `DataView` boilerplate, `u32::to_le_bytes()` is cleaner).

**Example — fullscreen color in TS vs Rust:**
```typescript
// TypeScript (9 lines)
export function setFullscreenColor(r: number, g: number, b: number): Uint8Array {
    return new Uint8Array([7, 0, 2, 128, r & 0xff, g & 0xff, b & 0xff]);
}
```
```rust
// Rust (3 lines)
pub fn set_fullscreen_color(r: u8, g: u8, b: u8) -> Vec<u8> {
    vec![7, 0, 2, 128, r, g, b]
}
```

**Estimated effort:** 1-2 hours

### 2. CLI Framework — Easy
11 subcommands with options/arguments. `clap` with derive macros makes this concise. Each subcommand is a struct with `#[derive(Parser)]`.

**Estimated effort:** 2-3 hours

### 3. CRC32 — Trivial
One-liner with `crc32fast::hash()`.

**Estimated effort:** 5 minutes

### 4. Image Processing — Easy-Medium
Need to:
- Load PNG/JPEG/GIF from file or URL
- Resize to 32x32 or 64x64 with `contain` fit + black background
- Output as single-frame GIF

The `image` crate handles all of this. The "contain" fit logic needs manual implementation (calculate scale, resize, paste onto black canvas), but it's ~20 lines.

**Estimated effort:** 2-3 hours

### 5. Animated GIF / Carousel — Medium
Need to:
- Resize multiple images to display size
- Compose into animated GIF with per-frame delays

The `image` crate can encode animated GIFs via `GifEncoder` with frame delays. No extra dependency needed (unlike TS which needed `sharp-gif2`).

**Estimated effort:** 2-3 hours

### 6. HTTP Fetch (URL support) — Easy
`reqwest` with blocking or async. Download image bytes from URL.

**Estimated effort:** 30 minutes

### 7. BLE Transport — Medium-Hard (the main challenge)
This is where most of the complexity lives, same as TypeScript. `btleplug` is async and cross-platform but:
- Scanning with filtering by device name prefix
- Connecting by address or name
- Discovering services/characteristics by UUID
- Writing with chunking (MTU-3 byte chunks, write-with-response)
- Subscribing to notifications
- Timeouts and error handling

`btleplug` has a cleaner API than Noble (proper async/await, no event emitters), so this is actually slightly *easier* than the TypeScript version. The Noble transport is 229 lines; the Rust equivalent would be roughly the same.

**Estimated effort:** 4-6 hours

### 8. Async Runtime — Easy
`btleplug` requires `tokio`. Add `tokio` with `rt` and `macros` features. Standard Rust async boilerplate.

**Estimated effort:** 15 minutes

---

## Overall Assessment

| Metric | Value |
|--------|-------|
| **Difficulty** | **Medium** — no novel problems, all libraries are mature |
| **Estimated total effort** | **2-4 days** (assuming some Rust familiarity) |
| **Lines of Rust (estimated)** | ~1,200-1,500 |
| **Binary size (optimized)** | ~2-5MB stripped |
| **Bun binary comparison** | ~50-80MB |

### What makes it Medium, not Hard:
- The protocol is trivially simple (byte arrays)
- All dependencies have well-documented Rust equivalents
- `btleplug` is actually better than Noble (proper async, cross-platform by default)
- No complex state machines, no concurrency challenges
- The TS codebase is only ~1,360 lines total

### The only real challenge:
**BLE transport** — not because the code is complex, but because BLE is inherently platform-specific and debugging requires a physical device. The same issues we hit with Noble (MTU negotiation, write-with-response, chunking delays) will need to be solved again with `btleplug`, though `btleplug` handles more of this automatically.

---

## Binary Size Optimization

With these `Cargo.toml` settings:
```toml
[profile.release]
opt-level = "z"
lto = "fat"
codegen-units = 1
panic = "abort"
strip = true
```

Expected binary size: **~2-5MB** (vs ~50-80MB for Bun compiled, vs ~0 if run as `bun run` script but requiring Bun installed).

---

## Recommended Rust Dependencies

```toml
[dependencies]
btleplug = "0.11"       # BLE
tokio = { version = "1", features = ["rt", "macros", "time"] }
image = "0.25"           # Image load/resize/GIF encode
clap = { version = "4", features = ["derive"] }
crc32fast = "1"
reqwest = { version = "0.12", features = ["blocking"] }  # URL downloads
log = "0.4"
env_logger = "0.11"
```

---

## Tauri Sidecar Integration

The Rust CLI binary would be invoked by Tauri via `tauri::api::process::Command::new_sidecar()`. The GUI sends commands like:
```
idm --address IDM-2E8006 image upload /tmp/image.png --size 64
idm --address IDM-2E8006 carousel upload img1.png img2.png --delay 5000
idm --address IDM-2E8006 screen --brightness 80
```

Tauri captures stdout/stderr for progress feedback. This keeps BLE entirely in the sidecar process, avoiding conflicts with Tauri's own runtime.

---

## Recommendation

**Go for it.** The rewrite is straightforward — it's a 2-4 day effort with a massive payoff in binary size (2-5MB vs 50-80MB). The protocol layer ports almost 1:1, and `btleplug` is actually a better BLE library than Noble. The existing TypeScript codebase serves as a perfect reference implementation with all the protocol quirks already solved (GIF-not-PNG for image upload, write-with-response, 16-byte headers with CRC32, etc.).

### Suggested implementation order:
1. Protocol commands + CRC32 (~2 hours) — port byte builders, write unit tests
2. CLI framework with clap (~2 hours) — all subcommands stubbed
3. BLE transport with btleplug (~4-6 hours) — scan, connect, write, notifications
4. Image processing + GIF (~3 hours) — resize, contain fit, animated GIF carousel
5. URL download support (~30 min) — reqwest
6. Integration testing (~2-3 hours) — test with real device
7. Binary size optimization (~30 min) — release profile tuning
