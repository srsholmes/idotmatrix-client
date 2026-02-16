/**
 * GIF upload payload builder.
 *
 * GIF data is split into 4096-byte chunks. Each chunk gets a 16-byte header:
 *   [0-1]:  u16 LE = header_len + chunk_data_len
 *   [2]:    0x01 (static)
 *   [3]:    0x00 (static)
 *   [4]:    flag (0 for first chunk, 2 for subsequent)
 *   [5-8]:  u32 LE = total GIF data length
 *   [9-12]: u32 LE = CRC32 of entire GIF data
 *   [13-15]: 0x05, 0x00, 0x0D (static footer)
 *
 * Each chunk is sent separately with BLE write-with-response.
 */

import { GIF_CHUNK_SIZE, GIF_HEADER_SIZE } from "../constants.ts";
import { crc32 } from "../../utils/crc32.ts";

export function createGifPayloads(gifData: Uint8Array): Uint8Array[] {
	const crc = crc32(gifData);
	const chunks = splitIntoChunks(gifData, GIF_CHUNK_SIZE);
	const payloads: Uint8Array[] = [];

	for (let i = 0; i < chunks.length; i++) {
		const chunk = chunks[i]!;
		const header = new Uint8Array(GIF_HEADER_SIZE);
		const view = new DataView(header.buffer);

		const chunkLen = GIF_HEADER_SIZE + chunk.length;
		view.setUint16(0, chunkLen, true);
		header[2] = 0x01;
		header[3] = 0x00;
		header[4] = i > 0 ? 2 : 0;
		view.setUint32(5, gifData.length, true);
		view.setUint32(9, crc, true);
		header[13] = 0x05;
		header[14] = 0x00;
		header[15] = 0x0d;

		const payload = new Uint8Array(chunkLen);
		payload.set(header, 0);
		payload.set(chunk, GIF_HEADER_SIZE);
		payloads.push(payload);
	}

	return payloads;
}

function splitIntoChunks(data: Uint8Array, chunkSize: number): Uint8Array[] {
	const chunks: Uint8Array[] = [];
	for (let i = 0; i < data.length; i += chunkSize) {
		chunks.push(data.slice(i, i + chunkSize));
	}
	return chunks;
}
