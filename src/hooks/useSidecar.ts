import { useState, useCallback, useRef } from "react";
import { runIdm, type SidecarOptions } from "../lib/sidecar";
import type {
  SuccessOutput,
  ScanOutput,
  PreviewOutput,
  ProgressOutput,
} from "../lib/types";

interface SidecarState {
  loading: boolean;
  error: string | null;
  progress: ProgressOutput | null;
}

export function useSidecar() {
  const [state, setState] = useState<SidecarState>({
    loading: false,
    error: null,
    progress: null,
  });
  const runningRef = useRef(false);

  const execute = useCallback(
    async (
      args: string[],
      options?: SidecarOptions,
    ): Promise<ScanOutput | SuccessOutput | PreviewOutput | null> => {
      if (runningRef.current) {
        setState((prev) => ({
          ...prev,
          error: "Another command is still running. Please wait.",
        }));
        return null;
      }

      runningRef.current = true;
      setState({ loading: true, error: null, progress: null });

      try {
        const result = await runIdm(args, {
          onProgress: (progress) => {
            setState((prev) => ({ ...prev, progress }));
            options?.onProgress?.(progress);
          },
        });
        setState({ loading: false, error: null, progress: null });
        return result;
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        setState({ loading: false, error, progress: null });
        return null;
      } finally {
        runningRef.current = false;
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    execute,
    clearError,
  };
}
