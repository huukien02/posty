"use client";
import { useState } from "react";
import { Avatar, Box, CircularProgress } from "@mui/material";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase.config";
import { useUser } from "@/hooks/useUser";
import { toast } from "react-toastify";

export default function ProfileAvatar() {
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

        toast.success("Avatar updated!");
      }
    } catch (err) {
      toast.error("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box position="relative" paddingRight={2} display="inline-block">
      {/* input file ẩn */}
      <input
        type="file"
        id="avatar-upload"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* click vào avatar để chọn ảnh */}
      <label htmlFor="avatar-upload" style={{ cursor: "pointer" }}>
        <Avatar
          src={preview || user?.avatar}
          sx={{
            width: 60,
            height: 60,
            border: "2px solid #ccc",
            transition: "0.2s",
            "&:hover": { opacity: 0.8 },
          }}
        >
          {user?.username?.[0] || user?.email?.[0]}
        </Avatar>
      </label>

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
          bgcolor="rgba(0,0,0,0.4)"
          borderRadius="50%"
        >
          <CircularProgress size={32} sx={{ color: "#fff" }} />
        </Box>
      )}
    </Box>
  );
}
