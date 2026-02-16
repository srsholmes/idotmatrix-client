export interface Color {
	r: number;
	g: number;
	b: number;
}

export interface DiscoveredDevice {
	address: string;
	name: string;
	rssi?: number;
}

export type ChronographMode = 0 | 1 | 2 | 3; // reset, start, pause, continue
export type CountdownMode = 0 | 1 | 2 | 3; // disable, start, pause, restart
export type TextMode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type TextColorMode = 0 | 1 | 2 | 3 | 4 | 5; // white, RGB, rainbow modes
export type TextBgMode = 0 | 1; // black, RGB
export type EffectStyle = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type ClockStyle = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DisplaySize = 32 | 64;
