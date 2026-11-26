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
import { layout, radius, surfaceSx } from "@/app/lib/theme";
import dayjs from "@/app/lib/dayjs";
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
      <Container sx={{ py: { xs: 2, md: 3 }, maxWidth: `${layout.feedWidth + 48}px !important` }}>
        <Paper
          elevation={0}
          sx={(theme) => ({
            ...surfaceSx(theme),
            p: { xs: 2, md: 3 },
          })}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
            <Skeleton variant="circular" width={48} height={48} />
            <Box flex={1}>
              <Skeleton width="40%" height={22} />
              <Skeleton width="55%" height={18} />
            </Box>
          </Stack>
          <Skeleton width="80%" height={36} />
          <Skeleton width="100%" height={20} sx={{ mt: 2 }} />
          <Skeleton width="95%" height={20} />
          <Skeleton width="60%" height={20} />
          <Skeleton
            variant="rounded"
            height={220}
            sx={{ mt: 3, borderRadius: `${radius.md}px` }}
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
      sx={{
        maxWidth: `${layout.contentWidth}px !important`,
        px: { xs: 1.5, sm: 2, md: 3 },
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
        sx={{
          mb: 2,
          flexShrink: 0,
          alignSelf: "flex-start",
          borderRadius: `${radius.pill}px`,
          fontWeight: 600,
          bgcolor: "transparent",
          color: "text.secondary",
          "&:hover": { bgcolor: "action.hover", color: "text.primary" },
          "& .MuiChip-icon": { ml: 0.5, color: "inherit" },
        }}
      />

      {/* ===== 2 CỘT: BÀI VIẾT | BÌNH LUẬN ===== */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 2, md: 3 },
        }}
      >
        {/* ===== CARD BÀI VIẾT ===== */}
        <Paper
          elevation={0}
          sx={(theme) => ({
            ...surfaceSx(theme),
            flex: { xs: "none", md: 1.25 },
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          })}
        >

          <Box
            sx={{
              p: { xs: 2, md: 3 },
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
            }}
          >
          {/* Tác giả */}
          {author && (
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Avatar src={author.avatar ?? ""} sx={{ width: 44, height: 44 }}>
                {author.username?.[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {author.username}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap component="div">
                  {author.email}
                </Typography>
              </Box>
            </Stack>
          )}

          {/* Tiêu đề */}
          <Typography
            variant="h4"
            sx={{
              lineHeight: 1.25,
              fontSize: { xs: 22, md: 28 },
              mb: 1.5,
              wordBreak: "break-word",
            }}
          >
            {post.title}
          </Typography>

          {/* Nội dung */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ lineHeight: 1.75, whiteSpace: "pre-line" }}
          >
            {post.content ?? "Bài viết chưa có nội dung"}
          </Typography>

          {/* Ảnh - gallery full chiều rộng */}
          {images.length > 0 && (
            <Box
              sx={{
                mt: 2.5,
                position: "relative",
                borderRadius: `${radius.md}px`,
                overflow: "hidden",
                bgcolor: "action.hover",
              }}
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
                      borderRadius: "50%",
                      bgcolor: (t) => alpha(t.palette.common.black, 0.45),
                      color: "common.white",
                      backdropFilter: "blur(4px)",
                      "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.65) },
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
                      borderRadius: "50%",
                      bgcolor: (t) => alpha(t.palette.common.black, 0.45),
                      color: "common.white",
                      backdropFilter: "blur(4px)",
                      "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.65) },
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
                      bgcolor: (t) => alpha(t.palette.common.black, 0.55),
                      color: "common.white",
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
                          bgcolor: (t) =>
                            i === imgIndex % images.length
                              ? t.palette.common.white
                              : alpha(t.palette.common.white, 0.5),
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
            ...surfaceSx(theme),
            flex: 1,
            minHeight: { xs: 320, md: 0 },
            display: "flex",
            flexDirection: "column",
          })}
        >
        <Box
          sx={{
            p: { xs: 2, md: 2.5 },
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
            mb={2}
            sx={{ flexShrink: 0 }}
          >
            <ChatBubbleOutlineRounded fontSize="small" sx={{ color: "text.secondary" }} />
            <Typography variant="h6">Bình luận</Typography>
            <Chip
              label={commentCount}
              size="small"
              sx={{ height: 20, fontSize: 12, fontWeight: 600, bgcolor: "action.hover" }}
            />
          </Stack>

          {/* Danh sách bình luận */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              mx: -0.5,
              px: 0.5,
            }}
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
                        sx={{ width: 32, height: 32, mt: 0.25, fontSize: 14 }}
                      >
                        {(c.user?.username ?? c.userId)?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box
                        sx={{
                          minWidth: 0,
                          maxWidth: "100%",
                          px: 1.5,
                          py: 1,
                          borderRadius: "14px",
                          bgcolor: "action.hover",
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="baseline"
                          flexWrap="wrap"
                          sx={{ mb: 0.25 }}
                        >
                          <Typography variant="subtitle2" sx={{ fontSize: 13 }}>
                            {c.user?.username ?? c.userId}
                          </Typography>
                          {date && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              title={date.toLocaleString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            >
                              {dayjs(date).fromNow()}
                            </Typography>
                          )}
                        </Stack>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: "pre-line", wordBreak: "break-word" }}
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
                mt: 2,
                pt: 2,
                flexShrink: 0,
                borderTop: `1px solid ${theme.palette.divider}`,
                display: "flex",
                gap: 1.25,
                alignItems: "center",
              })}
            >
              <Avatar src={user.avatar ?? ""} sx={{ width: 32, height: 32, fontSize: 14 }}>
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: `${radius.pill}px`,
                    bgcolor: "action.hover",
                    "& fieldset": { borderColor: "transparent" },
                    "&:hover fieldset": { borderColor: "divider" },
                    "&.Mui-focused fieldset": { borderColor: "primary.main", borderWidth: 1 },
                  },
                }}
              />
              <IconButton
                color="primary"
                onClick={handleAddComment}
                disabled={!text.trim() || sending}
                sx={(theme) => ({
                  borderRadius: "50%",
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
