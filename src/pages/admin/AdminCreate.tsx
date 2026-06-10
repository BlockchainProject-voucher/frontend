import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createVoucherProgram } from "../../services/voucherApi";
import { useWallet } from "../../context/WalletContext";
import Toast from "../../components/Toast";

const CATEGORIES = [
  "음식점",
  "카페/베이커리",
  "편의점/마트",
  "영화관",
  "공연/전시",
  "도서/문구",
  "스포츠/레저",
  "병원/약국",
  "교육/학원",
  "미용/뷰티",
];

const REGIONS = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원특별자치도",
  "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

function toLocalDateTime(value: string): string {
  if (!value) return "";
  return value.length === 16 ? `${value}:00` : value;
}

export default function AdminCreate() {
  const navigate = useNavigate();
  const { walletAddress } = useWallet();

  const [form, setForm] = useState({
    name: "",
    description: "",
    maxValue: "",
    totalSupply: "",
    validFrom: "",
    validUntil: "",
    minAge: "",
    maxAge: "",
    usageGuide: "",
    issuanceGuide: "",
    refundPolicy: "",
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const handleSubmit = async () => {
    if (!form.name || !form.maxValue || !form.totalSupply || !form.validFrom || !form.validUntil) {
      setToast({ msg: "필수 항목을 모두 입력해주세요.", type: "error" });
      return;
    }
    if (selectedCategories.length === 0) {
      setToast({ msg: "카테고리를 1개 이상 선택해주세요.", type: "error" });
      return;
    }
    if (!walletAddress) {
      setToast({ msg: "지갑 주소를 확인할 수 없습니다. 다시 로그인해주세요.", type: "error" });
      return;
    }

    const maxValue = Number(form.maxValue);
    const totalSupply = Number(form.totalSupply);
    if (isNaN(maxValue) || maxValue <= 0) { setToast({ msg: "유효한 최대 금액을 입력해주세요.", type: "error" }); return; }
    if (isNaN(totalSupply) || totalSupply <= 0) { setToast({ msg: "유효한 발행 수량을 입력해주세요.", type: "error" }); return; }

    const validFromIso = toLocalDateTime(form.validFrom);
    const validUntilIso = toLocalDateTime(form.validUntil);
    if (new Date(validFromIso).getTime() >= new Date(validUntilIso).getTime()) {
      setToast({ msg: "유효 종료일은 시작일 이후여야 합니다.", type: "error" });
      return;
    }

    const minAge = form.minAge ? Number(form.minAge) : undefined;
    const maxAge = form.maxAge ? Number(form.maxAge) : undefined;
    if (minAge !== undefined && (isNaN(minAge) || minAge < 0)) { setToast({ msg: "최소 나이를 올바르게 입력해주세요.", type: "error" }); return; }
    if (maxAge !== undefined && (isNaN(maxAge) || maxAge < 0)) { setToast({ msg: "최대 나이를 올바르게 입력해주세요.", type: "error" }); return; }
    if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
      setToast({ msg: "최소 나이는 최대 나이보다 작아야 합니다.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await createVoucherProgram({
        walletAddress,
        name: form.name,
        description: form.description || undefined,
        maxValue,
        totalSupply,
        category: selectedCategories.join(","),
        validFrom: validFromIso,
        validUntil: validUntilIso,
        minAge,
        maxAge,
        allowedRegions: selectedRegions.length > 0 ? selectedRegions.join(",") : undefined,
        usageGuide: form.usageGuide || undefined,
        issuanceGuide: form.issuanceGuide || undefined,
        refundPolicy: form.refundPolicy || undefined,
      });

      setToast({ msg: `프로그램 #${res.id} "${res.name}" 생성 완료!`, type: "success" });
      setTimeout(() => navigate("/admin/home"), 1500);
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message;
      setToast({ msg: backendMsg ?? err?.message ?? "프로그램 생성에 실패했습니다.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full">
      <div className="h-12" />

      <div className="px-6 flex items-center gap-3">
        <button onClick={() => navigate("/admin/home")} className="text-v-text p-0.5 -ml-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-v-text">바우처 프로그램 생성</h1>
      </div>

      <div className="px-6 mt-5 space-y-4 pb-6">
        {/* 기본 정보 */}
        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">프로그램 이름</label>
          <input
            type="text"
            value={form.name}
            onChange={handleChange("name")}
            placeholder="예: 청년 식비 지원 바우처"
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">
            설명 <span className="text-v-textMuted font-normal">(선택)</span>
          </label>
          <textarea
            value={form.description}
            onChange={handleChange("description")}
            placeholder="프로그램에 대한 간단한 설명"
            rows={2}
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">최대 금액 (원)</label>
          <input
            type="number"
            value={form.maxValue}
            onChange={handleChange("maxValue")}
            placeholder="예: 50000"
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">총 발행 수량</label>
          <input
            type="number"
            value={form.totalSupply}
            onChange={handleChange("totalSupply")}
            placeholder="예: 100"
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-2">
            카테고리 <span className="text-v-textMuted font-normal text-xs">(복수 선택 가능)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategories.includes(cat)
                    ? "bg-v-accent text-white"
                    : "bg-v-surface2 text-v-textMuted border border-v-border"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {selectedCategories.length > 0 && (
            <p className="text-[11px] text-v-accent mt-1.5">선택됨: {selectedCategories.join(", ")}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">유효 시작일</label>
          <input
            type="datetime-local"
            value={form.validFrom}
            onChange={handleChange("validFrom")}
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">유효 종료일</label>
          <input
            type="datetime-local"
            value={form.validUntil}
            onChange={handleChange("validUntil")}
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
          />
        </div>

        {/* 자격 요건 */}
        <div className="pt-2">
          <p className="text-sm font-semibold text-v-text mb-3">
            신청 자격 요건 <span className="text-v-textMuted font-normal">(선택)</span>
          </p>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-v-textMuted block mb-1">최소 나이 (만)</label>
              <input
                type="number"
                value={form.minAge}
                onChange={handleChange("minAge")}
                placeholder="예: 18"
                min={0}
                className="w-full px-3 py-2.5 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-v-textMuted block mb-1">최대 나이 (만)</label>
              <input
                type="number"
                value={form.maxAge}
                onChange={handleChange("maxAge")}
                placeholder="예: 39"
                min={0}
                className="w-full px-3 py-2.5 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
              />
            </div>
          </div>
          <p className="text-[11px] text-v-textMuted mt-1">비워두면 나이 제한 없음</p>
        </div>

        <div>
          <label className="text-xs text-v-textMuted block mb-2">허용 지역 <span className="text-[11px]">(비워두면 전국)</span></label>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => toggleRegion(region)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedRegions.includes(region)
                    ? "bg-v-accent text-white"
                    : "bg-v-surface2 text-v-textMuted border border-v-border"
                }`}
              >
                {region}
              </button>
            ))}
          </div>
          {selectedRegions.length > 0 && (
            <p className="text-[11px] text-v-accent mt-1.5">선택된 지역: {selectedRegions.join(", ")}</p>
          )}
        </div>

        {/* 상세 안내 */}
        <div className="pt-2">
          <p className="text-sm font-semibold text-v-text mb-3">
            상세 안내 <span className="text-v-textMuted font-normal">(선택)</span>
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-v-textMuted block mb-1">사용처 및 방법</label>
              <textarea
                value={form.usageGuide}
                onChange={handleChange("usageGuide")}
                placeholder={"예) 전국 영화관 어디서나 사용 가능\n1인 1회 사용 가능하며 잔액은 다음 방문 시 사용 가능\n제휴 가맹점 앱에서 바우처 코드 입력 후 결제"}
                rows={4}
                className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-v-textMuted block mb-1">발급 및 이용 안내</label>
              <textarea
                value={form.issuanceGuide}
                onChange={handleChange("issuanceGuide")}
                placeholder={"예) 신청 후 자격 확인 즉시 자동 발급\n발급된 바우처는 내 바우처 메뉴에서 확인 가능\n유효기간 내 미사용 시 자동 소멸"}
                rows={4}
                className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-v-textMuted block mb-1">환불 및 양도 규정</label>
              <textarea
                value={form.refundPolicy}
                onChange={handleChange("refundPolicy")}
                placeholder={"예) 발급 후 취소 및 환불 불가\n타인 양도 불가 (본인만 사용 가능)\n부정 사용 적발 시 즉시 회수 및 법적 조치"}
                rows={4}
                className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              프로그램 생성 중...
            </>
          ) : "프로그램 생성"}
        </button>
      </div>

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
