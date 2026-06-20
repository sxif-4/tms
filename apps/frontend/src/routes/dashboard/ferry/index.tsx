import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/ferry/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/dashboard/ferry/"!</div>;
}
