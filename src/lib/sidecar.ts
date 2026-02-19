import { Command } from "@tauri-apps/plugin-shell";
import type {
  ErrorOutput,
  PreviewOutput,
  ProgressOutput,
  ScanOutput,
  SuccessOutput,
} from "./types";

export interface SidecarOptions {
  onProgress?: (progress: ProgressOutput) => void;
}

export async function runIdm(
  args: string[],
  options?: SidecarOptions,
): Promise<ScanOutput | SuccessOutput | PreviewOutput> {
  const fullArgs = ["--json", ...args];
  console.log("[sidecar] spawning:", "idm", fullArgs.join(" "));

  const command = Command.sidecar("binaries/idm", fullArgs);

  const stderrLines: string[] = [];
  let lastResult: ScanOutput | SuccessOutput | PreviewOutput | null = null;
  let jsonError: string | null = null;

  command.stdout.on("data", (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    console.log("[sidecar:stdout]", trimmed);

    try {
      const parsed: unknown = JSON.parse(trimmed);
      const obj = parsed as Record<string, unknown>;

      if (obj.stage && options?.onProgress) {
        options.onProgress(obj as unknown as ProgressOutput);
        return;
      }

      if (obj.error) {
        jsonError = (obj as unknown as ErrorOutput).error;
        return;
      }

      lastResult = obj as unknown as ScanOutput | SuccessOutput | PreviewOutput;
    } catch {
      stderrLines.push(trimmed);
    }
  });

  command.stderr.on("data", (line: string) => {
    const trimmed = line.trim();
    if (trimmed) {
      console.log("[sidecar:stderr]", trimmed);
      stderrLines.push(trimmed);
    }
  });

  const child = await command.spawn();
  console.log("[sidecar] spawned pid:", child.pid);

  return new Promise((resolve, reject) => {
    command.on("close", (data) => {
      console.log("[sidecar] closed with code:", data.code, "signal:", data.signal);
      console.log("[sidecar] jsonError:", jsonError, "lastResult:", !!lastResult, "stderr:", stderrLines);

      if (jsonError) {
        reject(new Error(jsonError));
        return;
      }
      if (data.code !== 0) {
        reject(
          new Error(
            stderrLines.join("\n") || `Sidecar exited with code ${data.code}`,
          ),
        );
        return;
      }
      if (lastResult) {
        resolve(lastResult);
      } else {
        reject(
          new Error(
            stderrLines.join("\n") || "No JSON output from sidecar",
          ),
        );
      }
    });

    command.on("error", (error) => {
      console.error("[sidecar] error event:", error);
      reject(new Error(error));
    });
  });
}
