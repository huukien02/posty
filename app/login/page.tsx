"use client";

import { useForm, SubmitHandler, Controller } from "react-hook-form";
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  Divider,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../../lib/firebase.config";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { Google, Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{6,}$/;
interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const { handleSubmit, control } = useForm<LoginForm>({
    defaultValues: { email: "", password: "" },
  });

  // Login bằng Email/Password
  const onSubmit: SubmitHandler<LoginForm> = async (data) => {
    try {
      // Kiểm tra user trong Firestore
      const q = query(
        collection(db, "users"),
        where("email", "==", data.email),
        where("password", "==", data.password),
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error("Sai email hoặc mật khẩu");
        return;
      }

      // Lấy user (chỉ 1 kết quả)
      const userDoc = snapshot.docs[0];
      const user: any = { id: userDoc.id, ...userDoc.data() };
      if (user.banned) {
        toast.error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.");
        return;
      }

      // Lưu vào localStorage
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("Đăng nhập thành công");
      window.dispatchEvent(new Event("userChanged"));
      router.push("/profile");
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (err: any) {
      console.error(err);
      toast.error("Login error: " + err.message);
    }
  };

  // Login bằng Google
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Query user trong Firestore
      const q = query(
        collection(db, "users"),
        where("email", "==", firebaseUser.email),
      );
      const snapshot = await getDocs(q);

      let userData: any;

      if (snapshot.empty) {
        // Nếu user chưa tồn tại => tạo mới
        const newUserRef = await addDoc(collection(db, "users"), {
          username: firebaseUser.displayName,
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL,
          postsRemaining: 5,
          createdAt: Date.now(),
          banned: false,
        });

        userData = {
          id: newUserRef.id,
          username: firebaseUser.displayName,
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL,
          postsRemaining: 5,
          createdAt: Date.now(),
          banned: false,
        };

        toast.success("Đăng nhập Google thành công!");
      } else {
        // Nếu user đã tồn tại => login
        const userDoc = snapshot.docs[0];
        userData = {
          id: userDoc.id,
          ...userDoc.data(),
        };

        // 🧱 Kiểm tra tài khoản bị banned
        if (userData.banned) {
          toast.error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.");
          await auth.signOut();
          return;
        }

        toast.success("Đăng nhập Google thành công!");
      }

      // Lưu user vào localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      window.dispatchEvent(new Event("userChanged"));
      router.push("/profile");
    } catch (err: any) {
      console.error(err);
      toast.error("Google login error: " + err.message);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="100%"
    >
      <Box
        width={400}
        border="1px solid #ccc"
        borderRadius={2}
        p={3}
        boxShadow={1}
      >
        <Typography variant="h5" align="center" mb={2}>
          Login
        </Typography>

        {/* Form login email/password */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            {/* Email */}
            <Controller
              name="email"
              control={control}
              rules={{
                required: "Vui lòng nhập email",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Email không đúng định dạng",
                },
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="text"
                  variant="outlined"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />

            {/* Password */}
            <Controller
              name="password"
              control={control}
              rules={{
                required: "Mật khẩu không được để trống",
                minLength: {
                  value: 6,
                  message: "Mật khẩu phải có ít nhất 6 ký tự",
                },
                maxLength: {
                  value: 12,
                  message: "Mật khẩu phải có nhất 12 ký tự",
                },
                pattern: {
                  value: PASSWORD_REGEX,
                  message:
                    "Mật khẩu phải có ít nhất 1 chữ hoa, 1 số và 1 ký tự đặc biệt",
                },
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  variant="outlined"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Button type="submit" variant="contained" color="primary">
              Login
            </Button>
          </Stack>
        </form>

        <Divider sx={{ my: 2 }}>OR</Divider>

        {/* Google login */}
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          onClick={handleGoogleLogin}
          startIcon={<Google />}
        >
          Login with Google
        </Button>
      </Box>
    </Box>
  );
}
