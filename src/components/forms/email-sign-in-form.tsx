"use client";

import { Mail } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type EmailSignInFormProps = {
  /** Sends the sign-in link; resolves to an error message, or null when the email went out. */
  onSubmit: (email: string) => Promise<string | null>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email-link sign-in, the fallback to Google (live mode). */
export default function EmailSignInForm({ onSubmit }: EmailSignInFormProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sentToEmail, setSentToEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const errorMessage = await onSubmit(trimmedEmail);
      if (errorMessage) {
        setEmailError(errorMessage);
      } else {
        setSentToEmail(trimmedEmail);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sentToEmail) {
    return (
      <p role="status" className="rounded-md bg-muted px-3 py-2 text-sm">
        Check <strong>{sentToEmail}</strong> for a sign-in link. You can close this tab.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-3">
      <Field data-invalid={Boolean(emailError)}>
        <FieldLabel htmlFor="sign-in-email">Work email</FieldLabel>
        <Input
          id="sign-in-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(null);
          }}
          aria-invalid={Boolean(emailError)}
        />
        <FieldDescription>We&rsquo;ll email you a one-time sign-in link.</FieldDescription>
        <FieldError>{emailError}</FieldError>
      </Field>
      <Button type="submit" variant="outline" disabled={isSubmitting}>
        <Mail aria-hidden />
        Email me a sign-in link
      </Button>
    </form>
  );
}
