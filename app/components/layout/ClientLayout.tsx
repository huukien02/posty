"use client"; // BẮT BUỘC để đánh dấu client component

import { Box } from "@mui/material";
import Header from "./Header";
import Footer from "./Footer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ThemeRegistry from "@/app/lib/theme-implementation";

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
        {/* Vùng nội dung: cuộn nội bộ, Header/Footer luôn hiển thị */}
        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </Box>
        <ToastContainer />
        <Footer />
      </Box>
    </ThemeRegistry>
  );
};

export default ClientLayout;
