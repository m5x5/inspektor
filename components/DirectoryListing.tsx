"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileTextIcon, FolderOpenIcon, TrashIcon, CopyIcon, FolderInputIcon } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useRemoteStorage } from "@/contexts/RemoteStorageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { ItemIcon } from "./ItemIcon";
import { humanFileSize } from "@/lib/human-file-size";
import type { StorageItem } from "@/lib/remotestorage";

type DirectoryListingProps = {
  items: StorageItem[];
  onDeleteItem?: (item: StorageItem) => void;
  onFileClick?: (item: StorageItem) => void;
  selectedFilePath?: string | null;
};

export function DirectoryListing({ items, onDeleteItem, onFileClick, selectedFilePath }: DirectoryListingProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { prefetchListing } = useRemoteStorage();
  const [folderSheetOpen, setFolderSheetOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<StorageItem | null>(null);

  const openFolderSheet = useCallback((item: StorageItem, e: React.MouseEvent | React.TouchEvent) => {
    if (!item.isFolder) return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedFolder(item);
    setFolderSheetOpen(true);
  }, []);

  const closeFolderSheet = useCallback(() => {
    setFolderSheetOpen(false);
    setSelectedFolder(null);
  }, []);

  const sorted = [...items].sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  const listRow = (item: (typeof sorted)[0]) => {
    const isFolder = item.isFolder;
    const href = isFolder
      ? `/?path=${encodeURIComponent(item.path)}`
      : `/inspect?path=${encodeURIComponent(item.path)}`;
    const folderName = item.name.replace(/\/$/, "");
    const isSelected = !isFolder && selectedFilePath === item.path;
    const row = (
      <li
        key={item.path}
        className={`hover:bg-muted/50 transition-colors${isSelected ? " bg-accent" : ""}`}
        onContextMenu={isMobile && isFolder ? (e) => openFolderSheet(item, e) : undefined}
      >
        <Link
          href={href}
          className="grid grid-cols-[auto_1fr] md:grid-cols-[3%_60%_10%_27%] gap-2 md:gap-3 py-4 px-6.5 md:px-2 no-underline text-foreground items-center min-w-0"
          onPointerEnter={isFolder ? () => prefetchListing(item.path) : undefined}
          onClick={!isFolder && onFileClick ? (e) => { e.preventDefault(); onFileClick(item); } : undefined}
        >
          <span className="flex justify-center shrink-0">
            <ItemIcon type={item.type} />
          </span>
          <span className="min-w-0 truncate">{folderName}</span>
          <span className="whitespace-nowrap text-muted-foreground text-sm hidden md:inline">
            {isFolder ? "" : humanFileSize(item.size)}
          </span>
          <span className="whitespace-nowrap text-muted-foreground text-sm hidden md:inline">{item.type}</span>
        </Link>
      </li>
    );
    if (isMobile && isFolder) {
      return row;
    }
    return (
      <ContextMenu key={item.path}>
        <ContextMenuTrigger asChild>
          {row}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => router.push(href)}>
            {isFolder ? <FolderOpenIcon className="size-4" /> : <FileTextIcon className="size-4" />}
            Open
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => navigator.clipboard.writeText(item.path)}
          >
            Copy path
          </ContextMenuItem>
          {onDeleteItem && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                variant="destructive"
                onClick={() => onDeleteItem(item)}
              >
                <TrashIcon className="size-4" />
                Delete
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  return (
    <>
      <ul className="list-none p-0 m-0 mb-24">
        {sorted.map(listRow)}
      </ul>

      {isMobile && selectedFolder && (
        <Sheet open={folderSheetOpen} onOpenChange={(open) => !open && closeFolderSheet()}>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle className="text-left pr-8">
                {selectedFolder.name.replace(/\/$/, "")}
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 px-4 pb-6">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  router.push(`/?path=${encodeURIComponent(selectedFolder.path)}`);
                  closeFolderSheet();
                }}
              >
                <FolderOpenIcon className="size-4 mr-2" />
                Open
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  navigator.clipboard.writeText(selectedFolder.path);
                  closeFolderSheet();
                }}
              >
                <CopyIcon className="size-4 mr-2" />
                Copy path
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  router.push(`/?path=${encodeURIComponent(selectedFolder.path)}`);
                  closeFolderSheet();
                }}
              >
                <FolderInputIcon className="size-4 mr-2" />
                Select this folder
              </Button>
              {onDeleteItem && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    onDeleteItem(selectedFolder);
                    closeFolderSheet();
                  }}
                >
                  <TrashIcon className="size-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
