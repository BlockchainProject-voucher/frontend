import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  merchantPrepareUse,
  getPaymentStatus,
  UseVoucherPrepareResponse,
  VoucherQrResponse,
} from "../../services/voucherApi";
import Toast from "../../components/Toast";
import { getCategoryIcon } from "../../types/voucher";

const POLL_INTERVAL_MS = 3000;

function maskWallet(addr: string | null | undefined): string {
  if (!addr) return "-";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function MerchantVerify() {
  const navigate = useNavigate();
  const location = useLocation();

  const voucherInfo = (location.state as { voucherInfo?: VoucherQrResponse } | null)
    ?.voucherInfo;

  const [amountInput, setAmountInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [prepared, setPrepared] = useState<UseVoucherPrepareResponse | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);

  const pollingRef = useRef<number | null>(null);

  // 결제 완료 폴링 — prepared 상태일 때 3초마다 status 확인
  useEffect(() => {
    if (!prepared || paymentDone) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const status = await getPaymentStatus(prepared.historyId);
        if (cancelled) return;
        if (status === "CONFIRMED") {
          setPaymentDone(true);
          return;
        }
        if (status === "FAILED") {
          setToast({ msg: "결제가 실패했습니다. 다시 시도해주세요.", type: "error" });
          setPrepared(null);
          return;
        }
      } catch (_) {
        // silent fail — 다음 tick에서 재시도
      }
      if (!cancelled) {
        pollingRef.current = window.setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    pollingRef.current = window.setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (pollingRef.current !== null) window.clearTimeout(pollingRef.current);
    };
  }, [prepared, paymentDone]);

  if (!voucherInfo) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 text-center">
        <p className="text-v-textMuted text-sm">
          바우처 정보를 찾을 수 없습니다. QR 스캔부터 다시 시작해주세요.
        </p>
        <button
          onClick={() => navigate("/merchant/home")}
          className="mt-4 px-5 py-2.5 rounded-v-md bg-v-accentLight text-v-accent text-sm font-medium"
        >
          홈으로 이동
        </button>
      </div>
    );
  }

  const categoryIcon = getCategoryIcon(voucherInfo.category);

  const handleRequestPayment = async () => {
    const amount = Number(amountInput);
    if (!amount || amount <= 0) {
      setToast({ msg: "결제 금액을 올바르게 입력해주세요.", type: "error" });
      return;
    }
    if (amount > voucherInfo.currentValue) {
      setToast({ msg: `잔액(${voucherInfo.currentValue.toLocaleString("ko-KR")}원)을 초과할 수 없습니다.`, type: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await merchantPrepareUse({
        voucherId: voucherInfo.voucherId,
        ownerWallet: voucherInfo.ownerWallet,
        amount,
      });
      setPrepared(res);
      setToast({ msg: "결제 요청이 전송되었습니다.", type: "success" });
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message;
      setToast({ msg: apiMsg ?? "결제 요청 중 오류가 발생했습니다.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 결제 완료 팝업
  if (paymentDone && prepared) {
    return (
      <div className="min-h-full bg-v-bg flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10 text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-v-text">결제 완료!</h2>
        <p className="text-sm text-v-textMuted mt-2">
          {prepared.programName}
        </p>
        <p className="text-[32px] font-bold text-v-accent mt-3 tracking-tight">
          {prepared.amount.toLocaleString("ko-KR")}원
        </p>
        <p className="text-xs text-v-textMuted mt-1">요청 번호 #{prepared.historyId}</p>

        <div className="mt-8 w-full max-w-xs space-y-2">
          <button
            onClick={() => {
              setPrepared(null);
              setPaymentDone(false);
              navigate("/merchant/scan");
            }}
            className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md"
          >
            새 결제 받기
          </button>
          <button
            onClick={() => navigate("/merchant/home")}
            className="w-full py-3 rounded-v-md text-v-textMuted text-sm border border-v-border"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  // 사용자 서명 대기 화면
  if (prepared) {
    return (
      <div className="min-h-full bg-v-bg flex flex-col">
        <div className="h-12" />

        <div className="px-6 flex items-center gap-3">
          <h1 className="text-base font-semibold text-v-text">결제 요청됨</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-8">
          <div className="relative w-20 h-20 mb-6">
            <span className="absolute inset-0 border-4 border-v-accentLight rounded-full" />
            <span className="absolute inset-0 border-4 border-transparent border-t-v-accent rounded-full animate-spin" />
          </div>

          <h2 className="text-lg font-semibold text-v-text text-center">
            사용자 폰에서 서명을 기다리는 중...
          </h2>
          <p className="text-sm text-v-textMuted text-center mt-2 max-w-xs">
            사용자가 결제를 승인하면 자동으로 완료 화면이 표시됩니다.
          </p>

          <div className="mt-6 w-full max-w-xs bg-v-surface rounded-v-md p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-v-textMuted">바우처</span>
              <span className="text-v-text font-medium truncate ml-3">{prepared.programName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-v-textMuted">결제 금액</span>
              <span className="text-v-text font-semibold">{prepared.amount.toLocaleString("ko-KR")}원</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-v-border">
              <span className="text-v-textMuted">요청 번호</span>
              <span className="text-v-textMuted font-mono">#{prepared.historyId}</span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={() => navigate("/merchant/scan")}
            className="w-full py-3.5 rounded-v-md bg-v-accent text-white font-semibold text-sm active:bg-v-accentHover transition-colors"
          >
            새 결제 받기 (다시 스캔)
          </button>
          <button
            onClick={() => navigate("/merchant/home")}
            className="w-full py-3 rounded-v-md text-v-textMuted text-sm border border-v-border"
          >
            처음으로
          </button>
        </div>

        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // 금액 입력 화면
  return (
    <div className="min-h-full">
      <div className="h-12" />

      <div className="px-6 flex items-center gap-3">
        <button
          onClick={() => navigate("/merchant/scan")}
          className="text-v-text p-0.5 -ml-0.5"
          aria-label="뒤로"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-v-text">결제 금액 입력</h1>
      </div>

      <div
        className="mx-6 mt-4 rounded-v-lg p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
      >
        <div className="absolute rounded-full pointer-events-none" style={{ width: 160, height: 160, top: -40, right: -40, background: "rgba(255,255,255,0.08)" }} />
        <div className="absolute text-[64px] leading-none pointer-events-none select-none opacity-30" style={{ top: 12, right: 16 }} aria-hidden>{categoryIcon}</div>

        <p className="text-xs text-white/75 relative">{voucherInfo.programName}</p>
        <p className="text-[28px] font-bold text-white mt-1 tracking-tight relative">
          {voucherInfo.currentValue.toLocaleString("ko-KR")}원
        </p>
        <div className="mt-3 space-y-1 relative">
          <p className="text-xs text-white/70">
            소유자: <span className="text-white font-medium">{voucherInfo.ownerNickname || "익명"}</span>{" "}
            <span className="text-white/60 font-mono">({maskWallet(voucherInfo.ownerWallet)})</span>
          </p>
          {voucherInfo.onChainTokenId != null && (
            <p className="text-xs text-white/70">
              Token ID: <span className="text-white font-mono">#{voucherInfo.onChainTokenId}</span>
            </p>
          )}
        </div>
      </div>

      <div className="px-6 mt-5">
        <label className="text-sm font-semibold text-v-text block mb-2">결제 금액</label>
        <div className="relative">
          <input
            type="number"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="금액 입력"
            min={1}
            max={voucherInfo.currentValue}
            inputMode="numeric"
            className="w-full px-4 py-3 pr-10 rounded-v-md border border-v-border bg-v-surface text-v-text text-sm outline-none focus:border-v-accent transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-v-textMuted">원</span>
        </div>
        <p className="text-xs text-v-textMuted mt-1.5">최대 {voucherInfo.currentValue.toLocaleString("ko-KR")}원</p>
      </div>

      <div className="px-6 mt-5 pb-6">
        <button
          onClick={handleRequestPayment}
          disabled={loading}
          className="w-full py-4 rounded-v-lg bg-v-accent text-white font-semibold text-[15px] shadow-v-md active:bg-v-accentHover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              요청 중...
            </>
          ) : "결제 요청"}
        </button>
        <p className="text-xs text-v-textMuted text-center mt-3 leading-relaxed">
          요청을 보내면 사용자 폰에 서명 요청이 도착합니다.<br />
          사용자가 승인해야 결제가 완료됩니다.
        </p>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
