// lib/cloudinary.ts
export async function uploadFilesToCloudinary(files: File[]) {
  // Gọi server lấy signature
  const sigRes = await fetch("/api/sign-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: "" }), // để trống nếu không muốn tạo folder
  });

  if (!sigRes.ok) throw new Error("Không lấy được signature từ server");

  const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

  const uploadPromises = files.map(async (file) => {
    if (!file.type.startsWith("image/")) {
      throw new Error("File không hợp lệ: chỉ chấp nhận ảnh");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!uploadRes.ok) throw new Error("Upload thất bại");

    const data = await uploadRes.json();
    return data.secure_url;
  });

  const imageUrls = await Promise.all(uploadPromises);
  return imageUrls;
}
