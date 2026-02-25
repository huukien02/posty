"use client";
import React from "react";
import { Container, Typography, Box, Button } from "@mui/material";
import Link from "next/link";

export default function CancelPage() {
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
        <Typography variant="h4" color="error" fontWeight="bold">
          ❌ Thanh toán bị hủy
        </Typography>
        <Typography variant="body1" align="center">
          Bạn đã hủy thanh toán. Vui lòng thử lại nếu muốn hoàn tất đơn hàng.
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
