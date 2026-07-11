import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  getErrorMessage,
  getErrorStatus,
  loginRequest,
  registerRequest,
} from "~/features/auth/api";
import { meQueryOptions } from "~/features/auth/queries";
import { loginSchema, signupSchema, type LoginValues, type SignupValues } from "~/features/auth/schemas";

export function InlineAuthPanel({
  defaultName = "",
  defaultEmail = "",
  onSuccess,
}: {
  defaultName?: string;
  defaultEmail?: string;
  onSuccess: () => void;
}) {
  const [tab, setTab] = useState<"login" | "signup">("signup");
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: defaultEmail, password: "" },
  });

  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: {
      name: defaultName,
      email: defaultEmail,
      password: "",
      confirmPassword: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: async (user) => {
      queryClient.setQueryData(meQueryOptions.queryKey, user);
      await router.invalidate();
      toast.success(`Welcome back, ${user.name}`);
      onSuccess();
    },
    onError: (err) =>
      toast.error(
        getErrorStatus(err) === 401
          ? "Invalid email or password"
          : getErrorMessage(err),
      ),
  });

  const signupMutation = useMutation({
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
      onSuccess();
    },
    onError: (err) =>
      toast.error(
        getErrorStatus(err) === 409
          ? "That email is already registered"
          : getErrorMessage(err),
      ),
  });

  return (
    <div className="glass-data rounded-xl border p-5">
      <h3 className="font-semibold">Sign in to complete your booking</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Your dates and contact details are saved — just sign in or create an
        account to confirm.
      </p>
      <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="mt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signup">Create account</TabsTrigger>
          <TabsTrigger value="login">Sign in</TabsTrigger>
        </TabsList>
        <TabsContent value="signup" className="mt-4">
          <form
            className="space-y-4"
            onSubmit={signupForm.handleSubmit((values) =>
              signupMutation.mutate(values),
            )}
            noValidate
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="inline-name">Full name</FieldLabel>
                <Input id="inline-name" {...signupForm.register("name")} />
                <FieldError>{signupForm.formState.errors.name?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="inline-signup-email">Email</FieldLabel>
                <Input
                  id="inline-signup-email"
                  type="email"
                  {...signupForm.register("email")}
                />
                <FieldError>{signupForm.formState.errors.email?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="inline-signup-password">Password</FieldLabel>
                <Input
                  id="inline-signup-password"
                  type="password"
                  {...signupForm.register("password")}
                />
                <FieldError>
                  {signupForm.formState.errors.password?.message}
                </FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="inline-confirm">Confirm password</FieldLabel>
                <Input
                  id="inline-confirm"
                  type="password"
                  {...signupForm.register("confirmPassword")}
                />
                <FieldError>
                  {signupForm.formState.errors.confirmPassword?.message}
                </FieldError>
              </Field>
              <Button type="submit" disabled={signupMutation.isPending} className="w-full">
                {signupMutation.isPending ? "Creating account…" : "Create account & book"}
              </Button>
            </FieldGroup>
          </form>
        </TabsContent>
        <TabsContent value="login" className="mt-4">
          <form
            className="space-y-4"
            onSubmit={loginForm.handleSubmit((values) =>
              loginMutation.mutate(values),
            )}
            noValidate
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="inline-login-email">Email</FieldLabel>
                <Input
                  id="inline-login-email"
                  type="email"
                  {...loginForm.register("email")}
                />
                <FieldError>{loginForm.formState.errors.email?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="inline-login-password">Password</FieldLabel>
                <Input
                  id="inline-login-password"
                  type="password"
                  {...loginForm.register("password")}
                />
                <FieldError>
                  {loginForm.formState.errors.password?.message}
                </FieldError>
              </Field>
              <Button type="submit" disabled={loginMutation.isPending} className="w-full">
                {loginMutation.isPending ? "Signing in…" : "Sign in & book"}
              </Button>
            </FieldGroup>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
