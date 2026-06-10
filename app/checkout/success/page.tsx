"use client";

// app/checkout/success/page.tsx
import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Stack,
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  CheckCircleRounded,
  ErrorOutlineRounded,
  BoltRounded,
} from "@mui/icons-material";
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

  const title =
    status === "success"
      ? "Thanh toán thành công!"
      : status === "error"
      ? "Đang xử lý giao dịch"
      : "Đang xác nhận thanh toán...";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="xs" disableGutters>
        <Paper
          elevation={0}
          sx={(theme) => ({
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            textAlign: "center",
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: "0 12px 40px rgba(2,6,23,0.10)",
          })}
        >
          {/* Icon trạng thái */}
          <Box
            sx={(theme) => {
              const color =
                status === "success"
                  ? theme.palette.success.main
                  : status === "error"
                  ? theme.palette.warning.main
                  : theme.palette.primary.main;
              return {
                width: 84,
                height: 84,
                borderRadius: "50%",
                mx: "auto",
                mb: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(color, 0.12),
                color,
              };
            }}
          >
            {status === "loading" ? (
              <CircularProgress size={36} />
            ) : status === "success" ? (
              <CheckCircleRounded sx={{ fontSize: 48 }} />
            ) : (
              <ErrorOutlineRounded sx={{ fontSize: 48 }} />
            )}
          </Box>

          <Typography variant="h5" fontWeight={800} gutterBottom>
            {title}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {renderMessage()}
          </Typography>

          {/* Số dư lượt sau khi thành công */}
          {status === "success" && postsRemaining !== null && (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="center"
              sx={(theme) => ({
                mt: 3,
                py: 1.5,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              })}
            >
              <BoltRounded sx={{ color: "primary.main" }} />
              <Typography>
                Số lượt hiện tại:{" "}
                <strong>{postsRemaining.toLocaleString()}</strong>
              </Typography>
            </Stack>
          )}

          <Stack spacing={1.5} sx={{ mt: 4 }}>
            <Button
              component={Link}
              href="/"
              variant="contained"
              size="large"
              fullWidth
              sx={{ borderRadius: 2.5, py: 1.25, fontWeight: 700 }}
            >
              Quay về trang chủ
            </Button>
            {status === "error" && (
              <Button
                component={Link}
                href="/checkout"
                variant="outlined"
                size="large"
                fullWidth
                sx={{ borderRadius: 2.5, py: 1.25, fontWeight: 700 }}
              >
                Thử lại
              </Button>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
