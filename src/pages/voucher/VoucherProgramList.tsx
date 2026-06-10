import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getActivePrograms, VoucherProgramResponse } from "../../services/voucherApi";
import { getCategoryIcon } from "../../types/voucher";
import Toast from "../../components/Toast";

function formatDate(val: string): string {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function VoucherProgramList() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<VoucherProgramResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getActivePrograms()
      .then(setPrograms)
      .catch(() => setToast("프로그램 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-full">
      <div className="h-12" />

      <div className="px-6">
        <h1 className="text-[20px] font-bold text-v-text">바우처 프로그램</h1>
        <p className="text-xs text-v-textMuted mt-0.5">신청 가능한 바우처 목록입니다</p>
      </div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <span className="w-8 h-8 border-2 border-v-border border-t-v-accent rounded-full animate-spin" />
        </div>
      ) : programs.length === 0 && !loading ? (
        <div className="flex items-center justify-center mt-24 px-6">
          <p className="text-v-textMuted text-sm text-center">현재 신청 가능한 프로그램이 없습니다.</p>
        </div>
      ) : (
        <div className="px-6 mt-4 space-y-3">
          {programs.map((program) => {
            const icon = getCategoryIcon(program.category);
            return (
              <button
                key={program.id}
                onClick={() => navigate(`/voucher/programs/${program.id}`)}
                className="w-full bg-v-surface rounded-v-lg px-4 py-4 shadow-v-sm text-left active:bg-v-surface2 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-v-surface2 text-v-textMuted">
                    {icon} {program.category}
                  </span>
                  <span className="text-[10px] text-v-textMuted truncate ml-2 max-w-[120px]">
                    {program.createdByWallet.slice(0, 6)}...
                  </span>
                </div>
                <p className="text-base font-bold text-v-text">{program.name}</p>
                <p className="text-[22px] font-bold text-v-accent mt-1">
                  {program.maxValue.toLocaleString("ko-KR")}원
                </p>
                <p className="text-xs text-v-textMuted mt-1">
                  유효기간 ~{formatDate(program.validUntil)}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-v-textMuted">
                  <span>총 {program.totalSupply.toLocaleString()}개 발행</span>
                  <span className="flex items-center gap-1">
                    상세보기
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {toast && (
        <Toast message={toast} type="error" onClose={() => setToast(null)} />
      )}
    </div>
  );
}
