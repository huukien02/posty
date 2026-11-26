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
      p={2}
      overflow="auto"
      display="flex"
      flexDirection="column"
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: "16px",
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
              maxWidth: "70%",
              textAlign: "left",
              wordBreak: "break-word",
              bgcolor: m.sender === currentUser ? "primary.main" : "action.hover",
              color: m.sender === currentUser ? "primary.contrastText" : "text.primary",
              borderRadius: "18px",
              ...(m.sender === currentUser
                ? { borderBottomRightRadius: 6 }
                : { borderBottomLeftRadius: 6 }),
              px: 1.75,
              py: 1,
            }}
          >
            {m.text}
          </Typography>
          <Typography
            sx={{ fontSize: "0.6875rem", color: "text.secondary", mt: 0.5, px: 0.5 }}
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
