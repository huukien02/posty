"use client";
import React from "react";
import { Stack, TextField, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

interface Props {
  newMessage: string;
  setNewMessage: (v: string) => void;
  onSend: () => void;
}

export default function MessageInput({
  newMessage,
  setNewMessage,
  onSend,
}: Props) {
  return (
    <Stack direction="row" spacing={1} mt={2} alignItems="center">
      <TextField
        fullWidth
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Nhập tin nhắn..."
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "999px",
            bgcolor: "action.hover",
            "& fieldset": { borderColor: "transparent" },
            "&.Mui-focused fieldset": { borderColor: "primary.main" },
          },
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSend();
        }}
      />
      <IconButton
        onClick={onSend}
        aria-label="Gửi"
        sx={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          flexShrink: 0,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          "&:hover": { bgcolor: "primary.dark" },
        }}
      >
        <SendIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}
