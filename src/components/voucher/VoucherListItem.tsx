import React from "react";
import { VoucherResponse, VoucherStatus } from "../../services/voucherApi";

interface Props {
  voucher: VoucherResponse;
  onClick?: () => void;
}

const STATUS_LABEL: Record<VoucherStatus, string> = {
  ACTIVE: "사용 가능",
  USED: "사용 완료",
  EXPIRED: "만료",
  REVOKED: "취소됨",
};

const STATUS_STYLE: Record<VoucherStatus, string> = {
  ACTIVE: "bg-v-successLight text-v-success",
  USED: "bg-v-surface2 text-v-textMuted",
  EXPIRED: "bg-v-errorLight text-v-error",
  REVOKED: "bg-v-surface2 text-v-textMuted",
};

export default function VoucherListItem({ voucher, onClick }: Props) {
  const amount = voucher.currentValue.toLocaleString("ko-KR") + "원";
  const isInactive =
    voucher.status === "USED" ||
    voucher.status === "EXPIRED" ||
    voucher.status === "REVOKED";

  // TODO: 만료일은 voucher.voucherProgramId로 program을 조회해야 알 수 있다.
  // 졸업 데모에서는 목록에 보여주지 않고 토큰 ID로 대체한다.
  const subLabel = isInactive
    ? STATUS_LABEL[voucher.status]
    : voucher.onChainTokenId != null
      ? `Token #${voucher.onChainTokenId}`
      : "발급 처리 중";

  return (
    <button
      className="w-full flex items-center justify-between py-3.5 border-b border-v-border last:border-b-0 text-left"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-v-md bg-v-accentLight flex items-center justify-center text-lg flex-shrink-0">
          🎫
        </div>
        <div>
          <p className="text-sm font-medium text-v-text">{voucher.programName}</p>
          <p className="text-xs text-v-textMuted mt-0.5">{subLabel}</p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className={`text-sm font-semibold ${isInactive ? "text-v-textMuted" : "text-v-accent"}`}
        >
          {amount}
        </span>
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLE[voucher.status]}`}
        >
          {STATUS_LABEL[voucher.status]}
        </span>
      </div>
    </button>
  );
}
