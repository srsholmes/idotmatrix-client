import noble from "@stoprocent/noble";
import type { Peripheral, Characteristic } from "@stoprocent/noble";
import type { IBLETransport } from "./types.ts";
import type { DiscoveredDevice } from "../protocol/types.ts";
import { UUID_WRITE_DATA, UUID_READ_DATA, DEVICE_NAME_PREFIX, BLE_DELAY_MS } from "../protocol/constants.ts";
import { delay } from "../utils/delay.ts";
import { debug, error as logError } from "../utils/logger.ts";

// Noble may return full UUIDs without hyphens, or shortened 4-char UUIDs on macOS
const WRITE_UUID_FULL = UUID_WRITE_DATA.replace(/-/g, "");
const READ_UUID_FULL = UUID_READ_DATA.replace(/-/g, "");
const WRITE_UUID_SHORT = "fa02";
const READ_UUID_SHORT = "fa03";

function matchUuid(uuid: string, ...candidates: string[]): boolean {
	const lower = uuid.toLowerCase();
	return candidates.some((c) => lower === c.toLowerCase() || lower.endsWith(c.toLowerCase()));
}

export class NobleTransport implements IBLETransport {
	private peripheral: Peripheral | null = null;
	private writeChar: Characteristic | null = null;
	private readChar: Characteristic | null = null;
	private connected = false;

	private async waitForBluetooth(timeoutMs = 5000): Promise<void> {
		if (noble.state === "poweredOn") return;

		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				reject(
					new Error(
						`Bluetooth is ${noble.state}. Please turn on Bluetooth and try again.`,
					),
				);
			}, timeoutMs);

			noble.once("stateChange", (state: string) => {
				clearTimeout(timer);
				if (state === "poweredOn") {
					resolve();
				} else {
					reject(
						new Error(
							`Bluetooth is ${state}. Please turn on Bluetooth and try again.`,
						),
					);
				}
			});
		});
	}

	async scan(timeout = 5000): Promise<DiscoveredDevice[]> {
		await this.waitForBluetooth();

		const devices: DiscoveredDevice[] = [];

		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				noble.stopScanning();
				resolve(devices);
			}, timeout);

			noble.on("discover", (peripheral: Peripheral) => {
				const name = peripheral.advertisement?.localName ?? "";
				if (name.startsWith(DEVICE_NAME_PREFIX)) {
					const address = peripheral.address && peripheral.address !== "" ? peripheral.address : peripheral.id;
					debug(`Found device: ${name} (address=${peripheral.address}, id=${peripheral.id})`);
					devices.push({
						address,
						name,
						rssi: peripheral.rssi,
					});
				}
			});

			noble.startScanning([], false, (err?: Error) => {
				if (err) {
					clearTimeout(timer);
					reject(err);
				}
			});
		});
	}

	async connect(address: string): Promise<void> {
		await this.waitForBluetooth();

		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				noble.stopScanning();
				reject(new Error(`Connection timeout: device ${address} not found`));
			}, 15000);

			const onDiscover = async (peripheral: Peripheral) => {
				const name = peripheral.advertisement?.localName ?? "";
				const peripheralAddress = peripheral.address && peripheral.address !== "" ? peripheral.address : peripheral.id;
				const target = address.toLowerCase();
				const matches =
					peripheralAddress.toLowerCase() === target ||
					peripheral.id.toLowerCase() === target ||
					name.toLowerCase() === target;
				if (!matches) return;

				clearTimeout(timer);
				noble.stopScanning();
				noble.removeListener("discover", onDiscover);

				try {
					await peripheral.connectAsync();
					// Discover all services and characteristics, then filter
					const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(
						[],
						[],
					);

					debug(`Found ${characteristics.length} characteristics:`);
					for (const c of characteristics) {
						debug(`  ${c.uuid} (properties: ${c.properties.join(", ")})`);
					}

					this.writeChar = characteristics.find((c) => matchUuid(c.uuid, WRITE_UUID_FULL, WRITE_UUID_SHORT)) ?? null;
					this.readChar = characteristics.find((c) => matchUuid(c.uuid, READ_UUID_FULL, READ_UUID_SHORT)) ?? null;

					if (!this.writeChar) {
						throw new Error("Write characteristic not found");
					}

					this.peripheral = peripheral;
					this.connected = true;
					debug(`Connected to ${address}`);
					resolve();
				} catch (err) {
					reject(err);
				}
			};

			noble.on("discover", onDiscover);

			noble.startScanning([], false, (err?: Error) => {
				if (err) {
					clearTimeout(timer);
					reject(err);
				}
			});
		});
	}

	async disconnect(): Promise<void> {
		if (this.peripheral && this.connected) {
			await this.peripheral.disconnectAsync();
			this.connected = false;
			this.peripheral = null;
			this.writeChar = null;
			this.readChar = null;
			debug("Disconnected");
		}
	}

	async write(data: Uint8Array, withResponse = false): Promise<void> {
		if (!this.writeChar || !this.connected) {
			throw new Error("Not connected");
		}

		const mtu = this.peripheral?.mtu ?? 20;
		const maxWriteSize = Math.max(mtu - 3, 20);

		if (data.length <= maxWriteSize) {
			debug(`Writing ${data.length} bytes (single write, withResponse=${withResponse})`);
			await this.writeChar.writeAsync(Buffer.from(data), !withResponse);
		} else {
			const totalChunks = Math.ceil(data.length / maxWriteSize);
			debug(`Writing ${data.length} bytes in ${totalChunks} chunks of ${maxWriteSize} (MTU=${mtu}, withResponse=${withResponse})`);
			for (let i = 0; i < data.length; i += maxWriteSize) {
				const end = Math.min(i + maxWriteSize, data.length);
				const chunk = Buffer.from(data.slice(i, end));
				const chunkNum = Math.floor(i / maxWriteSize) + 1;
				debug(`  Chunk ${chunkNum}/${totalChunks}: ${chunk.length} bytes`);
				await this.writeChar.writeAsync(chunk, !withResponse);
				// Noble on macOS resolves write-without-response immediately
				// without waiting for CoreBluetooth to transmit. Use a longer
				// delay to let each chunk transmit before sending the next.
				await delay(withResponse ? BLE_DELAY_MS : 50);
			}
		}

		await delay(BLE_DELAY_MS);
	}

	async subscribeNotifications(): Promise<void> {
		if (!this.readChar) {
			debug("No read characteristic to subscribe to");
			return;
		}
		this.readChar.on("data", (data: Buffer) => {
			debug(`Notification received: ${data.toString("hex")}`);
		});
		await this.readChar.subscribeAsync();
		debug("Subscribed to notifications");
	}

	async waitForNotification(timeoutMs = 5000): Promise<Uint8Array> {
		if (!this.readChar) {
			throw new Error("No read characteristic");
		}
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				reject(new Error("Notification timeout"));
			}, timeoutMs);
			this.readChar!.once("data", (data: Buffer) => {
				clearTimeout(timer);
				debug(`Notification: ${data.toString("hex")}`);
				resolve(new Uint8Array(data));
			});
		});
	}

	async read(): Promise<Uint8Array> {
		if (!this.readChar || !this.connected) {
			throw new Error("Not connected");
		}
		const data = await this.readChar.readAsync();
		return new Uint8Array(data);
	}

	isConnected(): boolean {
		return this.connected;
	}
}
