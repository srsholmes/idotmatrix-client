# CLAUDE.md — src (Frontend)

React frontend for the iDotMatrix Tauri desktop app.

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4

## Structure

```
main.tsx                    Entry point, renders App
App.tsx                     Layout shell: DeviceProvider > Header + Sidebar + MainContent
index.css                   Tailwind imports

lib/
  sidecar.ts                Wraps @tauri-apps/plugin-shell sidecar calls
  types.ts                  TypeScript interfaces matching Rust JSON output
  constants.ts              Panel groups, effect styles, text modes

hooks/
  useDevice.ts              React context: address, size, devices[], busy
  useSidecar.ts             Command execution: loading, error, progress state

components/
  layout/
    Header.tsx              Scan button, device dropdown, size selector, status indicator
    Sidebar.tsx             Navigation panel groups
    MainContent.tsx         Routes activePanel to command components

  commands/                 One component per device feature
    ScreenControl.tsx       On/off, flip, brightness, freeze
    ColorPicker.tsx         Fullscreen solid color
    ImageUpload.tsx         Pick image, preview at device res, upload
    GifUpload.tsx           Pick GIF, preview, upload
    CarouselUpload.tsx      Multi-image animated GIF
    CanvasDrawing.tsx       Pixel art editor with grid
    ClockControl.tsx        Style, color, date, 12h, sync
    CountdownControl.tsx    Start/pause/restart/disable
    ChronographControl.tsx  Start/pause/continue/reset
    ScoreboardControl.tsx   Two scores with +/-
    PixelControl.tsx        Single pixel by coords
    EffectControl.tsx       Style dropdown + 2-7 colors
    SpeedControl.tsx        Speed slider
    TextDisplay.tsx         Message, mode, speed, colors
    PasswordControl.tsx     Number input
    TimeIndicatorControl.tsx  Toggle
    ResetDevice.tsx         Button with confirmation

  shared/
    ColorInput.tsx          Hex color picker
    SliderInput.tsx         Range slider with label
    FileDropZone.tsx        File picker via @tauri-apps/plugin-dialog
    ImagePreview.tsx        Renders base64 GIF at pixelated scale
    CommandOutput.tsx       Loading/error/success display
```

## Key Patterns

- **All device communication goes through `runIdm()` in `sidecar.ts`** — spawns the `idm` sidecar binary with `--json`, parses stdout line-by-line
- **One sidecar at a time** — `useSidecar` uses a `runningRef` to prevent concurrent BLE commands
- **Device context** — `useDevice` provides address, size, and `getBaseArgs()` which returns `["--address", addr]`
- **Each command panel** calls `useSidecar().execute([...getBaseArgs(), "command", ...args])`
- **Progress streaming** — upload commands emit `{"stage":"uploading","chunk":N}` lines, forwarded via `onProgress` callback
- **Canvas export** — draws to offscreen canvas at device resolution, writes PNG to `$TEMP/` via `@tauri-apps/plugin-fs`, uploads via sidecar with `--raw` flag
