"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Container,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  DialogTitle,
  DialogActions,
  Paper,
  Stack,
  Skeleton,
  Divider,
} from "@mui/material";
import PaginationCustom from "../components/PaginationCustom";
import FavoriteIcon from "@mui/icons-material/Favorite";
import DownloadIcon from "@mui/icons-material/Download";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import PermMediaIcon from "@mui/icons-material/PermMedia";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase.config";
import { useUser } from "@/hooks/useUser";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { alpha } from "@mui/material/styles";
import ProfileAvatar from "../components/ProfileAvatar";
import CollectionManager from "../components/UserCollectionsManager";
import PostActions from "../components/handleAddToCollection";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import PostForm from "../components/post/PostForm";
import AddIcon from "@mui/icons-material/Add";
import PostImageSlider from "../components/post/PostImageSlider";
import PostFormMultiple from "../components/post/PostFormMultiple";
import PostTitle from "../components/post/PostTitle";
interface Post {
  id: string;
  title: string;
  thrilled: string;
  imageUrl: string;
  imageUrls: string[];
  createdAt: number;
  sent: boolean;
  authorId: string;
  favorite: boolean;
  visible: boolean;
}

const ProfilePage: React.FC = () => {
  const user = useUser();
  const [refreshKey, setRefreshKey] = useState(0);

  const [openCollection, setOpenCollection] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const [openPostForm, setOpenPostForm] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState("all");

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [favoriteFilter, setFavoriteFilter] = useState<
    "all" | "favorite" | "notFavorite"
  >("all");

  const [visibleFilter, setVisibleFilter] = useState<
    "all" | "visible" | "notVisible"
  >("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 8;

  const fetchUserPosts = async (email: string) => {
    setLoading(true);
    try {
      const postsRef = collection(db, "posts");
      const q = query(postsRef, where("authorId", "==", email));
      const snapshot = await getDocs(q);

      let data: Post[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          title: d.title || "",
          thrilled: d.content || "",
          imageUrl: d.imageUrl || "",
          imageUrls: d.imageUrls || [],
          createdAt: Number(d.createdAt) || Date.now(),
          sent: Boolean(d.sent) || false,
          authorId: d.authorId || "",
          favorite: d.favorite ?? false,
          visible: d.visible ?? false,
        };
      });

      if (selectedCollection && selectedCollection !== "all") {
        const collectionData = collections.find(
          (c) => c.id === selectedCollection
        );

        if (collectionData?.postIds?.length) {
          const ids = collectionData.postIds.map(String);
          data = data.filter((p) => ids.includes(String(p.id)));
          console.log("Sau khi lọc theo bộ sưu tập:", data.length);
        } else {
          console.log("Không có postIds trong bộ sưu tập này");
          data = [];
        }
      }

      if (startDate)
        data = data.filter((p) => p.createdAt >= startDate.valueOf());
      if (endDate) data = data.filter((p) => p.createdAt <= endDate.valueOf());

      if (favoriteFilter === "favorite") data = data.filter((p) => p.favorite);
      if (favoriteFilter === "notFavorite")
        data = data.filter((p) => !p.favorite);

      if (visibleFilter === "visible") data = data.filter((p) => p.visible);
      if (visibleFilter === "notVisible") data = data.filter((p) => !p.visible);

      data.sort((a, b) => b.createdAt - a.createdAt);
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Lấy danh sách bộ sưu tập của user
  useEffect(() => {
    fetchCollections();
  }, [user?.id]);
  const fetchCollections = async () => {
    if (!user?.id) return;
    const colRef = collection(db, "userCollections", user.id, "collections");
    const snap = await getDocs(colRef);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setCollections(data);
  };

  useEffect(() => {
    if (user?.email) {
      setCurrentPage(1); // reset page khi filter thay đổi
      fetchUserPosts(user.email);
    }
  }, [
    user,
    startDate,
    endDate,
    favoriteFilter,
    visibleFilter,
    selectedCollection,
    refreshKey,
  ]);

  const handleDownload = async (url: string, title: string) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = title || "image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const toggleFavorite = async (postId: string) => {
    try {
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) return;

      const currentFavorite = postSnap.data()?.favorite;
      await updateDoc(postRef, { favorite: !currentFavorite });

      fetchUserPosts(user?.email);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const toggleVisible = async (postId: string) => {
    try {
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) return;

      const currentVisible = postSnap.data()?.visible;
      const newVisible = currentVisible === undefined ? false : !currentVisible;

      await updateDoc(postRef, { visible: newVisible });

      // Load lại danh sách posts
      fetchUserPosts(user?.email);
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  if (!user) return <Typography>Loading user...</Typography>;

  // Pagination logic
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  const stats = {
    total: posts.length,
    favorites: posts.filter((p) => p.favorite).length,
    hidden: posts.filter((p) => !p.visible).length,
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      {/* ===== Header hồ sơ ===== */}
      <Paper
        elevation={0}
        sx={(theme) => ({
          overflow: "hidden",
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          mb: 4,
        })}
      >
        {/* Ảnh bìa gradient */}
        <Box
          sx={(theme) => {
            const isDark = theme.palette.mode === "dark";
            const c1 = isDark ? "#1e1b4b" : "#4f46e5";
            const c2 = isDark ? "#3b0764" : "#7c3aed";
            return {
              height: { xs: 110, md: 150 },
              background: `radial-gradient(120% 120% at 85% 10%, ${alpha(
                "#ffffff",
                isDark ? 0.08 : 0.16
              )} 0%, transparent 50%), linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
            };
          }}
        />
        <Box sx={{ px: { xs: 2, md: 4 }, pb: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "flex-end" }}
            sx={{ mt: { xs: -6, md: -7 } }}
          >
            <ProfileAvatar size={100} />
            <Box sx={{ flex: 1, pb: 0.5, minWidth: 0 }}>
              <Typography variant="h5" fontWeight={800} noWrap>
                {user.username || user.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user.email}
              </Typography>
            </Box>
            <Stack
              direction="row"
              spacing={1.5}
              divider={<Divider orientation="vertical" flexItem />}
              sx={{ pb: 0.5 }}
            >
              <ProfileStat value={stats.total} label="Bài viết" />
              <ProfileStat value={stats.favorites} label="Yêu thích" />
              <ProfileStat value={stats.hidden} label="Đã ẩn" />
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <Stack
        direction="row"
        spacing={1.5}
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 3 }}
      >
        <Button
          startIcon={openPostForm ? <CloseIcon /> : <AddIcon />}
          onClick={() => setOpenPostForm((prev) => !prev)}
          variant={openPostForm ? "contained" : "outlined"}
          sx={{ borderRadius: 2.5, px: 3, py: 1.1 }}
        >
          Bài viết
        </Button>

        <Button
          startIcon={openCollection ? <CloseIcon /> : <PermMediaIcon />}
          onClick={() => setOpenCollection((prev) => !prev)}
          variant={openCollection ? "contained" : "outlined"}
          sx={{ borderRadius: 2.5, px: 3, py: 1.1 }}
        >
          Bộ sưu tập
        </Button>

        <Button
          startIcon={openFilter ? <CloseIcon /> : <SearchIcon />}
          onClick={() => setOpenFilter((prev) => !prev)}
          variant={openFilter ? "contained" : "outlined"}
          sx={{ borderRadius: 2.5, px: 3, py: 1.1 }}
        >
          Bộ lọc
        </Button>
      </Stack>

      <Dialog
        open={openPostForm}
        onClose={() => setOpenPostForm(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Thêm bài viết mới</DialogTitle>
        <DialogContent>
          {/* <PostForm
            userId={user?.email}
            onPostAdded={() => {
              setRefreshKey((prev) => prev + 1);
              setOpenPostForm(false);
            }}
          /> */}
          <PostFormMultiple
            userId={user?.email}
            onPostAdded={() => {
              setRefreshKey((prev) => prev + 1);
              setOpenPostForm(false);
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPostForm(false)}>Hủy</Button>
        </DialogActions>
      </Dialog>

      {openCollection && (
        <Box mb={4} width={"100%"}>
          <CollectionManager
            collections={collections}
            refreshCollections={fetchCollections}
          />
        </Box>
      )}

      {openFilter && (
        <Paper
          elevation={0}
          sx={(theme) => ({
            p: { xs: 2, md: 3 },
            mb: 4,
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
          })}
        >
          {/* Filter Date + Favorite */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              gap={2}
              mb={2}
              flexWrap="wrap"
            >
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { variant: "outlined" } }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { variant: "outlined" } }}
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Favorite</InputLabel>
                <Select
                  value={favoriteFilter}
                  label="Favorite"
                  onChange={(e) => setFavoriteFilter(e.target.value as any)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="favorite">Favorite</MenuItem>
                  <MenuItem value="notFavorite">Not Favorite</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Visible</InputLabel>
                <Select
                  value={visibleFilter}
                  label="Visible"
                  onChange={(e) => setVisibleFilter(e.target.value as any)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="visible">Visible</MenuItem>
                  <MenuItem value="notVisible">Not Visible</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Collection</InputLabel>
                <Select
                  value={selectedCollection}
                  label="Collection"
                  onChange={(e) => setSelectedCollection(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  {collections.map((col) => (
                    <MenuItem key={col.id} value={col.id}>
                      {col.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                onClick={() => fetchUserPosts(user.email)}
                sx={{ borderRadius: 2.5, px: 3 }}
              >
                Áp dụng
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                sx={{ borderRadius: 2.5, px: 3 }}
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                  setFavoriteFilter("all");
                  fetchUserPosts(user.email);
                  setSelectedCollection("all");
                }}
              >
                Xóa lọc
              </Button>
            </Box>
          </LocalizationProvider>
        </Paper>
      )}

      {selectedCollection !== "all" && (
        <Typography variant="h5" mb={2} sx={{ fontWeight: "bold" }}>
          <PermMediaIcon />{" "}
          {collections &&
            collections.find((col) => col.id == selectedCollection)?.title}
        </Typography>
      )}

      {/* Posts Grid */}
      {loading ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2.5,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Box key={i}>
              <Skeleton
                variant="rounded"
                height={170}
                sx={{ borderRadius: 3, mb: 1 }}
              />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="50%" />
            </Box>
          ))}
        </Box>
      ) : posts.length === 0 ? (
        <Paper
          elevation={0}
          sx={(theme) => ({
            py: 8,
            textAlign: "center",
            borderRadius: 4,
            border: `1px dashed ${theme.palette.divider}`,
          })}
        >
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Chưa có bài viết nào 📭
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nhấn “Bài viết” để tạo bài đầu tiên của bạn.
          </Typography>
        </Paper>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 2.5,
            }}
          >
            {currentPosts.map((post) => (
              <Card
                key={post.id}
                elevation={0}
                sx={(theme) => ({
                  position: "relative",
                  cursor: "pointer",
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  overflow: "hidden",
                  transition:
                    "transform .25s, box-shadow .25s, border-color .25s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 14px 30px rgba(2,6,23,0.12)",
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                  },
                })}
              >
                {post.imageUrl && (
                  <Box sx={{ width: "100%", pt: "75%", position: "relative" }}>
                    <CardMedia
                      component="img"
                      image={post.imageUrl}
                      alt={post.title}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        display: "flex",
                        gap: 1,
                      }}
                    >
                      <PostActions
                        post={post}
                        refreshCollections={fetchCollections}
                      />
                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          sx={(theme) => ({
                            bgcolor: alpha(theme.palette.background.paper, 0.7),
                            "&:hover": {
                              bgcolor: alpha(
                                theme.palette.background.paper,
                                0.9
                              ),
                            },
                          })}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(post.imageUrl, post.title);
                          }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Zoom">
                        <IconButton
                          size="small"
                          sx={(theme) => ({
                            bgcolor: alpha(theme.palette.background.paper, 0.7),
                            "&:hover": {
                              bgcolor: alpha(
                                theme.palette.background.paper,
                                0.9
                              ),
                            },
                          })}
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomImage(post.imageUrl);
                          }}
                        >
                          <ZoomInIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={post.favorite ? "Favorite" : "UnFavorite"}
                      >
                        <IconButton
                          size="small"
                          sx={(theme) => ({
                            bgcolor: alpha(theme.palette.background.paper, 0.7),
                            "&:hover": {
                              bgcolor: alpha(
                                theme.palette.background.paper,
                                0.9
                              ),
                            },
                          })}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(post.id);
                          }}
                        >
                          <FavoriteIcon
                            fontSize="small"
                            color={post.favorite ? "error" : "inherit"}
                          />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={
                          post.visible !== false ? "Hide Post" : "Show Post"
                        }
                      >
                        <IconButton
                          size="small"
                          sx={(theme) => ({
                            bgcolor: alpha(theme.palette.background.paper, 0.7),
                            "&:hover": {
                              bgcolor: alpha(
                                theme.palette.background.paper,
                                0.9
                              ),
                            },
                          })}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVisible(post.id);
                          }}
                        >
                          {post.visible !== false ? (
                            <VisibilityIcon fontSize="small" />
                          ) : (
                            <VisibilityOffIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                )}

                {post.imageUrls?.length > 0 && (
                  <PostImageSlider
                    post={post}
                    PostActionsComponent={
                      <PostActions
                        post={post}
                        refreshCollections={fetchCollections}
                      />
                    }
                    fetchCollections={fetchCollections}
                    setZoomImage={setZoomImage}
                    toggleFavorite={toggleFavorite}
                    toggleVisible={toggleVisible}
                  />
                )}
                <CardContent>
                  {/* <Typography variant="h6">{post.title}</Typography> */}
                  <PostTitle post={post} />
                  <Typography variant="body2" mb={1}>
                    {post.thrilled}
                  </Typography>
                  <Typography variant="caption" sx={{ marginLeft:2 }}>
                    {new Date(post.createdAt).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box
              sx={{ mt: 4, pb: 2, display: "flex", justifyContent: "center" }}
            >
              <PaginationCustom
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </Box>
          )}
        </>
      )}

      {/* Lightbox */}
      <Dialog
        open={!!zoomImage}
        onClose={() => setZoomImage(null)}
        maxWidth="lg"
        slotProps={{
          paper: {
            sx: {
              bgcolor: "transparent",
              boxShadow: "none",
              m: 2,
              maxWidth: "none",
            },
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {zoomImage && (
            <img
              src={zoomImage}
              alt="Zoom"
              style={{
                display: "block",
                maxWidth: "92vw",
                maxHeight: "88vh",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

function ProfileStat({ value, label }: { value: number; label: string }) {
  return (
    <Box sx={{ textAlign: "center", px: 1.5, minWidth: 64 }}>
      <Typography variant="h6" fontWeight={800} lineHeight={1.1}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export default ProfilePage;
