"use client"; // BẮT BUỘC để đánh dấu client component

import { Box } from "@mui/material";
import Header from "./Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ThemeRegistry from "@/app/lib/theme-implementation";
import { layout } from "@/app/lib/theme";

interface Props {
  children: React.ReactNode;
}

const ClientLayout = ({ children }: Props) => {
  return (
    <ThemeRegistry>
      <Box
        sx={(theme) => ({
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          overflow: "hidden",
          bgcolor: theme.palette.background.default,
          color: theme.palette.text.primary,
        })}
      >
        <Header />
        {/* Vùng nội dung: cuộn nội bộ, Header luôn hiển thị.
            Trên mobile chừa chỗ cho thanh điều hướng dưới. */}
        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            pb: {
              xs: `calc(${layout.bottomNavHeight}px + env(safe-area-inset-bottom))`,
              md: 0,
            },
          }}
        >
          {children}
        </Box>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar
          newestOnTop
          theme="colored"
        />
      </Box>
    </ThemeRegistry>
  );
};

export default ClientLayout;
