import { useEffect, useState } from "react";
import { Box, Typography, IconButton, Avatar, Tooltip } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../../../lib/firebase.config";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import SettingDialog from "./SettingDialog";

interface ChatWindowProps {
  roomId: string | null;
  selectedUser: {
    id: string; // uid
    email: string;
    username: string;
    avatar?: string | null;
  } | null;
  currentUser: string; // uid
  messages: {
    sender: string; // uid
    text: string;
    createdAt: number;
  }[];
  newMessage: string;
  setNewMessage: (msg: string) => void;
  onSend: () => void;
}

export default function ChatWindow({
  roomId,
  selectedUser,
  currentUser,
  messages,
  newMessage,
  setNewMessage,
  onSend,
}: ChatWindowProps) {
  const [theme, setTheme] = useState({
    background: "#fff",
    fontFamily: "Roboto",
  });
  const [openSettings, setOpenSettings] = useState(false);

  // load config realtime từ room
  useEffect(() => {
    if (!roomId) return;
    const roomRef = ref(rtdb, `rooms/${roomId}/config`);
    const unsub = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTheme(data);
      }
    });
    return () => unsub();
  }, [roomId]);

  return (
    <Box flex={1} p={2} display="flex" flexDirection="column" minHeight={0}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ pb: 1.5, borderBottom: 1, borderColor: "divider" }}
      >
        {selectedUser ? (
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              src={selectedUser.avatar || undefined}
              alt={selectedUser.username}
              sx={{ width: 40, height: 40 }}
            />
            <Typography variant="subtitle1">
              {selectedUser.username || selectedUser.email}
            </Typography>
          </Box>
        ) : (
          <Typography variant="subtitle1" color="text.secondary">
            Chọn một người để trò chuyện
          </Typography>
        )}
        {roomId && (
          <Tooltip title="Tuỳ chỉnh cuộc trò chuyện">
            <IconButton onClick={() => setOpenSettings(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Messages */}
      <MessageList
        bgcolor={theme.background}
        fontFamily={theme.fontFamily}
        messages={messages}
        currentUser={currentUser}
      />

      {/* Input */}
      {selectedUser && (
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSend={onSend}
        />
      )}

      {/* Settings */}
      <SettingDialog
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        theme={theme}
        setTheme={setTheme}
        roomId={roomId || ""}
      />
    </Box>
  );
}
