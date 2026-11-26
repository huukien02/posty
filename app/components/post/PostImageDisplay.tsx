"use client";
import { useState } from "react";
import { Box, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
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
        sx={{
          mt: 1,
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          bgcolor: "action.hover",
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
        bgcolor: "action.hover",
        overflow: "hidden",
        mt: 1,
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
          left: 12,
          transform: "translateY(-50%)",
          width: 32,
          height: 32,
          borderRadius: "50%",
          bgcolor: (t) => alpha(t.palette.common.black, 0.45),
          color: "common.white",
          backdropFilter: "blur(4px)",
          "& svg": { fontSize: 14 },
          "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.65) },
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
          right: 12,
          transform: "translateY(-50%)",
          width: 32,
          height: 32,
          borderRadius: "50%",
          bgcolor: (t) => alpha(t.palette.common.black, 0.45),
          color: "common.white",
          backdropFilter: "blur(4px)",
          "& svg": { fontSize: 14 },
          "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.65) },
        }}
      >
        <ArrowForwardIosIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default PostImageDisplay;
