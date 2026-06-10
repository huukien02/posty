"use client";
import { Box, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

interface PaginationCustomProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function PaginationCustom({
  totalPages,
  currentPage,
  onPageChange,
}: PaginationCustomProps) {
  if (totalPages <= 1) return null;

  // Tạo danh sách trang hiển thị.
  // Khi nhiều trang: luôn trả về ĐÚNG 7 phần tử (cửa sổ trượt cố định) để
  // thanh phân trang không bị co dãn / nhảy khi chuyển trang.
  const getPages = (): (number | string)[] => {
    // Ít trang -> hiện hết (số lượng không đổi khi chuyển trang nên vẫn ổn định)
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Gần đầu: [1 2 3 4 5 … last]
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "…", totalPages];
    }

    // Gần cuối: [1 … t-4 t-3 t-2 t-1 t]
    if (currentPage >= totalPages - 3) {
      return [
        1,
        "…",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    // Ở giữa: [1 … c-1 c c+1 … last]
    return [
      1,
      "…",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "…",
      totalPages,
    ];
  };

  const pages = getPages();

  const handlePrev = () => currentPage > 1 && onPageChange(currentPage - 1);
  const handleNext = () =>
    currentPage < totalPages && onPageChange(currentPage + 1);

  const navBtnSx = {
    width: 38,
    height: 38,
    borderRadius: "12px",
    border: (t: any) => `1px solid ${t.palette.divider}`,
    bgcolor: "background.paper",
    transition: "all .15s ease",
    "&:hover": {
      borderColor: "primary.main",
      color: "primary.main",
      transform: "translateY(-1px)",
    },
    "&.Mui-disabled": { opacity: 0.4 },
  } as const;

  return (
    <Box
      sx={(theme) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        p: 0.75,
        borderRadius: "16px",
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow:
          theme.palette.mode === "light"
            ? "0 4px 16px rgba(16,24,40,0.06)"
            : "none",
      })}
    >
      <IconButton
        onClick={handlePrev}
        disabled={currentPage === 1}
        size="small"
        sx={navBtnSx}
      >
        <ChevronLeft />
      </IconButton>

      {pages.map((p, index) =>
        p === "…" ? (
          <Box
            key={`gap-${index}`}
            sx={{
              width: 38,
              textAlign: "center",
              color: "text.secondary",
              fontWeight: 700,
              userSelect: "none",
            }}
          >
            …
          </Box>
        ) : (
          <Box
            key={p}
            component="button"
            onClick={() => onPageChange(p as number)}
            sx={(theme) => {
              const active = p === currentPage;
              return {
                cursor: "pointer",
                minWidth: 38,
                height: 38,
                px: 1,
                borderRadius: "12px",
                border: "none",
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: 700,
                transition: "all .15s ease",
                color: active ? "#fff" : theme.palette.text.primary,
                background: active
                  ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                  : "transparent",
                boxShadow: active
                  ? "0 6px 16px rgba(79,70,229,0.35)"
                  : "none",
                "&:hover": active
                  ? {}
                  : {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                    },
              };
            }}
          >
            {p}
          </Box>
        )
      )}

      <IconButton
        onClick={handleNext}
        disabled={currentPage === totalPages}
        size="small"
        sx={navBtnSx}
      >
        <ChevronRight />
      </IconButton>
    </Box>
  );
}
