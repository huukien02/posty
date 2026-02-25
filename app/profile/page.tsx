"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Pagination,
  DialogTitle,
  DialogActions,
} from "@mui/material";
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

  return (
    <Box
      sx={{
        margin: { xs: 0, sm: "0 auto" },
        mt: { xs: 2, sm: 4 },
        px: 2,
        pb: 2,
        width: { xs: "100%", sm: "60%" },
      }}
    >
      {/* Header User */}
      <Box display="flex" alignItems="center" mb={4} width={"100%"}>
        <ProfileAvatar />
        <Box>
          <Typography variant="h5">{user.username || user.email}</Typography>
          <Typography variant="body2">{user.email}</Typography>
        </Box>
      </Box>

      <Box
        display="flex"
        gap={2}
        mb={4}
        width="100%"
        sx={{
          justifyContent: { xs: "center", sm: "flex-start" },
          flexWrap: "wrap",
        }}
      >
        {/* Post Button */}
        <Button
          startIcon={openPostForm ? <CloseIcon /> : <AddIcon />}
          onClick={() => setOpenPostForm((prev) => !prev)}
          variant="contained"
          sx={(theme) => ({
            textTransform: "none",
            borderRadius: 2,
            px: 3,
            py: 1.2,
            backgroundColor: openPostForm
              ? theme.palette.primary.dark
              : theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            boxShadow: openPostForm ? theme.shadows[4] : theme.shadows[2],
            "&:hover": {
              backgroundColor: openPostForm
                ? theme.palette.primary.main
                : theme.palette.primary.dark,
              boxShadow: theme.shadows[4],
            },
          })}
        >
          {openPostForm ? "Post (Mở)" : "Post"}
        </Button>

        {/* Collection Button */}
        <Button
          startIcon={openCollection ? <CloseIcon /> : <PermMediaIcon />}
          onClick={() => setOpenCollection((prev) => !prev)}
          variant="contained"
          sx={(theme) => ({
            textTransform: "none",
            borderRadius: 2,
            px: 3,
            py: 1.2,
            backgroundColor: openCollection
              ? theme.palette.primary.dark
              : theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            boxShadow: openCollection ? theme.shadows[4] : theme.shadows[2],
            "&:hover": {
              backgroundColor: openCollection
                ? theme.palette.primary.main
                : theme.palette.primary.dark,
              boxShadow: theme.shadows[4],
            },
          })}
        >
          {openCollection ? "Collection (Mở)" : "Collection"}
        </Button>

        {/* Filter Button */}
        <Button
          startIcon={openFilter ? <CloseIcon /> : <SearchIcon />}
          onClick={() => setOpenFilter((prev) => !prev)}
          variant="contained"
          sx={(theme) => ({
            textTransform: "none",
            borderRadius: 2,
            px: 3,
            py: 1.2,
            backgroundColor: openCollection
              ? theme.palette.primary.dark
              : theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            boxShadow: openCollection ? theme.shadows[4] : theme.shadows[2],
            "&:hover": {
              backgroundColor: openCollection
                ? theme.palette.primary.main
                : theme.palette.primary.dark,
              boxShadow: theme.shadows[4],
            },
          })}
        >
          {openFilter ? "Filter (Mở)" : "Filter"}
        </Button>
      </Box>

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
        <Box minWidth={"100%"}>
          {/* Filter Date + Favorite */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              gap={2}
              mb={2}
              pt={2}
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

            <Box display="flex" gap={2} mb={4}>
              <Button
                variant="contained"
                onClick={() => fetchUserPosts(user.email)}
              >
                Filter
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                  setFavoriteFilter("all");
                  fetchUserPosts(user.email);
                  setSelectedCollection("all");
                }}
              >
                Clear
              </Button>
            </Box>
          </LocalizationProvider>
        </Box>
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
        <Typography>Loading posts...</Typography>
      ) : posts.length === 0 ? (
        <Typography sx={{ mt: 5 }}>No posts yet.</Typography>
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
              gap: 2,
            }}
          >
            {currentPosts.map((post) => (
              <Card
                key={post.id}
                sx={{
                  position: "relative",
                  cursor: "pointer",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": { transform: "translateY(-5px)", boxShadow: 6 },
                }}
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
              sx={{ mt: 3, pb: 3, display: "flex", justifyContent: "center" }}
            >
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                size="large"
                variant="outlined"
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
      >
        <DialogContent>
          <img
            src={zoomImage || ""}
            alt="Zoom"
            style={{ width: "100%", height: "auto" }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;
