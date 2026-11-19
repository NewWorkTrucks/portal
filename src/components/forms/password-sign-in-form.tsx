"use client";

import { LogIn } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type PasswordSignInFormProps = {
  /** Signs in; resolves to an error message, or null when it worked. */
  onSubmit: (email: string, password: string) => Promise<string | null>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email and password sign-in (live mode). Accounts are created by an admin. */
export default function PasswordSignInForm({
  onSubmit,
}: PasswordSignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    const isEmailValid = EMAIL_PATTERN.test(trimmedEmail);
    setEmailError(isEmailValid ? null : "Enter a valid email address.");
    setPasswordError(password ? null : "Enter your password.");
    if (!isEmailValid || !password) {
      return;
    }

    setIsSubmitting(true);
    setSignInError(null);
    try {
      const errorMessage = await onSubmit(trimmedEmail, password);
      if (errorMessage) {
        setSignInError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmitForm}
      noValidate
      className="flex flex-col gap-3"
    >
      <Field data-invalid={Boolean(emailError)}>
        <FieldLabel htmlFor="sign-in-email">Work email</FieldLabel>
        <Input
          id="sign-in-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(null);
          }}
          aria-invalid={Boolean(emailError)}
          autoFocus
        />
        <FieldError>{emailError}</FieldError>
      </Field>
      <Field data-invalid={Boolean(passwordError)}>
        <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
        <Input
          id="sign-in-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setPasswordError(null);
          }}
          aria-invalid={Boolean(passwordError)}
        />
        <FieldError>{passwordError}</FieldError>
      </Field>
      {signInError && (
        <p role="alert" className="text-sm text-destructive">
          {signInError}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        <LogIn aria-hidden />
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-xs text-muted-foreground">
        No account, or forgot your password? Ask your portal admin.
      </p>
    </form>
  );
}
