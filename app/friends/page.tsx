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
  Typography,
  Box,
  TextField,
  Container,
  Paper,
  Stack,
  Chip,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  PersonAddAlt1,
  Group,
  MarkEmailReadOutlined,
  SendOutlined,
  Search as SearchIcon,
  PersonRemove,
  Check,
  Close,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
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
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, width: "100%" }}>
      {/* ===== Tiêu đề trang ===== */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>
          Bạn bè 👥
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Kết nối, quản lý lời mời và mở rộng cộng đồng của bạn.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1fr) minmax(0, 1.35fr)",
          },
          gap: 3,
          alignItems: "start",
        }}
      >
        {/* ===== Gợi ý kết bạn ===== */}
        <SectionCard
          icon={<PersonAddAlt1 sx={{ color: "primary.main" }} />}
          title="Gợi ý kết bạn"
          count={filteredUsers.length}
          sx={{ position: { md: "sticky" }, top: 24 }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm theo email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
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

          {filteredUsers.length === 0 ? (
            <EmptyState text="Không tìm thấy người dùng" />
          ) : (
            <Stack
              spacing={0.5}
              sx={(theme) => ({
                maxHeight: 440,
                overflowY: "auto",
                mx: -0.5,
                px: 0.5,
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
                "&::-webkit-scrollbar-thumb:hover": {
                  background: theme.palette.primary.main,
                },
                "&::-webkit-scrollbar-track": { background: "transparent" },
              })}
            >
              {filteredUsers.map((u) => {
                const status = requestStatus[u.email];
                return (
                  <FriendRow key={u.id} person={u}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={
                        status === "sent" ? <Check /> : <PersonAddAlt1 />
                      }
                      disabled={status === "loading" || status === "sent"}
                      sx={{ borderRadius: 2, flexShrink: 0 }}
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
                        ? "Đang gửi"
                        : status === "sent"
                        ? "Đã gửi"
                        : "Kết bạn"}
                    </Button>
                  </FriendRow>
                );
              })}
            </Stack>
          )}
        </SectionCard>

        {/* ===== Cột phải ===== */}
        <Stack spacing={3}>
          {/* Bạn bè */}
          <SectionCard
            icon={<Group sx={{ color: "#10b981" }} />}
            title="Bạn bè"
            count={friends.length}
          >
            {friends.length === 0 ? (
              <EmptyState text="Chưa có bạn bè" />
            ) : (
              <Stack spacing={0.5}>
                {friends.map((f) => {
                  const friendEmail =
                    f.from === currentUserEmail ? f.to : f.from;
                  const friend = users.find((u) => u.email === friendEmail);
                  if (!friend) return null;
                  return (
                    <FriendRow key={f.id} person={friend}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<PersonRemove />}
                        disabled={loadingRemoveId === f.id}
                        sx={{ borderRadius: 2, flexShrink: 0 }}
                        onClick={() => removeFriendship(f.id)}
                      >
                        Xóa bạn
                      </Button>
                    </FriendRow>
                  );
                })}
              </Stack>
            )}
          </SectionCard>

          {/* Lời mời đến */}
          <SectionCard
            icon={<MarkEmailReadOutlined sx={{ color: "primary.main" }} />}
            title="Lời mời kết bạn"
            count={friendRequests.length}
          >
            {friendRequests.length === 0 ? (
              <EmptyState text="Không có lời mời nào" />
            ) : (
              <Stack spacing={0.5}>
                {friendRequests.map((f) => {
                  const sender = users.find((u) => u.email === f.from);
                  if (!sender) return null;
                  const status = requestActionStatus[f.id];
                  const busy = status === "loading" || status === "done";

                  return (
                    <FriendRow key={f.id} person={sender}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ flexShrink: 0 }}
                      >
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<Check />}
                          disabled={busy}
                          sx={{ borderRadius: 2 }}
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
                          {status === "loading" ? "..." : "Chấp nhận"}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<Close />}
                          disabled={busy}
                          sx={{ borderRadius: 2 }}
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
                          Từ chối
                        </Button>
                      </Stack>
                    </FriendRow>
                  );
                })}
              </Stack>
            )}
          </SectionCard>

          {/* Lời mời đã gửi */}
          <SectionCard
            icon={<SendOutlined sx={{ color: "#f59e0b" }} />}
            title="Lời mời đã gửi"
            count={sentRequests.length}
          >
            {sentRequests.length === 0 ? (
              <EmptyState text="Bạn chưa gửi lời mời nào" />
            ) : (
              <Stack spacing={0.5}>
                {sentRequests.map((f) => {
                  const receiver = users.find((u) => u.email === f.to);
                  if (!receiver) return null;
                  return (
                    <FriendRow key={f.id} person={receiver}>
                      <Chip
                        size="small"
                        label="Đang chờ"
                        sx={{ mr: 1, flexShrink: 0 }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={loadingRemoveId === f.id}
                        sx={{ borderRadius: 2, flexShrink: 0 }}
                        onClick={() => removeFriendship(f.id)}
                      >
                        {loadingRemoveId === f.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          "Huỷ"
                        )}
                      </Button>
                    </FriendRow>
                  );
                })}
              </Stack>
            )}
          </SectionCard>
        </Stack>
      </Box>
    </Container>
  );
}

/* ---------- Sub-components ---------- */

function SectionCard({
  icon,
  title,
  count,
  children,
  sx,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  children: React.ReactNode;
  sx?: object;
}) {
  return (
    <Paper
      elevation={0}
      sx={[
        (theme) => ({
          p: { xs: 2, md: 2.5 },
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow:
            theme.palette.mode === "light"
              ? "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.04)"
              : "none",
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        {icon}
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
        {typeof count === "number" && (
          <Chip
            label={count}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ height: 22, fontWeight: 700 }}
          />
        )}
      </Stack>
      {children}
    </Paper>
  );
}

function FriendRow({
  person,
  children,
}: {
  person: any;
  children: React.ReactNode;
}) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{
        p: 1,
        borderRadius: 2.5,
        transition: "background-color .15s",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Avatar src={person?.avatar} sx={{ width: 44, height: 44 }}>
        {person?.username?.[0]?.toUpperCase()}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography fontWeight={600} noWrap fontSize={14}>
          {person?.username}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap fontSize={12}>
          {person?.email}
        </Typography>
      </Box>
      {children}
    </Stack>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Box sx={{ py: 3, textAlign: "center" }}>
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Box>
  );
}
