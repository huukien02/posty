"use client";
import {
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  CircularProgress,
  alpha,
} from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import CheckCircle from "@mui/icons-material/CheckCircle";
import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase.config";
import { useUser } from "@/hooks/useUser";
import { toast } from "react-toastify";

interface PostAddToCollectionDialogProps {
  post: { id: string };
  refreshCollections: () => void;
}

export default function PostAddToCollectionDialog({
  post,
  refreshCollections
}: PostAddToCollectionDialogProps) {
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Lấy danh sách collection của user
  useEffect(() => {
    if (open && user?.id) fetchCollections();
  }, [open, user?.id]);

  const fetchCollections = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const colRef = collection(db, "userCollections", user.id, "collections");
      const snap = await getDocs(colRef);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCollections(data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải bộ sưu tập");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Thêm hoặc xóa post khỏi bộ sưu tập
  const handleTogglePostInCollection = async (collection: any) => {
    if (!user?.id || !post?.id) return;
    const colDoc = doc(
      db,
      "userCollections",
      user.id,
      "collections",
      collection.id
    );

    const isInCollection = collection.postIds?.includes(post.id);

    try {
      if (isInCollection) {
        await updateDoc(colDoc, { postIds: arrayRemove(post.id) });
        toast.success(`Đã xóa khỏi "${collection.title}"`);
      } else {
        await updateDoc(colDoc, { postIds: arrayUnion(post.id) });
        toast.success(`Đã thêm vào "${collection.title}"`);
      }

      // Cập nhật lại danh sách sau khi thay đổi
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collection.id
            ? {
                ...c,
                postIds: isInCollection
                  ? c.postIds.filter((id: string) => id !== post.id)
                  : [...(c.postIds || []), post.id],
              }
            : c
        )
      );
       if (refreshCollections) refreshCollections();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật bộ sưu tập");
    }
  };

  return (
    <>
      <Tooltip title="Thêm vào bộ sưu tập">
        <IconButton
          sx={(theme) => ({
            bgcolor: alpha(theme.palette.background.paper, 0.85),
            backdropFilter: "blur(4px)",
            "&:hover": {
              bgcolor: alpha(theme.palette.background.paper, 0.95),
            },
          })}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          size="small"
        >
          <BookmarkIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Chọn bộ sưu tập</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress size={24} />
            </Box>
          ) : collections.length === 0 ? (
            <Typography textAlign="center" py={2} color="text.secondary">
              Bạn chưa có bộ sưu tập nào
            </Typography>
          ) : (
            <List>
              {collections.map((col) => {
                const isInCollection = col.postIds?.includes(post.id);
                return (
                  <ListItemButton
                    key={col.id}
                    onClick={() => handleTogglePostInCollection(col)}
                    sx={(theme) => ({
                      border: `1px solid ${
                        isInCollection ? theme.palette.primary.main : theme.palette.divider
                      }`,
                      bgcolor: isInCollection
                        ? alpha(theme.palette.primary.main, 0.1)
                        : "transparent",
                      color: isInCollection
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                      mb: 1,
                      "&:hover": {
                        bgcolor: isInCollection
                          ? alpha(theme.palette.primary.main, 0.16)
                          : theme.palette.action.hover,
                      },
                    })}
                  >
                    <ListItemText
                      primary={col.title}
                      secondary={
                        isInCollection
                          ? `${col.postIds.length} bài viết`
                          : col.postIds?.length
                          ? `${col.postIds.length} bài viết`
                          : "Chưa có bài viết"
                      }
                      primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                      secondaryTypographyProps={{ color: "text.secondary", fontSize: 12 }}
                    />
                    {isInCollection && <CheckCircle fontSize="small" color="primary" />}
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
