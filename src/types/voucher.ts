export type VoucherStatus = "active" | "pending" | "used" | "expired";

export interface Voucher {
  tokenId: number;
  name: string;
  category: "food" | "transport" | "book" | "medical" | "other";
  amount: number;
  remainingAmount: number;
  status: VoucherStatus;
  expiresAt: string;
  issuedBy: string;
  allowedCategories: string[];
  tokenAddress: string;
}

export const STATUS_LABEL: Record<VoucherStatus, string> = {
  active: "사용 가능",
  pending: "심사 중",
  used: "사용 완료",
  expired: "만료됨",
};

export const CATEGORY_ICON: Record<Voucher["category"], string> = {
  food: "🍽️",
  transport: "🚌",
  book: "📚",
  medical: "💊",
  other: "🎫",
};

export const CATEGORY_LABEL: Record<Voucher["category"], string> = {
  food: "식비",
  transport: "교통",
  book: "도서",
  medical: "의료",
  other: "기타",
};

// =============================================================================
// 백엔드 program.category(문자열) → 이모지 매핑
// VoucherResponse.programCategory / VoucherQrResponse.category 양쪽에서 공용 사용.
// =============================================================================

export const CATEGORY_ICONS: Record<string, string> = {
  "음식점": "🍽️",
  "카페/베이커리": "☕",
  "편의점/마트": "🏪",
  "영화관": "🎬",
  "공연/전시": "🎭",
  "도서/문구": "📚",
  "스포츠/레저": "⚽",
  "병원/약국": "💊",
  "교육/학원": "📖",
  "미용/뷰티": "💇",
  // 레거시 호환
  "일반 음식점": "🍽️",
  "카페": "☕",
  "편의점": "🏪",
};

export const DEFAULT_CATEGORY_ICON = "🎫";

export function getCategoryIcon(category: string | null | undefined): string {
  if (!category) return DEFAULT_CATEGORY_ICON;
  // comma-separated인 경우 첫 번째 카테고리 아이콘 반환
  const first = category.split(",")[0].trim();
  return CATEGORY_ICONS[first] ?? DEFAULT_CATEGORY_ICON;
}

// =============================================================================
// 만료일 뱃지 계산 — programValidUntil(ISO LocalDateTime) 기반.
// =============================================================================

export type ExpiryTone = "ok" | "warn" | "expired";

export interface ExpiryBadge {
  label: string;
  tone: ExpiryTone;
  /** 남은 일수(만료된 경우 음수). 기한이 없는 경우 null. */
  days: number | null;
}

export function expiryBadge(programValidUntil: string | null | undefined): ExpiryBadge {
  if (!programValidUntil) return { label: "기한 없음", tone: "ok", days: null };
  const ts = new Date(programValidUntil).getTime();
  if (isNaN(ts)) return { label: "기한 없음", tone: "ok", days: null };
  const days = Math.ceil((ts - Date.now()) / 86400000);
  if (days < 0) return { label: "만료됨", tone: "expired", days };
  if (days <= 7) return { label: `D-${days}`, tone: "warn", days };
  return { label: `D-${days}`, tone: "ok", days };
}

/** 만료 뱃지 tone → Tailwind 클래스 */
export const EXPIRY_TONE_STYLE: Record<ExpiryTone, string> = {
  ok: "text-v-textMuted",
  warn: "bg-amber-100 text-amber-700",
  expired: "bg-v-errorLight text-v-error",
};
