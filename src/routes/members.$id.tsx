import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/members/$id")({
  component: () => null,
});
