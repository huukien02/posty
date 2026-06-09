"use client";

// app/checkout/success/page.tsx
import { useEffect, useState } from "react";
import { Container, Typography, Box, Button } from "@mui/material";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase.config";
import { useSearchParams } from "next/navigation";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [postsRemaining, setPostsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    // Slot đã được CỘNG Ở SERVER qua Stripe webhook (đã verify thanh toán).
    // Trang này chỉ làm mới số dư từ Firestore để hiển thị, không tự cộng gì.
    const refreshUser = async () => {
      try {
        const stored = localStorage.getItem("user");
        if (!stored) {
          setStatus("success");
          return;
        }
        const localUser = JSON.parse(stored);
        const email = localUser?.email;
        if (!email) {
          setStatus("success");
          return;
        }

        // Webhook có thể xử lý trễ vài giây -> thử lại tối đa 5 lần.
        const before = Number(localUser.postsRemaining ?? 0);
        for (let i = 0; i < 5; i++) {
          const q = query(
            collection(db, "users"),
            where("email", "==", email),
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const fresh = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
            const now = Number(fresh.postsRemaining ?? 0);

            localStorage.setItem("user", JSON.stringify(fresh));
            window.dispatchEvent(new Event("userChanged"));
            setPostsRemaining(now);

            // Đã thấy số dư tăng -> dừng.
            if (now > before) break;
          }
          await sleep(1500);
        }

        setStatus("success");
      } catch (err) {
        console.error("❌ Error refreshing user:", err);
        setStatus("error");
      }
    };

    refreshUser();
  }, [sessionId]);

  const renderMessage = () => {
    switch (status) {
      case "loading":
        return "⏳ Đang xác nhận giao dịch...";
      case "success":
        return postsRemaining !== null
          ? `Số lượt đăng bài hiện tại của bạn: ${postsRemaining}.`
          : "Cảm ơn bạn đã mua hàng. Lượt đăng bài sẽ được cộng sau khi thanh toán được xác nhận.";
      case "error":
        return "❌ Không xác nhận được giao dịch. Nếu đã bị trừ tiền, lượt sẽ được cộng tự động sau ít phút. Vui lòng liên hệ hỗ trợ nếu cần.";
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={3}
      >
        <Typography variant="h5" fontWeight="bold">
          {status === "success"
            ? "🎉 Thanh toán thành công!"
            : status === "error"
              ? "⚠️ Đang xử lý"
              : "⏳ Đang xác nhận..."}
        </Typography>

        <Typography variant="body1" align="center">
          {renderMessage()}
        </Typography>

        <Link href="/" passHref>
          <Button variant="contained" color="primary">
            Quay về trang chủ
          </Button>
        </Link>
      </Box>
    </Container>
  );
}
