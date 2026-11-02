"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { paymentApi } from "@/lib/api";
import { Star, CheckCircle2 } from "lucide-react";

export default function PlanoPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<any>(null);
  const [error, setError] = useState("");

  const subscribe = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await paymentApi.planoAgente();
      setPayment(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Erro ao criar referência.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  const isAgente = user.role === "agente" || user.role === "admin";

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-primary-950">
        Plano Agente
      </h1>

      {isAgente ? (
        <div className="card p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
          <h2 className="font-display text-xl font-bold text-primary-900">Plano Agente activo</h2>
          {user.plano_agente_expira_em && (
            <p className="mt-2 text-sm text-primary-500">
              Expira em {new Date(user.plano_agente_expira_em).toLocaleDateString("pt-AO")}
            </p>
          )}
        </div>
      ) : payment ? (
        <div className="card p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-primary-900">Referência de pagamento</h2>
          <div className="rounded-xl bg-surface-muted p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-primary-500">Entidade</span>
              <span className="font-bold text-primary-900">{payment.entidade}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-500">Referência</span>
              <span className="font-bold text-primary-900 tracking-widest">{payment.referencia}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-500">Valor</span>
              <span className="font-bold text-primary-900">8 000 Kz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-500">Válido até</span>
              <span className="text-primary-700">{payment.validade ? new Date(payment.validade).toLocaleDateString("pt-AO") : "—"}</span>
            </div>
          </div>
          <p className="text-xs text-primary-500 text-center">
            Paga pelo Multicaixa Express ou ATM com esta referência.
            A activação é automática após a confirmação do pagamento.
          </p>
        </div>
      ) : (
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-terra-100 text-terra-700">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-xl font-bold text-primary-900">Plano Agente</div>
              <div className="text-terra-600 font-semibold">8 000 Kz / mês</div>
            </div>
          </div>

          <ul className="space-y-2.5">
            {[
              "Anúncios ilimitados",
              "Badge de agente verificado",
              "Prioridade nos resultados de pesquisa",
              "Destaque gratuito no 1º anúncio",
              "Acesso a analytics detalhados",
            ].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-primary-700">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button onClick={subscribe} disabled={loading} className="btn-terra w-full justify-center py-3">
            {loading ? "A gerar referência..." : "Subscrever por 8 000 Kz"}
          </button>

          <p className="text-xs text-primary-400 text-center">
            Renovação automática. Cancela a qualquer momento.
          </p>
        </div>
      )}
    </div>
  );
}
