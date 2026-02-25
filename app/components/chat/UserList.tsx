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
    <Box width={{ xs: "100%", sm: 200 }} borderRight="1px solid #ccc" p={2}>
      <Typography variant="h6">{currentUser}</Typography>
      <Stack spacing={1} mt={2}>
        {users.map((u) => (
          <Button
            key={u.id}
            variant={selectedUser?.id === u.id ? "contained" : "outlined"}
            startIcon={
              u.avatar ? (
                <Avatar src={u.avatar} />
              ) : (
                <Avatar>{u.username[0]}</Avatar>
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
