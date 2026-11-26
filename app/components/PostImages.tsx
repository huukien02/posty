import { useState } from "react";
import { Box, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

export default function PostImages({ post }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!post.imageUrl && (!post.imageUrls || post.imageUrls.length === 0)) {
    return null;
  }

  // Chuẩn hóa mảng ảnh
  const images =
    post.imageUrls && post.imageUrls.length > 0
      ? post.imageUrls
      : [post.imageUrl];

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 300,
        mx: "auto",
        height: 300, // cố định chiều cao khung
        overflow: "hidden",
        borderRadius: "12px",
        bgcolor: "action.hover",
      }}
    >
      <img
        src={images[currentIndex]}
        alt={post.title}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {images.length > 1 && (
        <>
          <IconButton
            onClick={prevImage}
            sx={{
              position: "absolute",
              top: "50%",
              left: 0,
              transform: "translateY(-50%)",
              m: 0.5,
              width: 32,
              height: 32,
              borderRadius: "50%",
              color: "common.white",
              bgcolor: (t) => alpha(t.palette.common.black, 0.45),
              "& svg": { fontSize: 14 },
              "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.65) },
            }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
          <IconButton
            onClick={nextImage}
            sx={{
              position: "absolute",
              top: "50%",
              right: 0,
              transform: "translateY(-50%)",
              m: 0.5,
              width: 32,
              height: 32,
              borderRadius: "50%",
              color: "common.white",
              bgcolor: (t) => alpha(t.palette.common.black, 0.45),
              "& svg": { fontSize: 14 },
              "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.65) },
            }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </>
      )}
    </Box>
  );
}
