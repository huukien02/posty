// theme.ts
import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2", // màu xanh chủ đạo
    },
    background: {
      default: "#ffffff",
      paper: "#f5f5f5",
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9", // màu xanh sáng hơn cho dark mode
    },
    background: {
      default: "#121212",
      paper: "#1d1d1d",
    },
  },
});
