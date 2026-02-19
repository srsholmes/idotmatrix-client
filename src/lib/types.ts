export interface DiscoveredDevice {
  address: string;
  name: string;
  rssi: number | null;
}

export interface ScanOutput {
  devices: DiscoveredDevice[];
}

export interface SuccessOutput {
  success: boolean;
  message: string;
}

export interface PreviewOutput {
  preview: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
}

export interface ProgressOutput {
  stage: string;
  message?: string;
  chunk?: number;
  total_chunks?: number;
}

export interface ErrorOutput {
  error: string;
}

export type SidecarResult =
  | ScanOutput
  | SuccessOutput
  | PreviewOutput
  | ProgressOutput
  | ErrorOutput;

export type DeviceSize = 16 | 32 | 64;

export type Panel =
  | "scan"
  | "screen"
  | "color"
  | "image"
  | "gif"
  | "carousel"
  | "canvas"
  | "clock"
  | "countdown"
  | "chronograph"
  | "scoreboard"
  | "pixel"
  | "effect"
  | "speed"
  | "text"
  | "password"
  | "time-indicator"
  | "reset";
