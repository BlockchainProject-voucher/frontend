import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMerchantHistory, VoucherUseHistoryResponse } from "../../services/voucherApi";
import { useWallet } from "../../context/WalletContext";

function formatDate(val: string): string {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function statusLabel(rec: { status: string; deadline?: number | null }): { text: string; cls: string } {
  if (rec.status === "CONFIRMED") return { text: "완료", cls: "text-green-600 bg-green-50 border-green-100" };
  if (rec.status === "PENDING") {
    const expired = rec.deadline != null && rec.deadline < Math.floor(Date.now() / 1000);
    return expired
      ? { text: "만료", cls: "text-gray-500 bg-gray-100 border-gray-200" }
      : { text: "대기", cls: "text-amber-600 bg-amber-50 border-amber-100" };
  }
  return { text: "실패", cls: "text-red-600 bg-red-50 border-red-100" };
}

export default function MerchantHome() {
  const navigate = useNavigate();
  const { nickname } = useWallet();
  const [recent, setRecent] = useState<VoucherUseHistoryResponse[]>([]);

  useEffect(() => {
    getMerchantHistory()
      .then((list) => setRecent(list.slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-full">
      <div className="h-12" />

      {/* 인사말 */}
      <div className="px-6">
        <p className="text-[13px] text-v-textMuted">가맹점 대시보드</p>
        <h1 className="text-[22px] font-bold text-v-text mt-0.5">{nickname ?? "가맹점"}님</h1>
      </div>

      {/* QR 스캔 바로가기 */}
      <div className="px-6 mt-5">
        <button
          onClick={() => navigate("/merchant/scan")}
          className="w-full rounded-v-lg p-5 flex items-center gap-4 text-left active:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)" }}
        >
          <div className="w-12 h-12 rounded-v-md bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="white" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-[15px]">바우처 QR 스캔</p>
            <p className="text-white/65 text-xs mt-0.5">고객의 QR 코드를 스캔해 결제를 진행합니다</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5 ml-auto opacity-60 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* 최근 결제 내역 */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-v-text">최근 결제</h2>
          <button onClick={() => navigate("/merchant/history")} className="text-xs text-v-accent font-medium">
            전체보기
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="bg-v-surface rounded-v-lg px-4 py-6 text-center shadow-v-sm">
            <p className="text-v-textMuted text-sm">아직 결제 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="bg-v-surface rounded-v-lg shadow-v-sm divide-y divide-v-border">
            {recent.map((rec) => {
              const s = statusLabel(rec);
              return (
                <div key={rec.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-v-text truncate">바우처 #{rec.voucherId}</p>
                    <p className="text-[11px] text-v-textMuted mt-0.5">{formatDate(rec.usedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.cls}`}>{s.text}</span>
                    <span className="text-sm font-bold text-v-text">{rec.amount.toLocaleString("ko-KR")}원</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
