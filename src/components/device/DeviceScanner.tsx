import { useState } from "react";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import type { ScanOutput } from "../../lib/types";

export function DeviceScanner() {
  const { devices, setDevices, setAddress } = useDevice();
  const { loading, error, execute } = useSidecar();
  const [timeout, setTimeout] = useState(5000);

  const handleScan = async () => {
    const result = await execute(["scan", "--timeout", String(timeout)]);
    if (result && "devices" in result) {
      const scan = result as ScanOutput;
      setDevices(scan.devices);
      if (scan.devices.length === 1) {
        setAddress(scan.devices[0]!.address);
      }
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-white">Scan for Devices</h2>

      <div className="flex items-end gap-3">
        <div>
          <label className="mb-1 block text-sm text-gray-400">
            Timeout (ms)
          </label>
          <input
            type="number"
            value={timeout}
            onChange={(e) => setTimeout(Number(e.target.value))}
            className="w-28 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
            min={1000}
            max={30000}
            step={1000}
          />
        </div>
        <button
          onClick={handleScan}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Scanning..." : "Scan"}
        </button>
      </div>

      {devices.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-300">
            Found {devices.length} device(s)
          </h3>
          {devices.map((d) => (
            <button
              key={d.address}
              onClick={() => setAddress(d.address)}
              className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-left transition-colors hover:border-blue-500"
            >
              <div className="font-medium text-white">{d.name}</div>
              <div className="text-xs text-gray-400">
                {d.address}
                {d.rssi != null && ` (RSSI: ${d.rssi})`}
              </div>
            </button>
          ))}
        </div>
      )}

      <CommandOutput loading={loading} error={error} />
    </div>
  );
}
