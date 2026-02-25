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
        maxWidth: 600,
        mx: "auto",
        p: 3,
        borderRadius: 3,
        bgcolor: "background.paper",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      }}
    >
      {/* Header với Avatar */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Avatar
          src={user?.avatar || ""}
          alt={user?.username || "User"}
          sx={{ width: 48, height: 48, mr: 2 }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            color: "text.primary",
          }}
        >
          {user?.username || "Bạn"}
        </Typography>
      </Box>

      {/* Title bài viết */}
      <TextField
        placeholder="Bạn đang nghĩ gì?"
        fullWidth
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{
          mb: 1,
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            padding: "4px 12px",
            minHeight: 40,
            "& fieldset": {
              borderColor: "grey.400",
            },
            "&:hover fieldset": {
              borderColor: "primary.main",
            },
            "&.Mui-focused fieldset": {
              borderColor: "primary.main",
              boxShadow: "0 0 8px rgba(25,118,210,0.2)",
            },
          },
          "& .MuiInputBase-input": {
            padding: "6px 0",
          },
        }}
        variant="outlined"
      />

      {/* Description bài viết */}
      <TextField
        placeholder="Nội dung bài viết..."
        fullWidth
        multiline
        rows={2}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        sx={{
          mb: 2,
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            "& fieldset": {
              borderColor: "grey.400",
            },
            "&:hover fieldset": {
              borderColor: "primary.main",
            },
            "&.Mui-focused fieldset": {
              borderColor: "primary.main",
              boxShadow: "0 0 8px rgba(25,118,210,0.2)",
            },
          },
        }}
        variant="outlined"
      />

      {/* Upload ảnh */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Button
          variant="outlined"
          component="label"
          sx={{
            mb: 2,
            borderRadius: 3,
            border: "2px dashed",
            borderColor: "primary.main",
            color: "primary.main",
            "&:hover": {
              background: "rgba(25,118,210,0.1)",
              borderColor: "primary.main",
            },
          }}
        >
          📁 Thêm ảnh
          <input
            type="file"
            hidden
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </Button>

        {preview && (
          <Box
            sx={{
              mt: 1,
              mb: 3,
              width: 150,
              height: 150,
              borderRadius: 3,
              overflow: "hidden",
              position: "relative",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              "&:hover .overlay": { opacity: 1 },
            }}
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
                bgcolor: "rgba(25,118,210,0.4)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "1rem",
                opacity: 0,
                transition: "opacity 0.3s",
                borderRadius: 3,
              }}
            >
              ❌ Xóa ảnh
            </Box>
          </Box>
        )}
      </Box>

      {/* Submit Button */}
      <Button
        variant="contained"
        size="large"
        onClick={handleSubmit}
        sx={{
          borderRadius: 3,
          background: "linear-gradient(90deg, #1976d2, #42a5f5)",
          color: "white",
          fontWeight: "bold",
          fontSize: "1rem",
          py: 1,
          "&:hover": {
            background: "linear-gradient(90deg, #42a5f5, #1976d2)",
          },
          transition: "all 0.3s ease",
        }}
      >
        {loading ? "Đang xử lý..." : "Thêm bài viết"}
      </Button>
    </Box>
  );
}
