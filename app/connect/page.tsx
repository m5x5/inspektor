"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRemoteStorage } from "@/contexts/RemoteStorageContext";
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCw, Wifi, WifiOff, Loader2 } from "lucide-react";

type SyncState = "idle" | "syncing" | "error";

function StatusBadge({ connected, connecting, syncState }: {
  connected: boolean;
  connecting: boolean;
  syncState: SyncState;
}) {
  if (connecting) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
        <Loader2 className="size-3 animate-spin" />
        Connecting…
      </span>
    );
  }
  if (connected && syncState === "syncing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        <RefreshCw className="size-3 animate-spin" />
        Syncing
      </span>
    );
  }
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <Wifi className="size-3" />
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      <WifiOff className="size-3" />
      Not connected
    </span>
  );
}

export default function ConnectPage() {
  const { connected, connecting, userAddress, storage, disconnect } = useRemoteStorage();
  const widgetRef = useRef<HTMLDivElement>(null);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Mount the remoteStorage widget
  useEffect(() => {
    if (connected || !storage || !widgetRef.current) return;
    let isMounted = true;
    async function mount() {
      if (!widgetRef.current || !storage) return;
      const rs = storage.getRemoteStorage();
      const { default: Widget } = await import("m5x5-remotestorage-widget");
      if (!isMounted || !widgetRef.current) return;
      const w = new (Widget as new (rs: unknown, opts: object) => { attach: (el: HTMLElement) => void })(
        rs,
        { logging: false, skipInitial: false }
      );
      w.attach(widgetRef.current);
    }
    mount();
    return () => {
      isMounted = false;
      if (widgetRef.current) widgetRef.current.innerHTML = "";
    };
  }, [connected, storage]);

  // Track sync state
  useEffect(() => {
    if (!storage) return;
    const rs = storage.getRemoteStorage() as {
      on?: (event: string, cb: () => void) => void;
      removeEventListener?: (event: string, cb: () => void) => void;
    };
    if (!rs?.on) return;

    const onSyncReqDone = () => {
      setSyncState("syncing");
    };
    const onSyncDone = () => {
      setSyncState("idle");
      setLastSynced(new Date());
    };
    const onError = () => {
      setSyncState("error");
    };

    rs.on("sync-req-done", onSyncReqDone);
    rs.on("sync-done", onSyncDone);
    rs.on("error", onError);

    return () => {
      rs.removeEventListener?.("sync-req-done", onSyncReqDone);
      rs.removeEventListener?.("sync-done", onSyncDone);
      rs.removeEventListener?.("error", onError);
    };
  }, [storage]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <StatusBadge connected={connected} connecting={connecting} syncState={syncState} />
        <h1 className="text-2xl font-semibold tracking-tight">
          {connected ? "remoteStorage" : "Connect remoteStorage"}
        </h1>
        {connected && userAddress && (
          <p className="text-sm text-muted-foreground">{userAddress}</p>
        )}
        {connected && lastSynced && (
          <p className="text-xs text-muted-foreground">
            Last synced {lastSynced.toLocaleTimeString()}
          </p>
        )}
        {syncState === "error" && (
          <p className="text-sm text-destructive">Sync error — check your connection and try again.</p>
        )}
      </div>

      {connected ? (
        <div className="flex flex-col items-center gap-3">
          <Link href="/">
            <Button variant="default">Browse files</Button>
          </Link>
          <Button variant="outline" onClick={disconnect} className="gap-2">
            <LogOut className="size-4" />
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="flex w-full max-w-sm flex-col items-center gap-4">
          {connecting ? (
            <p className="text-sm text-muted-foreground">Waiting for connection…</p>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Enter your remoteStorage address to sync your data across devices.
            </p>
          )}
          <div ref={widgetRef} className="w-full" />
        </div>
      )}
    </div>
  );
}
