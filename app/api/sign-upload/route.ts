import { v2 as cloudinary } from "cloudinary";

const CLOUD_NAME = "dhmr88vva";
const API_KEY = "731336174326163"; // thay bằng của bạn
const API_SECRET = "AAGsmaOjLycO8aHDszt6r-ad2zQ"; // thay bằng của bạn (chỉ ở đây, KHÔNG ở client!)

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
    API_SECRET
  );

  return Response.json({
    timestamp,
    signature,
    cloudName: CLOUD_NAME,
    apiKey: API_KEY,
  });
}
