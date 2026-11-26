import { useState } from "react";
import { Box, Avatar, Typography, Paper, Divider, Button } from "@mui/material";

export default function CommentList({ comments }: { comments: any[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Box>
      {/* Nút mở/đóng */}
      <Button
        variant="text"
        size="small"
        disabled={comments.length === 0} // disable khi không có comment
        onClick={() => setOpen(!open)}
        sx={{ mb: 1, px: 1, color: "text.secondary", fontWeight: 600 }}
      >
        {comments.length === 0
          ? "Chưa có bình luận nào"
          : open
          ? "Ẩn bình luận"
          : `Xem ${comments.length} bình luận`}
      </Button>
      {open && (
        <Box>
          {comments.map((c, idx) => (
            <Box key={c.id} mb={1.25}>
              <Box display="flex" alignItems="flex-start" gap={1}>
                <Avatar src={c.user.avatar ?? ""} sx={{ width: 32, height: 32 }} />
                <Box
                  sx={{
                    bgcolor: "action.hover",
                    px: 1.5,
                    py: 0.75,
                    borderRadius: "14px",
                    maxWidth: "100%",
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="text.primary"
                    sx={{ fontSize: 13 }}
                  >
                    {c.user.username}
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ wordBreak: "break-word" }}>
                    {c.text}
                  </Typography>
                </Box>
              </Box>
              {/* {idx < comments.length - 1 && <Divider sx={{ mt: 1 }} />} */}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
