"use client";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Stack,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { HighlightOffRounded } from "@mui/icons-material";
import Link from "next/link";

export default function CancelPage() {
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
          <Box
            sx={(theme) => ({
              width: 84,
              height: 84,
              borderRadius: "50%",
              mx: "auto",
              mb: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.error.main, 0.12),
              color: theme.palette.error.main,
            })}
          >
            <HighlightOffRounded sx={{ fontSize: 48 }} />
          </Box>

          <Typography variant="h5" fontWeight={800} gutterBottom>
            Thanh toán đã bị hủy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bạn đã hủy giao dịch. Đừng lo, bạn chưa bị trừ khoản nào — có thể
            thử lại bất cứ lúc nào.
          </Typography>

          <Stack spacing={1.5} sx={{ mt: 4 }}>
            <Button
              component={Link}
              href="/checkout"
              variant="contained"
              size="large"
              fullWidth
              sx={{ borderRadius: 2.5, py: 1.25, fontWeight: 700 }}
            >
              Thử lại
            </Button>
            <Button
              component={Link}
              href="/"
              variant="outlined"
              size="large"
              fullWidth
              sx={{ borderRadius: 2.5, py: 1.25, fontWeight: 700 }}
            >
              Quay về trang chủ
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
