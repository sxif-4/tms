import { createFileRoute } from "@tanstack/react-router";
import { FerryBookPage } from "~/features/ferry-browsing/pages/ferry-book-page";

export const Route = createFileRoute("/ferry/book")({
  component: FerryBookPage,
});
