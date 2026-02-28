"use client";

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

  const username = userAddress ? userAddress.split("@")[0] : "";
  const host = userAddress ? `@${userAddress.split("@")[1]}` : "";

  return (
    <div>
      <p className="hidden md:block text-lg text-sidebar-foreground font-medium leading-tight">{username}</p>
      <p className="hidden md:block text-base text-gray-300 italic">{host}</p>
      <div className="hidden space-y-1">
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={downloadAllData}
          disabled={isDownloading}
        >
          {isDownloading ? (downloadStatus || "Downloading...") : "Download All Data"}
        </Button>
        {isDownloading && (
          <div className="space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
