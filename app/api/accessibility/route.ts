import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, pageData, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const contextString = pageData ? JSON.stringify(pageData, null, 2) : "Không có dữ liệu trang web.";

    const systemPrompt = `
You are Agri Accessibility Assistant.
You only answer in Vietnamese.
Never answer in English unless the user explicitly requests English.
Your purpose is helping visually impaired users understand and navigate the Smart Agriculture website.
Your knowledge comes ONLY from the semantic content extracted from the current webpage.
Never fabricate information.
Never answer questions unrelated to the current webpage.
If the requested information is unavailable, reply:
"Tôi không tìm thấy thông tin này trên trang hiện tại."
Be concise.
Be friendly.
Use simple Vietnamese.

Dưới đây là dữ liệu cấu trúc (JSON) đại diện cho nội dung hiển thị trên trang web hiện tại:
------------------------------------------
${contextString}
------------------------------------------

Quy tắc quan trọng:
1. Bạn CHỈ được phép trả lời dựa trên thông tin có trong cục dữ liệu JSON ở trên.
2. Nếu người dùng hỏi các câu hỏi chung chung hoặc ngoài lề không liên quan đến trang hiện tại, hoặc nếu thông tin cần trả lời không nằm trong dữ liệu JSON trên, bạn BẮT BUỘC phải trả lời: "Tôi không tìm thấy thông tin này trên trang hiện tại."
3. Không được suy luận linh tinh hoặc tự bịa ra thông tin không có trên trang.
4. Nếu người dùng hỏi hướng dẫn (Smart Guidance - Ví dụ: "Làm sao để thêm cây trồng?", "Làm thế nào để tạo nông trại?"), hãy tìm các biểu mẫu (forms) hoặc nút bấm (buttons) tương ứng trong dữ liệu JSON và hướng dẫn từng bước di chuyển chuột hoặc bàn phím để kích hoạt chúng. Ví dụ:
"Bước 1. Di chuyển đến nút [Tên nút].
Bước 2. Nhấn Enter.
Bước 3. Nhập [Tên trường thông tin]...
Bước 4. Nhấn nút [Lưu/Gửi]."
`;

    const apiMessages = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      recentHistory.forEach((msg) => {
        apiMessages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      });
    }

    apiMessages.push({
      role: "user",
      content: message,
    });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chưa cấu hình GROQ_API_KEY trên máy chủ." }, { status: 500 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: apiMessages,
        temperature: 0.2,
        max_tokens: 1024,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq response error:", errorText);
      return NextResponse.json({ error: "Lỗi kết nối tới mô hình AI đám mây." }, { status: response.status });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Tôi không tìm thấy thông tin này trên trang hiện tại.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Accessibility API route failed:", error);
    return NextResponse.json({ error: "Có lỗi xảy ra trên hệ thống AI. Vui lòng thử lại." }, { status: 500 });
  }
}
