import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/park/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/dashboard/park/"!</div>;
}
