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
        maxWidth: 600,
        mx: "auto",
        p: 3,
        borderRadius: 3,
        bgcolor: "background.paper",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      }}
    >
      {/* Title */}
      <TextField
        placeholder="Bạn đang nghĩ gì?"
        fullWidth
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 1 }}
      />

      {/* Content */}
      <TextField
        placeholder="Nội dung bài viết..."
        fullWidth
        multiline
        rows={2}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Upload nhiều ảnh */}
      <Box sx={{ textAlign: "center" }}>
        <Button
          variant="outlined"
          component="label"
          sx={{
            mb: 2,
            borderRadius: 3,
            border: "2px dashed",
            borderColor: "primary.main",
          }}
        >
          📸 Chọn nhiều ảnh
          <input
            type="file"
            hidden
            multiple
            accept="image/*"
            ref={inputRef}
            onChange={handleFileChange}
          />
        </Button>

        {/* Preview nhiều ảnh */}
        {previews.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 2,
              justifyContent: "left",
              mb: 3,
            }}
          >
            {previews.map((url, index) => (
              <Box
                key={index}
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  position: "relative",
                  cursor: "pointer",
                  "&:hover .overlay": { opacity: 1 },
                }}
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
                    bgcolor: "rgba(25,118,210,0.5)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    opacity: 0,
                    transition: "opacity 0.3s",
                  }}
                >
                  ❌ Xóa
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
        {loading ? "Đang xử lý..." : "Đăng bài viết"}
      </Button>
    </Box>
  );
}
