"use client";

import {
  ChangeEvent,
  ClipboardEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const CODE_LENGTH = 6;

interface ConfirmRegistrationFormProps {
  email: string;
}

export function ConfirmRegistrationForm({ email }: ConfirmRegistrationFormProps) {
  const { confirmRegistration, resendConfirmation } = useAuth();
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = useMemo(() => digits.join(""), [digits]);
  const isComplete = code.length === CODE_LENGTH && digits.every((d) => /^\d$/.test(d));

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const focusInput = (index: number) => {
    const el = inputsRef.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < CODE_LENGTH - 1) focusInput(index + 1);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    } else if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault();
      focusInput(index + 1);
    } else if (event.key === "Enter" && isComplete) {
      event.preventDefault();
      submit();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(text)) return;
    event.preventDefault();
    const chars = text.slice(0, CODE_LENGTH).split("");
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((c, i) => {
        next[i] = c;
      });
      return next;
    });
    focusInput(Math.min(chars.length, CODE_LENGTH - 1));
  };

  const submit = () => {
    if (!isComplete || confirmRegistration.isPending) return;
    confirmRegistration.mutate({ email, code });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleResend = () => {
    if (cooldown > 0 || resendConfirmation.isPending) return;
    resendConfirmation.mutate(
      { email },
      {
        onSuccess: (data) => {
          setCooldown(data?.retry_after ?? 60);
          setDigits(Array(CODE_LENGTH).fill(""));
          focusInput(0);
        },
        onError: (err: any) => {
          const wait = err?.response?.data?.retry_after;
          if (typeof wait === "number") setCooldown(wait);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Code envoyé à</span>
        </div>
        <div className="mt-1 truncate font-medium text-foreground">{email || "votre email"}</div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Code de confirmation</legend>
        <div className="flex justify-between gap-2 sm:gap-3" role="group" aria-label="Code à 6 chiffres">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              onFocus={(e) => e.target.select()}
              aria-label={`Chiffre ${index + 1} sur ${CODE_LENGTH}`}
              className={cn(
                "h-14 w-full rounded-lg border border-input bg-background text-center text-2xl font-semibold tabular-nums shadow-sm transition-all focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                digit && "border-primary/60 bg-primary/5"
              )}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Le code expire après quelques minutes. Vérifiez aussi vos spams si vous ne le voyez pas.
        </p>
      </fieldset>

      <Button type="submit" className="w-full gap-2" disabled={!isComplete || confirmRegistration.isPending}>
        {confirmRegistration.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        {confirmRegistration.isPending ? "Vérification..." : "Confirmer mon compte"}
      </Button>

      <div className="flex flex-col items-center gap-2 border-t pt-4 text-sm">
        <span className="text-muted-foreground">Vous n'avez rien reçu ?</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleResend}
          disabled={cooldown > 0 || resendConfirmation.isPending || !email}
        >
          {resendConfirmation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : "Renvoyer le code"}
        </Button>
      </div>
    </form>
  );
}
