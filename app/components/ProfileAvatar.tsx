"use client";
import { useState } from "react";
import { Avatar, Box, CircularProgress, Tooltip } from "@mui/material";
import { PhotoCameraOutlined } from "@mui/icons-material";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase.config";
import { useUser } from "@/hooks/useUser";
import { toast } from "react-toastify";

export default function ProfileAvatar({ size = 60 }: { size?: number }) {
  const user = useUser();
  const [preview, setPreview] = useState(user?.avatar || "");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Preview local trước
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "unsigned_preset"); // preset Cloudinary của bạn

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dhmr88vva/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (data.secure_url) {
        setPreview(data.secure_url);

        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, { avatar: data.secure_url });

        const updatedUser = { ...user, avatar: data.secure_url };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        toast.success("Đã cập nhật ảnh đại diện!");
      }
    } catch (err) {
      toast.error("Tải ảnh lên thất bại!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box position="relative" display="inline-block" lineHeight={0}>
      {/* input file ẩn */}
      <input
        type="file"
        id="avatar-upload"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* click vào avatar để chọn ảnh */}
      <Tooltip title="Đổi ảnh đại diện">
        <label htmlFor="avatar-upload" style={{ cursor: "pointer", display: "inline-block" }}>
          <Avatar
            src={preview || user?.avatar}
            sx={{
              width: size,
              height: size,
              fontSize: size * 0.4,
              border: "4px solid",
              borderColor: "background.paper",
              transition: "opacity .2s",
              "&:hover": { opacity: 0.9 },
            }}
          >
            {(user?.username?.[0] || user?.email?.[0])?.toUpperCase()}
          </Avatar>
          <Box
            sx={(theme) => ({
              position: "absolute",
              right: 2,
              bottom: 2,
              width: 28,
              height: 28,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "background.paper",
              color: "text.secondary",
              border: `1px solid ${theme.palette.divider}`,
            })}
          >
            <PhotoCameraOutlined sx={{ fontSize: 16 }} />
          </Box>
        </label>
      </Tooltip>

      {/* loading overlay */}
      {uploading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(15,23,42,0.45)"
          borderRadius="50%"
        >
          <CircularProgress size={28} sx={{ color: "common.white" }} />
        </Box>
      )}
    </Box>
  );
}
