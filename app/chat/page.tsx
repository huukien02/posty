"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  TextField,
  Button,
  Divider,
  Badge,
  Popover,
  IconButton,
} from "@mui/material";
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

  if (!user) return null;

  return (
    <div className="flex flex-col flex-1 sm:flex-row">
      <div className="md:w-1/4 w-full h-full border-r border-gray-300 flex flex-col">
        {/* Header */}
        <div className="h-[80px] font-bold flex items-center px-3 text-lg  border-b border-gray-300">
          Users
        </div>

        <TextField
          fullWidth
          size="small"
          placeholder="Tìm theo tên người dùng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 1 }}
        />

        <div className="h-[calc(100vh-200px)] overflow-y-auto">
          <List disablePadding>
            {filteredUsers.map((u) => {
              const room = findRoomWithUser(u.email);
              const hasNew = room?.unreadBy?.includes(user.email);

              return (
                <ListItemButton
                  key={u.id}
                  selected={selectedUser?.id === u.id}
                  onClick={() => handleSelectUser(u)}
                  sx={{
                    "&.Mui-selected": {
                      backgroundColor: "action.selected",
                    },
                    "&:hover": {
                      backgroundColor: "action.hover",
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
                          height: 15,
                          minWidth: 15,
                          borderRadius: "50%",
                          border: "2px solid white", // tạo viền trắng giống Messenger
                          fontWeight: "bold",
                        },
                      }}
                    >
                      <Avatar src={u.avatar || undefined}>
                        {u.username?.[0]}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>

                  <ListItemText
                    primary={u.username}
                    secondary={u.email}
                    primaryTypographyProps={{
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{
                      fontSize: "0.75rem",
                      color: "text.secondary",
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </div>
      </div>

      <Box
        sx={(theme) => ({
          width: { xs: "100%", md: "75%" },
          height: "100%",
          overflowY: "auto", // ✅ thêm dòng này để có scrollbar
          "&::-webkit-scrollbar": {
            width: 8,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor:
              theme.palette.mode === "dark"
                ? theme.palette.grey[700]
                : theme.palette.grey[400],
            borderRadius: 4,
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor:
              theme.palette.mode === "dark"
                ? theme.palette.background.default
                : theme.palette.grey[200],
          },
          /* Firefox support */
          scrollbarWidth: "thin",
          scrollbarColor:
            theme.palette.mode === "dark"
              ? `${theme.palette.grey[700]} ${theme.palette.background.default}`
              : `${theme.palette.grey[400]} ${theme.palette.grey[200]}`,
        })}
      >
        {selectedUser ? (
          <>
            <Box p={2} borderBottom="1px solid #ccc">
              <Typography variant="h6">
                <span style={{ fontWeight: "bold" }}>Chat with</span>{" "}
                <span style={{ fontWeight: "bold", color: "#1976d2" }}>
                  {selectedUser.username}
                </span>
              </Typography>
            </Box>
            <div
              ref={scrollRef}
              className="h-[calc(100vh-250px)] overflow-y-scroll px-5 py-3"
            >
              <Box sx={{ py: 5 }}>
                {messages.map((msg: any, idx: number) => (
                  <Box
                    key={idx}
                    display="flex"
                    flexDirection="column"
                    alignItems={
                      msg.sender === user?.email ? "flex-end" : "flex-start"
                    }
                    mb={0.5}
                    sx={{ position: "relative" }}
                  >
                    {/* bubble */}
                    <Box
                      p={msg.type === "image" ? 0.5 : 1.2} // nhỏ hơn padding cho ảnh
                      borderRadius={2}
                      bgcolor={
                        msg.type !== "image" && msg.type !== "images"
                          ? msg.sender === user?.email
                            ? "primary.main"
                            : "grey.200"
                          : "transparent"
                      }
                      color={msg.sender === user?.email ? "white" : "black"}
                      maxWidth="70%"
                      onClick={() =>
                        setSelectedMsg(selectedMsg === msg.id ? null : msg.id)
                      }
                      sx={{
                        cursor: "pointer",
                        border:
                          msg.type === "image" || msg.type === "images"
                            ? "1px solid rgba(214, 214, 214, 0.1)"
                            : "none",
                        boxShadow:
                          msg.type === "image" || msg.type === "images"
                            ? 1
                            : "none",
                      }}
                    >
                      {msg.type === "image" ? (
                        <img
                          src={msg.text}
                          alt="shared"
                          style={{
                            maxWidth: "150px",
                            maxHeight: "150px",
                            borderRadius: "8px",
                            display: "block",
                          }}
                        />
                      ) : msg.type === "images" ? (
                        // 🖼️🖼️ Trường hợp nhiều ảnh
                        <MultiImageSlider images={JSON.parse(msg.text)} />
                      ) : (
                        // 💬 Trường hợp text
                        <Typography
                          variant="body1"
                          sx={{
                            overflowY: "auto",
                            overflowX: "hidden",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {msg.text}
                        </Typography>
                      )}

                      {/* hiển thị reaction nếu có */}
                      {msg.reactions && (
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 8,
                            right: msg.sender === user?.email ? 0 : "auto",
                            left: msg.sender === user?.email ? "auto" : 0,
                            display: "flex",
                            gap: "3px",
                            borderRadius: "12px",
                            px: 0.5,
                            py: 0.2,
                          }}
                        >
                          {Object.values(msg.reactions).map((emoji: any, i) => (
                            <span key={i} style={{ fontSize: "0.9rem" }}>
                              {emoji}
                            </span>
                          ))}
                        </Box>
                      )}
                    </Box>

                    {/* popup emoji */}
                    {selectedMsg === msg.id && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: -45,
                          right: msg.sender === user?.email ? 0 : "auto",
                          left: msg.sender === user?.email ? "auto" : 0,
                          display: "flex",
                          gap: "5px",
                          bgcolor: "white",
                          borderRadius: "20px",
                          boxShadow: 3,
                          px: 1,
                          py: 0.5,
                          zIndex: 10,
                        }}
                      >
                        {emojis.map((emoji, i) => {
                          const userKey = user?.email.replace(/\./g, "_");
                          const currentReaction = msg.reactions?.[userKey];

                          return (
                            <IconButton
                              key={i}
                              onClick={() => handleSelectEmoji(emoji)}
                              sx={{
                                bgcolor:
                                  currentReaction === emoji
                                    ? "grey.300"
                                    : "transparent",
                                borderRadius: "50%",
                              }}
                            >
                              <span style={{ fontSize: "1.5rem" }}>
                                {emoji}
                              </span>
                            </IconButton>
                          );
                        })}
                      </Box>
                    )}

                    {/* thời gian */}
                    <Typography
                      variant="caption"
                      sx={{ fontSize: "0.65rem", opacity: 0.6, mt: 1.75 }}
                    >
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : ""}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </div>
            <Box p={2} display="flex" gap={1}>
              <TextField
                fullWidth
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
                size="small"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button variant="contained" onClick={handleSend}>
                Send
              </Button>
            </Box>
          </>
        ) : (
          <Box
            flex={1}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Typography sx={{ mt: 2 }}>Select a user to chat</Typography>
          </Box>
        )}
      </Box>
    </div>
  );
}
