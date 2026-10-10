import React, { useState } from "react";
import { Boxes } from "lucide-react";

export type AuthMode = "login" | "register";

interface LoginViewProps {
  onSubmit: (mode: AuthMode, values: { email: string; password: string; tenantName: string }) => Promise<string | null>;
}

// Returns an error message to show, or null on success (the parent then swaps this view out).
export const LoginView: React.FC<LoginViewProps> = ({ onSubmit }) => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const message = await onSubmit(mode, { email, password, tenantName });
    setBusy(false);
    if (message) setError(message);
  };

  const input =
    "w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">PazarEntegra 360</h1>
        </div>
        <h2 className="text-sm font-semibold text-slate-600">{mode === "login" ? "Giriş yap" : "Hesap oluştur"}</h2>

        {mode === "register" && (
          <label className="block text-xs font-medium text-slate-600">
            Mağaza adı
            <input
              className={input}
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              maxLength={100}
            />
          </label>
        )}
        <label className="block text-xs font-medium text-slate-600">
          E-posta
          <input
            className={input}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Parola
          <input
            className={input}
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={mode === "register" ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm disabled:opacity-60"
        >
          {mode === "login" ? "Giriş yap" : "Kayıt ol"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
          className="w-full text-xs text-slate-500 hover:text-slate-800"
        >
          {mode === "login" ? "Hesabınız yok mu? Kayıt olun" : "Zaten hesabınız var mı? Giriş yapın"}
        </button>
      </form>
    </div>
  );
};
