let verbose = false;

export function setVerbose(v: boolean): void {
	verbose = v;
}

export function log(...args: unknown[]): void {
	console.log(...args);
}

export function debug(...args: unknown[]): void {
	if (verbose) {
		console.log("[debug]", ...args);
	}
}

export function error(...args: unknown[]): void {
	console.error("[error]", ...args);
}
