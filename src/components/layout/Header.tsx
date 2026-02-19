import { useState } from "react";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import type { DeviceSize, ScanOutput } from "../../lib/types";

export function Header() {
  const { address, size, devices, setAddress, setSize, setDevices, busy } =
    useDevice();
  const { loading, execute } = useSidecar();
  const [scanning, setScanning] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    const result = await execute(["scan", "--timeout", "5000"]);
    if (result && "devices" in result) {
      const scan = result as ScanOutput;
      setDevices(scan.devices);
      if (scan.devices.length === 1 && !address) {
        setAddress(scan.devices[0]!.address);
      }
    }
    setScanning(false);
  };

  return (
    <header className="flex items-center gap-4 border-b border-gray-800 bg-gray-900 px-4 py-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Device:</label>
        <select
          value={address ?? ""}
          onChange={(e) => setAddress(e.target.value || null)}
          className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white"
        >
          <option value="">Select device...</option>
          {devices.map((d) => (
            <option key={d.address} value={d.address}>
              {d.name} ({d.address}
              {d.rssi != null ? `, ${d.rssi}dBm` : ""})
            </option>
          ))}
        </select>
        <button
          onClick={handleScan}
          disabled={scanning || loading}
          className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {scanning ? "Scanning..." : "Scan"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Size:</label>
        <select
          value={size}
          onChange={(e) => setSize(Number(e.target.value) as DeviceSize)}
          className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white"
        >
          <option value={16}>16x16</option>
          <option value={32}>32x32</option>
          <option value={64}>64x64</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`h-2.5 w-2.5 rounded-full ${address ? "bg-green-500" : "bg-gray-600"}`}
        />
        <span className="text-sm text-gray-400">
          {busy || loading
            ? "Busy..."
            : address
              ? "Connected"
              : "No device"}
        </span>
      </div>
    </header>
  );
}
