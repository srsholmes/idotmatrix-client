/**
 * Common device commands: screen, brightness, time, password, reset.
 * Based on BleProtocolN.java from the iDotMatrix Android App.
 */

export function freezeScreen(): Uint8Array {
	return new Uint8Array([4, 0, 3, 0]);
}

export function screenOn(): Uint8Array {
	return new Uint8Array([5, 0, 7, 1, 1]);
}

export function screenOff(): Uint8Array {
	return new Uint8Array([5, 0, 7, 1, 0]);
}

export function flipScreen(flip: boolean): Uint8Array {
	return new Uint8Array([5, 0, 6, 128, flip ? 1 : 0]);
}

export function setBrightness(percent: number): Uint8Array {
	const clamped = Math.max(5, Math.min(100, Math.round(percent)));
	return new Uint8Array([5, 0, 4, 128, clamped]);
}

export function setSpeed(speed: number): Uint8Array {
	return new Uint8Array([5, 0, 3, 1, speed & 0xff]);
}

export function setTime(date: Date): Uint8Array {
	const year = date.getFullYear() % 100;
	const month = date.getMonth() + 1;
	const day = date.getDate();
	// JS getDay(): 0=Sunday. Protocol expects: 1=Monday..7=Sunday
	const weekday = date.getDay() === 0 ? 7 : date.getDay();
	const hour = date.getHours();
	const minute = date.getMinutes();
	const second = date.getSeconds();
	return new Uint8Array([11, 0, 1, 128, year, month, day, weekday, hour, minute, second]);
}

export function setPassword(password: number): Uint8Array {
	const pwd = Math.max(0, Math.min(999999, Math.round(password)));
	const high = Math.floor(pwd / 10000) & 0xff;
	const mid = (Math.floor(pwd / 100) % 100) & 0xff;
	const low = (pwd % 100) & 0xff;
	return new Uint8Array([8, 0, 4, 2, 1, high, mid, low]);
}

export function reset(): Uint8Array[] {
	return [new Uint8Array([0x04, 0x00, 0x03, 0x80]), new Uint8Array([0x05, 0x00, 0x04, 0x80, 0x50])];
}
