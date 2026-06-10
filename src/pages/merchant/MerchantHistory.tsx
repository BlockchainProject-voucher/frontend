import React, { useEffect, useState } from "react";
import { getMerchantHistory, VoucherUseHistoryResponse } from "../../services/voucherApi";
import Toast from "../../components/Toast";

function formatDate(val: string): string {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function statusLabel(rec: { status: string; deadline?: number | null }): { text: string; cls: string } {
  if (rec.status === "CONFIRMED") return { text: "완료", cls: "text-green-600 bg-green-50" };
  if (rec.status === "PENDING") {
    const expired = rec.deadline != null && rec.deadline < Math.floor(Date.now() / 1000);
    return expired
      ? { text: "만료됨", cls: "text-gray-500 bg-gray-100" }
      : { text: "대기 중", cls: "text-amber-600 bg-amber-50" };
  }
  return { text: "실패", cls: "text-red-600 bg-red-50" };
}

export default function MerchantHistory() {
  const [records, setRecords] = useState<VoucherUseHistoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getMerchantHistory()
      .then(setRecords)
      .catch((err) => {
        setToast(err?.response?.data?.message ?? "사용 내역을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  const confirmedTotal = records
    .filter((r) => r.status === "CONFIRMED")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="min-h-full">
      <div className="h-12" />

      <div className="px-6 flex items-center gap-2">
        <h1 className="text-[20px] font-bold text-v-text">사용 내역</h1>
        {records.length > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-v-surface2 text-v-textMuted">
            {records.length}건
          </span>
        )}
      </div>

      {!loading && records.length > 0 && (
        <div className="px-6 mt-4">
          <div
            className="rounded-v-lg p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)" }}
          >
            <div className="absolute rounded-full pointer-events-none" style={{ width: 140, height: 140, top: -30, right: -30, background: "rgba(255,255,255,0.08)" }} />
            <p className="text-xs text-white/70 font-medium">완료된 결제 합계</p>
            <p className="text-[26px] font-bold text-white mt-1 tracking-tight">
              {confirmedTotal.toLocaleString("ko-KR")}원
            </p>
            <p className="text-[11px] text-white/65 mt-1">총 {records.length}건</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center mt-20">
          <span className="w-8 h-8 border-2 border-v-border border-t-v-accent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 px-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.3} stroke="currentColor" className="w-16 h-16 text-v-border mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <p className="text-v-textMuted text-sm">사용 내역이 없습니다</p>
        </div>
      ) : (
        <div className="px-6 mt-4 space-y-2">
          {records.map((rec) => {
            const { text, cls } = statusLabel(rec);
            return (
              <div key={rec.id} className="bg-v-surface rounded-v-lg px-4 py-3.5 shadow-v-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-v-text truncate">
                        {(rec as any).programName ?? `바우처 #${rec.voucherId}`}
                      </p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${cls}`}>{text}</span>
                    </div>
                    <p className="text-xs text-v-textMuted mt-0.5">{formatDate(rec.usedAt)}</p>
                  </div>
                  <p className="text-base font-bold text-v-accent flex-shrink-0">
                    -{rec.amount.toLocaleString("ko-KR")}원
                  </p>
                </div>
                {rec.txHash && (
                  <p className="text-[10px] text-v-textMuted font-mono mt-1.5 truncate">{rec.txHash}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {toast && <Toast message={toast} type="error" onClose={() => setToast(null)} />}
    </div>
  );
}
