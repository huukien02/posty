"use client";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  InputBase,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material";
import { deepPurple } from "@mui/material/colors";
import { Search, AddPhotoAlternate } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import PostForm from "./components/post/PostForm";
import PostList from "./components/post/PostList";
import Image from "next/image";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase.config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PostFormMultiple from "./components/post/PostFormMultiple";
interface UserType {
  id: string; // uid trong Firestore
  email: string;
  username: string;
  avatar?: string | null;
}

interface User {
  id: string;
  username: string;
  avatar: string;
}
interface Comment {
  id: string;
  text: string;
  user: User;
}

interface Post {
  id: string;
  title: string;
  thrilled: string;
  imageUrl: string;
  author: User;
  comments: Comment[];
  sent: boolean;
  createdAt: string | number;
  favorite: boolean;
  visible: boolean;
  authorId: string;
}
export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const user = useUser();
  const router = useRouter();
  const currentUserId = user?.email;
  const [users, setUsers] = useState<UserType[]>([]);
  const [postsTop, setPostsTop] = useState<Post[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [querySearch, setQuerySearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const list: UserType[] = [];
      snapshot.forEach((doc) => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const data = doc.data() as any;
        if (data.email !== user.email) {
          list.push({ id: doc.id, ...data });
        }
      });
      setUsers(list);
    };
    fetchUsers();
  }, [user]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Lấy tất cả posts, sắp xếp theo thời gian tạo (mới nhất trước)
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        const allPosts: Post[] = await Promise.all(
          snap.docs.map(async (doc) => {
            const postData = doc.data();
            const postId = doc.id;

            // Lấy comments cho từng post
            const commentsSnap = await getDocs(
              collection(db, "posts", postId, "comments")
            );

            const comments = commentsSnap.docs.map((c) => ({
              id: c.id,
              ...c.data(),
            }));

            return {
              id: postId,
              ...postData,
              comments,
            } as Post;
          })
        );
        setPosts(allPosts);

        // Sắp xếp theo số lượng comment, lấy 3 post nhiều comment nhất
        const topPosts = allPosts
          .sort((a, b) => b.comments.length - a.comments.length)
          .slice(0, 3);

        setPostsTop(topPosts);
      } catch (error) {
        console.error("Lỗi khi lấy posts:", error);
      }
    };

    fetchPosts();
  }, []);

  // Search Posts
  // const filtered = posts?.filter((p) =>
  //   (p.title ?? "").toLowerCase().includes((querySearch ?? "").toLowerCase())
  // );
  const filtered = (posts ?? []).filter((p) => {
    const title = typeof p?.title === "string" ? p.title.toLowerCase() : "";
    const query =
      typeof querySearch === "string" ? querySearch.toLowerCase() : "";
    return title.includes(query);
  });
  const handleSelect = (id: string) => {
    setQuerySearch("");
    router.push(`/posts/${id}`);
  };

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        width: "100%",
        backgroundColor: theme.palette.background.default, // theo theme
        color: theme.palette.text.primary, // chữ tự đổi trắng/đen
      })}
    >
      {/* HEADER */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={(theme) => ({
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Toolbar sx={{ maxWidth: 1200, mx: "auto", width: "100%" }}>
          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
            <Image
              src="/favicon.ico" // nằm trong thư mục public
              alt="Logo"
              width={32}
              height={32}
            />
          </Box>
          <Box sx={{ position: "relative", maxWidth: 400, flexGrow: 2, mr: 2 }}>
            <Paper
              sx={{
                display: "flex",
                alignItems: "center",
                px: 1,
                py: 0.5,
                borderRadius: 2,
              }}
            >
              <Search sx={{ color: "gray" }} />
              <InputBase
                placeholder="Tìm kiếm bài viết..."
                value={querySearch}
                onChange={(e) => setQuerySearch(e.target.value)}
                sx={{ ml: 1, flex: 1 }}
              />
            </Paper>

            {querySearch && (
              <Paper
                sx={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  mt: 1,
                  maxHeight: 250,
                  overflowY: "auto",
                  borderRadius: 2,
                  zIndex: 10,
                }}
              >
                <List>
                  {filtered.length > 0 ? (
                    filtered.map((p) => (
                      <ListItemButton
                        key={p.id}
                        onClick={() => handleSelect(p.id)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          py: 0.5, // giảm padding dọc
                          minHeight: 60, // chiều cao thấp hơn
                        }}
                      >
                        {/* Ảnh nhỏ hơn */}
                        {p.imageUrl && (
                          <Box
                            component="img"
                            src={p.imageUrl}
                            alt={p.title}
                            sx={{
                              width: 40,
                              height: 40,
                              objectFit: "cover",
                              borderRadius: 1,
                              flexShrink: 0,
                            }}
                          />
                        )}

                        {/* Nội dung */}
                        <ListItemText
                          primary={p.title}
                          secondary={
                            <>
                              <span style={{ fontSize: 12, color: "gray" }}>
                                {p.authorId} • {p.comments?.length || 0} bình
                                luận
                              </span>
                            </>
                          }
                          primaryTypographyProps={{
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                          secondaryTypographyProps={{ fontSize: 12 }}
                        />
                      </ListItemButton>
                    ))
                  ) : (
                    <Box p={2} textAlign="center">
                      Không tìm thấy bài viết
                    </Box>
                  )}
                </List>
              </Paper>
            )}
          </Box>
          {user && (
            <Link href={`/profile`} style={{ textDecoration: "none" }}>
              <Avatar
                sx={{
                  bgcolor: deepPurple[500],
                  width: 36,
                  height: 36,
                  cursor: "pointer",
                }}
                src={user?.avatar}
              >
                {user?.username?.[0] || "U"}
              </Avatar>
            </Link>
          )}
        </Toolbar>
      </AppBar>

      {/* MAIN CONTENT */}
      <Box
        sx={(theme) => ({
          maxWidth: 1200,
          mx: "auto",
          mt: 5,
          width: "100%",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 3, md: 10 },
          backgroundColor: theme.palette.background.default,
          px: { xs: 2, sm: 3 },
        })}
      >
        {/* LEFT SIDEBAR */}
        <Box
          sx={{
            flex: { xs: "none", md: "0 0 250px" },
            display: { xs: "none", md: "block" },
          }}
        >
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Trending Tags 🔥
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {["#ReactJS", "#NextJS", "#Firebase", "#Design"].map((tag) => (
                <Button key={tag} size="small" variant="outlined">
                  {tag}
                </Button>
              ))}
            </Box>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Gợi ý bạn bè 👥
            </Typography>

            <Box
              sx={(theme) => ({
                maxHeight: 280,
                overflowY: "auto",
                pr: 1,
                "&::-webkit-scrollbar": {
                  width: 8,
                },
                "&::-webkit-scrollbar-track": {
                  background: theme.palette.background.paper,
                },
                "&::-webkit-scrollbar-thumb": {
                  background: theme.palette.primary.main,
                  borderRadius: 8,
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  background: theme.palette.primary.dark,
                },
              })}
            >
              {users?.map((user) => (
                <Box
                  key={user.id}
                  sx={{ display: "flex", alignItems: "center", mb: 2 }}
                >
                  <Avatar src={user.avatar ?? ""} sx={{ mr: 2 }} />
                  <Box>
                    <Typography>{user.username}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* FEED */}
        <Box sx={{ flex: 1, maxWidth: { xs: "100%", md: 500 }, mx: "auto" }}>
          {/* <PostForm
            userId={currentUserId}
            onPostAdded={() => setRefreshKey((prev) => prev + 1)}
          /> */}

          {/* <PostFormMultiple userId={currentUserId}  onPostAdded={() => setRefreshKey((prev) => prev + 1)} /> */}

          <PostList refreshKey={refreshKey} currentUserId={currentUserId} />
        </Box>

        {/* RIGHT SIDEBAR */}
        <Box
          sx={{
            flex: { xs: "none", md: "0 0 250px" },
            mt: { xs: 3, md: 0 },
            display: { xs: "none", md: "block" }, // ẩn trên mobile
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Post sôi nổi 📌{" "}
          </Typography>
          {postsTop.map((post, i) => {
            // top1 = 🥇, top2 = 🥈, top3 = 🥉
            const medalEmojis = ["🥇", "🥈", "🥉"];
            const medal = medalEmojis[i] || "🏅"; // nếu nhiều hơn top 3 thì dùng huy chương chung

            return (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Box
                  sx={(theme) => ({
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    padding: 1,
                    borderRadius: 2,
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                    },
                  })}
                >
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      {/* Huy chương */}
                      <Typography fontWeight="bold" sx={{ fontSize: "2rem" }}>
                        {medal}
                      </Typography>

                      {/* Title CÓ gạch chân xanh */}
                      <Typography
                        fontWeight="bold"
                        sx={{
                          color: "primary.main",
                          textDecoration: "underline",
                          textDecorationColor: "primary.main",
                          textUnderlineOffset: "3px",
                        }}
                      >
                        {post.title ?? "Bài viết nổi bật"}
                      </Typography>

                      <Typography color="text.secondary">
                        (comments: {post?.comments.length})
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      {post?.authorId}
                    </Typography>
                  </Box>
                </Box>
              </Link>
            );
          })}

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Banner
            </Typography>
            <Box
              sx={(theme) => ({
                bgcolor: theme.palette.background.paper,
                height: 150,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              })}
            >
              Banner
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
