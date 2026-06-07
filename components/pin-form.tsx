"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, KeyRound, Loader2 } from "lucide-react";

export function PinForm() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "PIN tidak valid.");
      window.location.href = "/";
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Tidak dapat memeriksa PIN.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5 px-7 py-7" onSubmit={submit}>
      <div>
        <label className="label" htmlFor="pin">
          PIN aplikasi
        </label>
        <div className="relative">
          <KeyRound
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            size={17}
          />
          <input
            id="pin"
            className="field pl-11 tracking-[0.25em]"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="••••••"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            autoFocus
            required
          />
        </div>
      </div>
      {error ? (
        <p className="rounded-xl border border-danger/20 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <button className="btn-primary w-full" type="submit" disabled={loading}>
        {loading ? <Loader2 className="animate-spin" size={17} /> : null}
        Buka dashboard
        {!loading ? <ArrowRight size={17} /> : null}
      </button>
      <p className="text-center text-xs leading-5 text-muted">
        Session disimpan di cookie HTTP-only dan berlaku selama tujuh hari.
      </p>
    </form>
  );
}
