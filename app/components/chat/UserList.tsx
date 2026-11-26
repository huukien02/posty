"use client";
import React from "react";
import { Stack, Button, Typography, Avatar, Box } from "@mui/material";

interface UserType {
  id: string;
  email: string;
  username: string;
  avatar?: string | null;
}

interface Props {
  currentUser: string;
  users: UserType[];
  selectedUser: UserType | null;
  onSelect: (u: UserType) => void;
}

export default function UserList({
  currentUser,
  users,
  selectedUser,
  onSelect,
}: Props) {
  return (
    <Box
      width={{ xs: "100%", sm: 280 }}
      p={1.5}
      sx={{ borderRight: 1, borderColor: "divider", bgcolor: "background.paper" }}
    >
      <Typography variant="subtitle1" sx={{ px: 1, py: 0.5 }} noWrap>
        {currentUser}
      </Typography>
      <Stack spacing={0.5} mt={1}>
        {users.map((u) => (
          <Button
            key={u.id}
            variant="text"
            color="inherit"
            sx={{
              justifyContent: "flex-start",
              gap: 0.5,
              py: 1,
              fontWeight: 600,
              borderRadius: "12px",
              bgcolor: selectedUser?.id === u.id ? "action.selected" : "transparent",
              "&:hover": { bgcolor: "action.hover" },
            }}
            startIcon={
              u.avatar ? (
                <Avatar src={u.avatar} sx={{ width: 40, height: 40 }} />
              ) : (
                <Avatar sx={{ width: 40, height: 40 }}>{u.username[0]}</Avatar>
              )
            }
            onClick={() => onSelect(u)}
          >
            {u.username}
          </Button>
        ))}
      </Stack>
    </Box>
  );
}
