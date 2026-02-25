"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Box,
  TextField,
} from "@mui/material";
import { useUser } from "@/hooks/useUser";
import { db } from "@/lib/firebase.config";

export default function FriendPage() {
  const user = useUser();
  const currentUserEmail = user?.email;
  const [users, setUsers] = useState<any[]>([]);
  const [friendships, setFriendships] = useState<any[]>([]);

  // Set laoding button
  const [requestStatus, setRequestStatus] = useState<{
    [email: string]: "loading" | "sent";
  }>({});
  const [requestActionStatus, setRequestActionStatus] = useState<{
    [id: string]: "loading" | "done";
  }>({});

  const [loadingRemoveId, setLoadingRemoveId] = useState<string | null>(null);

  // 📌 Lấy danh sách users
  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setUsers(list.filter((u: any) => u.email !== currentUserEmail));
  };

  // 📌 Lấy danh sách friendships liên quan tới mình
  const fetchFriendships = async () => {
    if (!currentUserEmail) return;
    const q1 = query(
      collection(db, "friendships"),
      where("from", "==", currentUserEmail)
    );
    const q2 = query(
      collection(db, "friendships"),
      where("to", "==", currentUserEmail)
    );
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const list = [
      ...snap1.docs.map((d) => ({ id: d.id, ...d.data() })),
      ...snap2.docs.map((d) => ({ id: d.id, ...d.data() })),
    ];
    setFriendships(list);
  };

  useEffect(() => {
    if (!currentUserEmail) return;
    fetchUsers();
    fetchFriendships();
  }, [currentUserEmail]);

  // 📌 Gửi lời mời
  const sendRequest = async (toEmail: string) => {
    if (!currentUserEmail) return;
    await addDoc(collection(db, "friendships"), {
      from: currentUserEmail,
      to: toEmail,
      status: "pending",
      createdAt: serverTimestamp(),
    });
    fetchFriendships();
  };

  // 📌 Chấp nhận lời mời
  const acceptRequest = async (friendshipId: string) => {
    const ref = doc(db, "friendships", friendshipId);
    await updateDoc(ref, { status: "accepted" });
    fetchFriendships();
  };

  // 📌 Hủy bạn hoặc từ chối lời mời
  // const removeFriendship = async (friendshipId: string) => {
  //   await deleteDoc(doc(db, "friendships", friendshipId));
  //   fetchFriendships();
  // };

  const removeFriendship = async (friendshipId: string) => {
    try {
      setLoadingRemoveId(friendshipId);
      await deleteDoc(doc(db, "friendships", friendshipId));
      await fetchFriendships();
    } catch (error) {
      console.error("Lỗi khi xoá bạn:", error);
    } finally {
      setLoadingRemoveId(null);
    }
  };

  // 📌 Helper kiểm tra trạng thái
  const getFriendship = (userEmail: string) => {
    return friendships.find(
      (f) =>
        (f.from === currentUserEmail && f.to === userEmail) ||
        (f.to === currentUserEmail && f.from === userEmail)
    );
  };

  // 📌 Chia nhóm
  const friendRequests = friendships.filter(
    (f) => f.to === currentUserEmail && f.status === "pending"
  ); // người khác gửi cho mình
  const sentRequests = friendships.filter(
    (f) => f.from === currentUserEmail && f.status === "pending"
  ); // mình đã gửi đi
  const friends = friendships.filter((f) => f.status === "accepted");
  const otherUsers = users.filter(
    (u) => u.email !== currentUserEmail && !getFriendship(u.email)
  );

  const [search, setSearch] = useState("");

  // Lọc danh sách theo username (không phân biệt hoa thường)
  const filteredUsers = useMemo(() => {
    return otherUsers.filter((u) =>
      u.email.toLowerCase().includes(search.toLowerCase().trim())
    );
  }, [otherUsers, search]);

  if (!user) return null;

  return (
    <div className="h-full w-full flex flex-col sm:flex-row gap-4 py-4 px-8 justify-center">
      <div className="w-full sm:w-[30%] h-full">
        {/* 🌍 Người dùng khác */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={"bold"} gutterBottom>
              Bạn bè đề xuất
            </Typography>

            {/* ✅ Ô tìm kiếm */}
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm theo tên người dùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ mb: 2 }}
            />

            {filteredUsers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Không tìm thấy người dùng
              </Typography>
            ) : (
              <Box
                sx={(theme) => ({
                  height: 400,
                  overflowY: "auto",
                  bgcolor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  pr: 1,
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
                })}
              >
                {filteredUsers.map((u) => {
                  const status = requestStatus[u.email];

                  return (
                    <ListItem key={u.id} divider>
                      <ListItemAvatar>
                        <Avatar src={u.avatar} />
                      </ListItemAvatar>
                      <ListItemText primary={u.username} secondary={u.email} />
                      <Button
                        size="small"
                        variant="contained"
                        disabled={status === "loading" || status === "sent"}
                        onClick={async () => {
                          setRequestStatus((prev) => ({
                            ...prev,
                            [u.email]: "loading",
                          }));
                          try {
                            await sendRequest(u.email);
                            setRequestStatus((prev) => ({
                              ...prev,
                              [u.email]: "sent",
                            }));
                          } catch {
                            setRequestStatus((prev) => {
                              const updated = { ...prev };
                              delete updated[u.email];
                              return updated;
                            });
                          }
                        }}
                      >
                        {status === "loading"
                          ? "Đang gửi..."
                          : status === "sent"
                          ? "Đã gửi"
                          : "Kết bạn"}
                      </Button>
                    </ListItem>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="w-full sm:w-[60%]">
        {/* ✅ Bạn bè */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={"bold"} gutterBottom>
              Bạn bè
            </Typography>
            {friends.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Chưa có bạn bè
              </Typography>
            ) : (
              <List>
                {friends.map((f) => {
                  const friendEmail =
                    f.from === currentUserEmail ? f.to : f.from;
                  const friend = users.find((u) => u.email === friendEmail);
                  if (!friend) return null;
                  return (
                    <ListItem key={f.id} divider>
                      <ListItemAvatar>
                        <Avatar src={friend.avatar} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={friend.username}
                        secondary={friend.email}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={loadingRemoveId === f.id}
                        onClick={() => removeFriendship(f.id)}
                      >
                        Xóa bạn
                      </Button>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </CardContent>
        </Card>

        {/* 📩 Lời mời đến */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={"bold"} gutterBottom>
              Lời mời kết bạn
            </Typography>
            {friendRequests.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Không có lời mời nào
              </Typography>
            ) : (
              <List>
                {/* {friendRequests.map((f) => {
                  const sender = users.find((u) => u.email === f.from);
                  if (!sender) return null;
                  return (
                    <ListItem key={f.id} divider>
                      <ListItemAvatar>
                        <Avatar src={sender.avatar} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={sender.username}
                        secondary={sender.email}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => acceptRequest(f.id)}
                        sx={{ mr: 1, ml: 2 }}
                      >
                        Chấp nhận
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => removeFriendship(f.id)}
                      >
                        Từ chối
                      </Button>
                    </ListItem>
                  );
                })} */}
                {friendRequests.map((f) => {
                  const sender = users.find((u) => u.email === f.from);
                  if (!sender) return null;

                  const status = requestActionStatus[f.id];

                  return (
                    <ListItem key={f.id} divider>
                      <ListItemAvatar>
                        <Avatar src={sender.avatar} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={sender.username}
                        secondary={sender.email}
                      />

                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        sx={{ mr: 1, ml: 2 }}
                        disabled={status === "loading" || status === "done"}
                        onClick={async () => {
                          setRequestActionStatus((prev) => ({
                            ...prev,
                            [f.id]: "loading",
                          }));
                          try {
                            await acceptRequest(f.id);
                            setRequestActionStatus((prev) => ({
                              ...prev,
                              [f.id]: "done",
                            }));
                          } catch {
                            setRequestActionStatus((prev) => {
                              const copy = { ...prev };
                              delete copy[f.id];
                              return copy;
                            });
                          }
                        }}
                      >
                        {status === "loading" ? "Đang xử lý..." : "Chấp nhận"}
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={status === "loading" || status === "done"}
                        onClick={async () => {
                          setRequestActionStatus((prev) => ({
                            ...prev,
                            [f.id]: "loading",
                          }));
                          try {
                            await removeFriendship(f.id);
                            setRequestActionStatus((prev) => ({
                              ...prev,
                              [f.id]: "done",
                            }));
                          } catch {
                            setRequestActionStatus((prev) => {
                              const copy = { ...prev };
                              delete copy[f.id];
                              return copy;
                            });
                          }
                        }}
                      >
                        {status === "loading" ? "Đang xử lý..." : "Từ chối"}
                      </Button>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </CardContent>
        </Card>

        {/* 📤 Lời mời đã gửi */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={"bold"} gutterBottom>
              Lời mời đã gửi
            </Typography>
            {sentRequests.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Bạn chưa gửi lời mời nào
              </Typography>
            ) : (
              <List>
                {sentRequests.map((f) => {
                  const receiver = users.find((u) => u.email === f.to);
                  if (!receiver) return null;
                  return (
                    <ListItem key={f.id} divider>
                      <ListItemAvatar>
                        <Avatar src={receiver.avatar} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={receiver.username}
                        secondary={receiver.email}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={loadingRemoveId === f.id}
                        onClick={() => removeFriendship(f.id)}
                      >
                        Huỷ lời mời
                      </Button>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
