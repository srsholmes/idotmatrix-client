# idm - iDotMatrix CLI Client

TypeScript CLI for controlling iDotMatrix programmable pixel art LED displays (32x32 and 64x64) over Bluetooth Low Energy.

## Install

Requires [Bun](https://bun.sh) runtime.

```bash
bun install
```

## Usage

```bash
# Scan for nearby devices
bun run src/index.ts scan

# Set device address for all commands (or use IDOTMATRIX_ADDRESS env var)
export IDOTMATRIX_ADDRESS=AA:BB:CC:DD:EE:FF

# Upload an image (auto-resized to 32x32)
bun run src/index.ts image upload photo.jpg --size 32

# Upload to 64x64 display
bun run src/index.ts image upload artwork.png --size 64

# Preview pixelated result without uploading
bun run src/index.ts image preview photo.jpg --size 32 --output preview.png

# Upload animated GIF
bun run src/index.ts gif upload animation.gif --size 32

# Screen controls
bun run src/index.ts screen on
bun run src/index.ts screen off
bun run src/index.ts screen brightness 80
bun run src/index.ts screen flip
bun run src/index.ts screen freeze

# Clock mode
bun run src/index.ts clock set --style 3 --color ff0000
bun run src/index.ts clock sync

# Countdown timer
bun run src/index.ts countdown start -m 5 -s 30

# Stopwatch
bun run src/index.ts chronograph start

# Scoreboard
bun run src/index.ts scoreboard 42 17

# Solid color fill
bun run src/index.ts color ff0000

# Set individual pixel
bun run src/index.ts pixel 10 20 00ff00

# Reset device
bun run src/index.ts reset
```

## Development

```bash
bun test          # Run tests
bun run lint      # Lint with Biome
bun run format    # Format with Biome
```

## Credits

Protocol reverse-engineered by [derkalle4/python3-idotmatrix-client](https://github.com/derkalle4/python3-idotmatrix-client).
