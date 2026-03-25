"use client";

import { useState, useCallback, useMemo, useEffect, memo } from "react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useRemoteStorage } from "@/contexts/RemoteStorageContext";
import { useInstallPrompt } from "@/contexts/InstallPromptContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { AccountInfo } from "./AccountInfo";
import { CategoriesNav } from "./CategoriesNav";
import Link from "next/link";
import { MoreVertical, FolderPlusIcon, User, LogOut, LogIn, Download, SunIcon, MoonIcon, MonitorIcon, DownloadIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDownloadAllData } from "@/hooks/use-download-all-data";

// Isolated sidebar — React.memo ensures it never re-renders due to page navigation
const AppSidebar = memo(function AppSidebar() {
  const { connected, userAddress, rootListing, storage, fetchListing, refreshRootListing, disconnect } = useRemoteStorage();
  const { downloadAllData, isDownloading } = useDownloadAllData(storage, userAddress);
  const { theme, setTheme } = useTheme();
  const { canInstall, install } = useInstallPrompt();
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !storage) { setAvatarUrl(null); return; }
    storage.getFile("profile/data.json").then((result: { data?: string | ArrayBuffer; mimeType?: string } | null) => {
      if (!result?.data) return;
      const text = typeof result.data === "string" ? result.data : new TextDecoder().decode(result.data);
      const profile = JSON.parse(text);
      if (typeof profile?.avatarDataUrl === "string") setAvatarUrl(profile.avatarDataUrl);
    }).catch(() => {});
  }, [connected, storage]);

  const createNewFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (!name || !storage) return;
    try {
      await storage.createRootFolder(name);
      setShowFolderModal(false);
      setNewFolderName("");
      refreshRootListing();
      toast.success(`Folder "${name}" created successfully!`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to create folder: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [newFolderName, storage, refreshRootListing]);

  const categories = useMemo(() => rootListing ?? [], [rootListing]);

  const profileDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Profile" className="size-9 shrink-0 overflow-hidden rounded-full">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
          ) : (
            <User className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right">
        {connected && userAddress ? (
          <>
            <div className="px-2 py-1.5 text-sm text-muted-foreground truncate max-w-[200px]">
              {userAddress}
            </div>
            <DropdownMenuSeparator />
          </>
        ) : null}
        {connected && storage ? (
          <>
            <DropdownMenuItem
              onClick={() => downloadAllData()}
              disabled={isDownloading}
              className="flex items-center gap-2"
            >
              <Download className="size-4" />
              {isDownloading ? "Downloading…" : "Download All Data"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        {canInstall && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={install}>
              <DownloadIcon className="size-4" />
              Add to home screen
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("light")} className={theme === "light" ? "bg-accent" : ""}>
          <SunIcon className="size-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className={theme === "dark" ? "bg-accent" : ""}>
          <MoonIcon className="size-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className={theme === "system" ? "bg-accent" : ""}>
          <MonitorIcon className="size-4" />
          System
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {connected ? (
          <DropdownMenuItem onClick={disconnect}>
            <LogOut className="size-4" />
            Disconnect
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/connect">
              <LogIn className="size-4" />
              Connect
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <Sidebar collapsible="offcanvas" variant="inset">
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <div className="flex items-start justify-between gap-2">
            <AccountInfo userAddress={userAddress} storage={storage} onDisconnect={disconnect} />
            <div className="hidden md:block shrink-0">{profileDropdown}</div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="flex-1 overflow-y-auto min-h-0">
            <SidebarGroupContent>
              <CategoriesNav categories={categories} fetchListing={fetchListing} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2" />
      </Sidebar>

      <Dialog open={showFolderModal} onOpenChange={setShowFolderModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Root Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder (e.g., &quot;photos&quot;, &quot;documents&quot;, &quot;music&quot;)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="my-folder"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createNewFolder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderModal(false)}>
              Cancel
            </Button>
            <Button onClick={createNewFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

// Mobile top header — shown on small screens on the home page
const MobileTopHeader = memo(function MobileTopHeader() {
  const { connected, userAddress, storage, disconnect } = useRemoteStorage();
  const { downloadAllData, isDownloading } = useDownloadAllData(storage, userAddress);
  const { theme, setTheme } = useTheme();
  const { canInstall, install } = useInstallPrompt();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !storage) { setAvatarUrl(null); return; }
    storage.getFile("profile/data.json").then((result: { data?: string | ArrayBuffer; mimeType?: string } | null) => {
      if (!result?.data) return;
      const text = typeof result.data === "string" ? result.data : new TextDecoder().decode(result.data);
      const profile = JSON.parse(text);
      if (typeof profile?.avatarDataUrl === "string") setAvatarUrl(profile.avatarDataUrl);
    }).catch(() => {});
  }, [connected, storage]);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border px-4">
      <span className="flex-1 font-bold text-foreground">Inspektor</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Profile" className="size-9 shrink-0 overflow-hidden rounded-full">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
            ) : (
              <User className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {connected && userAddress ? (
            <>
              <div className="px-2 py-1.5 text-sm text-muted-foreground truncate max-w-[200px]">
                {userAddress}
              </div>
              <DropdownMenuSeparator />
            </>
          ) : null}
          {connected && storage ? (
            <>
              <DropdownMenuItem
                onClick={() => downloadAllData()}
                disabled={isDownloading}
                className="flex items-center gap-2"
              >
                <Download className="size-4" />
                {isDownloading ? "Downloading…" : "Download All Data"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          {canInstall && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={install}>
                <DownloadIcon className="size-4" />
                Add to home screen
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme("light")} className={theme === "light" ? "bg-accent" : ""}>
            <SunIcon className="size-4" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")} className={theme === "dark" ? "bg-accent" : ""}>
            <MoonIcon className="size-4" />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")} className={theme === "system" ? "bg-accent" : ""}>
            <MonitorIcon className="size-4" />
            System
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {connected ? (
            <DropdownMenuItem onClick={disconnect}>
              <LogOut className="size-4" />
              Disconnect
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link href="/connect">
                <LogIn className="size-4" />
                Connect
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
});

// Thin shell — only re-renders when children (page content) changes
export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const showTopHeader = pathname !== "/inspect";

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-svh w-full">
        <AppSidebar />
        <SidebarRail />
        <SidebarInset>
          {showTopHeader && isMobile && <MobileTopHeader />}
          <main className="@container flex-1 overflow-auto px-0 py-0 md:px-8 md:pt-2 md:pb-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
