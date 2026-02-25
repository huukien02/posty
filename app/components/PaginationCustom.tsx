"use client";
import React from "react";
import { Box, Button, IconButton } from "@mui/material";
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

  // Tạo danh sách trang hiển thị
  const getPages = () => {
    const pages: (number | string)[] = [];

    pages.push(1);

    if (currentPage > 3) pages.push("…");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push("…");

    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const pages = getPages();

  // Xử lý khi nhấn nút Prev / Next
  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      gap={1}
      mt={3}
    >
      {/* Nút Prev */}
      <IconButton
        onClick={handlePrev}
        disabled={currentPage === 1}
        size="small"
        sx={{  borderRadius: "8px" }}
      >
        <ChevronLeft />
      </IconButton>

      {/* Danh sách trang */}
      {pages.map((p, index) =>
        p === "…" ? (
          <Box key={index} px={1}>
            . . .
          </Box>
        ) : (
          <Button
            key={index}
            variant={p === currentPage ? "contained" : "outlined"}
            onClick={() => onPageChange(p as number)}
            size="small"
            sx={{
              minWidth: 36,
              borderRadius: "8px",
              textTransform: "none",
            }}
          >
            {p}
          </Button>
        )
      )}

      {/* Nút Next */}
      <IconButton
        onClick={handleNext}
        disabled={currentPage === totalPages}
        size="small"
        sx={{  borderRadius: "8px" }}
      >
        <ChevronRight />
      </IconButton>
    </Box>
  );
}
