"use client";

/// <reference path="../types/pretty.d.ts" />
import { useEffect, useState, useCallback, useMemo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { JsonView, defaultStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import pretty from "pretty";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type RemoteStorageService from "@/lib/remotestorage";

type DocumentMetaData = {
  name: string;
  type: string;
  size: number | null;
  path: string;
  etag: string | null;
  isBinary?: boolean;
};

type FilePreviewProps = {
  metaData: DocumentMetaData;
  storage: RemoteStorageService | null;
  isJSON: boolean;
  showEditor: boolean;
  showRaw: boolean;
  jsonShowTree: boolean;
  jsonShowSource: boolean;
  onToggleJsonTree: () => void;
  onToggleJsonSource: () => void;
  onShowEditor: () => void;
  onCancelEditor: () => void;
};

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|svg|bmp|ico|avif|tiff?)$/i;
const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|aac|flac|m4a|wma|opus|webm)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogv|mov|avi|mkv)$/i;
const PDF_EXTENSION = /\.pdf$/i;

export function FilePreview({
  metaData,
  storage,
  isJSON,
  showEditor,
  showRaw,
  jsonShowTree,
  jsonShowSource,
  onToggleJsonTree,
  onToggleJsonSource,
  onShowEditor,
  onCancelEditor,
}: FilePreviewProps) {
  const [loaded, setLoaded] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState<string | null>(null);
  const [objectURL, setObjectURL] = useState<string | null>(null);
  const [editedJson, setEditedJson] = useState("");
  const [uploading, setUploading] = useState(false);

  const isImage = /^image\/.+/.test(metaData.type) || IMAGE_EXTENSIONS.test(metaData.name);
  const isAudio = /^audio\/.+/.test(metaData.type) || AUDIO_EXTENSIONS.test(metaData.name);
  const isVideo = /^video\/.+/.test(metaData.type) || VIDEO_EXTENSIONS.test(metaData.name);
  const isPDF = /^application\/pdf/.test(metaData.type) || PDF_EXTENSION.test(metaData.name);
  const isBinary = metaData.isBinary === true || metaData.type === "folder" || /charset=binary/.test(metaData.type);
  const isText = !isBinary;
  const isHTML =
    /html/i.test(metaData.type) ||
    metaData.name.endsWith(".html") ||
    metaData.name.endsWith(".htm");

  const prettyJson = useMemo(() => {
    if (!fileContent || !isJSON) return null;
    try {
      return JSON.stringify(JSON.parse(fileContent), null, 2);
    } catch {
      return fileContent;
    }
  }, [fileContent, isJSON]);

  const prettyHtml = useMemo(() => {
    if (!fileContent || !isHTML) return null;
    try {
      return pretty(fileContent);
    } catch {
      return fileContent;
    }
  }, [fileContent, isHTML]);

  // Reset state when file changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on path change
  useEffect(() => {
    setLoaded(false);
    setFileContent(null);
    setRawContent(null);
    setObjectURL((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setEditedJson("");
  }, [metaData.path]);

  useEffect(() => {
    if (!metaData.path || !storage || loaded) return;
    let cancelled = false;
    const path = metaData.path;
    const needsBlobURL = isImage || isPDF || isAudio || isVideo;

    storage.getFile(path).then((file: { data: string | ArrayBuffer; contentType?: string }) => {
      if (cancelled || !file) { if (!cancelled) setLoaded(true); return; }
      const data = file.data;
      if (needsBlobURL && data instanceof ArrayBuffer) {
        let mimeType = file.contentType || "application/octet-stream";
        if (isPDF) mimeType = "application/pdf";
        else if (isAudio && !/^audio\//.test(mimeType)) mimeType = "audio/mpeg";
        else if (isVideo && !/^video\//.test(mimeType)) mimeType = "video/mp4";
        const blob = new Blob([data], { type: mimeType });
        setObjectURL(URL.createObjectURL(blob));
        const bytes = new Uint8Array(data);
        const hex = Array.from(bytes.slice(0, 4096))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ");
        setRawContent(hex + (bytes.length > 4096 ? `\n\n… (${bytes.length.toLocaleString()} bytes total)` : ""));
      } else if (typeof data === "string") {
        setFileContent(data);
        setRawContent(data);
      } else if (data instanceof ArrayBuffer) {
        const dec = new TextDecoder();
        const text = dec.decode(data);
        setFileContent(text);
        setRawContent(text);
      }
      setLoaded(true);
    }).catch(() => { if (!cancelled) setLoaded(true); });

    return () => { cancelled = true; };
  }, [metaData.path, storage, loaded, isImage, isPDF, isAudio, isVideo]);

  const saveChanges = useCallback(() => {
    if (!storage || !isJSON) return;
    setUploading(true);
    storage.storeFile(metaData.path, "application/json", editedJson)
      .then(() => {
        setFileContent(editedJson);
        onCancelEditor();
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to save.");
      })
      .finally(() => setUploading(false));
  }, [storage, metaData.path, isJSON, jsonShowTree, editedJson, onCancelEditor]);

  useEffect(() => {
    if (loaded && isJSON && fileContent) setEditedJson(JSON.stringify(JSON.parse(fileContent), null, 2));
  }, [loaded, isJSON, fileContent]);

  if (!loaded) return <p className="p-4">Loading…</p>;

  // Raw data view — show underlying content for any file type
  if (showRaw && rawContent !== null) {
    return (
      <div className="overflow-auto rounded-md text-[0.9rem] [&_pre]:!p-4 [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!whitespace-pre-wrap [&_pre]:!break-words [&_code]:!whitespace-pre-wrap [&_code]:!break-words [&>div]:!whitespace-pre-wrap [&>div]:!break-words">
        <SyntaxHighlighter language="plaintext" style={oneLight} showLineNumbers PreTag="div" customStyle={{ margin: 0 }}>
          {rawContent}
        </SyntaxHighlighter>
      </div>
    );
  }

  // Image preview (works for both binary and text-detected-by-extension)
  if (isImage && objectURL) {
    return <img src={objectURL} alt={metaData.name} className="max-w-full h-auto p-4" />;
  }

  // PDF preview
  if (isPDF && objectURL) {
    return (
      <iframe
        src={objectURL}
        title={metaData.name}
        className="w-full h-[calc(100dvh-8rem)] border-0"
      />
    );
  }

  // Audio preview
  if (isAudio && objectURL) {
    return <audio src={objectURL} controls className="w-full p-4" />;
  }

  // Video preview
  if (isVideo && objectURL) {
    return <video src={objectURL} controls className="max-w-full p-4" />;
  }

  if (isBinary) {
    return <p className="p-4 text-muted-foreground">No preview available for this content type.</p>;
  }

  if (isText) {
    if (isJSON && (jsonShowTree || jsonShowSource)) {
      let parsed: unknown = null;
      try {
        parsed = fileContent ? JSON.parse(fileContent) : null;
      } catch {
        // ignore
      }
      if (showEditor) {
        return (
          <div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={saveChanges} disabled={uploading}>
                Save changes
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEditor} disabled={uploading}>
                Cancel editing
              </Button>
            </div>
            <textarea
              className="flex min-h-64 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-[1rem] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-2"
              value={editedJson}
              onChange={(e) => setEditedJson(e.target.value)}
              spellCheck={false}
            />
          </div>
        );
      }
      if (jsonShowTree && parsed !== null && typeof parsed === "object") {
        return (
          <div id="json-tree-view" className="overflow-auto text-[1rem]">
            <JsonView data={parsed as object} shouldExpandNode={(l) => l < 2} style={defaultStyles} />
          </div>
        );
      }
      return (
        <div className="overflow-auto rounded-md text-[0.9rem] [&_pre]:!p-4 [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!whitespace-pre-wrap [&_pre]:!break-words [&_code]:!whitespace-pre-wrap [&_code]:!break-words [&>div]:!whitespace-pre-wrap [&>div]:!break-words">
          <SyntaxHighlighter language="json" style={oneLight} showLineNumbers PreTag="div" customStyle={{ margin: 0 }}>
            {prettyJson ?? fileContent ?? ""}
          </SyntaxHighlighter>
        </div>
      );
    }
    if (isHTML && prettyHtml) {
      return (
        <div className="overflow-auto rounded-md text-[0.9rem] [&_pre]:!p-4 [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!whitespace-pre-wrap [&_pre]:!break-words [&_code]:!whitespace-pre-wrap [&_code]:!break-words [&>div]:!whitespace-pre-wrap [&>div]:!break-words">
          <SyntaxHighlighter language="html" style={oneLight} showLineNumbers PreTag="div" customStyle={{ margin: 0 }}>
            {prettyHtml}
          </SyntaxHighlighter>
        </div>
      );
    }
    return (
      <div className="overflow-auto rounded-md text-[0.9rem] [&_pre]:!p-4 [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!whitespace-pre-wrap [&_pre]:!break-words [&_code]:!whitespace-pre-wrap [&_code]:!break-words [&>div]:!whitespace-pre-wrap [&>div]:!break-words">
        <SyntaxHighlighter language="plaintext" style={oneLight} showLineNumbers PreTag="div" customStyle={{ margin: 0 }}>
          {fileContent ?? ""}
        </SyntaxHighlighter>
      </div>
    );
  }

  return null;
}
