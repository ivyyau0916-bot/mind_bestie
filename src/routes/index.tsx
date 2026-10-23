import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/chat" });
  },
  head: () => ({
    meta: [
      { title: "心事 Bestie" },
      { name: "description", content: "AI 情緒傾訴與心情紀錄，用天氣記下每一天的心情。" },
      { property: "og:title", content: "心事 Bestie" },
      { property: "og:description", content: "AI 情緒傾訴與心情紀錄，用天氣記下每一天的心情。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
