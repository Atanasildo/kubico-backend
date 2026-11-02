"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { verificationApi } from "@/lib/api";
import { Mail, Phone, CheckCircle2 } from "lucide-react";

export default function VerificarPage() {
  const { user, refresh } = useAuth();
  const [step, setStep] = useState<"idle"|"code">("idle");
  const [canal, setCanal] = useState<"email"|"telefone">("email");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!user) return null;

  const destino = canal === "email" ? user.email : user.telefone ?? "";

  const requestCode = async (c: "email"|"telefone") => {
    setCanal(c);
    setError("");
    setLoading(true);
    try {
      await verificationApi.requestCode(c, c === "email" ? user.email : user.telefone ?? "");
      setStep("code");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Erro ao enviar código.");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verificationApi.verifyCode(canal, destino, code);
      await refresh();
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="font-display text-xl font-bold text-primary-900">
            {canal === "email" ? "Email" : "Telefone"} verificado!
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-primary-950">
        Verificar conta
      </h1>

      {step === "idle" ? (
        <div className="space-y-3">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-primary-900">Email</div>
                  <div className="text-xs text-primary-500">{user.email}</div>
                </div>
              </div>
              {user.email_verificado ? (
                <span className="badge-verificado"><CheckCircle2 className="h-3 w-3" /> Verificado</span>
              ) : (
                <button onClick={() => requestCode("email")} disabled={loading} className="btn-primary text-xs px-3 py-1.5">
                  Verificar
                </button>
              )}
            </div>
          </div>

          {user.telefone && (
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-primary-900">Telefone</div>
                    <div className="text-xs text-primary-500">{user.telefone}</div>
                  </div>
                </div>
                {user.telefone_verificado ? (
                  <span className="badge-verificado"><CheckCircle2 className="h-3 w-3" /> Verificado</span>
                ) : (
                  <button onClick={() => requestCode("telefone")} disabled={loading} className="btn-primary text-xs px-3 py-1.5">
                    Verificar
                  </button>
                )}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="card p-6">
          <p className="mb-5 text-sm text-primary-700">
            Enviámos um código de 6 dígitos para{" "}
            <strong>{destino}</strong>. Insere-o abaixo.
          </p>
          <form onSubmit={verify} className="space-y-4">
            <div>
              <label className="label">Código</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                required
                className="input text-center text-2xl tracking-widest font-bold"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? "A verificar..." : "Confirmar código"}
            </button>
            <button type="button" onClick={() => setStep("idle")} className="w-full text-sm text-primary-500 hover:text-primary-700">
              Voltar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
