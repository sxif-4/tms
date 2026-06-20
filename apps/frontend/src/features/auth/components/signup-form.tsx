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
import { getErrorMessage, getErrorStatus, registerRequest } from "../api";
import { meQueryOptions } from "../queries";
import { landingPathForRole } from "../redirects";
import { signupSchema, type SignupValues } from "../schemas";
import { SocialLogins } from "./social-logins";

export function SignupForm({ className }: { className?: string }) {
  const router = useRouter();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  const mutation = useMutation({
    mutationFn: (values: SignupValues) =>
      registerRequest({
        name: values.name,
        email: values.email,
        password: values.password,
      }),
    onSuccess: async (user) => {
      queryClient.setQueryData(meQueryOptions.queryKey, user);
      await router.invalidate();
      toast.success(`Welcome, ${user.name}!`);
      await navigate({ to: landingPathForRole(user.role) });
    },
    onError: (err) =>
      toast.error(
        getErrorStatus(err) === 409
          ? "That email is already registered"
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
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Book hotels, ferries and theme-park tickets
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input id="name" autoComplete="name" {...register("name")} />
          <FieldError>{errors.name?.message}</FieldError>
        </Field>
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
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
          <FieldError>{errors.password?.message}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          <FieldError>{errors.confirmPassword?.message}</FieldError>
        </Field>
        <Field>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating account…" : "Create account"}
          </Button>
        </Field>
        <SocialLogins />
        <FieldDescription className="text-center">
          Already have an account?{" "}
          <Link to="/login" className="underline underline-offset-4">
            Sign in
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
