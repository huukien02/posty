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
} from "@mui/material";
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
      mt={4}
      display="flex"
      flexDirection="column"
      gap={3}
      sx={{
        animation: "fadeIn 0.4s ease",
        "@keyframes fadeIn": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Card
        sx={(theme) => ({
          border: `1px solid ${
            theme.palette.mode === "light"
              ? theme.palette.divider
              : theme.palette.grey[800]
          }`,
          borderRadius: 3,
          boxShadow:
            theme.palette.mode === "light"
              ? "0 4px 20px rgba(0,0,0,0.06)"
              : "0 4px 20px rgba(0,0,0,0.4)",
          backgroundColor:
            theme.palette.mode === "light"
              ? theme.palette.background.paper
              : theme.palette.background.default,
          transition: theme.transitions.create(["box-shadow", "transform"], {
            duration: theme.transitions.duration.shortest,
          }),
          "&:hover": {
            boxShadow:
              theme.palette.mode === "light"
                ? "0 8px 28px rgba(0,0,0,0.12)"
                : "0 8px 28px rgba(0,0,0,0.6)",
            transform: "translateY(-2px)",
          },
        })}
      >
        <CardContent sx={{ p: 0 }}>
          <Box
            display="flex"
            alignItems="center"
            px={3}
            pt={2.5}
            pb={1.5}
            justifyContent="space-between"
            sx={{
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ color: "primary.main" }}
            >
              My Collections
            </Typography>
            <AddIcon
              sx={{
                fontSize: 28,
                cursor: "pointer",
                color: "primary.main",
                transition: "transform 0.2s, color 0.2s",
                "&:hover": {
                  color: "primary.dark",
                  transform: "rotate(90deg) scale(1.1)",
                },
              }}
              onClick={handleAdd}
            />
          </Box>
          <Divider />

          {/* Loading / Empty */}
          {collections.length === 0 ? (
            <Box py={4} textAlign="center">
              <CircularProgress size={28} />
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {collections.map((col, index) => (
                <ListItem
                  key={col.id}
                  divider={index !== collections.length - 1}
                  sx={{
                    px: 3,
                    py: 1.5,
                    transition: "background 0.2s, transform 0.2s",
                    "&:hover": {
                      backgroundColor: "rgba(0,0,0,0.03)",
                      transform: "translateX(4px)",
                    },
                    "& .MuiListItemSecondaryAction-root": {
                      opacity: 0,
                      transition: "opacity 0.2s",
                    },
                    "&:hover .MuiListItemSecondaryAction-root": { opacity: 1 },
                  }}
                  secondaryAction={
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(col)}
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(25, 118, 210, 0.1)",
                          },
                        }}
                      >
                        <EditIcon color="primary" fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(col.id)}
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(211, 47, 47, 0.1)",
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography
                        fontWeight="bold"
                        sx={{ color: "text.primary" }}
                      >
                        {col.title}{" "}
                        <Typography
                          component="span"
                          sx={{ color: "text.secondary", fontWeight: 400 }}
                        >
                          ({col?.postIds.length})
                        </Typography>
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", fontSize: "0.8rem" }}
                      >
                        {new Date(col.createdAt).toLocaleString()}
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
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            textAlign: "center",
            pb: 1,
          }}
        >
          {editingId ? "Chỉnh sửa bộ sưu tập" : "Thêm bộ sưu tập mới"}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <TextField
              label="Tên bộ sưu tập"
              {...register("title", { required: true })}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&:hover fieldset": { borderColor: "primary.main" },
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
            <Button
              onClick={() => setOpen(false)}
              variant="outlined"
              color="inherit"
            >
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
