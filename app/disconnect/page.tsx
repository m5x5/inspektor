"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRemoteStorage } from "@/contexts/RemoteStorageContext";

export default function DisconnectPage() {
  const router = useRouter();
  const { disconnect } = useRemoteStorage();

  useEffect(() => {
    disconnect();
    router.replace("/connect");
  }, [disconnect, router]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6">
      <p className="text-muted-foreground">Disconnecting…</p>
    </div>
  );
}
