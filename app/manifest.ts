import type { MetadataRoute } from "next";

export default function manifest() {
  return {
    name: "Inspektor",
    short_name: "Inspektor",
    description: "Inspect the contents of your remoteStorage",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    orientation: "portrait-primary",
    scope: "/",
    categories: ["utilities", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-mobile.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
        label: "Inspektor home screen",
      },
    ],
    // Web Share Target — files are handled entirely by the service worker
    // so they never hit the server (no body-size limit issues).
    share_target: {
      action: "/share-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
        files: [
          {
            name: "files",
            accept: ["*/*"],
          },
        ],
      },
    },
  } satisfies MetadataRoute.Manifest & { share_target: unknown };
}
