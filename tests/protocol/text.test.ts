import { describe, it, expect } from "vitest";
import { buildTextPacket, renderCharBitmap } from "../../src/protocol/commands/text.ts";
import { crc32 } from "../../src/utils/crc32.ts";

describe("text commands", () => {
	it("renderCharBitmap produces separator + 64 bytes", () => {
		// 16x32 = 512 pixels, 512/8 = 64 bytes bitmap
		const pixels = new Uint8Array(16 * 32);
		const result = renderCharBitmap(pixels);
		// 4 bytes separator + 64 bytes bitmap = 68
		expect(result.length).toBe(68);
		// Check separator
		expect(result[0]).toBe(0x05);
		expect(result[1]).toBe(0xff);
		expect(result[2]).toBe(0xff);
		expect(result[3]).toBe(0xff);
	});

	it("renderCharBitmap encodes pixels LSB first", () => {
		const pixels = new Uint8Array(16 * 32);
		// Set pixel at (0, 0) = bit 0 of first byte
		pixels[0] = 1;
		// Set pixel at (7, 0) = bit 7 of first byte
		pixels[7] = 1;

		const result = renderCharBitmap(pixels);
		// First bitmap byte after separator (offset 4)
		expect(result[4]).toBe(0b10000001); // bits 0 and 7
	});

	it("buildTextPacket creates valid header", () => {
		// Create a simple bitmap with one character
		const pixels = new Uint8Array(16 * 32);
		const bitmaps = renderCharBitmap(pixels);

		const packet = buildTextPacket({
			text: "A",
			bitmaps,
			textMode: 1,
			speed: 95,
			textColorMode: 1,
			textColor: { r: 255, g: 0, b: 0 },
			textBgMode: 0,
			textBgColor: { r: 0, g: 0, b: 0 },
		});

		// Header is 16 bytes
		const view = new DataView(packet.buffer, packet.byteOffset);

		// total_len should equal packet.length
		expect(view.getUint16(0, true)).toBe(packet.length);
		// static header bytes
		expect(packet[2]).toBe(0x03);
		expect(packet[3]).toBe(0x00);
		expect(packet[4]).toBe(0x00);

		// metadata + bitmaps length
		const innerLen = view.getUint32(5, true);
		expect(innerLen).toBe(packet.length - 16);

		// CRC32 of metadata + bitmaps
		const innerData = packet.slice(16);
		expect(view.getUint32(9, true)).toBe(crc32(innerData));

		// footer
		expect(packet[13]).toBe(0x00);
		expect(packet[14]).toBe(0x00);
		expect(packet[15]).toBe(0x0c);

		// num_chars should be 1
		const metaView = new DataView(packet.buffer, packet.byteOffset + 16);
		expect(metaView.getUint16(0, true)).toBe(1);
	});
});
