"use client";
import { useState } from "react";
import { db } from "../../../lib/firebase.config";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import {
  Box,
  TextField,
  Button,
  Avatar,
  IconButton,
  Paper,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useUser } from "@/hooks/useUser";

interface CommentBoxProps {
  postId: string;
  userId: string;
  userAvatar?: string;
  onCommentAdded: () => void;
}

export default function CommentBox({
  postId,
  userId,
  userAvatar,
  onCommentAdded,
}: CommentBoxProps) {
  const user = useUser();
  const [text, setText] = useState("");

  const handleAddComment = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "posts", postId, "comments"), {
      userId,
      text,
      createdAt: serverTimestamp(),
    });

    setText("");
    onCommentAdded();
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        mt: 1,
      }}
    >
      {/* Avatar user */}
      <Avatar src={user?.avatar ?? ""} sx={{ width: 32, height: 32 }} />

      {/* Input comment */}
      <TextField
        placeholder="Viết bình luận..."
        variant="outlined"
        size="small"
        fullWidth
        value={text}
        onChange={(e) => setText(e.target.value)}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "999px",
            bgcolor: "action.hover",
            "& fieldset": { borderColor: "transparent" },
            "&:hover fieldset": { borderColor: "divider" },
            "&.Mui-focused fieldset": { borderColor: "primary.main", borderWidth: 1 },
          },
        }}
      />

      {/* Nút gửi */}
      <IconButton
        color="primary"
        disabled={!text.trim()}
        onClick={handleAddComment}
      >
        <SendIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
