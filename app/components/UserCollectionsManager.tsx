"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { FolderOutlined } from "@mui/icons-material";
import { radius } from "@/app/lib/theme";
import { useForm } from "react-hook-form";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase.config";
import { useUser } from "@/hooks/useUser";

interface CollectionItem {
  id: string;
  title: string;
  createdAt: number;
  postIds: string[];
}

interface FormValues {
  title: string;
}

export default function CollectionManager({
  refreshCollections,
  collections,
}: {
  refreshCollections: () => void;
  collections: CollectionItem[];
}) {
  const user = useUser();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, setValue } = useForm<FormValues>();

  // 🔹 Thêm hoặc cập nhật bộ sưu tập
  const onSubmit = async (data: FormValues) => {
    if (!user?.id) return;
    try {
      if (editingId) {
        // Cập nhật
        await updateDoc(
          doc(db, "userCollections", user.id, "collections", editingId),
          { title: data.title }
        );
        refreshCollections();
      } else {
        // Thêm mới
        await addDoc(
          collection(db, "userCollections", user.id, "collections"),
          {
            title: data.title,
            createdAt: Date.now(),
            postIds: [],
          }
        );
      }
      reset();
      setOpen(false);
      setEditingId(null);
      refreshCollections();
    } catch (err) {
      console.error("Error saving collection:", err);
    }
  };

  // 🔹 Mở popup chỉnh sửa
  const handleEdit = (col: CollectionItem) => {
    setEditingId(col.id);
    setValue("title", col.title);
    setOpen(true);
  };

  // 🔹 Xoá bộ sưu tập
  const handleDelete = async (id: string) => {
    if (!user?.id) return;
    if (confirm("Bạn có chắc muốn xoá bộ sưu tập này?")) {
      await deleteDoc(doc(db, "userCollections", user.id, "collections", id));
      refreshCollections();
    }
  };

  // 🔹 Mở popup thêm mới
  const handleAdd = () => {
    setEditingId(null);
    reset();
    setOpen(true);
  };

  if (!user?.id) return null;

  return (
    <Box
      maxWidth={"100%"}
      mx="auto"
      display="flex"
      flexDirection="column"
      gap={3}
      sx={{
        animation: "fadeIn 0.25s ease",
        "@keyframes fadeIn": {
          from: { opacity: 0, transform: "translateY(6px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Card sx={{ bgcolor: "background.paper" }}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box
            display="flex"
            alignItems="center"
            px={2.5}
            py={1.5}
            justifyContent="space-between"
          >
            <Typography variant="subtitle1">Bộ sưu tập của tôi</Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              Tạo mới
            </Button>
          </Box>
          <Divider />

          {/* Loading / Empty */}
          {collections.length === 0 ? (
            <Box py={4} textAlign="center">
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List sx={{ py: 0.5, px: 0.5 }}>
              {collections.map((col, index) => (
                <ListItem
                  key={col.id}
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderRadius: `${radius.sm}px`,
                    transition: "background-color 0.15s",
                    "&:hover": { bgcolor: "action.hover" },
                    "& .MuiListItemSecondaryAction-root": {
                      opacity: { xs: 1, md: 0 },
                      transition: "opacity 0.15s",
                    },
                    "&:hover .MuiListItemSecondaryAction-root": { opacity: 1 },
                  }}
                  secondaryAction={
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Sửa">
                        <IconButton size="small" onClick={() => handleEdit(col)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xoá">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(col.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <Box
                    sx={(theme) => ({
                      width: 36,
                      height: 36,
                      mr: 1.5,
                      flexShrink: 0,
                      borderRadius: `${radius.sm}px`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "primary.main",
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    })}
                  >
                    <FolderOutlined fontSize="small" />
                  </Box>
                  <ListItemText
                    primary={
                      <Typography fontWeight={600} fontSize={14} sx={{ color: "text.primary" }}>
                        {col.title}{" "}
                        <Typography
                          component="span"
                          sx={{ color: "text.secondary", fontWeight: 400, fontSize: 13 }}
                        >
                          · {col?.postIds.length} bài viết
                        </Typography>
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {new Date(col.createdAt).toLocaleString("vi-VN")}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Popup thêm/sửa */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {editingId ? "Chỉnh sửa bộ sưu tập" : "Thêm bộ sưu tập mới"}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ pt: "8px !important" }}>
            <TextField
              label="Tên bộ sưu tập"
              {...register("title", { required: true })}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)} color="inherit">
              Huỷ
            </Button>
            <Button type="submit" variant="contained">
              {editingId ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
