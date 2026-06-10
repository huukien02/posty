"use client";
import {
  Avatar,
  Box,
  Chip,
  Container,
  Divider,
  InputBase,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Search,
  LocalFireDepartment,
  Group,
  EmojiEvents,
  Whatshot,
  Close,
  ArticleOutlined,
  PeopleAltOutlined,
  ForumOutlined,
} from "@mui/icons-material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@/hooks/useUser";
import PostList from "./components/post/PostList";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase.config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchPostsWithDetails, type PostWithDetails } from "./lib/fetchPosts";

interface UserType {
  id: string; // uid trong Firestore
  email: string;
  username: string;
  avatar?: string | null;
}

const TRENDING_TAGS = ["ReactJS", "NextJS", "Firebase", "Design", "TypeScript"];

export default function HomePage() {
  const user = useUser();
  const router = useRouter();
  const currentUserId = user?.email;
  const [users, setUsers] = useState<UserType[]>([]);
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
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

  // Một nguồn dữ liệu duy nhất cho cả feed lẫn sidebar (tránh fetch trùng).
  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const allPosts = await fetchPostsWithDetails();
      setPosts(allPosts);
    } catch (error) {
      console.error("Lỗi khi lấy posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Top 3 bài nhiều comment nhất, tính lại từ posts đã có sẵn.
  const postsTop = useMemo(
    () =>
      [...posts]
        .sort((a, b) => b.comments.length - a.comments.length)
        .slice(0, 3),
    [posts]
  );

  // Số liệu cho hero
  const totalComments = useMemo(
    () => posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0),
    [posts]
  );
  const memberCount = users.length + (user ? 1 : 0);

  const filtered = useMemo(() => {
    const q = querySearch.trim().toLowerCase();
    if (!q) return [];
    return (posts ?? []).filter((p) =>
      (typeof p?.title === "string" ? p.title.toLowerCase() : "").includes(q)
    );
  }, [posts, querySearch]);

  const handleSelect = (id: string) => {
    setQuerySearch("");
    router.push(`/posts/${id}`);
  };

  const greetingName = user?.username || "bạn";

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        width: "100%",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
      })}
    >
      {/* ===== HERO ===== */}
      <Box
        sx={(theme) => {
          const isDark = theme.palette.mode === "dark";
          // Bộ màu cùng tông (indigo -> violet) cho từng theme, tránh loang màu.
          const c1 = isDark ? "#1e1b4b" : "#4f46e5";
          const c2 = isDark ? "#3b0764" : "#7c3aed";
          const glow = isDark ? 0.1 : 0.16;
          return {
            position: "relative",
            overflow: "hidden",
            color: "#fff",
            pt: { xs: 5, md: 7 },
            pb: { xs: 5, md: 7 },
            // Highlight radial mềm (thay cho khối tròn cứng) + gradient nền.
            background: `
              radial-gradient(120% 120% at 85% 10%, ${alpha(
                "#ffffff",
                glow
              )} 0%, transparent 50%),
              linear-gradient(135deg, ${c1} 0%, ${c2} 100%)
            `,
            borderBottom: `1px solid ${alpha("#ffffff", isDark ? 0.06 : 0.12)}`,
          };
        }}
      >
        {/* Lớp texture chấm bi mờ */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.5,
            backgroundImage: `radial-gradient(${alpha(
              "#ffffff",
              0.18
            )} 1px, transparent 1px)`,
            backgroundSize: "22px 22px",
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)",
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative" }}>
          <Stack
            direction="row"
            spacing={2.5}
            alignItems="center"
            sx={{ mb: { xs: 3, md: 3.5 } }}
          >
            <Link href="/profile" style={{ textDecoration: "none" }}>
              <Avatar
                src={user?.avatar}
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: alpha("#ffffff", 0.2),
                  border: "2px solid rgba(255,255,255,0.7)",
                  boxShadow: "0 8px 24px rgba(2,6,23,0.25)",
                  fontWeight: 700,
                  fontSize: 26,
                }}
              >
                {user?.username?.[0]?.toUpperCase() || "U"}
              </Avatar>
            </Link>
            <Box sx={{ minWidth: 0 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 0.5 }}
              >
                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    bgcolor: alpha("#ffffff", 0.18),
                    border: `1px solid ${alpha("#ffffff", 0.25)}`,
                  }}
                >
                  Bảng tin Posty
                </Box>
              </Stack>
              <Typography
                sx={{
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  fontSize: { xs: 28, md: 38 },
                }}
              >
                Xin chào, {greetingName} 👋
              </Typography>
              <Typography sx={{ opacity: 0.85, mt: 0.75, fontSize: { xs: 14, md: 16 } }}>
                Khám phá những câu chuyện mới nhất từ cộng đồng.
              </Typography>
            </Box>
          </Stack>

          {/* Thống kê nhanh */}
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <HeroStat
              icon={<ArticleOutlined sx={{ fontSize: 20 }} />}
              value={posts.length}
              label="Bài viết"
            />
            <HeroStat
              icon={<PeopleAltOutlined sx={{ fontSize: 20 }} />}
              value={memberCount}
              label="Thành viên"
            />
            <HeroStat
              icon={<ForumOutlined sx={{ fontSize: 20 }} />}
              value={totalComments}
              label="Bình luận"
            />
          </Stack>
        </Container>
      </Box>

      {/* ===== THANH TÌM KIẾM (sticky) ===== */}
      <Box
        sx={(theme) => ({
          position: "sticky",
          top: 0,
          zIndex: 1100,
          py: 1.5,
          bgcolor: theme.palette.background.default,
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: "0 4px 16px rgba(2, 6, 23, 0.06)",
        })}
      >
        <Container maxWidth="lg">
          <Box sx={{ position: "relative", maxWidth: 720, mx: "auto" }}>
            <Paper
              elevation={0}
              sx={(theme) => ({
                display: "flex",
                alignItems: "center",
                px: 2,
                py: 1,
                borderRadius: 999,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: "0 6px 20px rgba(2, 6, 23, 0.08)",
              })}
            >
              <Search sx={{ color: "text.secondary" }} />
              <InputBase
                placeholder="Tìm kiếm bài viết theo tiêu đề..."
                value={querySearch}
                onChange={(e) => setQuerySearch(e.target.value)}
                sx={{ ml: 1.5, flex: 1, fontSize: 15 }}
              />
              {querySearch && (
                <Close
                  onClick={() => setQuerySearch("")}
                  sx={{
                    color: "text.secondary",
                    cursor: "pointer",
                    fontSize: 20,
                  }}
                />
              )}
            </Paper>

            {querySearch && (
              <Paper
                sx={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  left: 0,
                  right: 0,
                  maxHeight: 320,
                  overflowY: "auto",
                  borderRadius: 3,
                  zIndex: 20,
                  boxShadow: "0 16px 40px rgba(2, 6, 23, 0.22)",
                }}
              >
                <List disablePadding>
                  {filtered.length > 0 ? (
                    filtered.map((p) => (
                      <ListItemButton
                        key={p.id}
                        onClick={() => handleSelect(p.id)}
                        sx={{ gap: 1.5, py: 1, minHeight: 64 }}
                      >
                        <Box
                          component="img"
                          src={p.imageUrl || "/favicon.ico"}
                          alt={p.title}
                          sx={{
                            width: 44,
                            height: 44,
                            objectFit: "cover",
                            borderRadius: 2,
                            flexShrink: 0,
                            bgcolor: "action.hover",
                          }}
                        />
                        <ListItemText
                          primary={p.title || "(Không có tiêu đề)"}
                          secondary={`${p.author?.username || p.authorId} • ${
                            p.comments?.length || 0
                          } bình luận`}
                          primaryTypographyProps={{
                            fontSize: 14,
                            fontWeight: 600,
                            noWrap: true,
                          }}
                          secondaryTypographyProps={{ fontSize: 12 }}
                        />
                      </ListItemButton>
                    ))
                  ) : (
                    <Box p={3} textAlign="center" color="text.secondary">
                      Không tìm thấy bài viết phù hợp
                    </Box>
                  )}
                </List>
              </Paper>
            )}
          </Box>
        </Container>
      </Box>

      {/* ===== MAIN ===== */}
      <Container
        maxWidth="lg"
        sx={{
          mt: { xs: 3, md: 4 },
          position: "relative",
          zIndex: 2,
          pb: 6,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "260px minmax(0, 1fr)",
              lg: "260px minmax(0, 1fr) 280px",
            },
            gap: { xs: 3, md: 4 },
            alignItems: "start",
          }}
        >
          {/* LEFT SIDEBAR */}
          <Stack
            spacing={3}
            sx={{
              display: { xs: "none", md: "flex" },
              position: "sticky",
              top: 88,
            }}
          >
            <SectionCard
              icon={<LocalFireDepartment sx={{ color: "#f97316" }} />}
              title="Trending Tags"
            >
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {TRENDING_TAGS.map((tag) => (
                  <Chip
                    key={tag}
                    label={`#${tag}`}
                    onClick={() => setQuerySearch(tag)}
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      "&:hover": {
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                        borderColor: "primary.main",
                        color: "primary.main",
                      },
                    }}
                  />
                ))}
              </Box>
            </SectionCard>

            <SectionCard
              icon={<Group sx={{ color: "primary.main" }} />}
              title="Gợi ý bạn bè"
            >
              {users.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Chưa có gợi ý nào.
                </Typography>
              ) : (
                <Stack
                  spacing={1}
                  sx={(theme) => ({
                    maxHeight: 320,
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
                  {users.map((u) => (
                    <Stack
                      key={u.id}
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        transition: "background-color .15s",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <Avatar src={u.avatar ?? ""} sx={{ width: 40, height: 40 }}>
                        {u.username?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={600} noWrap fontSize={14}>
                          {u.username}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          fontSize={12}
                        >
                          {u.email}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              )}
            </SectionCard>
          </Stack>

          {/* FEED */}
          <Box sx={{ width: "100%", maxWidth: 640, mx: "auto" }}>
            <PostList
              posts={posts}
              loading={loadingPosts}
              currentUserId={currentUserId}
              onRefresh={loadPosts}
            />
          </Box>

          {/* RIGHT SIDEBAR */}
          <Stack
            spacing={3}
            sx={{
              display: { xs: "none", lg: "flex" },
              position: "sticky",
              top: 88,
            }}
          >
            <SectionCard
              icon={<EmojiEvents sx={{ color: "#f59e0b" }} />}
              title="Bài viết sôi nổi"
            >
              {postsTop.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Chưa có dữ liệu.
                </Typography>
              ) : (
                <Stack
                  spacing={0.5}
                  divider={<Divider flexItem sx={{ opacity: 0.6 }} />}
                >
                  {postsTop.map((post, i) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{
                          py: 1.25,
                          px: 0.5,
                          borderRadius: 2,
                          transition: "background-color .15s",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <RankBadge rank={i} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            fontWeight={600}
                            fontSize={14}
                            noWrap
                            sx={{ color: "text.primary" }}
                          >
                            {post.title || "Bài viết nổi bật"}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontSize={12}
                          >
                            {post.author?.username || post.authorId} •{" "}
                            {post.comments.length} bình luận
                          </Typography>
                        </Box>
                      </Stack>
                    </Link>
                  ))}
                </Stack>
              )}
            </SectionCard>

            {/* CTA Banner */}
            <Box
              sx={(theme) => {
                const isDark = theme.palette.mode === "dark";
                const c1 = isDark ? "#1e1b4b" : "#4f46e5";
                const c2 = isDark ? "#3b0764" : "#7c3aed";
                return {
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 4,
                  p: 3,
                  color: "#fff",
                  background: `
                    radial-gradient(120% 120% at 85% 0%, ${alpha(
                      "#ffffff",
                      isDark ? 0.08 : 0.16
                    )} 0%, transparent 55%),
                    linear-gradient(135deg, ${c1} 0%, ${c2} 100%)
                  `,
                  border: `1px solid ${alpha("#ffffff", isDark ? 0.06 : 0.12)}`,
                  boxShadow: "0 10px 30px rgba(2, 6, 23, 0.18)",
                };
              }}
            >
              <Whatshot sx={{ fontSize: 30, mb: 1 }} />
              <Typography variant="h6" fontWeight={800}>
                Kết nối cộng đồng
              </Typography>
              <Typography sx={{ opacity: 0.9, fontSize: 14, mt: 0.5, mb: 2 }}>
                Tìm bạn mới và trò chuyện ngay hôm nay.
              </Typography>
              <Chip
                component={Link}
                href="/friends"
                clickable
                label="Khám phá bạn bè →"
                sx={{
                  bgcolor: "#fff",
                  color: "primary.main",
                  fontWeight: 700,
                  "&:hover": { bgcolor: alpha("#ffffff", 0.85) },
                }}
              />
            </Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

/* ---------- Sub-components ---------- */

function HeroStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      sx={{
        px: 2,
        py: 1.25,
        borderRadius: 3,
        bgcolor: alpha("#ffffff", 0.14),
        border: `1px solid ${alpha("#ffffff", 0.22)}`,
        backdropFilter: "blur(6px)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: "50%",
          bgcolor: alpha("#ffffff", 0.18),
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography sx={{ fontSize: 12, opacity: 0.85 }}>{label}</Typography>
      </Box>
    </Stack>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        p: 2.5,
        borderRadius: 4,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow:
          theme.palette.mode === "light"
            ? "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.04)"
            : "none",
      })}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        {icon}
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Paper>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const palette = [
    { bg: "linear-gradient(135deg,#fbbf24,#f59e0b)", label: "1" },
    { bg: "linear-gradient(135deg,#cbd5e1,#94a3b8)", label: "2" },
    { bg: "linear-gradient(135deg,#fb923c,#ea580c)", label: "3" },
  ];
  const p = palette[rank] ?? {
    bg: "linear-gradient(135deg,#a5b4fc,#818cf8)",
    label: String(rank + 1),
  };
  return (
    <Box
      sx={{
        flexShrink: 0,
        width: 34,
        height: 34,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 800,
        fontSize: 15,
        background: p.bg,
        boxShadow: "0 4px 10px rgba(2,6,23,0.18)",
      }}
    >
      {p.label}
    </Box>
  );
}
