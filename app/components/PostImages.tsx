import { useState } from "react";
import { Box, IconButton } from "@mui/material";
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
      }}
    >
      <img
        src={images[currentIndex]}
        alt={post.title}
        style={{
          width: "100%",
          height: "auto",
          maxWidth: "100%",
          borderRadius: "12px",
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
              color: "white",
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
              color: "white",
            }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </>
      )}
    </Box>
  );
}
