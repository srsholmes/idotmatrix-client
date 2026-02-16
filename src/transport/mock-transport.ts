import type { IBLETransport } from "./types.ts";
import type { DiscoveredDevice } from "../protocol/types.ts";

export class MockTransport implements IBLETransport {
	public writes: { data: Uint8Array; withResponse: boolean }[] = [];
	public connected = false;
	public readResponse: Uint8Array = new Uint8Array();

	async scan(_timeout?: number): Promise<DiscoveredDevice[]> {
		return [
			{ address: "AA:BB:CC:DD:EE:FF", name: "IDM-Mock", rssi: -50 },
		];
	}

	async connect(_address: string): Promise<void> {
		this.connected = true;
	}

	async disconnect(): Promise<void> {
		this.connected = false;
	}

	async write(data: Uint8Array, withResponse = false): Promise<void> {
		if (!this.connected) throw new Error("Not connected");
		this.writes.push({ data: new Uint8Array(data), withResponse });
	}

	async read(): Promise<Uint8Array> {
		if (!this.connected) throw new Error("Not connected");
		return this.readResponse;
	}

	isConnected(): boolean {
		return this.connected;
	}

	reset(): void {
		this.writes = [];
		this.connected = false;
		this.readResponse = new Uint8Array();
	}

	getLastWrite(): Uint8Array | undefined {
		return this.writes[this.writes.length - 1]?.data;
	}
}
