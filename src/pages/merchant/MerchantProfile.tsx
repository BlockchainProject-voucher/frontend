import React, { useEffect, useState } from "react";
import { getMember, MemberResponse } from "../../services/voucherApi";
import { useWallet } from "../../context/WalletContext";

function formatDate(val: string | null): string {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function maskWallet(addr: string | null | undefined): string {
  if (!addr) return "-";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function MerchantProfile() {
  const { walletAddress, logout } = useWallet();
  const [member, setMember] = useState<MemberResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) return;
    getMember(walletAddress)
      .then(setMember)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [walletAddress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="w-8 h-8 border-2 border-v-border border-t-v-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="h-12" />

      <div className="px-6">
        <p className="text-[13px] text-v-textMuted">내 정보</p>
        <h1 className="text-[22px] font-bold text-v-text mt-0.5">{member?.nickname ?? "가맹점"}</h1>
      </div>

      {/* 승인 상태 배지 */}
      <div className="px-6 mt-4">
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-v-lg px-4 py-3">
          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <p className="text-sm font-medium text-green-700">승인된 가맹점</p>
          <span className="ml-auto text-xs text-green-600 font-semibold">MERCHANT</span>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="px-6 mt-4 space-y-2">
        {[
          ["가맹점명", member?.nickname ?? "-"],
          ["카테고리", member?.category ?? "-"],
          ["지갑 주소", maskWallet(member?.walletAddress)],
          ["가입일", formatDate(member?.createdAt ?? null)],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between bg-v-surface rounded-v-md px-4 py-3 shadow-v-sm gap-3">
            <span className="text-sm text-v-textMuted flex-shrink-0">{label}</span>
            <span className="text-sm font-medium text-v-text text-right break-all">{value}</span>
          </div>
        ))}
      </div>

      {/* 지갑 전체 주소 */}
      <div className="px-6 mt-2">
        <div className="bg-v-surface rounded-v-md px-4 py-3 shadow-v-sm">
          <p className="text-xs text-v-textMuted mb-1">지갑 전체 주소</p>
          <p className="text-xs font-mono text-v-text break-all">{member?.walletAddress ?? "-"}</p>
        </div>
      </div>

      {/* 로그아웃 */}
      <div className="px-6 mt-6">
        <button
          onClick={logout}
          className="w-full py-3.5 rounded-v-lg bg-v-surface2 border border-v-border text-v-textMuted font-semibold text-sm active:bg-red-50 active:text-red-500 active:border-red-200 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
