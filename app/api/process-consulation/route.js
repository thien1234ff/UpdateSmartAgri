import { streamText } from "ai";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

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

// Cấu hình gửi email bằng Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "22T1020444@husc.edu.vn", // email của bạn
    pass: "nazm zdyy vsku kpsh"     // app password từ Gmail
  }
});

export async function GET() {
  try {
    const snapshot = await db.collection("consultations")
      .where("status", "==", "pending")
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: "✅ Không có phản hồi nào cần xử lý" });
    }

    const results = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const { email, message } = data;

      // Tạo phản hồi bằng AI
      const result = await streamText({
        model: "openai/o4-mini",
        prompt: `Viết email phản hồi lịch sự, thân thiện cho khách hàng sau:\n"${message}"`,
      });

      let reply = "";
      for await (const chunk of result.textStream) {
        reply += typeof chunk === "string"
          ? chunk
          : new TextDecoder().decode(chunk);
      }

      // Gửi email
      await transporter.sendMail({
        from: `Nông Nghiệp Xanh <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Phản hồi từ đội ngũ hỗ trợ",
        text: reply
      });

      // Cập nhật trạng thái trong Firestore
      await doc.ref.update({
        status: "replied",
        reply,
        repliedAt: new Date()
      });

      results.push({ email, reply });
    }

    return NextResponse.json({
      message: `✅ Đã xử lý ${results.length} phản hồi`,
      results
    });
  } catch (error) {
    console.error("❌ Lỗi xử lý phản hồi:", error);
    return NextResponse.json(
      { error: "Lỗi xử lý phản hồi", details: error.message },
      { status: 500 }
    );
  }
}