interface CommandOutputProps {
  loading: boolean;
  error: string | null;
  message?: string | null;
}

export function CommandOutput({ loading, error, message }: CommandOutputProps) {
  if (!loading && !error && !message) return null;

  return (
    <div className="mt-4 space-y-2">
      {loading && (
        <div className="flex items-center gap-2 text-blue-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          <span className="text-sm">Sending command...</span>
        </div>
      )}
      {error && (
        <div className="rounded bg-red-900/30 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
      {message && !error && (
        <div className="rounded bg-green-900/30 px-3 py-2 text-sm text-green-400">
          {message}
        </div>
      )}
    </div>
  );
}
