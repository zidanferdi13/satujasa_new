"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UI } from "@/lib/ui-strings";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || UI.reg.failed);
      } else {
        router.push("/login?registered=true");
      }
    } catch {
      setError(UI.common.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{UI.reg.title}</CardTitle>
        <CardDescription>{UI.reg.desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/5 rounded-md">{error}</div>
          )}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              {UI.reg.name}
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {UI.reg.email}
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              {UI.reg.password}
            </label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              aria-describedby="password-help"
              required
            />
            <p id="password-help" className="text-xs text-muted-foreground">
              {UI.reg.passwordHelp}
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="organizationName" className="text-sm font-medium">
              {UI.reg.org}
            </label>
            <Input
              id="organizationName"
              type="text"
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              aria-describedby="org-help"
              required
            />
            <p id="org-help" className="text-xs text-muted-foreground">
              {UI.reg.orgHelp}
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? UI.reg.submitting : UI.reg.submit}
          </Button>
          {/* §18: a statement, not a checkbox — submitting already agrees. Both links open in a
              new tab so a half-filled form survives the read. */}
          <p className="text-center text-sm text-muted-foreground">
            {UI.reg.legalAgree.split(/(\{[^}]+\})/).map((part, index) => {
              const match = /^\{(.+)\}$/.exec(part);
              if (!match) return part;
              const href =
                match[1] === UI.legal.termsTitle ? "/syarat-ketentuan" : "/kebijakan-privasi";
              return (
                <Link
                  key={index}
                  href={href}
                  target="_blank"
                  rel="noopener"
                  className="underline underline-offset-4"
                >
                  {match[1]}
                </Link>
              );
            })}
          </p>
          <p className="text-center text-sm text-muted-foreground">
            {UI.reg.haveAccount}{" "}
            <Link href="/login" className="underline">
              {UI.reg.haveAccountLink}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
