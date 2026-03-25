"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PanelRightOpenIcon,
  ShareIcon,
  QrCodeIcon,
  ListIcon,
  CodeIcon,
  EyeIcon,
  PencilIcon,
  BracesIcon,
  TrashIcon,
  X,
  MoreVertical,
} from "lucide-react";
import { useRemoteStorage } from "@/contexts/RemoteStorageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { FilePreview } from "@/components/FilePreview";
import { ShareDialog } from "@/components/ShareDialog";
import { humanFileSize } from "@/lib/human-file-size";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { StorageItem } from "@/lib/remotestorage";

export function InspectPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathParam = searchParams.get("path") ?? "";
  const { storage, fetchListing } = useRemoteStorage();

  const [metaData, setMetaData] = useState<StorageItem | null>(null);
  const [currentDirPath, setCurrentDirPath] = useState("/");
  const [infoSheetOpen, setInfoSheetOpen] = useState(false);
  const [jsonView, setJsonView] = useState<"tree" | "source">("tree");
  const [documentShowEditor, setDocumentShowEditor] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const isMobile = useIsMobile();

  const documentIsJSON = !!metaData?.type?.match(/application\/json/i);
  const documentIsEditable = documentIsJSON;
  const publicItemURL = storage && metaData?.path?.match(/public\//) ? storage.getItemURL(metaData.path) : null;

  useEffect(() => {
    if (!pathParam || !storage) {
      setMetaData(null);
      return;
    }
    const path = pathParam.endsWith("/") ? pathParam.slice(0, -1) : pathParam;
    const match = path.match(/^(.*\/)(.+)$/);
    const parentPath = match ? match[1] : "";
    const documentName = match ? match[2] : path;

    const normalizedParent = parentPath || "";
    setCurrentDirPath(normalizedParent || "/");

    fetchListing(normalizedParent).then((items) => {
      const found = items.find((item) => item.name === documentName || item.name === documentName + "/");
      setMetaData(found ?? null);
    }).catch(() => setMetaData(null));
  }, [pathParam, storage, fetchListing]);

  const deleteItem = useCallback(() => {
    if (!storage || !metaData) return;
    storage.remove(metaData.path).then(() => {
      router.push(currentDirPath === "/" ? "/" : `/?path=${encodeURIComponent(currentDirPath)}`);
    });
  }, [storage, metaData, currentDirPath, router]);


  if (!metaData) {
    return <div className="p-4">Loading…</div>;
  }

  const docMeta = {
    name: metaData.name.replace(/\/$/, ""),
    type: metaData.type,
    size: metaData.size,
    path: metaData.path,
    etag: metaData.etag,
    isBinary: metaData.isBinary,
  };

  return (
    <>
      <header className="flex h-14 shrink-0 w-full items-center gap-4 border-b px-4 md:grid md:grid-cols-[1.618fr_3rem_1fr] md:px-6">
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <span className="block flex-1 min-w-0 truncate font-medium text-foreground md:hidden" title={docMeta.name}>
            {docMeta.name}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 md:hidden"
            aria-label="Close file"
            onClick={() => router.push(currentDirPath === "/" ? "/" : `/?path=${encodeURIComponent(currentDirPath)}`)}
          >
            <X className="size-4" />
          </Button>
          <div className="hidden md:block flex-1 min-w-0">
            <BreadcrumbNav currentDirPath={currentDirPath} />
          </div>
        </div>
        <nav className="flex items-center gap-2 justify-end md:col-start-3" aria-label="Document actions">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="md:hidden"
                aria-label="Document actions"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setInfoSheetOpen(true)}>
                <PanelRightOpenIcon className="size-4" />
                File info
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowRaw((v) => !v)}>
                <BracesIcon className="size-4" />
                {showRaw ? "Hide raw data" : "Show raw data"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmDeleteOpen(true)}>
                <TrashIcon className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="hidden md:flex flex-wrap gap-2 justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setInfoSheetOpen(true)}
              title="File info"
            >
              <PanelRightOpenIcon className="size-4" />
              Info
            </Button>
            {publicItemURL && (
              <Button size="sm" onClick={() => setShareDialogOpen(true)}>
                <QrCodeIcon className="size-4" />
                Share
              </Button>
            )}
            {documentIsJSON && (
              <div className="flex rounded-md border" role="group">
                <Button
                  size="sm"
                  variant={jsonView === "tree" ? "secondary" : "ghost"}
                  className="rounded-r-none border-0"
                  onClick={() => setJsonView("tree")}
                >
                  <ListIcon className="size-4" />
                  Tree
                </Button>
                <Button
                  size="sm"
                  variant={jsonView === "source" ? "secondary" : "ghost"}
                  className="rounded-l-none border-0 border-l"
                  onClick={() => setJsonView("source")}
                >
                  <CodeIcon className="size-4" />
                  Source
                </Button>
              </div>
            )}
            {documentIsEditable && (
              <div className="flex rounded-md border" role="group">
                <Button
                  size="sm"
                  variant={!documentShowEditor ? "secondary" : "ghost"}
                  className="rounded-r-none border-0"
                  onClick={() => setDocumentShowEditor(false)}
                >
                  <EyeIcon className="size-4" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant={documentShowEditor ? "secondary" : "ghost"}
                  className="rounded-l-none border-0 border-l"
                  onClick={() => setDocumentShowEditor(true)}
                >
                  <PencilIcon className="size-4" />
                  Edit
                </Button>
              </div>
            )}
            <Button
              size="sm"
              variant={showRaw ? "secondary" : "ghost"}
              onClick={() => setShowRaw((v) => !v)}
              title="Raw data"
            >
              <BracesIcon className="size-4" />
              Raw
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="More actions">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem variant="destructive" onClick={() => setConfirmDeleteOpen(true)}>
                  <TrashIcon className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 mb-12 md:mb-0 md:overflow-auto">
          <section className="border-t border-border pt-6 overflow-hidden">
            <FilePreview
            metaData={docMeta}
            storage={storage}
            isJSON={documentIsJSON}
            showEditor={documentShowEditor}
            showRaw={showRaw}
            jsonShowTree={jsonView === "tree"}
            jsonShowSource={jsonView === "source"}
            onToggleJsonTree={() => setJsonView("tree")}
            onToggleJsonSource={() => setJsonView("source")}
            onShowEditor={() => setDocumentShowEditor(true)}
            onCancelEditor={() => setDocumentShowEditor(false)}
          />
          </section>
        </div>

        {/* Desktop: file info sidebar */}
        <aside
          className="hidden md:flex md:w-72 md:shrink-0 md:flex-col md:border-l md:border-border md:bg-muted/30"
          aria-label="File information"
        >
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground mb-3">File info</h2>
            <dl className="m-0 space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Content type</dt>
                <dd className="m-0 text-sm">{docMeta.type}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Size</dt>
                <dd className="m-0 text-sm">{humanFileSize(docMeta.size)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Revision (ETag)</dt>
                <dd className="m-0 text-sm font-mono text-muted-foreground break-all">{docMeta.etag ?? "—"}</dd>
              </div>
            </dl>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-2">
            <Button
              size="sm"
              variant={showRaw ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setShowRaw((v) => !v)}
            >
              <BracesIcon className="size-4 mr-2" />
              Raw data
            </Button>
            {publicItemURL && (
              <Button size="sm" className="w-full justify-start" onClick={() => setShareDialogOpen(true)}>
                <QrCodeIcon className="size-4 mr-2" />
                Share
              </Button>
            )}
            {documentIsJSON && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setJsonView("tree")}
                >
                  <ListIcon className="size-4 mr-2" />
                  Tree
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setJsonView("source")}
                >
                  <CodeIcon className="size-4 mr-2" />
                  Source
                </Button>
              </>
            )}
            {documentIsEditable && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setDocumentShowEditor(false)}
                >
                  <EyeIcon className="size-4 mr-2" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setDocumentShowEditor(true)}
                >
                  <PencilIcon className="size-4 mr-2" />
                  Edit
                </Button>
              </>
            )}
          </div>
        </aside>
      </div>

      <Sheet open={infoSheetOpen} onOpenChange={setInfoSheetOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "left"}
          className={isMobile ? "rounded-t-xl" : "w-80 sm:max-w-sm"}
        >
          <SheetHeader>
            <SheetTitle>File info</SheetTitle>
          </SheetHeader>
          <dl className="m-0 px-4 pb-4 space-y-4">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Content type</dt>
              <dd className="m-0 text-sm">{docMeta.type}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Size</dt>
              <dd className="m-0 text-sm">{humanFileSize(docMeta.size)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Revision (ETag)</dt>
              <dd className="m-0 text-sm font-mono text-muted-foreground break-all">{docMeta.etag ?? "—"}</dd>
            </div>
          </dl>
          <div className="border-t border-border px-4 py-4 space-y-2">
            <Button
              size="sm"
              variant={showRaw ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => { setShowRaw((v) => !v); setInfoSheetOpen(false); }}
            >
              <BracesIcon className="size-4 mr-2" />
              Raw data
            </Button>
            {publicItemURL && (
              <Button size="sm" className="w-full justify-start" onClick={() => setShareDialogOpen(true)}>
                <QrCodeIcon className="size-4 mr-2" />
                Share
              </Button>
            )}
            {documentIsJSON && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => { setJsonView("tree"); setInfoSheetOpen(false); }}
                >
                  <ListIcon className="size-4 mr-2" />
                  Tree
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => { setJsonView("source"); setInfoSheetOpen(false); }}
                >
                  <CodeIcon className="size-4 mr-2" />
                  Source
                </Button>
              </>
            )}
            {documentIsEditable && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => { setDocumentShowEditor(false); setInfoSheetOpen(false); }}
                >
                  <EyeIcon className="size-4 mr-2" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => { setDocumentShowEditor(true); setInfoSheetOpen(false); }}
                >
                  <PencilIcon className="size-4 mr-2" />
                  Edit
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete &ldquo;{metaData?.name}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={deleteItem}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {publicItemURL && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          url={publicItemURL}
          fileName={docMeta.name}
        />
      )}
    </>
  );
}
