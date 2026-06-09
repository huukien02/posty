"use client";
import React from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
} from "@mui/material";
import { toast } from "react-toastify";
import { useUser } from "@/hooks/useUser";

// Chỉ để hiển thị; server (lib/stripe.ts) mới là nguồn sự thật về giá & số slot.
const plans = [
  { amount: 1, slots: 100 },
  { amount: 10, slots: 1000 },
  { amount: 100, slots: 10000 },
  { amount: 1000, slots: 100000 },
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
    <Container maxWidth="sm">
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 6,
          bgcolor: theme.palette.background.default, // theo theme
        })}
      >
        <Container maxWidth="md">
          <Typography align="center" sx={{ fontWeight: 700, mb: 6 }}>
            Choose Your Plan
          </Typography>

          <Grid container spacing={4}>
            {plans.map((plan) => (
              <Card
                key={plan.amount}
                sx={(theme) => ({
                  width: { xs: "100%", sm: 220 },
                  textAlign: "center",
                  py: 4,
                  px: 2,
                  borderRadius: 3,
                  bgcolor: theme.palette.background.paper, // nền theo theme
                  boxShadow: theme.shadows[3],
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: theme.shadows[6],
                  },
                })}
              >
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    ${plan.amount}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{ mt: 1, color: "text.secondary" }}
                  >
                    +{plan.slots} slots
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "center" }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => handleCheckout(plan.amount)}
                    sx={{
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: "none",
                      transition: "all 0.3s",
                      "&:hover": {
                        transform: "scale(1.05)",
                      },
                    }}
                  >
                    Pay ${plan.amount}
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Grid>
        </Container>
      </Box>
    </Container>
  );
}
