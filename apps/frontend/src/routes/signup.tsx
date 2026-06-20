import { createFileRoute, redirect } from '@tanstack/react-router';
import { AuthLayout, SignupForm, landingPathForRole } from '~/features/auth';

export const Route = createFileRoute('/signup')({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: landingPathForRole(context.user.role) });
    }
  },
  component: SignupPage,
});

function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
