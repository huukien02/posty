"use client";

import { useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import emailjs from "@emailjs/browser";
import { db } from "@/lib/firebase.config";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";

// Hàm tạo mật khẩu ngẫu nhiên
function generatePassword(length = 8) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [severity, setSeverity] = useState<"success" | "error">("success");

  const handleReset = async () => {
    if (!email) {
      setMessage("Please enter your email");
      setSeverity("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // 1️⃣ Tìm user trong Firestore
      const q = query(collection(db, "users"), where("email", "==", email));
      const snapshot = await getDocs(q);

      // Lọc user có password tồn tại và không rỗng
      const validUsers = snapshot.docs.filter(
        (doc) => doc.data().password && doc.data().password.trim() !== ""
      );

      if (validUsers.length === 0) {
        setMessage("User not found or has no password");
        setSeverity("error");
        setLoading(false);
        return;
      }

      const userDoc = validUsers[0];
      const newPassword = generatePassword();

      // 2️⃣ Update password trong Firestore
      await updateDoc(doc(db, "users", userDoc.id), { password: newPassword });

      // 3️⃣ Gửi mail qua EmailJS
      await emailjs.send(
        "service_la3ooas",
        "template_r10xtwa",
        {
          to_email: email,
          password: newPassword,
        },
        "h5jvcwJ-CjuNVmTwO"
      );

      setMessage("Password reset! Check your email.");
      setSeverity("success");
    } catch (err: any) {
      console.error(err);
      setMessage("Error: " + err.message);
      setSeverity("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      maxWidth={400}
      height={400}
      mx="auto"
      mt={8}
      p={4}
      borderRadius={2}
      boxShadow={3}
      textAlign="center"
      sx={(theme) => ({
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      })}
    >
      <Typography variant="h5" mb={3}>
        Reset Password
      </Typography>

      <Typography variant="body2" align="left" color="warning.main" mb={2}>
        Chỉ tài khoản đăng ký thủ công (không Google) mới có thể reset password.
      </Typography>

      <TextField
        label="Email"
        type="email"
        fullWidth
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        margin="normal"
      />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleReset}
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : "Reset Password"}
      </Button>

      {message && (
        <Alert severity={severity} sx={{ mt: 3 }}>
          {message}
        </Alert>
      )}
    </Box>
  );
}
