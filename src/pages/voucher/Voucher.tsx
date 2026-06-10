import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import VoucherBottomNav from "../../components/VoucherBottomNav";
import VoucherHome from "./VoucherHome";
import VoucherList from "./VoucherList";
import VoucherDetail from "./VoucherDetail";
import VoucherProgramList from "./VoucherProgramList";
import VoucherProgramDetail from "./VoucherProgramDetail";
import { useWallet } from "../../context/WalletContext";
import PendingPaymentModal from "../../components/PendingPaymentModal";
import Toast from "../../components/Toast";
import {
  getPendingUseRequests,
  UseVoucherPrepareResponse,
} from "../../services/voucherApi";

const POLL_INTERVAL_MS = 5000;

function Voucher() {
  const { walletAddress, isAuthenticated, logout } = useWallet();
  const [currentRequest, setCurrentRequest] =
    useState<UseVoucherPrepareResponse | null>(null);
  const [dismissedIds] = useState<Set<number>>(() => new Set());
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // 결제 요청 폴링 — 어느 페이지에 있든 동작하도록 레이아웃 레벨에서 실행
  useEffect(() => {
    if (!isAuthenticated || !walletAddress) return;
    if (currentRequest) return;

    let cancelled = false;
    let timerId: number | null = null;

    const poll = async () => {
      try {
        const pending = await getPendingUseRequests();
        if (cancelled) return;
        if (pending.length > 0) {
          const sorted = [...pending]
            .filter((r) => !dismissedIds.has(r.historyId))
            .sort((a, b) => a.deadline - b.deadline);
          if (sorted.length > 0) {
            setCurrentRequest(sorted[0]);
            return;
          }
        }
      } catch {
        // 401 → axios 인터셉터가 처리, 그 외 네트워크 오류는 silent fail
      }
      if (!cancelled) {
        timerId = window.setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [isAuthenticated, walletAddress, currentRequest]);

  const handlePaymentSuccess = () => {
    setCurrentRequest(null);
    setToast({ message: "결제가 완료되었습니다!", type: "success" });
  };

  const handlePaymentDismiss = () => {
    if (currentRequest) dismissedIds.add(currentRequest.historyId);
    setCurrentRequest(null);
  };

  return (
    <div className="relative h-screen bg-v-bg max-w-[480px] mx-auto overflow-hidden font-sans">
      <button
        type="button"
        onClick={logout}
        className="absolute top-3 right-4 z-20 text-xs text-v-textMuted hover:text-v-text active:text-v-accent transition-colors px-2 py-1"
        aria-label="로그아웃"
      >
        로그아웃
      </button>
      <div className="h-full overflow-y-auto pb-16">
        <Routes>
          <Route path="/home" element={<VoucherHome />} />
          <Route path="/programs" element={<VoucherProgramList />} />
          <Route path="/programs/:id" element={<VoucherProgramDetail />} />
          <Route path="/list" element={<VoucherList />} />
          <Route path="/list/:id" element={<VoucherDetail />} />
          <Route path="*" element={<Navigate to="/voucher/home" replace />} />
        </Routes>
      </div>
      <VoucherBottomNav />

      {currentRequest && walletAddress && (
        <PendingPaymentModal
          request={currentRequest}
          walletAddress={walletAddress}
          onSuccess={handlePaymentSuccess}
          onDismiss={handlePaymentDismiss}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default Voucher;
