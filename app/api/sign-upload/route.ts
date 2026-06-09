import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!; // chỉ ở server, KHÔNG ở client!

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

export async function POST(request: Request) {
  const { folder } = await request.json();
  const timestamp = Math.floor(Date.now() / 1000);

  // Tạo signature hợp lệ
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    API_SECRET,
  );

  return Response.json({
    timestamp,
    signature,
    cloudName: CLOUD_NAME,
    apiKey: API_KEY,
  });
}
