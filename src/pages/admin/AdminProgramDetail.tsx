import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getVoucherProgram, deleteVoucherProgram, VoucherProgramResponse } from "../../services/voucherApi";
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

export default function AdminProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [program, setProgram] = useState<VoucherProgramResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (!id) return;
    getVoucherProgram(Number(id))
      .then(setProgram)
      .catch(() => setToast({ msg: "프로그램 정보를 불러오지 못했습니다.", type: "error" }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!program) return;
    setDeleting(true);
    setShowConfirm(false);
    try {
      await deleteVoucherProgram(program.id);
      setToast({ msg: "프로그램이 비활성화되었습니다.", type: "success" });
      setTimeout(() => navigate("/admin/home"), 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "삭제에 실패했습니다.";
      setToast({ msg, type: "error" });
    } finally {
      setDeleting(false);
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
        <button onClick={() => navigate("/admin/home")} className="mt-3 px-4 py-2 rounded-v-md bg-v-accentLight text-v-accent text-xs font-medium">
          목록으로
        </button>
      </div>
    );
  }

  const categoryList = program.category ? program.category.split(",").map((c) => c.trim()).filter(Boolean) : [];
  const icon = getCategoryIcon(categoryList[0] ?? null);
  const eligibility = buildEligibilityText(program);

  return (
    <div className="min-h-full pb-32">
      <div className="h-12" />

      {/* 헤더 */}
      <div className="px-6 flex items-center gap-3">
        <button onClick={() => navigate("/admin/home")} className="text-v-text p-0.5 -ml-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-v-text">프로그램 상세</h1>
        <span className="ml-auto text-[11px] text-v-textMuted">#{program.id}</span>
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
        <p className="text-[28px] font-bold text-white mt-2 tracking-tight relative">{(program.maxValue ?? 0).toLocaleString("ko-KR")}원</p>
        <p className="text-xs text-white/70 mt-1 relative">{program.name}</p>
        <div className="flex items-center gap-3 mt-3 relative">
          <p className="text-[11px] text-white/55">총 {(program.totalSupply ?? 0).toLocaleString()}개 발행</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            program.status === "ACTIVE" ? "bg-green-500/30 text-green-200" :
            program.status === "PAUSED" ? "bg-amber-500/30 text-amber-200" :
            "bg-red-500/30 text-red-200"
          }`}>{program.status}</span>
        </div>
      </div>

      {/* 정보 목록 */}
      <div className="px-6 mt-5 space-y-2">
        {([
          ["프로그램명", program.name],
          ["금액", `${(program.maxValue ?? 0).toLocaleString("ko-KR")}원`],
          ["유효기간", `${formatDate(program.validFrom)} ~ ${formatDate(program.validUntil)}`],
          ["총 발행 수량", `${(program.totalSupply ?? 0).toLocaleString()}개`],
          ["신청 자격", eligibility],
          ["생성일", formatDate(program.createdAt)],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} className="flex items-center justify-between bg-v-surface rounded-v-md px-4 py-3 shadow-v-sm gap-3">
            <span className="text-sm text-v-textMuted flex-shrink-0">{label}</span>
            <span className="text-sm font-medium text-v-text text-right">{value}</span>
          </div>
        ))}

        {/* 카테고리 */}
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
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-16 left-0 right-0 px-6 max-w-[480px] mx-auto pb-2 pt-3 bg-v-bg flex gap-3">
        <button
          onClick={() => navigate(`/admin/programs/edit/${program.id}`)}
          className="flex-1 py-3.5 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors"
        >
          수정하기
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={deleting}
          className="flex-1 py-3.5 rounded-v-lg bg-red-50 text-red-500 font-semibold text-[15px] border border-red-200 active:bg-red-100 transition-colors disabled:opacity-60"
        >
          {deleting ? "처리 중..." : "삭제하기"}
        </button>
      </div>

      {/* 삭제 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 max-w-[480px] mx-auto">
          <div className="w-full bg-white rounded-t-2xl px-6 pt-6 pb-8 shadow-xl">
            <h3 className="text-base font-bold text-v-text mb-1">프로그램을 삭제하시겠습니까?</h3>
            <p className="text-sm text-v-textMuted mb-5">
              "{program.name}" 프로그램이 종료 처리됩니다. 기존 발급된 바우처에는 영향을 주지 않습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-v-lg bg-v-surface2 text-v-textMuted font-semibold text-sm"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-v-lg bg-red-500 text-white font-semibold text-sm"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
