export const EFFECT_STYLES = [
  { value: 0, label: "Horizontal Rainbow" },
  { value: 1, label: "Random Pixels" },
  { value: 2, label: "Random White" },
  { value: 3, label: "Vertical Rainbow" },
  { value: 4, label: "Diagonal Right" },
  { value: 5, label: "Diagonal Left" },
  { value: 6, label: "Random Colored" },
] as const;

export const TEXT_MODES = [
  { value: 0, label: "Replace" },
  { value: 1, label: "Marquee" },
  { value: 2, label: "Reversed" },
  { value: 3, label: "Rise" },
  { value: 4, label: "Lower" },
  { value: 5, label: "Blink" },
  { value: 6, label: "Fade" },
  { value: 7, label: "Tetris" },
  { value: 8, label: "Fill" },
] as const;

export const TEXT_COLOR_MODES = [
  { value: 0, label: "White" },
  { value: 1, label: "Custom" },
  { value: 2, label: "Rainbow 1" },
  { value: 3, label: "Rainbow 2" },
  { value: 4, label: "Rainbow 3" },
  { value: 5, label: "Rainbow 4" },
] as const;

export const CLOCK_STYLES = [
  { value: 0, label: "Style 0" },
  { value: 1, label: "Style 1" },
  { value: 2, label: "Style 2" },
  { value: 3, label: "Style 3" },
  { value: 4, label: "Style 4" },
  { value: 5, label: "Style 5" },
  { value: 6, label: "Style 6" },
  { value: 7, label: "Style 7" },
] as const;

export const PANEL_GROUPS = [
  {
    label: "Device",
    items: [
      { id: "screen", label: "Screen" },
    ],
  },
  {
    label: "Display",
    items: [
      { id: "color", label: "Color" },
      { id: "clock", label: "Clock" },
      { id: "effect", label: "Effect" },
    ],
  },
  {
    label: "Media",
    items: [
      { id: "image", label: "Image" },
      { id: "gif", label: "GIF" },
      { id: "carousel", label: "Carousel" },
      { id: "canvas", label: "Canvas" },
    ],
  },
  {
    label: "Tools",
    items: [
      { id: "text", label: "Text" },
      { id: "countdown", label: "Countdown" },
      { id: "chronograph", label: "Chronograph" },
      { id: "scoreboard", label: "Scoreboard" },
      { id: "pixel", label: "Pixel" },
    ],
  },
  {
    label: "Settings",
    items: [
      { id: "speed", label: "Speed" },
      { id: "password", label: "Password" },
      { id: "time-indicator", label: "Time Indicator" },
      { id: "reset", label: "Reset" },
    ],
  },
] as const;
