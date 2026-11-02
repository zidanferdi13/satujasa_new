"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UI } from "@/lib/ui-strings";

/** Minimal operator creation form for M1. Full list/edit/delete lives in M3. */
export default function OperatorForm({
  disabled,
  limitMessage,
}: {
  disabled: boolean;
  limitMessage: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/owner/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? UI.addop.failed);
      } else {
        setMessage(UI.addop.success(data.operator.name, data.operator.email));
        setName("");
        setEmail("");
        setPassword("");
        router.refresh();
      }
    } catch {
      setError(UI.common.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/5 rounded-md">{error}</div>
      )}
      {message && (
        <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md">{message}</div>
      )}
      <div className="space-y-2">
        <label htmlFor="operator-name" className="text-sm font-medium">
          {UI.addop.name}
        </label>
        <Input
          id="operator-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={disabled}
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="operator-email" className="text-sm font-medium">
          {UI.addop.email}
        </label>
        <Input
          id="operator-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={disabled}
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="operator-password" className="text-sm font-medium">
          {UI.addop.password}
        </label>
        <Input
          id="operator-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={disabled}
          aria-describedby="operator-password-help"
          minLength={8}
          required
        />
        <p id="operator-password-help" className="text-xs text-muted-foreground">
          {UI.addop.passwordHelp}
        </p>
      </div>
      <Button type="submit" disabled={loading || disabled}>
        {loading ? UI.addop.submitting : UI.addop.submit}
      </Button>
      {/* A16: info styling, not destructive — the package is full, nothing failed. */}
      {disabled && limitMessage ? (
        <p className="p-3 text-sm rounded-md bg-muted text-foreground">{limitMessage}</p>
      ) : null}
    </form>
  );
}
