import type { DiscoveredDevice } from "../protocol/types.ts";

export interface IBLETransport {
	scan(timeout?: number): Promise<DiscoveredDevice[]>;
	connect(address: string): Promise<void>;
	disconnect(): Promise<void>;
	write(data: Uint8Array, withResponse?: boolean): Promise<void>;
	read(): Promise<Uint8Array>;
	isConnected(): boolean;
}
