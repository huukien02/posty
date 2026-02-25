"use client";
import { useState } from "react";
import { Box, IconButton } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const PostImageDisplay = ({ post }: { post: any }) => {
  const [index, setIndex] = useState(0);

  const images = post.imageUrls?.length
    ? post.imageUrls
    : post.imageUrl
    ? [post.imageUrl]
    : [];

  const nextImage = () => setIndex((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setIndex((prev) => (prev - 1 + images.length) % images.length);

  if (images.length === 0) return null;

  // ✅ Nếu chỉ 1 ảnh, hiển thị như cũ
  if (images.length === 1) {
    return (
      <Box
        px={2}
        mb={1}
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 2,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={images[0]}
          alt={post.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain", // Không bị crop ảnh
          }}
        />
      </Box>
    );
  }

  // ✅ Slider khi có nhiều ảnh
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: 2,
        overflow: "hidden",
        mb: 1,
        px: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={images[index]}
          alt={`${post.title}-${index}`}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: "8px",
          }}
        />
      </AnimatePresence>

      {/* Nút chuyển trái */}
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          prevImage();
        }}
        sx={{
          position: "absolute",
          top: "50%",
          left: 16,
          transform: "translateY(-50%)",
          bgcolor: "rgba(0,0,0,0.4)",
          color: "white",
          "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
        }}
      >
        <ArrowBackIosNewIcon fontSize="small" />
      </IconButton>

      {/* Nút chuyển phải */}
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          nextImage();
        }}
        sx={{
          position: "absolute",
          top: "50%",
          right: 16,
          transform: "translateY(-50%)",
          bgcolor: "rgba(0,0,0,0.4)",
          color: "white",
          "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
        }}
      >
        <ArrowForwardIosIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default PostImageDisplay;
