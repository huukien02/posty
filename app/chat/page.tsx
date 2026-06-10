"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItemAvatar,
  ListItemButton,
  TextField,
  Badge,
  IconButton,
  Stack,
  InputAdornment,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Send,
  Search as SearchIcon,
  ChatBubbleOutline,
} from "@mui/icons-material";
import { useUser } from "@/hooks/useUser";
import { db as fsDb, rtdb } from "@/lib/firebase.config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ref, get, set, push, onValue, off, update } from "firebase/database";
import { MultiImageSlider } from "../components/MultiImageSlider";

interface UserType {
  id: string; // uid trong Firestore
  email: string;
  username: string;
  avatar?: string | null;
}

interface MessageType {
  sender: string;
  text: string;
  createdAt: number;
  id: any;
  reactions?: Record<string, string>;
}

const emojis = [
  "❤️", // yêu thích
  "😀", // cười vui
  "😂", // cười ra nước mắt
  "😍", // yêu thích
  "😅", // ngại ngùng
  "😎", // ngầu
  "🤔", // suy nghĩ
  "😢", // buồn
  "😭", // khóc to
  "😡", // tức giận
];

export default function ChatPage() {
  const user = useUser();
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [text, setText] = useState("");
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 🔹 Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const fetchFriends = async () => {
      // 1. Lấy tất cả friendships có status=accepted mà mình là from hoặc to
      const q1 = query(
        collection(fsDb, "friendships"),
        where("status", "==", "accepted"),
        where("from", "==", user.email),
      );
      const q2 = query(
        collection(fsDb, "friendships"),
        where("status", "==", "accepted"),
        where("to", "==", user.email),
      );

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const friendEmails: string[] = [];

      snap1.forEach((doc) => {
        const data = doc.data() as any;
        friendEmails.push(data.to); // mình là from → bạn là to
      });
      snap2.forEach((doc) => {
        const data = doc.data() as any;
        friendEmails.push(data.from); // mình là to → bạn là from
      });

      // 2. Lấy user info theo email
      if (friendEmails.length > 0) {
        const chunks = [];
        for (let i = 0; i < friendEmails.length; i += 10) {
          chunks.push(friendEmails.slice(i, i + 10));
        }

        const allUsers: UserType[] = [];
        for (const chunk of chunks) {
          const qUsers = query(
            collection(fsDb, "users"),
            where("email", "in", chunk),
          );
          const usersSnap = await getDocs(qUsers);
          usersSnap.forEach((doc) => {
            allUsers.push({ id: doc.id, ...(doc.data() as any) });
          });
        }

        setUsers(allUsers);
      } else {
        setUsers([]);
      }
    };

    fetchFriends();
  }, [user]);

  // 🔹 Lắng nghe tin nhắn realtime
  useEffect(() => {
    if (!roomId) return;

    const chatRef = ref(rtdb, `chats/${roomId}`);
    const listener = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        }));
        setMessages(msgs.sort((a, b) => a.createdAt - b.createdAt));
      } else {
        setMessages([]);
      }
    });

    return () => {
      off(chatRef);
    };
  }, [roomId]);

  const handleSelectUser = async (other: UserType) => {
    if (!user) return;
    setSelectedUser(other);

    const roomsRef = ref(rtdb, "rooms");
    const snapshot = await get(roomsRef);

    let existingRoomId: string | null = null;

    if (snapshot.exists()) {
      const allRooms = snapshot.val();
      for (const [rid, room] of Object.entries<any>(allRooms)) {
        if (
          (room.sender === user.email && room.receiver === other.email) ||
          (room.sender === other.email && room.receiver === user.email)
        ) {
          existingRoomId = rid;
          break;
        }
      }
    }

    if (existingRoomId) {
      setRoomId(existingRoomId);

      // 🔹 Đánh dấu đã đọc
      const roomRef = ref(rtdb, `rooms/${existingRoomId}`);
      const snap = await get(roomRef);
      if (snap.exists()) {
        const roomData = snap.val();
        const unreadBy: string[] = Array.isArray(roomData?.unreadBy)
          ? roomData.unreadBy
          : [];
        const newUnreadBy = unreadBy.filter((u) => u !== user.email);

        await update(roomRef, { unreadBy: newUnreadBy });
      }
    } else {
      // Tạo room mới
      const newRoomRef = push(roomsRef);
      await set(newRoomRef, {
        sender: user.email,
        receiver: other.email,
        createdAt: Date.now(),
        unreadBy: [], // luôn tạo mới có unreadBy
      });
      setRoomId(newRoomRef.key);
    }
  };
  // 🔹 Gửi tin nhắn
  const handleSend = async () => {
    if (!user || !selectedUser || !roomId || !text.trim() || text.length > 2000)
      return;

    const msgRef = push(ref(rtdb, `chats/${roomId}`));
    await set(msgRef, {
      sender: user.email,
      text,
      createdAt: Date.now(),
    });

    // Cập nhật lastMessage trong rooms
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snap = await get(roomRef);
    const roomData = snap.val();

    // Nếu chưa có unreadBy thì tạo mảng mới
    let unreadBy: string[] = Array.isArray(roomData?.unreadBy)
      ? roomData.unreadBy
      : [];

    // Thêm receiver vào unreadBy nếu chưa có
    if (!unreadBy.includes(selectedUser.email)) {
      unreadBy.push(selectedUser.email);
    }

    await update(roomRef, {
      lastMessage: text,
      lastSender: user.email,
      updatedAt: Date.now(),
      unreadBy,
    });

    setText("");
  };

  useEffect(() => {
    const roomsRef = ref(rtdb, "rooms");
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allRooms = snapshot.val();
        const list = Object.entries(allRooms).map(([id, room]) => ({
          id,
          ...(room as any),
        }));
        setRooms(list);
      } else {
        setRooms([]);
      }
    });

    return () => off(roomsRef);
  }, []);

  const findRoomWithUser = (otherEmail: string) => {
    if (!user) return null;
    return rooms.find(
      (room) =>
        (room.sender === user.email && room.receiver === otherEmail) ||
        (room.sender === otherEmail && room.receiver === user.email),
    );
  };

  // 🔹 Reaction msg
  const handleSelectEmoji = async (emoji: string) => {
    if (!selectedMsg || !user) return;

    const userKey = user.email.replace(/\./g, "_");
    const msgRef = ref(rtdb, `chats/${roomId}/${selectedMsg}/reactions`);

    // Lấy dữ liệu reaction hiện tại của tin nhắn
    const snapshot = await get(msgRef);
    const reactions = snapshot.val() || {};

    // Nếu user đã chọn cùng emoji -> xóa reaction
    if (reactions[userKey] === emoji) {
      await update(msgRef, { [userKey]: null });
    } else {
      // Nếu khác -> set reaction mới
      await update(msgRef, { [userKey]: emoji });
    }

    setSelectedMsg(null);
  };

  const [search, setSearch] = useState("");

  // ✅ Lọc danh sách theo username (không phân biệt hoa thường)
  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.username?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [users, search]);

  // 🔹 Helper định dạng thời gian / ngày
  const formatTime = (ts?: number) =>
    ts
      ? new Date(ts).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const isSameDay = (a?: number, b?: number) => {
    if (!a || !b) return false;
    return new Date(a).toDateString() === new Date(b).toDateString();
  };

  const formatDayLabel = (ts?: number) => {
    if (!ts) return "";
    const d = new Date(ts).toDateString();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (d === today) return "Hôm nay";
    if (d === yesterday) return "Hôm qua";
    return new Date(ts).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // 🔹 Sắp xếp hội thoại theo hoạt động gần nhất
  const conversations = [...filteredUsers].sort((a, b) => {
    const ra = findRoomWithUser(a.email)?.updatedAt || 0;
    const rb = findRoomWithUser(b.email)?.updatedAt || 0;
    return rb - ra;
  });

  if (!user) return null;

  return (
    <Box
      sx={(theme) => ({
        flex: 1,
        alignSelf: "stretch",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        width: "100%",
        minHeight: 0,
        bgcolor: theme.palette.background.default,
      })}
    >
      {/* ===== Sidebar danh sách ===== */}
      <Box
        sx={(theme) => ({
          width: { xs: "100%", md: 320 },
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          borderRight: { md: `1px solid ${theme.palette.divider}` },
          borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: "none" },
          bgcolor: theme.palette.background.paper,
        })}
      >
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
            Tin nhắn 💬
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm bạn bè..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      fontSize="small"
                      sx={{ color: "text.secondary" }}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Box
          sx={(theme) => ({
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
            px: 1,
            scrollbarWidth: "thin",
            scrollbarColor: `${alpha(
              theme.palette.primary.main,
              0.6
            )} transparent`,
            "&::-webkit-scrollbar": { width: 8 },
            "&::-webkit-scrollbar-thumb": {
              background: alpha(theme.palette.primary.main, 0.5),
              borderRadius: 8,
            },
            "&::-webkit-scrollbar-track": { background: "transparent" },
          })}
        >
          {conversations.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ p: 2, textAlign: "center" }}
            >
              Không có bạn bè nào
            </Typography>
          ) : (
            <List disablePadding>
              {conversations.map((u) => {
                const room = findRoomWithUser(u.email);
                const hasNew = room?.unreadBy?.includes(user.email);
                const lastMsg: string | undefined = room?.lastMessage;
                const isMine = room?.lastSender === user.email;
                const preview = lastMsg
                  ? `${isMine ? "Bạn: " : ""}${lastMsg}`
                  : u.email;

                return (
                  <ListItemButton
                    key={u.id}
                    selected={selectedUser?.id === u.id}
                    onClick={() => handleSelectUser(u)}
                    sx={{
                      borderRadius: 2.5,
                      mb: 0.5,
                      py: 1,
                      "&.Mui-selected": {
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                        "&:hover": {
                          bgcolor: (t) => alpha(t.palette.primary.main, 0.18),
                        },
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        variant="dot"
                        color="error"
                        invisible={!hasNew}
                        anchorOrigin={{ vertical: "top", horizontal: "right" }}
                        sx={{
                          "& .MuiBadge-dot": {
                            height: 14,
                            minWidth: 14,
                            borderRadius: "50%",
                            border: (t) =>
                              `2px solid ${t.palette.background.paper}`,
                          },
                        }}
                      >
                        <Avatar
                          src={u.avatar || undefined}
                          sx={{ width: 48, height: 48 }}
                        >
                          {u.username?.[0]?.toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Typography
                          noWrap
                          sx={{
                            fontSize: "0.9rem",
                            fontWeight: hasNew ? 800 : 600,
                          }}
                        >
                          {u.username}
                        </Typography>
                        {room?.updatedAt && (
                          <Typography
                            variant="caption"
                            color={hasNew ? "primary.main" : "text.secondary"}
                            sx={{ flexShrink: 0, fontWeight: hasNew ? 700 : 400 }}
                          >
                            {formatTime(room.updatedAt)}
                          </Typography>
                        )}
                      </Stack>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Typography
                          noWrap
                          sx={{
                            fontSize: "0.78rem",
                            color: hasNew ? "text.primary" : "text.secondary",
                            fontWeight: hasNew ? 700 : 400,
                          }}
                        >
                          {preview}
                        </Typography>
                        {hasNew && (
                          <Box
                            sx={{
                              flexShrink: 0,
                              width: 9,
                              height: 9,
                              borderRadius: "50%",
                              bgcolor: "primary.main",
                            }}
                          />
                        )}
                      </Stack>
                    </Box>
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>
      </Box>

      {/* ===== Khu vực chat ===== */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          minWidth: 0,
        }}
      >
        {selectedUser ? (
          <>
            {/* Header */}
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={(theme) => ({
                px: 2.5,
                py: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper,
                flexShrink: 0,
              })}
            >
              <Avatar src={selectedUser.avatar || undefined}>
                {selectedUser.username?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography fontWeight={700} lineHeight={1.2}>
                  {selectedUser.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedUser.email}
                </Typography>
              </Box>
            </Stack>

            {/* Danh sách tin nhắn */}
            <Box
              ref={scrollRef}
              sx={(theme) => ({
                flex: 1,
                overflowY: "auto",
                minHeight: 0,
                px: { xs: 2, md: 4 },
                py: 3,
                scrollbarWidth: "thin",
                scrollbarColor: `${alpha(
                  theme.palette.primary.main,
                  0.5
                )} transparent`,
                "&::-webkit-scrollbar": { width: 8 },
                "&::-webkit-scrollbar-thumb": {
                  background: alpha(theme.palette.primary.main, 0.4),
                  borderRadius: 8,
                },
                "&::-webkit-scrollbar-track": { background: "transparent" },
              })}
            >
              {messages.length === 0 ? (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  spacing={1}
                  sx={{ height: "100%", color: "text.secondary", textAlign: "center" }}
                >
                  <Avatar
                    src={selectedUser.avatar || undefined}
                    sx={{ width: 72, height: 72, mb: 1 }}
                  >
                    {selectedUser.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography fontWeight={700} color="text.primary">
                    {selectedUser.username}
                  </Typography>
                  <Typography variant="body2">
                    Hãy gửi lời chào để bắt đầu trò chuyện 👋
                  </Typography>
                </Stack>
              ) : (
                messages.map((msg: any, i: number) => {
                  const prev = messages[i - 1];
                  const next = messages[i + 1];
                  const isOwn = msg.sender === user?.email;
                  const isImage =
                    msg.type === "image" || msg.type === "images";
                  const showDay =
                    !prev || !isSameDay(prev.createdAt, msg.createdAt);
                  const lastOfGroup =
                    !next ||
                    next.sender !== msg.sender ||
                    !isSameDay(next.createdAt, msg.createdAt);

                  return (
                    <Box key={msg.id}>
                      {/* Ngăn cách theo ngày */}
                      {showDay && (
                        <Box
                          sx={{ display: "flex", justifyContent: "center", my: 2 }}
                        >
                          <Box
                            sx={(theme) => ({
                              px: 1.5,
                              py: 0.25,
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                              color: "text.secondary",
                              bgcolor:
                                theme.palette.mode === "light"
                                  ? theme.palette.grey[100]
                                  : alpha("#ffffff", 0.08),
                            })}
                          >
                            {formatDayLabel(msg.createdAt)}
                          </Box>
                        </Box>
                      )}

                      <Stack
                        direction="row"
                        justifyContent={isOwn ? "flex-end" : "flex-start"}
                        alignItems="flex-end"
                        spacing={1}
                        sx={{ mb: lastOfGroup ? 1.5 : 0.4 }}
                      >
                        {/* Avatar người gửi (chỉ ở tin cuối nhóm) */}
                        {!isOwn &&
                          (lastOfGroup ? (
                            <Avatar
                              src={selectedUser.avatar || undefined}
                              sx={{ width: 28, height: 28, fontSize: 13 }}
                            >
                              {selectedUser.username?.[0]?.toUpperCase()}
                            </Avatar>
                          ) : (
                            <Box sx={{ width: 28, flexShrink: 0 }} />
                          ))}

                        <Box
                          sx={{
                            position: "relative",
                            maxWidth: "72%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isOwn ? "flex-end" : "flex-start",
                          }}
                        >
                          {/* bubble */}
                          <Box
                            onClick={() =>
                              setSelectedMsg(
                                selectedMsg === msg.id ? null : msg.id
                              )
                            }
                            sx={(theme) => ({
                              position: "relative",
                              p: isImage ? 0.5 : "8px 14px",
                              maxWidth: "100%",
                              cursor: "pointer",
                              borderRadius: 3,
                              ...(isOwn
                                ? { borderBottomRightRadius: 4 }
                                : { borderBottomLeftRadius: 4 }),
                              bgcolor: isImage
                                ? "transparent"
                                : isOwn
                                ? theme.palette.primary.main
                                : theme.palette.mode === "light"
                                ? theme.palette.grey[100]
                                : alpha("#ffffff", 0.08),
                              color: isOwn
                                ? theme.palette.primary.contrastText
                                : theme.palette.text.primary,
                              border: isImage
                                ? `1px solid ${theme.palette.divider}`
                                : "none",
                              boxShadow: isImage
                                ? "0 2px 8px rgba(2,6,23,0.12)"
                                : "none",
                            })}
                          >
                            {msg.type === "image" ? (
                              <img
                                src={msg.text}
                                alt="shared"
                                style={{
                                  maxWidth: "180px",
                                  maxHeight: "180px",
                                  borderRadius: "8px",
                                  display: "block",
                                }}
                              />
                            ) : msg.type === "images" ? (
                              <MultiImageSlider images={JSON.parse(msg.text)} />
                            ) : (
                              <Typography
                                variant="body2"
                                sx={{
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                }}
                              >
                                {msg.text}
                              </Typography>
                            )}

                            {/* reaction */}
                            {msg.reactions && (
                              <Box
                                sx={(theme) => ({
                                  position: "absolute",
                                  bottom: -10,
                                  right: isOwn ? 6 : "auto",
                                  left: isOwn ? "auto" : 6,
                                  display: "flex",
                                  gap: "2px",
                                  bgcolor: theme.palette.background.paper,
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: "12px",
                                  px: 0.5,
                                  py: 0.1,
                                  boxShadow: "0 2px 6px rgba(2,6,23,0.15)",
                                })}
                              >
                                {Object.values(msg.reactions).map(
                                  (emoji: any, idx) => (
                                    <span
                                      key={idx}
                                      style={{ fontSize: "0.85rem" }}
                                    >
                                      {emoji}
                                    </span>
                                  )
                                )}
                              </Box>
                            )}
                          </Box>

                          {/* popup chọn emoji */}
                          {selectedMsg === msg.id && (
                            <Box
                              sx={(theme) => ({
                                position: "absolute",
                                bottom: -48,
                                right: isOwn ? 0 : "auto",
                                left: isOwn ? "auto" : 0,
                                display: "flex",
                                gap: "2px",
                                bgcolor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: "999px",
                                boxShadow: "0 8px 24px rgba(2,6,23,0.2)",
                                px: 0.5,
                                py: 0.25,
                                zIndex: 10,
                              })}
                            >
                              {emojis.map((emoji, idx) => {
                                const userKey = user?.email.replace(
                                  /\./g,
                                  "_"
                                );
                                const currentReaction =
                                  msg.reactions?.[userKey];

                                return (
                                  <IconButton
                                    key={idx}
                                    size="small"
                                    onClick={() => handleSelectEmoji(emoji)}
                                    sx={{
                                      bgcolor:
                                        currentReaction === emoji
                                          ? "action.selected"
                                          : "transparent",
                                    }}
                                  >
                                    <span style={{ fontSize: "1.25rem" }}>
                                      {emoji}
                                    </span>
                                  </IconButton>
                                );
                              })}
                            </Box>
                          )}

                          {/* thời gian (chỉ ở tin cuối nhóm) */}
                          {lastOfGroup && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: "0.62rem", mt: 0.5, px: 0.5 }}
                            >
                              {formatTime(msg.createdAt)}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Box>
                  );
                })
              )}
            </Box>

            {/* Ô nhập */}
            <Box
              sx={(theme) => ({
                p: 1.5,
                borderTop: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper,
                flexShrink: 0,
              })}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="flex-end"
                sx={(theme) => ({
                  p: 0.5,
                  pl: 2,
                  borderRadius: 999,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor:
                    theme.palette.mode === "light"
                      ? theme.palette.grey[50]
                      : alpha("#ffffff", 0.04),
                  transition: "border-color .15s",
                  "&:focus-within": {
                    borderColor: theme.palette.primary.main,
                  },
                })}
              >
                <TextField
                  fullWidth
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  variant="standard"
                  multiline
                  maxRows={5}
                  slotProps={{ input: { disableUnderline: true } }}
                  sx={{ py: 0.75 }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <IconButton
                  onClick={handleSend}
                  disabled={!text.trim()}
                  sx={(theme) => ({
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    "&:hover": { bgcolor: theme.palette.primary.dark },
                    "&.Mui-disabled": {
                      bgcolor: theme.palette.action.disabledBackground,
                      color: theme.palette.action.disabled,
                    },
                  })}
                >
                  <Send fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          </>
        ) : (
          <Stack
            flex={1}
            alignItems="center"
            justifyContent="center"
            spacing={1.5}
            sx={{ color: "text.secondary", p: 4, textAlign: "center" }}
          >
            <ChatBubbleOutline sx={{ fontSize: 56, opacity: 0.4 }} />
            <Typography fontWeight={600}>Chọn một người để bắt đầu</Typography>
            <Typography variant="body2">
              Tin nhắn của bạn sẽ hiển thị ở đây.
            </Typography>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
