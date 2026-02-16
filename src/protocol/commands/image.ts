/**
 * Image upload payload builder.
 *
 * PNG data is split into 4096-byte chunks. Each chunk gets a 16-byte header
 * (same format as GIF upload):
 *   [0-1]:   u16 LE = header_len + chunk_data_len
 *   [2]:     0x01 (static)
 *   [3]:     0x00 (static)
 *   [4]:     flag (0 for first chunk, 2 for subsequent)
 *   [5-8]:   u32 LE = total PNG data length
 *   [9-12]:  u32 LE = CRC32 of entire PNG data
 *   [13-15]: 0x05, 0x00, 0x0D (static footer)
 *
 * Each chunk is sent separately with BLE write-with-response.
 */

import { IMAGE_CHUNK_SIZE } from "../constants.ts";
import { crc32 } from "../../utils/crc32.ts";

const HEADER_SIZE = 16;

export function setImageMode(mode: number): Uint8Array {
	return new Uint8Array([5, 0, 4, 1, mode & 0xff]);
}

export function createImagePayloads(pngData: Uint8Array): Uint8Array[] {
	const crc = crc32(pngData);
	const chunks = splitIntoChunks(pngData, IMAGE_CHUNK_SIZE);
	const payloads: Uint8Array[] = [];

	for (let i = 0; i < chunks.length; i++) {
		const chunk = chunks[i]!;
		const header = new Uint8Array(HEADER_SIZE);
		const view = new DataView(header.buffer);

		const chunkLen = HEADER_SIZE + chunk.length;
		view.setUint16(0, chunkLen, true);
		header[2] = 0x01;
		header[3] = 0x00;
		header[4] = i > 0 ? 0x02 : 0x00;
		view.setUint32(5, pngData.length, true);
		view.setUint32(9, crc, true);
		header[13] = 0x05;
		header[14] = 0x00;
		header[15] = 0x0d;

		const payload = new Uint8Array(chunkLen);
		payload.set(header, 0);
		payload.set(chunk, HEADER_SIZE);
		payloads.push(payload);
	}

	return payloads;
}

/** @deprecated Use createImagePayloads instead */
export function createImagePayload(pngData: Uint8Array): Uint8Array {
	const payloads = createImagePayloads(pngData);
	const totalLen = payloads.reduce((sum, p) => sum + p.length, 0);
	const result = new Uint8Array(totalLen);
	let offset = 0;
	for (const p of payloads) {
		result.set(p, offset);
		offset += p.length;
	}
	return result;
}

function splitIntoChunks(data: Uint8Array, chunkSize: number): Uint8Array[] {
	const chunks: Uint8Array[] = [];
	for (let i = 0; i < data.length; i += chunkSize) {
		chunks.push(data.slice(i, i + chunkSize));
	}
	return chunks;
}
