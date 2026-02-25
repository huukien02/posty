import { useState, useRef, useEffect } from "react";
import { Typography, Button, Box } from "@mui/material";

export default function PostTitle({ post }: any) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflow, setIsOverflow] = useState(false);
  const textRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    // Nếu chiều cao thực > chiều cao hiển thị => bị tràn
    setIsOverflow(el.scrollHeight > el.clientHeight);
  }, [post.title]);

  return (
    <Box>
      <Typography
        ref={textRef}
        variant="subtitle1"
        px={2}
        pt={0.5}
        pb={0.5}
        fontWeight="bold"
        sx={{
          wordBreak: "break-word",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          ...(expanded
            ? {}
            : {
                WebkitLineClamp: 2,
              }),
        }}
      >
        {post.title}
      </Typography>

      {/* ✅ Chỉ hiện nút khi bị tràn */}
      {isOverflow && (
        <Box px={2}>
          <Button
            size="small"
            sx={{ p: 0, minWidth: "auto", textTransform: "none" }}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Thu gọn" : "Xem thêm"}
          </Button>
        </Box>
      )}
    </Box>
  );
}
