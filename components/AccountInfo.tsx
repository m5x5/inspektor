"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useDownloadAllData } from "@/hooks/use-download-all-data";
import type RemoteStorageService from "@/lib/remotestorage";

type AccountInfoProps = {
  userAddress: string | null;
  storage: RemoteStorageService | null;
  onDisconnect?: () => void;
};

export function AccountInfo({ userAddress, storage, onDisconnect }: AccountInfoProps) {
  const { downloadAllData, isDownloading, downloadStatus, downloadProgress } = useDownloadAllData(storage, userAddress);
  // Defer to after hydration so server and client initial render match
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const username = userAddress ? userAddress.split("@")[0] : "";
  const host = userAddress ? `@${userAddress.split("@")[1]}` : "";

  if (!mounted || !userAddress) {
    return (
      <div>
        <Link href="/connect">
          <Button variant="secondary" size="sm" className="w-full">
            Connect
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="hidden md:block text-lg text-sidebar-foreground font-medium leading-tight">{username}</p>
      <p className="hidden md:block text-base text-gray-300 italic">{host}</p>
    </div>
  );
}
