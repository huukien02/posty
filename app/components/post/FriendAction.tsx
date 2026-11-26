"use client";
import React, { useState, useEffect } from "react";
import {
  IconButton,
  Popover,
  Typography,
  List,
  ListItemButton,
  Avatar,
  Box,
} from "@mui/material";
import { MoreHoriz, SendOutlined } from "@mui/icons-material";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useUser } from "@/hooks/useUser";
import { db, rtdb } from "@/lib/firebase.config";
import { push, ref, set, update, get } from "firebase/database";
import { toast } from "react-toastify";
import { softShadow } from "@/app/lib/theme";

interface UserType {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface FriendActionProps {
  postToShare?: { imageUrl: string }; // nếu share post
}

const FriendAction: React.FC<FriendActionProps> = ({ postToShare }) => {
  const user = useUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [friends, setFriends] = useState<UserType[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  // Lấy danh sách bạn bè
  useEffect(() => {
    if (!user) return;

    const fetchFriends = async () => {
      const q1 = query(
        collection(db, "friendships"),
        where("status", "==", "accepted"),
        where("from", "==", user.email)
      );
      const q2 = query(
        collection(db, "friendships"),
        where("status", "==", "accepted"),
        where("to", "==", user.email)
      );

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const friendEmails: string[] = [];

      snap1.forEach((doc) => friendEmails.push((doc.data() as any).to));
      snap2.forEach((doc) => friendEmails.push((doc.data() as any).from));

      if (friendEmails.length > 0) {
        const chunks = [];
        for (let i = 0; i < friendEmails.length; i += 10)
          chunks.push(friendEmails.slice(i, i + 10));

        const allUsers: UserType[] = [];
        for (const chunk of chunks) {
          const qUsers = query(
            collection(db, "users"),
            where("email", "in", chunk)
          );
          const usersSnap = await getDocs(qUsers);
          usersSnap.forEach((doc) =>
            allUsers.push({ id: doc.id, ...(doc.data() as any) })
          );
        }
        setFriends(allUsers);
      } else setFriends([]);
    };

    fetchFriends();
  }, [user]);

  // Chọn user và tạo hoặc lấy roomId, trả về roomId
  const handleSelectUser = async (other: UserType): Promise<string | null> => {
    if (!user) return null;
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
      // đánh dấu đã đọc
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

      setRoomId(existingRoomId);
      return existingRoomId;
    } else {
      const newRoomRef = push(roomsRef);
      await set(newRoomRef, {
        sender: user.email,
        receiver: other.email,
        createdAt: Date.now(),
        unreadBy: [],
      });

      setRoomId(newRoomRef.key);
      return newRoomRef.key;
    }
  };

  // Gửi tin nhắn (text hoặc image) với roomId truyền vào
  const handleSend = async (
    receiver: UserType,
    messageText: string,
    type: "text" | "image" = "text",
    roomIdParam?: string
  ) => {
    const rId = roomIdParam ?? roomId; // ưu tiên roomId truyền vào
    if (!user || !receiver || !rId || !messageText.trim()) return;

    const msgRef = push(ref(rtdb, `chats/${rId}`));
    await set(msgRef, {
      sender: user.email,
      text: messageText,
      type,
      createdAt: Date.now(),
    });

    const roomRef = ref(rtdb, `rooms/${rId}`);
    const snap = await get(roomRef);
    const roomData = snap.val();

    const unreadBy: string[] = Array.isArray(roomData?.unreadBy)
      ? roomData.unreadBy
      : [];
    if (!unreadBy.includes(receiver.email)) unreadBy.push(receiver.email);

    await update(roomRef, {
      lastMessage: messageText,
      lastSender: user.email,
      type,
      updatedAt: Date.now(),
      unreadBy,
    });

    toast.success(`Đã chia sẻ cho ${receiver.username}!`);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        size="small"
        onClick={handleClick}
        aria-label="Gửi bài viết cho bạn bè"
        sx={{ color: "text.secondary", borderRadius: "50%" }}
      >
        <MoreHoriz fontSize="small" />
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: (t) => ({
              mt: 0.75,
              borderRadius: "12px",
              border: `1px solid ${t.palette.divider}`,
              boxShadow: softShadow(t),
            }),
          },
        }}
      >
        <Box p={1} minWidth={260} maxWidth={320}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1,
              pt: 0.5,
              pb: 1,
              color: "text.secondary",
            }}
          >
            <SendOutlined sx={{ fontSize: 16 }} />
            <Typography variant="subtitle2" color="text.primary">
              Gửi cho bạn bè
            </Typography>
          </Box>
          {friends.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 1.5 }}>
              Bạn chưa có bạn bè nào để gửi.
            </Typography>
          )}
          <List disablePadding sx={{ maxHeight: 320, overflowY: "auto" }}>
            {friends.map((friend) => (
              <ListItemButton
                key={friend.id}
                // onClick={async () => {
                //   const messageText = postToShare?.imageUrl ?? "";

                //   const rId = await handleSelectUser(friend);
                //   if (!rId) return;

                //   await handleSend(
                //     friend,
                //     messageText,
                //     postToShare ? "image" : "text",
                //     rId
                //   );

                //   handleClose();
                // }}
                onClick={async () => {
                  const { imageUrl, imageUrls }: any = postToShare || {};
                  const hasMany =
                    Array.isArray(imageUrls) && imageUrls.length > 0;

                  const messageText = hasMany
                    ? JSON.stringify(imageUrls)
                    : imageUrl ?? "";

                  const messageType: any = hasMany
                    ? "images"
                    : imageUrl
                    ? "image"
                    : "text";

                  const rId = await handleSelectUser(friend);
                  if (!rId) return;

                  await handleSend(friend, messageText, messageType, rId);
                  handleClose();
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  py: 0.75,
                  borderRadius: "8px",
                }}
              >
                <Avatar
                  src={friend.avatar ?? ""}
                  sx={{ width: 32, height: 32, fontSize: 14 }}
                >
                  {friend.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {friend.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap component="div">
                    {friend.email}
                  </Typography>
                </Box>
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Popover>
    </>
  );
};

export default FriendAction;
