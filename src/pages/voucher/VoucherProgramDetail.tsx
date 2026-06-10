import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getVoucherProgram, applyVoucher, VoucherProgramResponse } from "../../services/voucherApi";
import { useWallet } from "../../context/WalletContext";
import { getCategoryIcon } from "../../types/voucher";
import Toast from "../../components/Toast";

function formatDate(val: string): string {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function buildEligibilityText(program: VoucherProgramResponse): string {
  const parts: string[] = [];
  if (program.minAge != null && program.maxAge != null) {
    parts.push(`만 ${program.minAge}세 ~ ${program.maxAge}세`);
  } else if (program.minAge != null) {
    parts.push(`만 ${program.minAge}세 이상`);
  } else if (program.maxAge != null) {
    parts.push(`만 ${program.maxAge}세 이하`);
  }
  if (program.allowedRegions && program.allowedRegions.trim()) {
    parts.push(program.allowedRegions.trim());
  }
  return parts.length > 0 ? parts.join(" / ") : "제한 없음";
}

export default function VoucherProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { walletAddress } = useWallet();

  const [program, setProgram] = useState<VoucherProgramResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (!id) return;
    getVoucherProgram(Number(id))
      .then(setProgram)
      .catch(() => setToast({ msg: "프로그램 정보를 불러오지 못했습니다.", type: "error" }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    if (!program || !walletAddress) return;
    setApplying(true);
    try {
      await applyVoucher(program.id, walletAddress);
      setToast({ msg: "신청 완료! 내 바우처에서 확인하세요.", type: "success" });
      setTimeout(() => navigate("/voucher/list"), 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "신청에 실패했습니다.";
      setToast({ msg, type: "error" });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="w-8 h-8 border-2 border-v-border border-t-v-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <p className="text-v-textMuted text-sm">프로그램을 찾을 수 없습니다.</p>
        <button onClick={() => navigate("/voucher/programs")} className="mt-3 px-4 py-2 rounded-v-md bg-v-accentLight text-v-accent text-xs font-medium">
          목록으로
        </button>
      </div>
    );
  }

  const categoryList = program.category ? program.category.split(",").map((c) => c.trim()).filter(Boolean) : [];
  const icon = getCategoryIcon(categoryList[0] ?? null);
  const eligibility = buildEligibilityText(program);

  return (
    <div className="min-h-full pb-28">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6 flex items-center gap-3">
        <button onClick={() => navigate("/voucher/programs")} className="text-v-text p-0.5 -ml-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-v-text">바우처 상세</h1>
      </div>

      {/* 상단 카드 */}
      <div
        className="mx-6 mt-4 rounded-v-lg p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
      >
        <div className="absolute rounded-full pointer-events-none" style={{ width: 160, height: 160, top: -40, right: -40, background: "rgba(255,255,255,0.08)" }} />
        <div className="absolute text-[64px] leading-none pointer-events-none select-none opacity-30" style={{ top: 12, right: 16 }} aria-hidden>{icon}</div>
        <div className="flex items-center gap-2 relative flex-wrap">
          {categoryList.map((cat) => (
            <span key={cat} className="text-[11px] text-white/75 font-medium bg-white/15 rounded-full px-2 py-0.5">{getCategoryIcon(cat)} {cat}</span>
          ))}
        </div>
        <p className="text-[28px] font-bold text-white mt-2 tracking-tight relative">{program.maxValue.toLocaleString("ko-KR")}원</p>
        <p className="text-xs text-white/70 mt-1 relative">{program.name}</p>
        <p className="text-[11px] text-white/55 mt-3 relative">총 {program.totalSupply.toLocaleString()}개 발행</p>
      </div>

      {/* 정보 목록 */}
      <div className="px-6 mt-5 space-y-2">
        {([
          ["프로그램명", program.name],
          ["금액", `${program.maxValue.toLocaleString("ko-KR")}원`],
          ["유효기간", `${formatDate(program.validFrom)} ~ ${formatDate(program.validUntil)}`],
          ["총 발행 수량", `${program.totalSupply.toLocaleString()}개`],
          ["신청 자격", eligibility],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} className="flex items-center justify-between bg-v-surface rounded-v-md px-4 py-3 shadow-v-sm gap-3">
            <span className="text-sm text-v-textMuted flex-shrink-0">{label}</span>
            <span className="text-sm font-medium text-v-text text-right">{value}</span>
          </div>
        ))}
        {/* 카테고리 행 (복수 표시) */}
        <div className="flex items-start justify-between bg-v-surface rounded-v-md px-4 py-3 shadow-v-sm gap-3">
          <span className="text-sm text-v-textMuted flex-shrink-0">카테고리</span>
          <div className="flex flex-wrap gap-1 justify-end">
            {categoryList.map((cat) => (
              <span key={cat} className="text-xs bg-v-accentLight text-v-accent rounded-full px-2 py-0.5 font-medium">{getCategoryIcon(cat)} {cat}</span>
            ))}
          </div>
        </div>

        {program.description && (
          <div className="bg-v-surface rounded-v-md px-4 py-3 shadow-v-sm">
            <p className="text-xs font-semibold text-v-textMuted mb-1">프로그램 소개</p>
            <p className="text-sm text-v-text leading-relaxed">{program.description}</p>
          </div>
        )}

        {program.usageGuide && (
          <div className="bg-v-surface rounded-v-md px-4 py-3 shadow-v-sm">
            <p className="text-xs font-semibold text-v-textMuted mb-2">사용처 및 방법</p>
            <p className="text-sm text-v-text leading-relaxed whitespace-pre-line">{program.usageGuide}</p>
          </div>
        )}

        {program.issuanceGuide && (
          <div className="bg-v-surface rounded-v-md px-4 py-3 shadow-v-sm">
            <p className="text-xs font-semibold text-v-textMuted mb-2">발급 및 이용 안내</p>
            <p className="text-sm text-v-text leading-relaxed whitespace-pre-line">{program.issuanceGuide}</p>
          </div>
        )}

        {program.refundPolicy && (
          <div className="bg-v-surface rounded-v-md px-4 py-3 shadow-v-sm">
            <p className="text-xs font-semibold text-v-textMuted mb-2">환불 및 양도 규정</p>
            <p className="text-sm text-v-text leading-relaxed whitespace-pre-line">{program.refundPolicy}</p>
          </div>
        )}

        {/* 기본 이용 안내 (입력 없을 경우 fallback) */}
        {!program.issuanceGuide && (
          <div className="bg-amber-50 border border-amber-200 rounded-v-md px-4 py-3">
            <p className="text-xs font-semibold text-amber-800 mb-1">이용 안내</p>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside leading-relaxed">
              <li>바우처는 1인 1회만 신청 가능합니다.</li>
              <li>승인된 가맹점에서만 사용할 수 있습니다.</li>
              <li>유효기간 내에만 사용 가능합니다.</li>
              <li>발급 후 취소 및 환불은 불가합니다.</li>
            </ul>
          </div>
        )}
      </div>

      {/* 하단 고정 신청 버튼 */}
      <div className="fixed bottom-16 left-0 right-0 px-6 max-w-[480px] mx-auto pb-2 pt-3 bg-v-bg">
        <button
          onClick={handleApply}
          disabled={applying}
          className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {applying ? (
            <>
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              발급 중... (최대 40초)
            </>
          ) : "신청하기"}
        </button>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
