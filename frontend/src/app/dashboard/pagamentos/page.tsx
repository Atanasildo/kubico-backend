"use client";

import { useEffect, useState } from "react";
import { paymentApi } from "@/lib/api";
import { Payment } from "@/types";
import { formatPrice } from "@/lib/utils";
import { CreditCard, Star, CheckCircle2, Clock, XCircle } from "lucide-react";

const statusIcon = {
  pago: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  pendente: <Clock className="h-4 w-4 text-yellow-600" />,
  falhado: <XCircle className="h-4 w-4 text-red-500" />,
  reembolsado: <XCircle className="h-4 w-4 text-primary-400" />,
};

const statusLabel = {
  pago: "Pago",
  pendente: "Pendente",
  falhado: "Falhado",
  reembolsado: "Reembolsado",
};

export default function PagamentosPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentApi.myPayments().then(({ data }) => {
      setPayments(data.items ?? []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-primary-950">
        Pagamentos
      </h1>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-surface-muted animate-pulse" />)}
        </div>
      ) : payments.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <CreditCard className="mb-3 h-12 w-12 text-primary-200" />
          <p className="font-medium text-primary-700">Sem pagamentos ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(p => (
            <div key={p.id} className="card p-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${p.tipo === "destaque" ? "bg-terra-100 text-terra-700" : "bg-primary-100 text-primary-700"}`}>
                  {p.tipo === "destaque" ? <Star className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                </div>
                <div>
                  <div className="font-medium text-primary-900 text-sm">
                    {p.tipo === "destaque"
                      ? `Destaque ${p.dias_destaque} dias`
                      : p.tipo === "plano_agente"
                      ? "Plano Agente"
                      : "Verificação"}
                  </div>
                  {p.referencia && (
                    <div className="text-xs text-primary-500 mt-0.5">
                      Ref: {p.entidade} {p.referencia}
                    </div>
                  )}
                  <div className="text-xs text-primary-400 mt-0.5">
                    {new Date(p.criado_em).toLocaleDateString("pt-AO")}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-primary-900">
                  {formatPrice(p.valor)}
                </div>
                <div className="flex items-center justify-end gap-1 mt-1">
                  {statusIcon[p.status]}
                  <span className={`text-xs font-medium ${p.status === "pago" ? "text-green-700" : p.status === "pendente" ? "text-yellow-700" : "text-red-600"}`}>
                    {statusLabel[p.status]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
