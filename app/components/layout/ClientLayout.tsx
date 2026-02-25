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
          minHeight: "100vh",
          bgcolor: theme.palette.background.default,
          color: theme.palette.text.primary,
        })}
      >
        <Header />
        <Box
          sx={{
            flex: 1,
            display: "flex",
            minHeight: 0,
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
