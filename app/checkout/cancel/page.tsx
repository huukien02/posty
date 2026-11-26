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
import { radius, softShadow, surfaceSx } from "@/app/lib/theme";

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
          sx={(theme) => ({
            ...surfaceSx(theme),
            p: { xs: 3, md: 4 },
            textAlign: "center",
            boxShadow: softShadow(theme),
          })}
        >
          <Box
            sx={(theme) => ({
              width: 72,
              height: 72,
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
            <HighlightOffRounded sx={{ fontSize: 40 }} />
          </Box>

          <Typography variant="h5" gutterBottom>
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
            >
              Thử lại
            </Button>
            <Button
              component={Link}
              href="/"
              variant="outlined"
              size="large"
              fullWidth
            >
              Quay về trang chủ
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
