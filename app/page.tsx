"use client";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
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
  Close,
  PeopleAltOutlined,
  ForumOutlined,
  PersonOutline,
  WorkspacePremiumOutlined,
  TrendingUp,
  Tag,
} from "@mui/icons-material";
import { layout, radius, softShadow, surfaceSx } from "./lib/theme";
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
    <Box sx={{ width: "100%", bgcolor: "background.default", color: "text.primary" }}>
      <Box
        sx={{
          width: "100%",
          maxWidth: layout.contentWidth,
          mx: "auto",
          px: { xs: 1.5, sm: 2, md: 3 },
          py: { xs: 2, md: 3 },
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "260px minmax(0, 1fr)",
            lg: "260px minmax(0, 1fr) 300px",
          },
          gap: { xs: 2, md: 3 },
          alignItems: "start",
        }}
      >
        {/* ===== CỘT TRÁI ===== */}
        <Stack
          spacing={2}
          sx={{ display: { xs: "none", md: "flex" }, position: "sticky", top: 24 }}
        >
          {/* Thẻ người dùng */}
          <SectionCard>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Link href={user ? "/profile" : "/login"} style={{ textDecoration: "none" }}>
                <Avatar src={user?.avatar} sx={{ width: 48, height: 48, fontSize: 20 }}>
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </Avatar>
              </Link>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={600} noWrap>
                  Xin chào, {greetingName}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap component="div">
                  {user?.email || "Đăng nhập để tham gia cộng đồng"}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" justifyContent="space-between">
              <MiniStat value={posts.length} label="Bài viết" />
              <MiniStat value={memberCount} label="Thành viên" />
              <MiniStat value={totalComments} label="Bình luận" />
            </Stack>
          </SectionCard>

          {/* Lối tắt */}
          <SectionCard dense>
            <List disablePadding>
              {[
                { href: "/profile", label: "Hồ sơ của tôi", icon: <PersonOutline /> },
                { href: "/friends", label: "Bạn bè", icon: <PeopleAltOutlined /> },
                { href: "/chat", label: "Tin nhắn", icon: <ForumOutlined /> },
                { href: "/checkout", label: "Nâng cấp gói", icon: <WorkspacePremiumOutlined /> },
              ].map((l) => (
                <ListItemButton
                  key={l.href}
                  component={Link}
                  href={l.href}
                  sx={{ gap: 1.5, py: 1, color: "text.primary" }}
                >
                  <Box sx={{ display: "flex", color: "text.secondary" }}>{l.icon}</Box>
                  <ListItemText
                    primary={l.label}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                  />
                </ListItemButton>
              ))}
            </List>
          </SectionCard>

          <Typography variant="caption" color="text.secondary" sx={{ px: 1, lineHeight: 1.8 }}>
            <Link href="/privacy-policy" style={{ color: "inherit" }}>
              Chính sách quyền riêng tư
            </Link>
            {" · "}© {new Date().getFullYear()} Posty
          </Typography>
        </Stack>

        {/* ===== FEED ===== */}
        <Box sx={{ width: "100%", maxWidth: layout.feedWidth, mx: "auto", minWidth: 0 }}>
          {/* Tìm kiếm */}
          <Box
            sx={(theme) => ({
              position: "sticky",
              top: 0,
              zIndex: 10,
              pt: { xs: 2, md: 3 },
              mt: { xs: -2, md: -3 },
              pb: 2,
              background: `linear-gradient(${theme.palette.background.default} 85%, transparent)`,
            })}
          >
            <Box sx={{ position: "relative" }}>
              <Paper
                sx={(theme) => ({
                  display: "flex",
                  alignItems: "center",
                  px: 1.75,
                  height: 44,
                  borderRadius: `${radius.pill}px`,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: "border-color .15s, box-shadow .15s",
                  "&:focus-within": {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
                  },
                })}
              >
                <Search sx={{ color: "text.secondary", fontSize: 20 }} />
                <InputBase
                  placeholder="Tìm kiếm bài viết…"
                  value={querySearch}
                  onChange={(e) => setQuerySearch(e.target.value)}
                  sx={{ ml: 1.25, flex: 1, fontSize: 14 }}
                  inputProps={{ "aria-label": "Tìm kiếm bài viết" }}
                />
                {querySearch && (
                  <IconButton size="small" onClick={() => setQuerySearch("")} aria-label="Xoá">
                    <Close sx={{ fontSize: 18 }} />
                  </IconButton>
                )}
              </Paper>

              {querySearch && (
                <Paper
                  sx={(theme) => ({
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    right: 0,
                    maxHeight: 360,
                    overflowY: "auto",
                    borderRadius: `${radius.md}px`,
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: softShadow(theme),
                    zIndex: 20,
                    p: 0.5,
                  })}
                >
                  <List disablePadding>
                    {filtered.length > 0 ? (
                      filtered.map((p) => (
                        <ListItemButton
                          key={p.id}
                          onClick={() => handleSelect(p.id)}
                          sx={{ gap: 1.5, py: 1 }}
                        >
                          <Box
                            component="img"
                            src={p.imageUrl || "/favicon.ico"}
                            alt={p.title}
                            sx={{
                              width: 40,
                              height: 40,
                              objectFit: "cover",
                              borderRadius: `${radius.sm}px`,
                              flexShrink: 0,
                              bgcolor: "action.hover",
                            }}
                          />
                          <ListItemText
                            primary={p.title || "(Không có tiêu đề)"}
                            secondary={`${p.author?.username || p.authorId} · ${
                              p.comments?.length || 0
                            } bình luận`}
                            primaryTypographyProps={{ fontSize: 14, fontWeight: 600, noWrap: true }}
                            secondaryTypographyProps={{ fontSize: 12 }}
                          />
                        </ListItemButton>
                      ))
                    ) : (
                      <Box p={3} textAlign="center">
                        <Typography variant="body2" color="text.secondary">
                          Không tìm thấy bài viết phù hợp
                        </Typography>
                      </Box>
                    )}
                  </List>
                </Paper>
              )}
            </Box>
          </Box>

          <PostList
            posts={posts}
            loading={loadingPosts}
            currentUserId={currentUserId}
            onRefresh={loadPosts}
          />
        </Box>

        {/* ===== CỘT PHẢI ===== */}
        <Stack
          spacing={2}
          sx={{ display: { xs: "none", lg: "flex" }, position: "sticky", top: 24 }}
        >
          <SectionCard
            icon={<TrendingUp fontSize="small" />}
            title="Bài viết sôi nổi"
          >
            {postsTop.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Chưa có dữ liệu.
              </Typography>
            ) : (
              <Stack spacing={0.5}>
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
                        py: 1,
                        px: 1,
                        mx: -1,
                        borderRadius: `${radius.sm}px`,
                        transition: "background-color .15s",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <RankBadge rank={i} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={600} fontSize={14} noWrap color="text.primary">
                          {post.title || "Bài viết nổi bật"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {post.author?.username || post.authorId} · {post.comments.length} bình luận
                        </Typography>
                      </Box>
                    </Stack>
                  </Link>
                ))}
              </Stack>
            )}
          </SectionCard>

          <SectionCard
            icon={<PeopleAltOutlined fontSize="small" />}
            title="Gợi ý bạn bè"
            action={
              <Typography
                component={Link}
                href="/friends"
                variant="caption"
                sx={{ color: "primary.main", fontWeight: 600, textDecoration: "none" }}
              >
                Xem tất cả
              </Typography>
            }
          >
            {users.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Chưa có gợi ý nào.
              </Typography>
            ) : (
              <Stack spacing={0.5} sx={{ maxHeight: 320, overflowY: "auto", mx: -1 }}>
                {users.map((u) => (
                  <Stack
                    key={u.id}
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{
                      p: 1,
                      borderRadius: `${radius.sm}px`,
                      transition: "background-color .15s",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Avatar src={u.avatar ?? ""} sx={{ width: 36, height: 36, fontSize: 14 }}>
                      {u.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={600} noWrap fontSize={14}>
                        {u.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap component="div">
                        {u.email}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            )}
          </SectionCard>

          <SectionCard icon={<Tag fontSize="small" />} title="Chủ đề thịnh hành">
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {TRENDING_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  size="small"
                  onClick={() => setQuerySearch(tag)}
                  sx={(t) => ({
                    bgcolor: "action.hover",
                    "&:hover": {
                      bgcolor: alpha(t.palette.primary.main, 0.12),
                      color: "primary.main",
                    },
                  })}
                />
              ))}
            </Box>
          </SectionCard>
        </Stack>
      </Box>
    </Box>
  );
}

/* ---------- Sub-components (chỉ hiển thị) ---------- */

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <Box sx={{ textAlign: "center", flex: 1 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

function SectionCard({
  icon,
  title,
  action,
  dense,
  children,
}: {
  icon?: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
  dense?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Paper sx={(theme) => ({ ...surfaceSx(theme), p: dense ? 1 : 2 })}>
      {title && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          {icon && <Box sx={{ display: "flex", color: "text.secondary" }}>{icon}</Box>}
          <Typography variant="subtitle2" sx={{ flex: 1 }}>
            {title}
          </Typography>
          {action}
        </Stack>
      )}
      {children}
    </Paper>
  );
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <Box
      sx={(theme) => ({
        flexShrink: 0,
        width: 28,
        height: 28,
        borderRadius: `${radius.sm}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 13,
        color: rank === 0 ? theme.palette.primary.contrastText : theme.palette.text.secondary,
        bgcolor: rank === 0 ? theme.palette.primary.main : theme.palette.action.hover,
      })}
    >
      {rank + 1}
    </Box>
  );
}
