"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { COMPANY_NAME } from "@/lib/brand";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="relative min-h-dvh lg:grid lg:grid-cols-2">
      <div className="relative flex flex-col justify-end overflow-hidden px-5 pb-6 pt-[max(2.5rem,env(safe-area-inset-top))] sm:px-6 lg:min-h-screen lg:justify-center lg:px-16 lg:pb-16">
        <div className="pointer-events-none absolute inset-0 bg-garawol-green lg:bg-garawol-greenDark" />
        <div className="relative text-white">
          <Image
            src="/mf_logo.png"
            alt={COMPANY_NAME}
            width={72}
            height={72}
            className="mb-4 rounded-2xl shadow-lift lg:mb-5 lg:h-24 lg:w-24"
            priority
          />
          <p className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-4xl">
            MF &amp; F Enterprise
          </p>
          <p className="mt-3 max-w-md text-base text-white">
            Office desk system — register tenant payments and issue official receipts.
          </p>
          <ul className="mt-8 hidden space-y-2 text-base text-[#D5DEEA] lg:block">
            <li>· Record cash and bank payments at the counter</li>
            <li>· Print and share official MFF receipts</li>
            <li>· Track outstanding rent and issue official receipts</li>
          </ul>
        </div>
      </div>

      <div className="relative flex items-end bg-garawol-mist px-0 pb-0 lg:items-center lg:px-12 lg:py-10">
        <div className="w-full rounded-t-[1.75rem] border border-garawol-line border-b-0 bg-white px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 shadow-lift sm:p-6 lg:mx-auto lg:max-w-md lg:rounded-[1.75rem] lg:border-b lg:p-8">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-garawol-line lg:hidden" />
          <h1 className="font-display text-3xl font-semibold text-garawol-ink">Office sign-in</h1>
          <p className="mt-1 text-base text-garawol-muted">
            Sign in with your staff email and password
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="field"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="field"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button className="btn-primary w-full text-base" disabled={loading} type="submit">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
