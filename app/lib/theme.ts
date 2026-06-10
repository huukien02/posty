// theme.ts
import { createTheme, type ThemeOptions } from "@mui/material/styles";

const fontFamily =
  'var(--font-geist-sans), system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const sharedTypography: ThemeOptions["typography"] = {
  fontFamily,
  h4: { fontWeight: 800, letterSpacing: "-0.02em" },
  h5: { fontWeight: 800, letterSpacing: "-0.02em" },
  h6: { fontWeight: 700, letterSpacing: "-0.01em" },
  subtitle1: { fontWeight: 600 },
  subtitle2: { fontWeight: 600 },
  button: { fontWeight: 600, textTransform: "none" },
};

const sharedShape = { borderRadius: 14 };

const sharedComponents: ThemeOptions["components"] = {
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: { borderRadius: 10, textTransform: "none", fontWeight: 600 },
    },
  },
  MuiPaper: {
    styleOverrides: { root: { backgroundImage: "none" } },
  },
  MuiCard: {
    styleOverrides: { root: { backgroundImage: "none" } },
  },
  MuiChip: {
    styleOverrides: { root: { fontWeight: 600 } },
  },
  MuiAppBar: {
    styleOverrides: { root: { backgroundImage: "none" } },
  },
};

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4f46e5", light: "#6366f1", dark: "#4338ca" },
    secondary: { main: "#ec4899", light: "#f472b6", dark: "#db2777" },
    background: { default: "#f4f5fb", paper: "#ffffff" },
    text: { primary: "#1e293b", secondary: "#64748b" },
    divider: "rgba(15, 23, 42, 0.08)",
  },
  shape: sharedShape,
  typography: sharedTypography,
  components: sharedComponents,
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#818cf8", light: "#a5b4fc", dark: "#6366f1" },
    secondary: { main: "#f472b6", light: "#f9a8d4", dark: "#ec4899" },
    background: { default: "#0b1120", paper: "#131a2a" },
    text: { primary: "#e2e8f0", secondary: "#94a3b8" },
    divider: "rgba(148, 163, 184, 0.16)",
  },
  shape: sharedShape,
  typography: sharedTypography,
  components: sharedComponents,
});
