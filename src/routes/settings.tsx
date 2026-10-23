import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  beforeLoad: () => {
    throw redirect({ to: "/profile", search: { settings: "1" } });
  },
  head: () => ({
    meta: [{ title: "設定 · 心事 Bestie" }],
  }),
});
