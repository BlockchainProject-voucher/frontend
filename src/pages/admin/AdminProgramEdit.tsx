import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getVoucherProgram, updateVoucherProgram } from "../../services/voucherApi";
import { useWallet } from "../../context/WalletContext";
import Toast from "../../components/Toast";

const CATEGORIES = [
  "음식점", "카페/베이커리", "편의점/마트", "영화관", "공연/전시",
  "도서/문구", "스포츠/레저", "병원/약국", "교육/학원", "미용/뷰티",
];

const REGIONS = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원특별자치도",
  "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toLocalDateTime(value: string): string {
  if (!value) return "";
  return value.length === 16 ? `${value}:00` : value;
}

export default function AdminProgramEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { walletAddress } = useWallet();

  const [form, setForm] = useState({
    name: "", description: "", maxValue: "", totalSupply: "",
    validFrom: "", validUntil: "", minAge: "", maxAge: "",
    usageGuide: "", issuanceGuide: "", refundPolicy: "",
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);

  useEffect(() => {
    if (!id) return;
    getVoucherProgram(Number(id))
      .then((p) => {
        setForm({
          name: p.name ?? "",
          description: p.description ?? "",
          maxValue: String(p.maxValue ?? ""),
          totalSupply: String(p.totalSupply ?? ""),
          validFrom: toDatetimeLocal(p.validFrom),
          validUntil: toDatetimeLocal(p.validUntil),
          minAge: p.minAge != null ? String(p.minAge) : "",
          maxAge: p.maxAge != null ? String(p.maxAge) : "",
          usageGuide: p.usageGuide ?? "",
          issuanceGuide: p.issuanceGuide ?? "",
          refundPolicy: p.refundPolicy ?? "",
        });
        if (p.category) {
          setSelectedCategories(p.category.split(",").map((c) => c.trim()).filter(Boolean));
        }
        if (p.allowedRegions) {
          setSelectedRegions(p.allowedRegions.split(",").map((r) => r.trim()).filter(Boolean));
        }
      })
      .catch(() => setToast({ msg: "프로그램 정보를 불러오지 못했습니다.", type: "error" }))
      .finally(() => setLoadingData(false));
  }, [id]);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleCategory = (cat: string) =>
    setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);

  const toggleRegion = (region: string) =>
    setSelectedRegions((prev) => prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]);

  const handleSubmit = async () => {
    if (!form.name || !form.maxValue || !form.totalSupply || !form.validFrom || !form.validUntil) {
      setToast({ msg: "필수 항목을 모두 입력해주세요.", type: "error" }); return;
    }
    if (selectedCategories.length === 0) {
      setToast({ msg: "카테고리를 1개 이상 선택해주세요.", type: "error" }); return;
    }
    if (!walletAddress) {
      setToast({ msg: "지갑 주소를 확인할 수 없습니다.", type: "error" }); return;
    }

    const maxValue = Number(form.maxValue);
    const totalSupply = Number(form.totalSupply);
    if (isNaN(maxValue) || maxValue <= 0) { setToast({ msg: "유효한 최대 금액을 입력해주세요.", type: "error" }); return; }
    if (isNaN(totalSupply) || totalSupply <= 0) { setToast({ msg: "유효한 발행 수량을 입력해주세요.", type: "error" }); return; }

    const validFromIso = toLocalDateTime(form.validFrom);
    const validUntilIso = toLocalDateTime(form.validUntil);
    if (new Date(validFromIso).getTime() >= new Date(validUntilIso).getTime()) {
      setToast({ msg: "유효 종료일은 시작일 이후여야 합니다.", type: "error" }); return;
    }

    const minAge = form.minAge ? Number(form.minAge) : undefined;
    const maxAge = form.maxAge ? Number(form.maxAge) : undefined;
    if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
      setToast({ msg: "최소 나이는 최대 나이보다 작아야 합니다.", type: "error" }); return;
    }

    setLoading(true);
    try {
      await updateVoucherProgram(Number(id), {
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
      setToast({ msg: "수정 완료!", type: "success" });
      setTimeout(() => navigate(`/admin/programs/${id}`), 1200);
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message;
      setToast({ msg: backendMsg ?? "수정에 실패했습니다.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="w-8 h-8 border-2 border-v-border border-t-v-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="h-12" />

      <div className="px-6 flex items-center gap-3">
        <button onClick={() => navigate(`/admin/programs/${id}`)} className="text-v-text p-0.5 -ml-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-v-text">프로그램 수정</h1>
      </div>

      <div className="px-6 mt-5 space-y-4 pb-6">
        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">프로그램 이름</label>
          <input type="text" value={form.name} onChange={handleChange("name")}
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors" />
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">설명 <span className="text-v-textMuted font-normal">(선택)</span></label>
          <textarea value={form.description} onChange={handleChange("description")} rows={2}
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors resize-none" />
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">최대 금액 (원)</label>
          <input type="number" value={form.maxValue} onChange={handleChange("maxValue")}
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors" />
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">총 발행 수량</label>
          <input type="number" value={form.totalSupply} onChange={handleChange("totalSupply")}
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors" />
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-2">
            카테고리 <span className="text-v-textMuted font-normal text-xs">(복수 선택 가능)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategories.includes(cat) ? "bg-v-accent text-white" : "bg-v-surface2 text-v-textMuted border border-v-border"
                }`}>{cat}</button>
            ))}
          </div>
          {selectedCategories.length > 0 && (
            <p className="text-[11px] text-v-accent mt-1.5">선택됨: {selectedCategories.join(", ")}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">유효 시작일</label>
          <input type="datetime-local" value={form.validFrom} onChange={handleChange("validFrom")}
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors" />
        </div>

        <div>
          <label className="text-sm font-semibold text-v-text block mb-1.5">유효 종료일</label>
          <input type="datetime-local" value={form.validUntil} onChange={handleChange("validUntil")}
            className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors" />
        </div>

        <div className="pt-2">
          <p className="text-sm font-semibold text-v-text mb-3">신청 자격 요건 <span className="text-v-textMuted font-normal">(선택)</span></p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-v-textMuted block mb-1">최소 나이 (만)</label>
              <input type="number" value={form.minAge} onChange={handleChange("minAge")} placeholder="예: 18" min={0}
                className="w-full px-3 py-2.5 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-v-textMuted block mb-1">최대 나이 (만)</label>
              <input type="number" value={form.maxAge} onChange={handleChange("maxAge")} placeholder="예: 39" min={0}
                className="w-full px-3 py-2.5 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors" />
            </div>
          </div>
          <p className="text-[11px] text-v-textMuted mt-1">비워두면 나이 제한 없음</p>
        </div>

        <div>
          <label className="text-xs text-v-textMuted block mb-2">허용 지역 <span className="text-[11px]">(비워두면 전국)</span></label>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((region) => (
              <button key={region} type="button" onClick={() => toggleRegion(region)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedRegions.includes(region) ? "bg-v-accent text-white" : "bg-v-surface2 text-v-textMuted border border-v-border"
                }`}>{region}</button>
            ))}
          </div>
          {selectedRegions.length > 0 && (
            <p className="text-[11px] text-v-accent mt-1.5">선택된 지역: {selectedRegions.join(", ")}</p>
          )}
        </div>

        <div className="pt-2">
          <p className="text-sm font-semibold text-v-text mb-3">상세 안내 <span className="text-v-textMuted font-normal">(선택)</span></p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-v-textMuted block mb-1">사용처 및 방법</label>
              <textarea value={form.usageGuide} onChange={handleChange("usageGuide")} rows={4}
                className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors resize-none" />
            </div>
            <div>
              <label className="text-xs text-v-textMuted block mb-1">발급 및 이용 안내</label>
              <textarea value={form.issuanceGuide} onChange={handleChange("issuanceGuide")} rows={4}
                className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors resize-none" />
            </div>
            <div>
              <label className="text-xs text-v-textMuted block mb-1">환불 및 양도 규정</label>
              <textarea value={form.refundPolicy} onChange={handleChange("refundPolicy")} rows={4}
                className="w-full px-4 py-3 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors resize-none" />
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
          {loading ? (
            <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />수정 중...</>
          ) : "수정 완료"}
        </button>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
