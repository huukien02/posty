"use client";
import React from "react";
import { Stack, TextField, Button } from "@mui/material";

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
    <Stack direction="row" spacing={1} mt={2}>
      <TextField
        fullWidth
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message"
        onKeyDown={(e) => {
          if (e.key === "Enter") onSend();
        }}
      />
      <Button variant="contained" onClick={onSend}>
        Send
      </Button>
    </Stack>
  );
}
