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
  updateDoc,
  where,
} from "firebase/firestore";
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Grid,
} from "@mui/material";
import Image from "next/image";
import { alpha } from "@mui/material/styles";
import { AddPhotoAlternateOutlined, DeleteOutline } from "@mui/icons-material";
import { radius } from "@/app/lib/theme";
import { useUser } from "@/hooks/useUser";
import { toast } from "react-toastify";
import { uploadFilesToCloudinary } from "@/app/lib/cloudinary";
const MAX_FILE_SIZE = 100 * 1024 * 1024
interface PostFormMultipleProps {
  userId: string;
  onPostAdded: () => void;
}

export default function PostFormMultiple({
  userId,
  onPostAdded,
}: PostFormMultipleProps) {
  const user = useUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  // 🔍 Tạo preview cho tất cả ảnh
  useEffect(() => {
    if (files.length === 0) {
      setPreviews([]);
      return;
    }

    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);

    // cleanup
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const fileList = e.target.files;
  //   if (!fileList) return;

  //   const newFiles = Array.from(fileList);
  //   const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

  //   // Thêm cả vào 2 state
  //   setFiles((prev) => [...prev, ...newFiles]);
  //   setPreviews((prev) => [...prev, ...newPreviews]);

  //   // Reset input để chọn lại cùng file cũng vẫn trigger được
  //   e.target.value = "";
  // };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const selectedFiles = Array.from(fileList);

    const validFiles: File[] = [];

    selectedFiles.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" vượt quá 100MB`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));

    setFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);

    // reset input để chọn lại cùng file
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!user) return;

    if (title.length === 0) {
      toast.error("Tiêu đề không được bỏ trống");
      return;
    }

    if ( title.length > 1000) {
      toast.error("Tiêu đề không được quá 1000 kí tự");
      return;
    }

    if (user?.postsRemaining <= 0) {
      toast.error("Bạn đã hết lượt thêm bài viết.");
      return;
    }

    if (files.length === 0) {
      toast.error("Vui lòng chọn ít nhất một ảnh.");
      return;
    }

    try {
      setLoading(true);
      toast.info("Đang tải ảnh lên...");

      // 🔥 Upload tất cả ảnh lên Cloudinary
      const imageUrls = await uploadFilesToCloudinary(Array.from(files));

      // ✅ Thêm post vào Firestore
      await addDoc(collection(db, "posts"), {
        authorId: userId,
        title,
        content,
        imageUrls, // mảng URL thay vì 1 ảnh
        createdAt: Date.now(),
        sent: false,
        favorite: false,
        visible: false,
      });

      // 🔥 Trừ lượt bài viết còn lại
      const q = query(
        collection(db, "users"),
        where("email", "==", user.email),
      );
      const snapshot = await getDocs(q);
      const userDoc = snapshot.docs[0];
      await updateDoc(doc(db, "users", userDoc.id), {
        postsRemaining: increment(-1),
      });

      // Cập nhật user mới nhất
      const updatedSnap = await getDoc(doc(db, "users", userDoc.id));
      const updatedUser = { id: userDoc.id, ...updatedSnap.data() };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Thêm bài viết thành công!");
      setTitle("");
      setContent("");
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";

      onPostAdded();
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi thêm bài viết!");
    } finally {
      setLoading(false);
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
      {/* Title */}
      <TextField
        label="Tiêu đề"
        placeholder="Bạn đang nghĩ gì?"
        fullWidth
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Content */}
      <TextField
        label="Nội dung"
        placeholder="Chia sẻ thêm chi tiết…"
        fullWidth
        multiline
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {/* Upload nhiều ảnh */}
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
            Chọn ảnh để tải lên
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Có thể chọn nhiều ảnh cùng lúc
          </Typography>
          <input
            type="file"
            hidden
            multiple
            accept="image/*"
            ref={inputRef}
            onChange={handleFileChange}
          />
        </Box>

        {/* Preview nhiều ảnh */}
        {previews.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(4, 1fr)" },
              gap: 1,
              mt: 1.5,
            }}
          >
            {previews.map((url, index) => (
              <Box
                key={index}
                sx={(theme) => ({
                  pt: "100%",
                  borderRadius: `${radius.sm}px`,
                  overflow: "hidden",
                  border: `1px solid ${theme.palette.divider}`,
                  position: "relative",
                  cursor: "pointer",
                  "&:hover .overlay": { opacity: 1 },
                })}
                onClick={() => handleRemoveImage(index)}
              >
                <img
                  src={url}
                  alt={`preview-${index}`}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
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
                  <DeleteOutline fontSize="small" /> Xóa
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Submit */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleSubmit}
        sx={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? "Đang xử lý..." : "Đăng bài viết"}
      </Button>
    </Box>
  );
}
