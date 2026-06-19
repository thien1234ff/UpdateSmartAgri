import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Khởi tạo Firebase Admin nếu chưa có
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: "nongnghiepxanh-f6689",
      clientEmail: "firebase-adminsdk-fbsvc@nongnghiepxanh-f6689.iam.gserviceaccount.com",
      privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCR299QpFZJlkHL
FwFEs8uRkCkIWSUWpnbk9tyi+HVTMU9VfgW8tjXGO3n3KrlHqsHIAc9m5tPqM/OP
//6xwJWSShQbokNUO+utvJQyVb00h+nqTfOy9VhY8xq1g7HVbJ5RiHTuIggXb4gt
IbFkHi+hCGH0IkQxfaN2XUoO43l6oJY/vuVqPFZmluUe0gHF+OWkdD6omOin87oq
ujo/IqKurvtM6ooZcDEUIIdveIhLyCjfmDNoCTOiaFWUB3kjyDGNSdCIqASbE7zF
KSgOPx6lmAWd8r/RPImxJYMmlPb3nuG1cg53w2zxezNFFCUJ1zrIJgnMkIr24aaI
anINvqLxAgMBAAECggEAO3al/hxhSTLGs+M3EykxjrB06gBdzHQk+Idjv9UHD9mE
fFgaQqsOFTjeKlPyoTMOOVnzkgH81vhDDavRy+m1kKQ+ul1WkZq0JGpDCJpHvojC
ZlFNTuITGIBTnTiJYXccvCSjdwnMvrErlSqtRSHBTSc7t+nYX0zXPUQfEx7NwZ3k
uCEH/H7lJk4oD+O0iFmlnJinnTjtSkkWKT5sx31bT2aNLiyPXOJcShw5as2D9wp6
LoiPoQ5yyBUHIqzwQuiLRW39UsWpcAl5CTT0VjhsAktKoyJV9RF2G1ypK+21j0SX
J3vfoZPkJJGU4ZbIuwJxuEWtCWF65lVLXVsr819amQKBgQDImOjF2CueJgDiYupO
fFh4/oeyzaIShTSiFO96Ue24eDjJzmimkg7PlFS5kl3EZi5aZoX1rtChg0Wt92qN
0r92hpq9zVUIK3KeqBYNtLYRw9JbwrjLhZshn97lk8OgUD7/D3w0DQZUDTaYIiN6
QDy8wVTzhCtTc2R8GzmlRJQYcwKBgQC6JLimO/nmXcwV4KSbMvR5Y6fJfC2jV4Sf
ht4uTpK61ZMHO4joK+/KM7HJAW3Kp/fPHWNHxMaNRK1/vHYa3JdhCVD5nuo9DpQi
SNzHplCOJj+lngKU41TM4HDddSn5CFuM6WyAICkQm9ptsIU3bXS75b870C4jrn00
+qqvGNCSCwKBgQCoj0TaKuHMDKcllHTK6tX1JfylFQIhielGYU0yffHB1tPxUA7E
GWt0pnHjVciRJkPBFvFuFy2c6o/8tTDGZ9cXI9iXsRjIuqmgBCIz9iwgFWqITMG3
01ceFBba1yXFamjlLv/xRRiSPGApylYBfkULX3GhBujZQNepKb9wzoWbXQKBgH8J
hrd04UVWKG2Z5d1BtlWOLLm2tRLwLMQO8F1cJIm8Lt7Vw8boDXvLMf+DqSGQ5vAE
F3iok/VftKUjwtrsR6fjCs+BpE1NQM3xOjRLjlilQ/TM1Og2Ce7VElIhnyaljI2r
1O/QgxYht736pcBBRFTkJFI27vZNJIhettRPNDEnAoGAcX0H7IvZZuiXyadr6qDL
xtQUy1ZD5ip6MuHlwg/FLn28XsEcJkzZJCromdIHBQsSOcOBPTjwXl+1fc36Dw9t
qyVnSO/TpcpfChMqMtmRqvQPCQJjS/XjKsenvwm2LVm+wnGa6PNCAhCrBEUw8g1O
EY6K0KkW7YOS6h0mRhoMyPI=
-----END PRIVATE KEY-----`,
    }),
  });
}

const db = getFirestore();

export async function POST(req) {
  try {
    const body = await req.json();
    const description = body?.data?.description;
    const amount = body?.data?.amount;

    if (description === "Test webhook") {
      return Response.json({ success: true });
    }

    if (!description || typeof description !== "string") {
      return new Response("Thiếu hoặc sai định dạng 'description'", { status: 400 });
    }

    const match = description.match(/DH(\w+)/);
    if (!match) {
      return new Response("Không tìm thấy mã đơn hàng", { status: 400 });
    }

    const orderId = match[1];
    await db.collection("orders").doc(orderId).update({
      paymentStatus: "paid",
      status: "confirmed",
      paidAmount: amount,
      confirmedAt: new Date().toISOString(),
    });

    return Response.json({ success: true, orderId });
  } catch (error) {
    console.error("Lỗi xử lý webhook:", error);
    return new Response("Lỗi server", { status: 500 });
  }
}

