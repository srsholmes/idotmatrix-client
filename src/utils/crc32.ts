import CRC32 from "crc-32";

export function crc32(data: Uint8Array): number {
	return CRC32.buf(data) >>> 0; // unsigned
}
