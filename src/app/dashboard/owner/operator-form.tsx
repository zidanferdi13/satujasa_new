"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Minimal operator creation form for M1. Full list/edit/delete lives in M3. */
export default function OperatorForm({ disabled }: { disabled: boolean }) {
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
        setError(data.error ?? "Could not create the operator");
      } else {
        setMessage(
          `${data.operator.name} can now sign in with ${data.operator.email}. Give them the password you just set.`
        );
        setName("");
        setEmail("");
        setPassword("");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>}
      {message && <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md">{message}</div>}
      <div className="space-y-2">
        <label htmlFor="operator-name" className="text-sm font-medium">
          Name
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
          Email
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
          Initial password
        </label>
        <Input
          id="operator-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={disabled}
          minLength={8}
          required
        />
        <p className="text-xs text-gray-500">
          At least 8 characters. Share it with the operator; they can change it later.
        </p>
      </div>
      <Button type="submit" disabled={loading || disabled}>
        {loading ? "Creating..." : "Create operator"}
      </Button>
      {disabled && (
        <p className="text-sm text-amber-700">
          Your package has no operator seats left. Upgrade the package to add more.
        </p>
      )}
    </form>
  );
}
