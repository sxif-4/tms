import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { getErrorMessage, getErrorStatus, loginRequest } from "../api";
import { meQueryOptions } from "../queries";
import { landingPathForRole } from "../redirects";
import { loginSchema, type LoginValues } from "../schemas";
import { SocialLogins } from "./social-logins";

export function LoginForm({
  redirectTo,
  className,
}: {
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: async (user) => {
      queryClient.setQueryData(meQueryOptions.queryKey, user);
      await router.invalidate();
      toast.success(`Welcome back, ${user.name}`);
      await navigate({ to: redirectTo || landingPathForRole(user.role) });
    },
    onError: (err) =>
      toast.error(
        getErrorStatus(err) === 401
          ? "Invalid email or password"
          : getErrorMessage(err),
      ),
  });

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      noValidate
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to sign in
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            {...register("email")}
          />
          <FieldError>{errors.email?.message}</FieldError>
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          <FieldError>{errors.password?.message}</FieldError>
        </Field>
        <Field>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Signing in…" : "Sign in"}
          </Button>
        </Field>
        <SocialLogins />
        <FieldDescription className="text-center">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="underline underline-offset-4">
            Sign up
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
