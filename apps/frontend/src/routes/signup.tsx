import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AuthLayout,
  SignupForm,
  landingPathForRole,
  loginSearchSchema,
} from "~/features/auth";

export const Route = createFileRoute("/signup")({
  validateSearch: loginSearchSchema,
  beforeLoad: ({ context, search }) => {
    if (context.user) {
      throw redirect({
        to: search.redirect || landingPathForRole(context.user.role),
      });
    }
  },
  component: SignupPage,
});

function SignupPage() {
  const search = Route.useSearch();
  return (
    <AuthLayout>
      <SignupForm redirectTo={search.redirect} />
    </AuthLayout>
  );
}
