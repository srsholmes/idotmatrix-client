/**
 * Text display command builder.
 *
 * Text characters are rendered to 16x32 monochrome bitmaps, packed 8 pixels per byte (LSB first).
 * Characters are separated by 0x05 0xFF 0xFF 0xFF.
 *
 * Packet format:
 *   [16-byte header] + [14-byte metadata] + [bitmap data]
 *
 * Header:
 *   [0-1]:  u16 LE total packet length
 *   [2-4]:  0x03, 0x00, 0x00 (static)
 *   [5-8]:  u32 LE length of metadata + bitmaps
 *   [9-12]: u32 LE CRC32 of metadata + bitmaps
 *   [13-15]: 0x00, 0x00, 0x0C (static)
 *
 * Metadata:
 *   [0-1]:  u16 LE number of characters (separator count)
 *   [2-3]:  0x00, 0x01 (static)
 *   [4]:    text_mode (0-8)
 *   [5]:    speed
 *   [6]:    text_color_mode
 *   [7-9]:  text RGB
 *   [10]:   text_bg_mode
 *   [11-13]: bg RGB
 */

import type { Color, TextBgMode, TextColorMode, TextMode } from "../types.ts";
import { crc32 } from "../../utils/crc32.ts";

const TEXT_SEPARATOR = new Uint8Array([0x05, 0xff, 0xff, 0xff]);
const IMAGE_WIDTH = 16;
const IMAGE_HEIGHT = 32;

export interface TextOptions {
	text: string;
	bitmaps: Uint8Array;
	textMode?: TextMode;
	speed?: number;
	textColorMode?: TextColorMode;
	textColor?: Color;
	textBgMode?: TextBgMode;
	textBgColor?: Color;
}

export function buildTextPacket(opts: TextOptions): Uint8Array {
	const {
		bitmaps,
		textMode = 1,
		speed = 95,
		textColorMode = 1,
		textColor = { r: 255, g: 0, b: 0 },
		textBgMode = 0,
		textBgColor = { r: 0, g: 0, b: 0 },
	} = opts;

	// Count separators in bitmaps to get num_chars
	let numChars = 0;
	for (let i = 0; i <= bitmaps.length - 4; i++) {
		if (
			bitmaps[i] === 0x05 &&
			bitmaps[i + 1] === 0xff &&
			bitmaps[i + 2] === 0xff &&
			bitmaps[i + 3] === 0xff
		) {
			numChars++;
		}
	}

	// Build metadata
	const metadata = new Uint8Array(14);
	const metaView = new DataView(metadata.buffer);
	metaView.setUint16(0, numChars, true);
	metadata[2] = 0x00;
	metadata[3] = 0x01;
	metadata[4] = textMode;
	metadata[5] = speed & 0xff;
	metadata[6] = textColorMode;
	metadata[7] = textColor.r & 0xff;
	metadata[8] = textColor.g & 0xff;
	metadata[9] = textColor.b & 0xff;
	metadata[10] = textBgMode;
	metadata[11] = textBgColor.r & 0xff;
	metadata[12] = textBgColor.g & 0xff;
	metadata[13] = textBgColor.b & 0xff;

	// Combine metadata + bitmaps
	const packet = new Uint8Array(metadata.length + bitmaps.length);
	packet.set(metadata, 0);
	packet.set(bitmaps, metadata.length);

	// Build header
	const header = new Uint8Array(16);
	const headerView = new DataView(header.buffer);
	const totalLen = header.length + packet.length;
	headerView.setUint16(0, totalLen, true);
	header[2] = 0x03;
	header[3] = 0x00;
	header[4] = 0x00;
	headerView.setUint32(5, packet.length, true);
	headerView.setUint32(9, crc32(packet), true);
	header[13] = 0x00;
	header[14] = 0x00;
	header[15] = 0x0c;

	// Combine header + packet
	const result = new Uint8Array(totalLen);
	result.set(header, 0);
	result.set(packet, header.length);
	return result;
}

/**
 * Render a single character to a 16x32 monochrome bitmap.
 * Returns separator + bitmap bytes.
 *
 * Each row: 16 pixels packed into 2 bytes, LSB first within each byte.
 * Total: 32 rows * 2 bytes = 64 bytes per character.
 */
export function renderCharBitmap(pixels: Uint8Array): Uint8Array {
	// pixels should be IMAGE_WIDTH * IMAGE_HEIGHT values of 0 or 1
	const bitmap = new Uint8Array(IMAGE_WIDTH * IMAGE_HEIGHT / 8);
	let byteIndex = 0;
	let currentByte = 0;

	for (let y = 0; y < IMAGE_HEIGHT; y++) {
		for (let x = 0; x < IMAGE_WIDTH; x++) {
			if (x % 8 === 0) {
				currentByte = 0;
			}
			const pixel = pixels[y * IMAGE_WIDTH + x] ?? 0;
			currentByte |= (pixel & 1) << (x % 8);
			if (x % 8 === 7 || x === IMAGE_WIDTH - 1) {
				bitmap[byteIndex++] = currentByte;
			}
		}
	}

	// Prepend separator
	const result = new Uint8Array(TEXT_SEPARATOR.length + bitmap.length);
	result.set(TEXT_SEPARATOR, 0);
	result.set(bitmap, TEXT_SEPARATOR.length);
	return result;
}
