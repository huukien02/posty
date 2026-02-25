import { useState, useMemo, useEffect, createContext, ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import useMediaQuery from "@mui/material/useMediaQuery";
import { lightTheme, darkTheme } from "./theme";

// Định nghĩa type cho context
interface ColorModeContextType {
  toggleColorMode: () => void;
  mode: "light" | "dark";
}

// Tạo context
export const ColorModeContext = createContext<ColorModeContextType>({
  toggleColorMode: () => {},
  mode: "light",
});

// Props cho ThemeRegistry
interface ThemeRegistryProps {
  children: ReactNode;
}

export default function ThemeRegistry({ children }: ThemeRegistryProps) {
  // Lấy theme từ localStorage hoặc mặc định theo hệ thống
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [mode, setMode] = useState<"light" | "dark" | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Chỉ chạy trên client để đồng bộ theme từ localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | null;
    setMode(storedTheme || (prefersDarkMode ? "dark" : "light"));
    setIsMounted(true);
  }, [prefersDarkMode]);

  // Lưu theme vào localStorage khi mode thay đổi
  useEffect(() => {
    if (mode) {
      localStorage.setItem("theme", mode);
    }
  }, [mode]);

  // Hàm toggle theme
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
      mode: mode || "light",
    }),
    [mode]
  );

  // Chọn theme dựa trên mode
  const theme = useMemo(
    () => (mode === "dark" ? darkTheme : lightTheme),
    [mode]
  );

  // Tránh render nội dung cho đến khi theme được xác định
  if (!isMounted || !mode) {
    return null; // Hoặc có thể trả về một loading placeholder
  }

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
