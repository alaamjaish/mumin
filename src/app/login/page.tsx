"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/generate");
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "var(--coral-400)" }}
          >
            <span className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
              M
            </span>
          </div>
          <h1
            className="mb-1 text-2xl font-bold"
            style={{ color: "var(--gray-900)" }}
          >
            مرحباً بك في مؤمن
          </h1>
          <p className="text-sm" style={{ color: "var(--gray-500)" }}>
            سجّل دخولك للبدء في توليد الإعلانات
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-7">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                className="mb-1.5 block text-sm font-500"
                style={{ color: "var(--gray-700)" }}
              >
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-luxury w-full px-3.5 py-3 text-sm"
                placeholder="email@example.com"
                dir="ltr"
                required
              />
            </div>

            <div>
              <label
                className="mb-1.5 block text-sm font-500"
                style={{ color: "var(--gray-700)" }}
              >
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-luxury w-full px-3.5 py-3 text-sm"
                placeholder="••••••••"
                dir="ltr"
                required
              />
            </div>

            {error && (
              <div
                className="animate-scale-in rounded-lg px-3.5 py-2.5 text-sm"
                style={{
                  background: "rgba(217,79,51,0.06)",
                  border: "1px solid rgba(217,79,51,0.15)",
                  color: "var(--error)",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3 text-sm"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    جاري الدخول...
                  </>
                ) : (
                  "تسجيل الدخول"
                )}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
