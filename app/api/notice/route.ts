import admin from "firebase-admin";
import { NextResponse } from "next/server";

const FIREBASE_SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "coffee-9a1f8",
  private_key_id: "78534205a8e5a25b1ee17c2ea65d2729283440db",
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDaysjO6k1m4Btm
1Z6ABQAO/cJjgbBLFVPCiBmc/3eBEq7YwkKkOqkNhaJKpvZTEPbz8Lf0ZZEVFGko
b2AfwZGIHKRwiAzl0EmhuEd24ojP4vuElkv9cWL3/r3L8rTLuSQ9eYb0+fvszWnu
iFFqgssOOKxoMDcvt+Iq4GfQ/pDuj3k+nrPf48NpArm7AjtGv9jz/C+WS1qL14Gq
SF5HcYcbP0OPeLhhHDCinrbVVWcUEKvhHdU58mto2K01NWVfNdOchblaRfAagxw+
R6G+4s0sfyAlp1RGz9p453GHK6xZK7U/UmFFqscg0Cp/vG3dTXBmPPUUuaAlL5bk
1aYwq021AgMBAAECggEATJDTdimjfaFmpXWTOpzFWPmvya/MWHI1til3wSvbj8VQ
f9V3ic5nc650zWghYo9YxKRUU8gpXfWfGUHkoyhTvAy99Q1/afsakWgSRkXfd9So
jU0leaNw7XVtyQ39/B8l0geR1XAYG9YEwK9ewoXT9n2Zw/o/jcjtcnDGk+pKINlZ
npWMpYh0RXhLoGUY2dzeOlYCY0rGpyu4lUrQCpmj/T/AmrBmbYRDlUcWy0Rgqg8o
qPxCa9D0EQaKaOrnWTl1Sqgh0QoICkdfwj1XURVF45byT+8BjYiar0y0Vo3JpVFm
1KUk6/QWZUxDESyMdFy/V6LVtudgmuiYk/6HdU9WXwKBgQD9YfRuj/efgF82SeNE
pDlZoPri+4+JXCRbfJylER1aETci6nQ4e+I46/0QDvtPsFErnC0/sv7b9zilq8O1
EXiTtWDIWK++EElVKBsszRPw9AE8Kh7LOoDtnxbxi/L0yPZrh7V8W6U6XS5aXrZK
HxtfNern5rYmY1/NL8XlL5lwmwKBgQDdDVvCON2gQEztUD14/N1IWoUq0CHElbOc
Ckg5rHN1AkQGkJF+cI6Go744al+PxmEiF44Z0L2dV08ZNQgodqxcal+zHYcGbmbq
06gn66U/bpo7h3nlb/Z+4baEsFxWy/ymMK254IoNfmnTJishOhPGsu7r5C4WWUUG
X3lX75vX7wKBgC4b4zUzcaZO4ASrEXZuRBlxV/ZyPL6MS/lyBbdsE+FN/LCX5apZ
sOMW3qhLcaQgu8Sp2PocgpBYvrA3P5f1o/GNMh2DNgfqQs4CTF+suhJA9PCT4aKt
9MRJDQ3Ln9y3rVAIFBibPMgQKN09GwMGAh8jWqn0q/T0ZHycUvDP5qY9AoGARlzj
MV6ihUkSc5PQDXwH/+j4bJlVtlqkkm3fcaRIGB3Bg4lvFp1DcO4cNZ7+jihqcMyo
qeT9BmFtRyvPTfoAgWZG0h/7A/wOfH8lDpf+wMM3Cu3jyjmqb9bvHyt4KRTDdi8W
jY1AxGzRyKlkny36b4wzaxj15p1B0HaBjJEzvTcCgYEAs086QJzluHsviRY/KvVt
t4Zg46o3xOG97CATwZHthwhotvn3+7w2FKeIdAT3i54HpJ75sTvcSr/Flp4608aG
2dXm8VwsI2F2nab4p1ZTgiuPA+CNVm/ToooBqiu3fd0SKAQ1np+bAQEyBp8VXQmj
jj8L8z2RYaE2reNo3m9RAeE=
-----END PRIVATE KEY-----`,
  client_email: "firebase-adminsdk-fbsvc@coffee-9a1f8.iam.gserviceaccount.com",
  client_id: "101631513630686671674",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40coffee-9a1f8.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(FIREBASE_SERVICE_ACCOUNT as any),
  });
}

export async function POST(req: Request) {
  const { token, title, body } = await req.json();

  const message = {
    token,
    notification: { title, body },
    webpush: { notification: { icon: "/icon.png" } },
  };

  try {
    const res = await admin.messaging().send(message);

    return NextResponse.json({ success: true, res });
  } catch (err) {
    console.error("Error sending FCM:", err);
    return NextResponse.json({ success: false, error: String(err) });
  }
}
