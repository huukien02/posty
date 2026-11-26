// theme.ts — design system dùng chung cho toàn bộ app.
// Quy ước: KHÔNG viết cứng mã màu trong component; lấy từ palette / tokens bên dưới.
import { alpha, createTheme, type Theme, type ThemeOptions } from "@mui/material/styles";

const fontFamily =
  'var(--font-sans), system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/** Bo góc chuẩn (px). Dùng: sx={{ borderRadius: `${radius.md}px` }} */
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

/** Độ rộng nội dung chuẩn */
export const layout = {
  feedWidth: 640,
  contentWidth: 1200,
  headerHeight: 64,
  bottomNavHeight: 64,
} as const;

/** Shadow mềm, dùng chung (đã tính theo mode). */
export const softShadow = (theme: Theme) =>
  theme.palette.mode === "light"
    ? "0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)"
    : "0 1px 2px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)";

/** Style card chuẩn: nền paper + viền mảnh, không đổ bóng nặng. */
export const surfaceSx = (theme: Theme) => ({
  bgcolor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: `${radius.lg}px`,
});

const typography: ThemeOptions["typography"] = {
  fontFamily,
  fontSize: 14,
  h1: { fontWeight: 700, letterSpacing: "-0.02em" },
  h2: { fontWeight: 700, letterSpacing: "-0.02em" },
  h3: { fontWeight: 700, letterSpacing: "-0.02em" },
  h4: { fontWeight: 700, letterSpacing: "-0.02em", fontSize: "1.75rem" },
  h5: { fontWeight: 700, letterSpacing: "-0.015em", fontSize: "1.375rem" },
  h6: { fontWeight: 600, letterSpacing: "-0.01em", fontSize: "1.0625rem" },
  subtitle1: { fontWeight: 600, fontSize: "0.9375rem" },
  subtitle2: { fontWeight: 600, fontSize: "0.875rem" },
  body1: { fontSize: "0.9375rem", lineHeight: 1.6 },
  body2: { fontSize: "0.875rem", lineHeight: 1.55 },
  caption: { fontSize: "0.75rem" },
  button: { fontWeight: 600, textTransform: "none", letterSpacing: 0 },
};

const buildComponents = (): ThemeOptions["components"] => ({
  MuiCssBaseline: {
    styleOverrides: (theme: Theme) => ({
      body: { backgroundColor: theme.palette.background.default },
      "::selection": { backgroundColor: alpha(theme.palette.primary.main, 0.2) },
      "*::-webkit-scrollbar": { width: 8, height: 8 },
      "*::-webkit-scrollbar-thumb": {
        backgroundColor: alpha(theme.palette.text.primary, 0.15),
        borderRadius: 8,
      },
      "*::-webkit-scrollbar-thumb:hover": {
        backgroundColor: alpha(theme.palette.text.primary, 0.3),
      },
      "*::-webkit-scrollbar-track": { backgroundColor: "transparent" },
    }),
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: { borderRadius: radius.sm, paddingInline: 16, minHeight: 36 },
      sizeSmall: { minHeight: 30, paddingInline: 12 },
      sizeLarge: { minHeight: 44, paddingInline: 20, fontSize: "0.9375rem" },
      outlined: ({ theme }) => ({ borderColor: theme.palette.divider }),
    },
  },
  MuiIconButton: {
    styleOverrides: { root: { borderRadius: radius.sm } },
  },
  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: { root: { backgroundImage: "none" } },
  },
  MuiCard: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundImage: "none",
        borderRadius: radius.lg,
        border: `1px solid ${theme.palette.divider}`,
      }),
    },
  },
  MuiCardHeader: {
    styleOverrides: {
      title: { fontWeight: 600 },
      subheader: ({ theme }) => ({ color: theme.palette.text.secondary }),
    },
  },
  MuiAppBar: {
    defaultProps: { elevation: 0, color: "inherit" },
    styleOverrides: { root: { backgroundImage: "none" } },
  },
  MuiChip: {
    styleOverrides: { root: { fontWeight: 500, borderRadius: radius.sm } },
  },
  MuiAvatar: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontWeight: 600,
        backgroundColor: alpha(theme.palette.primary.main, 0.12),
        color: theme.palette.primary.main,
      }),
    },
  },
  MuiTextField: {
    defaultProps: { size: "small" },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: radius.sm,
        backgroundColor: theme.palette.background.paper,
        "& .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.divider },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: alpha(theme.palette.text.primary, 0.3),
        },
      }),
    },
  },
  MuiTooltip: {
    defaultProps: { arrow: true },
    styleOverrides: {
      tooltip: { fontSize: "0.75rem", fontWeight: 500, borderRadius: 6 },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: radius.lg,
        border: `1px solid ${theme.palette.divider}`,
      }),
    },
  },
  MuiDialogTitle: {
    styleOverrides: { root: { fontWeight: 700, fontSize: "1.125rem" } },
  },
  MuiMenu: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: radius.md,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: softShadow(theme),
        marginTop: 6,
      }),
      list: { padding: 6 },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: { borderRadius: 6, minHeight: 40, gap: 10, fontSize: "0.875rem" },
    },
  },
  MuiListItemButton: {
    styleOverrides: { root: { borderRadius: radius.sm } },
  },
  MuiTab: {
    styleOverrides: { root: { textTransform: "none", fontWeight: 600, minHeight: 44 } },
  },
  MuiTabs: {
    styleOverrides: { root: { minHeight: 44 } },
  },
  MuiDivider: {
    styleOverrides: { root: ({ theme }) => ({ borderColor: theme.palette.divider }) },
  },
  MuiSkeleton: {
    defaultProps: { animation: "wave" },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4f46e5", light: "#6366f1", dark: "#4338ca", contrastText: "#fff" },
    secondary: { main: "#0f172a", light: "#334155", dark: "#020617", contrastText: "#fff" },
    error: { main: "#e11d48" },
    success: { main: "#059669" },
    warning: { main: "#d97706" },
    background: { default: "#f6f7f9", paper: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#64748b" },
    divider: "rgba(15, 23, 42, 0.08)",
  },
  shape: { borderRadius: radius.md },
  typography,
  components: buildComponents(),
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#818cf8", light: "#a5b4fc", dark: "#6366f1", contrastText: "#0b0f19" },
    secondary: { main: "#e2e8f0", light: "#f8fafc", dark: "#cbd5e1", contrastText: "#0b0f19" },
    error: { main: "#fb7185" },
    success: { main: "#34d399" },
    warning: { main: "#fbbf24" },
    background: { default: "#0b0f19", paper: "#121826" },
    text: { primary: "#e5e7eb", secondary: "#94a3b8" },
    divider: "rgba(148, 163, 184, 0.14)",
  },
  shape: { borderRadius: radius.md },
  typography,
  components: buildComponents(),
});
