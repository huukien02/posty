"use client";
import { useEffect, useRef, useState } from "react";
import { db } from "../../../lib/firebase.config";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Box, TextField, Button, Typography, Avatar } from "@mui/material";
import Image from "next/image";
import { alpha } from "@mui/material/styles";
import { AddPhotoAlternateOutlined, DeleteOutline } from "@mui/icons-material";
import { radius } from "@/app/lib/theme";
import { useUser } from "@/hooks/useUser";
import { toast } from "react-toastify";

interface PostFormProps {
  userId: string;
  onPostAdded: () => void;
}

export default function PostForm({ userId, onPostAdded }: PostFormProps) {
  const user = useUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  // Tạo preview khi file thay đổi
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Clean up memory khi unmount hoặc file thay đổi
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleSubmit = async () => {
    if (loading) return; // chặn double click
    if (!user) return;

    if (user?.postsRemaining <= 0) {
      toast.error("Bạn đã hết lượt thêm bài viết.");
      return;
    }

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn ảnh đúng định dạng");
      return;
    }

    try {
      setLoading(true); // bắt đầu submit

      // Upload ảnh lên Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "unsigned_preset");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dhmr88vva/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();

      // Thêm post vào Firestore
      await addDoc(collection(db, "posts"), {
        authorId: userId,
        title,
        content,
        imageUrl: data.secure_url,
        createdAt: Date.now(),
        sent: false,
        favorite: false,
        visible: false,
      });

      // 🔥 Trừ postsRemaining trong users
      const q = query(
        collection(db, "users"),
        where("email", "==", user.email)
      );
      const snapshot = await getDocs(q);
      const userDoc = snapshot.docs[0];
      await updateDoc(doc(db, "users", userDoc.id), {
        postsRemaining: increment(-1),
      });

      // ✅ Lấy lại dữ liệu mới nhất của user sau khi update
      const updatedSnap = await getDoc(doc(db, "users", userDoc.id));
      const updatedUser = { id: userDoc.id, ...updatedSnap.data() };

      // Lưu vào localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Thêm bài viết thành công!");

      setTitle("");
      setContent("");
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      onPostAdded();
      // window.location.reload();
    } catch (err) {
      toast.error("Có lỗi xảy ra khi thêm bài viết");
      console.error(err);
    } finally {
      setLoading(false); // kết thúc submit
    }
  };

  if (!user) return null;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 600,
        mx: "auto",
        pt: 1,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Header với Avatar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar
          src={user?.avatar || undefined}
          alt={user?.username || "User"}
          sx={{ width: 40, height: 40 }}
        />
        <Typography variant="subtitle1" color="text.primary">
          {user?.username || "Bạn"}
        </Typography>
      </Box>

      {/* Title bài viết */}
      <TextField
        label="Tiêu đề"
        placeholder="Bạn đang nghĩ gì?"
        fullWidth
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        variant="outlined"
      />

      {/* Description bài viết */}
      <TextField
        label="Nội dung"
        placeholder="Chia sẻ thêm chi tiết…"
        fullWidth
        multiline
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        variant="outlined"
      />

      {/* Upload ảnh */}
      <Box>
        <Box
          component="label"
          sx={(theme) => ({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
            py: 3,
            px: 2,
            borderRadius: `${radius.md}px`,
            border: `1.5px dashed ${theme.palette.divider}`,
            bgcolor: "action.hover",
            color: "text.secondary",
            cursor: "pointer",
            textAlign: "center",
            transition: "border-color .15s, background-color .15s",
            "&:hover": {
              borderColor: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              color: "primary.main",
            },
          })}
        >
          <AddPhotoAlternateOutlined sx={{ fontSize: 32 }} />
          <Typography variant="body2" fontWeight={600} color="text.primary">
            Thêm ảnh
          </Typography>
          <input
            type="file"
            hidden
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </Box>

        {preview && (
          <Box
            sx={(theme) => ({
              mt: 1.5,
              width: 140,
              height: 140,
              borderRadius: `${radius.sm}px`,
              border: `1px solid ${theme.palette.divider}`,
              overflow: "hidden",
              position: "relative",
              cursor: "pointer",
              "&:hover .overlay": { opacity: 1 },
            })}
            onClick={() => {
              setFile(null);
              setPreview(null);
            }}
          >
            <Image
              src={preview}
              alt="Preview"
              fill
              style={{ objectFit: "cover" }}
            />
            <Box
              className="overlay"
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: "rgba(15,23,42,0.55)",
                color: "common.white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
                fontWeight: 600,
                fontSize: "0.8125rem",
                opacity: 0,
                transition: "opacity 0.2s",
              }}
            >
              <DeleteOutline fontSize="small" /> Xóa ảnh
            </Box>
          </Box>
        )}
      </Box>

      {/* Submit Button */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleSubmit}
        sx={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? "Đang xử lý..." : "Thêm bài viết"}
      </Button>
    </Box>
  );
}
