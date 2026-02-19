import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createElement } from "react";
import type { DeviceSize, DiscoveredDevice } from "../lib/types";

interface DeviceState {
  address: string | null;
  size: DeviceSize;
  devices: DiscoveredDevice[];
  busy: boolean;
}

interface DeviceContextValue extends DeviceState {
  setAddress: (address: string | null) => void;
  setSize: (size: DeviceSize) => void;
  setDevices: (devices: DiscoveredDevice[]) => void;
  setBusy: (busy: boolean) => void;
  getBaseArgs: () => string[];
}

const DeviceContext = createContext<DeviceContextValue | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DeviceState>({
    address: null,
    size: 32,
    devices: [],
    busy: false,
  });

  const setAddress = useCallback((address: string | null) => {
    setState((prev) => ({ ...prev, address }));
  }, []);

  const setSize = useCallback((size: DeviceSize) => {
    setState((prev) => ({ ...prev, size }));
  }, []);

  const setDevices = useCallback((devices: DiscoveredDevice[]) => {
    setState((prev) => ({ ...prev, devices }));
  }, []);

  const setBusy = useCallback((busy: boolean) => {
    setState((prev) => ({ ...prev, busy }));
  }, []);

  const getBaseArgs = useCallback((): string[] => {
    const args: string[] = [];
    if (state.address) {
      args.push("--address", state.address);
    }
    return args;
  }, [state.address]);

  const value: DeviceContextValue = {
    ...state,
    setAddress,
    setSize,
    setDevices,
    setBusy,
    getBaseArgs,
  };

  return createElement(DeviceContext.Provider, { value }, children);
}

export function useDevice(): DeviceContextValue {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }
  return context;
}
