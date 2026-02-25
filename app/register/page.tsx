"use client";

import { useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Stack,
  Divider,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { db } from "../../lib/firebase.config";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { toast } from "react-toastify";
import { Google, Visibility, VisibilityOff } from "@mui/icons-material";
interface RegisterForm {
  username: string;
  email: string;
  password: string;
  avatar?: FileList;
}
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{6,}$/;

export default function RegisterPage() {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { handleSubmit, control, register, reset } = useForm<RegisterForm>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      avatar: undefined,
    },
  });

  const auth = getAuth();

  // Đăng ký thủ công
  const onSubmit: SubmitHandler<RegisterForm> = async (data) => {
    if (loading) return; // ⛔ chặn submit trùng
    setLoading(true);
    try {
      const q2 = query(
        collection(db, "users"),
        where("email", "==", data.email),
      );
      const snapshot2 = await getDocs(q2);
      if (!snapshot2.empty) {
        toast.error("Email already exists");
        return;
      }

      let avatarUrl = "";

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "unsigned_preset");

        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dhmr88vva/image/upload",
          {
            method: "POST",
            body: formData,
          },
        );
        const data = await res.json();
        avatarUrl = data.url;
      }

      await addDoc(collection(db, "users"), {
        username: data.username,
        email: data.email,
        password: data.password,
        avatar: avatarUrl,
        postsRemaining: 5,
        createdAt: Date.now(),
      });
      toast.success("User registered successfully!");
      reset();
      setAvatarPreview(null);
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false); // ✅ luôn mở lại nút
    }
  };

  // Đăng ký bằng Google
  const handleGoogleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const q = query(
        collection(db, "users"),
        where("email", "==", user.email),
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        toast.warning("Email đã được đăng ký");
        return;
      }

      await addDoc(collection(db, "users"), {
        username: user.displayName,
        email: user.email,
        avatar: user.photoURL,
        postsRemaining: 5,
        createdAt: Date.now(),
      });

      toast.success("Đăng ký Google thành công!");
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (err: any) {
      console.error(err);
    }
  };

  // const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     setFile(file);
  //     setAvatarPreview(URL.createObjectURL(file));
  //   }
  // };

  const MAX_SIZE_MB = 2;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ❌ Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Vui lòng upload file định dạng ảnh");
      e.target.value = ""; // reset input
      return;
    }

    // ❌ Validate size
    const maxSize = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Dung lượng ảnh không được vượt quá ${MAX_SIZE_MB}MB`);
      e.target.value = "";
      return;
    }

    // ✅ Hợp lệ
    setFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      // height="100vh"
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
          Register
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            {/* Avatar */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={avatarPreview ?? undefined}
                sx={{ width: 56, height: 56 }}
              />
              <Button variant="contained" component="label">
                Upload Avatar
                <input
                  type="file"
                  hidden
                  {...register("avatar")}
                  onChange={handleAvatarChange}
                  accept="image/*"
                />
              </Button>
            </Stack>

            {/* Username */}
            <Controller
              name="username"
              control={control}
              rules={{
                required: "Vui lòng nhập username",
                maxLength: {
                  value: 15,
                  message: "Username tối đa 15 kí tự",
                },
                pattern: {
                  value: /^(?!\s*$).+/,
                  message: "Username không được chỉ chứa khoảng trắng",
                },
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Username"
                  variant="outlined"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />

            {/* Email */}
            <Controller
              name="email"
              control={control}
              rules={{
                required: "Vui lòng nhập email",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Email không hợp lệ",
                },
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="email"
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
                  message: "Mật khẩu tối đa 12 kí tự",
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

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </Button>
          </Stack>
        </form>

        <Divider sx={{ my: 2 }}>OR</Divider>

        {/* Google Signup */}
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          onClick={handleGoogleSignup}
          startIcon={<Google />}
        >
          Sign up with Google
        </Button>
      </Box>
    </Box>
  );
}
