"use client";
import React, { useRef, useEffect } from "react";
import { Box, Typography } from "@mui/material";

interface MessageType {
  sender: string;
  text: string;
  createdAt: number;
}

interface Props {
  messages: MessageType[];
  currentUser: string;
  bgcolor: string;
  fontFamily: string;
}

export default function MessageList({
  messages,
  currentUser,
  bgcolor,
  fontFamily,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Box
      flex={1}
      mt={2}
      border="1px solid #ccc"
      borderRadius={2}
      p={2}
      overflow="auto"
      display="flex"
      flexDirection="column"
      sx={{
        backgroundColor: bgcolor,
        fontFamily: fontFamily,
      }}
    >
      {messages.map((m, idx) => (
        <Box
          key={idx}
          mb={1}
          textAlign={m.sender === currentUser ? "right" : "left"}
        >
          <Typography
            component="span"
            sx={{
              display: "inline-block",
              bgcolor: m.sender === currentUser ? "#cce5ff" : "#eee",
              borderRadius: 1,
              px: 1,
              py: 0.5,
            }}
          >
            {m.text}
          </Typography>
          <Typography
            sx={{ fontSize: "0.65rem", color: "#666", mt: 0.3 }}
            variant="caption"
            display="block"
          >
            {new Date(m.createdAt).toLocaleDateString([], {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}{" "}
            -{" "}
            {new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
        </Box>
      ))}
      <div ref={messagesEndRef} />
    </Box>
  );
}
