import React, { useState } from "react";
import { Box, CardMedia, IconButton, Tooltip, alpha } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import DownloadIcon from "@mui/icons-material/Download";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import FavoriteIcon from "@mui/icons-material/Favorite";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import PostReactions from "./PostReactions";
interface PostImageSliderProps {
  post: any;
  fetchCollections?: () => void;
  setZoomImage: (url: string) => void;
  toggleFavorite: (postId: string) => void;
  toggleVisible: (postId: string) => void;
  PostActionsComponent?: React.ReactNode;
}
const PostImageSlider: React.FC<PostImageSliderProps> = ({
  post,
  fetchCollections,
  setZoomImage,
  toggleFavorite,
  toggleVisible,
  PostActionsComponent,
}) => {
  const images = post.imageUrls?.length ? post.imageUrls : [post.imageUrl];
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Box
      sx={{
        width: "100%",
        pt: "75%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={images[currentIndex]}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.4 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <CardMedia
            component="img"
            image={images[currentIndex]}
            alt={post.title}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Các nút hành động (download, zoom, favorite, visible) */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          display: "flex",
          gap: 0.75,
        }}
      >
        {PostActionsComponent &&  PostActionsComponent }
        <Tooltip title="Tải xuống">
          <IconButton
            size="small"
            sx={(theme) => ({
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: "blur(4px)",
              "&:hover": {
                bgcolor: theme.palette.background.paper,
              },
            })}
            onClick={async (e) => {
              e.stopPropagation();

              if (!images || images.length === 0) return;

              try {
                // Duyệt qua tất cả ảnh và tải xuống tuần tự
                for (let i = 0; i < images.length; i++) {
                  const url = images[i];
                  const response = await fetch(url, { mode: "cors" });
                  const blob = await response.blob();

                  const link = document.createElement("a");
                  link.href = window.URL.createObjectURL(blob);
                  link.download = `${post.title || "image"}-${i + 1}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(link.href);
                }
              } catch (err) {
                console.error("Download failed:", err);
              }
            }}
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Phóng to">
          <IconButton
            size="small"
            sx={(theme) => ({
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: "blur(4px)",
              "&:hover": {
                bgcolor: theme.palette.background.paper,
              },
            })}
            onClick={(e) => {
              e.stopPropagation();
              setZoomImage(images[currentIndex]);
            }}
          >
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={post.favorite ? "Bỏ yêu thích" : "Yêu thích"}>
          <IconButton
            size="small"
            sx={(theme) => ({
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: "blur(4px)",
              "&:hover": {
                bgcolor: theme.palette.background.paper,
              },
            })}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(post.id);
            }}
          >
            <FavoriteIcon
              fontSize="small"
              color={post.favorite ? "error" : "inherit"}
            />
          </IconButton>
        </Tooltip>

        <Tooltip title={post.visible !== false ? "Ẩn bài viết" : "Hiện bài viết"}>
          <IconButton
            size="small"
            sx={(theme) => ({
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: "blur(4px)",
              "&:hover": {
                bgcolor: theme.palette.background.paper,
              },
            })}
            onClick={(e) => {
              e.stopPropagation();
              toggleVisible(post.id);
            }}
          >
            {post.visible !== false ? (
              <VisibilityIcon fontSize="small" />
            ) : (
              <VisibilityOffIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Nút điều hướng slider */}
      {images.length > 1 && (
        <>
          <IconButton
            size="small"
            onClick={handlePrev}
            sx={{
              position: "absolute",
              top: "50%",
              left: 8,
              transform: "translateY(-50%)",
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

          <IconButton
            size="small"
            onClick={handleNext}
            sx={{
              position: "absolute",
              top: "50%",
              right: 8,
              transform: "translateY(-50%)",
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
        </>
      )}
    </Box>
  );
};

export default PostImageSlider;
