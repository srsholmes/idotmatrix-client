# CLAUDE.md — src-tauri (Tauri Backend)

Tauri v2 backend shell. Minimal — no custom Rust commands. All device communication goes through the sidecar binary.

## Structure

```
src/
  main.rs                   Desktop entry point
  lib.rs                    Plugin init: shell, dialog, fs
Cargo.toml                  Tauri + plugin dependencies
tauri.conf.json             App config, sidecar in bundle.externalBin
build.rs                    Tauri build script
capabilities/
  default.json              Permission scopes for sidecar, dialog, fs
icons/                      App icons (generated via `npx tauri icon`)
binaries/
  idm-{target-triple}       Sidecar binary (built by scripts/build-sidecar.sh)
```

## Configuration

### tauri.conf.json

- `bundle.externalBin: ["binaries/idm"]` — declares the sidecar
- `plugins.shell.open: true` — enables shell open (sidecar scope is in capabilities, NOT here)
- `build.devUrl: "http://localhost:1420"` — Vite dev server
- `identifier: "com.idotmatrix.controller"`

### capabilities/default.json

Permissions:
- `shell:allow-execute` + `shell:allow-spawn` — scoped to `binaries/idm` sidecar with `args: true`
- `shell:allow-stdin-write` — for potential future stdin use
- `dialog:allow-open` + `dialog:allow-save` — native file pickers
- `fs:allow-write-file` + `fs:allow-exists` — scoped to `$TEMP/**` (canvas PNG export)

### Important: Tauri v2 Scope Placement

In Tauri v2, sidecar scopes go in `capabilities/default.json` under each permission's `allow` array. Do NOT put scope config in `plugins.shell` in `tauri.conf.json` — that causes `"unknown field 'scope'"` errors.

## Plugins

| Plugin | Purpose |
|---|---|
| tauri-plugin-shell | Sidecar invocation (spawn + stdout/stderr streaming) |
| tauri-plugin-dialog | Native file open/save dialogs |
| tauri-plugin-fs | Write canvas PNG to temp directory |

## Sidecar Binary

The sidecar binary must be at `binaries/idm-{target-triple}` (e.g. `idm-aarch64-apple-darwin`).

Build and copy with:
```bash
./scripts/build-sidecar.sh
```

Or manually:
```bash
cd rust-cli && cargo build --release
cp target/release/idm ../src-tauri/binaries/idm-aarch64-apple-darwin
```
