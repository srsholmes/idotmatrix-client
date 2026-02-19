#!/usr/bin/env bash
set -euo pipefail

# Build the Rust CLI sidecar and copy to src-tauri/binaries/
# Tauri expects the binary named: idm-{target-triple}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
RUST_DIR="$PROJECT_DIR/rust-cli"
BINARIES_DIR="$PROJECT_DIR/src-tauri/binaries"

# Detect target triple
TARGET_TRIPLE=$(rustc -vV | sed -n 's/host: //p')

echo "Building idm for $TARGET_TRIPLE..."
cd "$RUST_DIR"
cargo build --release

# Copy binary with target triple suffix
mkdir -p "$BINARIES_DIR"
cp "$RUST_DIR/target/release/idm" "$BINARIES_DIR/idm-$TARGET_TRIPLE"

echo "Sidecar binary copied to $BINARIES_DIR/idm-$TARGET_TRIPLE"
ls -lh "$BINARIES_DIR/idm-$TARGET_TRIPLE"
