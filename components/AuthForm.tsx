"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AuthFormProps = { mode: "login" | "register" };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? {
            name: String(form.get("name") ?? ""),
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          }
        : {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push("/home");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <main className="flex min-h-screen flex-col bg-[#f7f7f5]">
      <div className="flex items-center gap-2 px-6 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#37352f] text-lg font-bold text-white">
          N
        </span>
        <span className="text-sm font-medium text-[#37352f]">Notion-ref</span>
      </div>

      <div className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center">
        <div className="w-full max-w-sm">
          <h1 className="mb-1 text-center text-3xl font-semibold tracking-tight text-[#37352f]">
            {isRegister ? "Create your workspace" : "Welcome back"}
          </h1>
          <p className="mb-7 text-center text-sm text-[#787774]">
            {isRegister
              ? "Start writing, organizing, and sharing ideas."
              : "Sign in to continue to your workspace."}
          </p>

          <form
            onSubmit={submit}
            className="space-y-4 rounded-lg border border-[#e9e9e7] bg-white p-6 shadow-sm"
          >
            {isRegister && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-[#37352f]"
                >
                  Your name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  minLength={2}
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  className="w-full rounded-md border border-[#e0e0de] bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#a3a3a0] focus:border-[#37352f] focus:ring-1 focus:ring-[#37352f]"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-[#37352f]"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-md border border-[#e0e0de] bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#a3a3a0] focus:border-[#37352f] focus:ring-1 focus:ring-[#37352f]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-[#37352f]"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={isRegister ? 8 : 1}
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder="••••••••"
                className="w-full rounded-md border border-[#e0e0de] bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#a3a3a0] focus:border-[#37352f] focus:ring-1 focus:ring-[#37352f]"
              />
              {isRegister && (
                <p className="mt-1 text-xs text-[#9b9a97]">
                  At least 8 characters
                </p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#37352f] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1f1e1d] disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : isRegister
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#787774]">
            {isRegister ? "Already have an account? " : "New here? "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-medium text-[#37352f] underline underline-offset-2"
            >
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>

          {!isRegister && (
            <p className="mt-6 rounded-lg border border-[#e9e9e7] bg-white/70 px-4 py-3 text-center text-xs text-[#787774]">
              Demo account: <strong>alex@example.com</strong> /{" "}
              <strong>password123</strong>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
