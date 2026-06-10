"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase.config";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import {
  Box,
  Typography,
  Avatar,
  Paper,
  TextField,
  IconButton,
  Chip,
  Stack,
  Skeleton,
  Container,
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  ArrowBackRounded,
  ChatBubbleOutlineRounded,
  SendRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
} from "@mui/icons-material";
import { useUser } from "@/hooks/useUser";

interface Post {
  imageUrls: any;
  id: string;
  title: string;
  content?: string;
  imageUrl?: string;
  authorId: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface Comment {
  id: string;
  text: string;
  userId: string; // email
  createdAt?: any;
  user?: User | null;
}

export default function PostDetail() {
  const { id: postId } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useUser();
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  // 🔹 Hàm lấy user theo email
  const fetchUserByEmail = async (email: string): Promise<User | null> => {
    const q = query(collection(db, "users"), where("email", "==", email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as User;
    }
    return null;
  };

  // 🔹 Lấy dữ liệu post + tác giả + comment
  useEffect(() => {
    const fetchData = async () => {
      if (!postId) return;

      // Post
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);

      if (postSnap.exists()) {
        const postData = postSnap.data() as Post;
        setPost({ ...postData, id: postSnap.id });

        // Tác giả
        if (postData.authorId) {
          const authorUser = await fetchUserByEmail(postData.authorId);
          if (authorUser) setAuthor(authorUser);
        }
      }

      // Comments
      const commentsSnap = await getDocs(
        query(
          collection(db, "posts", postId, "comments"),
          orderBy("createdAt", "desc")
        )
      );

      const commentsWithUser = await Promise.all(
        commentsSnap.docs.map(async (d) => {
          const data = d.data() as Comment;
          const user = await fetchUserByEmail(data.userId);
          return { ...data, id: d.id, user };
        })
      );

      setComments(commentsWithUser);
    };

    fetchData();
  }, [postId]);

  // 🔹 Gửi comment mới
  const handleAddComment = async () => {
    if (!text.trim() || !postId || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, "posts", postId, "comments"), {
        text,
        userId: user?.email,
        createdAt: serverTimestamp(),
      });

      setText("");

      // Refresh comments
      const commentsSnap = await getDocs(
        query(
          collection(db, "posts", postId, "comments"),
          orderBy("createdAt", "desc")
        )
      );

      const commentsWithUser = await Promise.all(
        commentsSnap.docs.map(async (d) => {
          const data = d.data() as Comment;
          const u = await fetchUserByEmail(data.userId);
          return { ...data, id: d.id, user: u };
        })
      );

      setComments(commentsWithUser);
    } finally {
      setSending(false);
    }
  };

  if (!post) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Paper
          elevation={0}
          sx={(theme) => ({
            p: { xs: 2.5, md: 4 },
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
            <Skeleton variant="circular" width={48} height={48} />
            <Box flex={1}>
              <Skeleton width="40%" height={22} />
              <Skeleton width="55%" height={18} />
            </Box>
          </Stack>
          <Skeleton width="80%" height={42} />
          <Skeleton width="100%" height={20} sx={{ mt: 2 }} />
          <Skeleton width="95%" height={20} />
          <Skeleton width="60%" height={20} />
          <Skeleton
            variant="rounded"
            height={220}
            sx={{ mt: 3, borderRadius: 3 }}
          />
        </Paper>
      </Container>
    );
  }

  const commentCount = comments.length;

  const images: string[] =
    post.imageUrls && post.imageUrls.length > 0
      ? post.imageUrls
      : post.imageUrl
      ? [post.imageUrl]
      : [];
  const currentImage = images[imgIndex % images.length] ?? images[0];
  const prevImage = () =>
    setImgIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const nextImage = () =>
    setImgIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 2, md: 3 },
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Nút quay lại */}
      <Chip
        icon={<ArrowBackRounded sx={{ fontSize: 18 }} />}
        label="Quay lại"
        onClick={() => router.back()}
        variant="outlined"
        sx={{
          mb: 2,
          flexShrink: 0,
          alignSelf: "flex-start",
          borderRadius: 999,
          fontWeight: 600,
          "& .MuiChip-icon": { ml: 0.5 },
        }}
      />

      {/* ===== 2 CỘT: BÀI VIẾT | BÌNH LUẬN ===== */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 2.5, md: 3 },
        }}
      >
        {/* ===== CARD BÀI VIẾT ===== */}
        <Paper
          elevation={0}
          sx={(theme) => ({
            flex: { xs: "none", md: 1.2 },
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            borderRadius: 4,
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
            boxShadow:
              theme.palette.mode === "light"
                ? "0 1px 2px rgba(16,24,40,0.04), 0 12px 32px rgba(16,24,40,0.06)"
                : "0 12px 32px rgba(0,0,0,0.35)",
          })}
        >
          {/* Dải gradient đầu card */}
          <Box
            sx={(theme) => {
              const isDark = theme.palette.mode === "dark";
              const c1 = isDark ? "#1e1b4b" : "#4f46e5";
              const c2 = isDark ? "#3b0764" : "#7c3aed";
              return {
                height: 8,
                flexShrink: 0,
                background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
              };
            }}
          />

          <Box
            sx={{
              p: { xs: 2.5, md: 4 },
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              scrollbarWidth: "thin",
            }}
          >
          {/* Tác giả */}
          {author && (
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mb: 2.5 }}
            >
              <Avatar
                src={author.avatar ?? ""}
                sx={(theme) => ({
                  width: 50,
                  height: 50,
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                })}
              >
                {author.username?.[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                  {author.username}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {author.email}
                </Typography>
              </Box>
            </Stack>
          )}

          {/* Tiêu đề */}
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              fontSize: { xs: 26, md: 34 },
              mb: 2,
            }}
          >
            {post.title}
          </Typography>

          {/* Nội dung */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: 16, lineHeight: 1.75, whiteSpace: "pre-line" }}
          >
            {post.content ?? "Bài viết chưa có nội dung"}
          </Typography>

          {/* Ảnh - gallery full chiều rộng */}
          {images.length > 0 && (
            <Box
              sx={(theme) => ({
                mt: 3,
                position: "relative",
                borderRadius: 3,
                overflow: "hidden",
                border: `1px solid ${theme.palette.divider}`,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(0,0,0,0.4)"
                    : theme.palette.grey[100],
              })}
            >
              <Box
                component="img"
                src={currentImage}
                alt={post.title}
                sx={{
                  display: "block",
                  width: "100%",
                  maxHeight: { xs: 360, md: 460 },
                  objectFit: "contain",
                }}
              />

              {images.length > 1 && (
                <>
                  {/* Nút trái/phải */}
                  <IconButton
                    onClick={prevImage}
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: 8,
                      transform: "translateY(-50%)",
                      bgcolor: "rgba(0,0,0,0.45)",
                      color: "#fff",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.65)" },
                    }}
                  >
                    <ChevronLeftRounded />
                  </IconButton>
                  <IconButton
                    onClick={nextImage}
                    sx={{
                      position: "absolute",
                      top: "50%",
                      right: 8,
                      transform: "translateY(-50%)",
                      bgcolor: "rgba(0,0,0,0.45)",
                      color: "#fff",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.65)" },
                    }}
                  >
                    <ChevronRightRounded />
                  </IconButton>

                  {/* Bộ đếm */}
                  <Chip
                    label={`${(imgIndex % images.length) + 1}/${images.length}`}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      bgcolor: "rgba(0,0,0,0.55)",
                      color: "#fff",
                      fontWeight: 600,
                    }}
                  />

                  {/* Chấm chỉ vị trí */}
                  <Stack
                    direction="row"
                    spacing={0.75}
                    justifyContent="center"
                    sx={{
                      position: "absolute",
                      bottom: 10,
                      left: 0,
                      right: 0,
                    }}
                  >
                    {images.map((_, i) => (
                      <Box
                        key={i}
                        onClick={() => setImgIndex(i)}
                        sx={{
                          width: i === imgIndex % images.length ? 18 : 7,
                          height: 7,
                          borderRadius: 4,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          bgcolor:
                            i === imgIndex % images.length
                              ? "#fff"
                              : "rgba(255,255,255,0.5)",
                        }}
                      />
                    ))}
                  </Stack>
                </>
              )}
            </Box>
          )}
        </Box>
      </Paper>

        {/* ===== CARD BÌNH LUẬN ===== */}
        <Paper
          elevation={0}
          sx={(theme) => ({
            flex: 1,
            minHeight: { xs: 320, md: 0 },
            display: "flex",
            flexDirection: "column",
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow:
              theme.palette.mode === "light"
                ? "0 1px 2px rgba(16,24,40,0.04), 0 12px 32px rgba(16,24,40,0.06)"
                : "0 12px 32px rgba(0,0,0,0.35)",
          })}
        >
        <Box
          sx={{
            p: { xs: 2.5, md: 3.5 },
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            mb={2.5}
            sx={{ flexShrink: 0 }}
          >
            <ChatBubbleOutlineRounded sx={{ color: "primary.main" }} />
            <Typography variant="h6" fontWeight={700}>
              Bình luận
            </Typography>
            <Chip
              label={commentCount}
              size="small"
              sx={(theme) => ({
                fontWeight: 700,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: "primary.main",
              })}
            />
          </Stack>

          {/* Danh sách bình luận */}
          <Box
            sx={(theme) => ({
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              pr: 0.5,
              mx: -0.5,
              px: 0.5,
              scrollbarWidth: "thin",
              scrollbarColor: `${alpha(
                theme.palette.primary.main,
                0.6
              )} transparent`,
              "&::-webkit-scrollbar": { width: 8 },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": {
                background: alpha(theme.palette.primary.main, 0.5),
                borderRadius: 8,
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: theme.palette.primary.main,
              },
            })}
          >
            {commentCount > 0 ? (
              <Stack spacing={1.5}>
                {comments.map((c) => {
                  const date = c.createdAt?.toDate();
                  return (
                    <Stack
                      key={c.id}
                      direction="row"
                      spacing={1.5}
                      alignItems="flex-start"
                    >
                      <Avatar
                        src={c.user?.avatar ?? ""}
                        sx={{ width: 36, height: 36, mt: 0.25 }}
                      >
                        {(c.user?.username ?? c.userId)?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box
                        sx={(theme) => ({
                          flex: 1,
                          minWidth: 0,
                          p: 1.5,
                          borderRadius: 3,
                          borderTopLeftRadius: 4,
                          backgroundColor:
                            theme.palette.mode === "light"
                              ? theme.palette.grey[100]
                              : alpha(theme.palette.common.white, 0.04),
                          border: `1px solid ${theme.palette.divider}`,
                        })}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="baseline"
                          flexWrap="wrap"
                          sx={{ mb: 0.5 }}
                        >
                          <Typography variant="subtitle2" fontWeight={700}>
                            {c.user?.username ?? c.userId}
                          </Typography>
                          {date && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {date.toLocaleString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Typography>
                          )}
                        </Stack>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: "pre-line" }}
                        >
                          {c.text}
                        </Typography>
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            ) : (
              <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
                <ChatBubbleOutlineRounded
                  sx={{ fontSize: 40, color: "text.disabled" }}
                />
                <Typography variant="body2" color="text.secondary">
                  Chưa có bình luận nào. Hãy là người đầu tiên!
                </Typography>
              </Stack>
            )}
          </Box>

          {/* Form nhập bình luận */}
          {user && (
            <Box
              sx={(theme) => ({
                mt: 2.5,
                pt: 2.5,
                flexShrink: 0,
                borderTop: `1px solid ${theme.palette.divider}`,
                display: "flex",
                gap: 1.25,
                alignItems: "center",
              })}
            >
              <Avatar src={user.avatar ?? ""} sx={{ width: 40, height: 40 }}>
                {user.username?.[0]?.toUpperCase()}
              </Avatar>
              <TextField
                fullWidth
                placeholder="Viết bình luận..."
                size="small"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 999 } }}
              />
              <IconButton
                color="primary"
                onClick={handleAddComment}
                disabled={!text.trim() || sending}
                sx={(theme) => ({
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                })}
              >
                {sending ? (
                  <CircularProgress size={20} />
                ) : (
                  <SendRounded fontSize="small" />
                )}
              </IconButton>
            </Box>
          )}
        </Box>
        </Paper>
      </Box>
    </Container>
  );
}
