"use client";
import {
  Container,
  Box,
  Typography,
  Card,
  Button,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  CheckCircleRounded,
  BoltRounded,
  LockRounded,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { useUser } from "@/hooks/useUser";

// Chỉ để hiển thị; server (lib/stripe.ts) mới là nguồn sự thật về giá & số slot.
const plans = [
  {
    amount: 1,
    slots: 100,
    name: "Khởi đầu",
    desc: "Dùng thử để làm quen",
    features: ["100 lượt đăng bài", "Lưu trữ vĩnh viễn"],
  },
  {
    amount: 10,
    slots: 1000,
    name: "Cơ bản",
    desc: "Cho người dùng thường xuyên",
    features: ["1.000 lượt đăng bài", "Lưu trữ vĩnh viễn", "Hỗ trợ qua email"],
  },
  {
    amount: 100,
    slots: 10000,
    name: "Chuyên nghiệp",
    desc: "Tối ưu cho nhà sáng tạo",
    popular: true,
    features: [
      "10.000 lượt đăng bài",
      "Lưu trữ vĩnh viễn",
      "Hỗ trợ ưu tiên",
    ],
  },
  {
    amount: 1000,
    slots: 100000,
    name: "Doanh nghiệp",
    desc: "Dành cho quy mô lớn",
    features: [
      "100.000 lượt đăng bài",
      "Lưu trữ vĩnh viễn",
      "Hỗ trợ 24/7",
    ],
  },
];

export default function StripeTestPage() {
  const user = useUser();

  const handleCheckout = async (amount: number) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    try {
      // Tạo session ở server -> secret key không lộ ra client.
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, email: user.email }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        toast.error(data.error || "Không tạo được phiên thanh toán");
        return;
      }

      // Chuyển sang trang Checkout của Stripe.
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối tới máy chủ thanh toán");
    }
  };

  if (!user) return null;

  return (
    <Box sx={{ width: "100%" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
        {/* ===== Heading ===== */}
        <Stack spacing={1.5} alignItems="center" sx={{ mb: { xs: 4, md: 6 } }}>
          <Chip
            icon={<BoltRounded sx={{ fontSize: 18 }} />}
            label="Nạp lượt đăng bài"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
          <Typography
            variant="h4"
            fontWeight={800}
            textAlign="center"
            sx={{ letterSpacing: "-0.02em" }}
          >
            Chọn gói phù hợp với bạn
          </Typography>
          <Typography
            color="text.secondary"
            textAlign="center"
            sx={{ maxWidth: 520 }}
          >
            Mua thêm lượt đăng bài cho tài khoản. Thanh toán một lần, dùng
            không giới hạn thời gian.
          </Typography>
        </Stack>

        {/* ===== Bảng giá ===== */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 3,
            alignItems: "stretch",
          }}
        >
          {plans.map((plan) => {
            const popular = !!plan.popular;
            return (
              <Card
                key={plan.amount}
                elevation={0}
                sx={(theme) => ({
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  p: 3,
                  borderRadius: 4,
                  overflow: "visible",
                  border: popular
                    ? `2px solid ${theme.palette.primary.main}`
                    : `1px solid ${theme.palette.divider}`,
                  boxShadow: popular
                    ? `0 18px 40px ${alpha(theme.palette.primary.main, 0.25)}`
                    : "0 1px 2px rgba(16,24,40,0.04), 0 10px 24px rgba(16,24,40,0.05)",
                  transition: "transform .25s, box-shadow .25s",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: `0 22px 48px ${alpha(
                      theme.palette.primary.main,
                      popular ? 0.3 : 0.16
                    )}`,
                  },
                })}
              >
                {popular && (
                  <Chip
                    label="Phổ biến nhất"
                    color="primary"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: -13,
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontWeight: 700,
                      boxShadow: 2,
                    }}
                  />
                )}

                <Typography variant="overline" color="text.secondary">
                  {plan.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, minHeight: 40 }}
                >
                  {plan.desc}
                </Typography>

                {/* Giá */}
                <Stack direction="row" alignItems="baseline" spacing={0.5}>
                  <Typography variant="h6" color="text.secondary">
                    $
                  </Typography>
                  <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{ letterSpacing: "-0.03em", lineHeight: 1 }}
                  >
                    {plan.amount.toLocaleString()}
                  </Typography>
                  <Typography color="text.secondary">/ lần</Typography>
                </Stack>

                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  sx={{ mt: 1.5 }}
                >
                  <BoltRounded sx={{ color: "primary.main", fontSize: 20 }} />
                  <Typography fontWeight={700}>
                    +{plan.slots.toLocaleString()} lượt
                  </Typography>
                </Stack>

                <Divider sx={{ my: 2.5 }} />

                {/* Tính năng */}
                <Stack spacing={1.25} sx={{ flexGrow: 1, mb: 3 }}>
                  {plan.features.map((f) => (
                    <Stack
                      key={f}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <CheckCircleRounded
                        sx={{ fontSize: 18, color: "success.main" }}
                      />
                      <Typography variant="body2">{f}</Typography>
                    </Stack>
                  ))}
                </Stack>

                <Button
                  fullWidth
                  size="large"
                  variant={popular ? "contained" : "outlined"}
                  onClick={() => handleCheckout(plan.amount)}
                  sx={{ borderRadius: 2.5, py: 1.25, fontWeight: 700 }}
                >
                  Chọn gói này
                </Button>
              </Card>
            );
          })}
        </Box>

        {/* ===== Ghi chú bảo mật ===== */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="center"
          sx={{ mt: 5, color: "text.secondary" }}
        >
          <LockRounded sx={{ fontSize: 18 }} />
          <Typography variant="body2">
            Thanh toán an toàn & mã hoá qua Stripe
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
