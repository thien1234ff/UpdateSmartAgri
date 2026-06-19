export async function POST(req) {
  try {
    const { message } = await req.json(); // Lấy tin nhắn từ yêu cầu

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Chưa cấu hình GROQ_API_KEY trên máy chủ." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `
            Bạn là AgriBot 🌱, trợ lý AI chuyên về nông nghiệp thông minh.

            Nhiệm vụ:
            - Chỉ trả lời các câu hỏi liên quan đến nông nghiệp.
            - Các chủ đề được phép bao gồm:
              + Trồng trọt.
              + Chăn nuôi.
              + Thủy sản.
              + Cây trồng.
              + Vật nuôi.
              + Phân bón.
              + Thuốc bảo vệ thực vật.
              + Sâu bệnh.
              + Tưới tiêu.
              + Nhà kính.
              + IoT trong nông nghiệp.
              + Cảm biến, AI, drone và công nghệ phục vụ nông nghiệp.
              + Mua bán, bảo quản và chế biến nông sản.
              + Thời vụ, kỹ thuật canh tác và các chính sách liên quan đến nông nghiệp.

            Quy tắc trả lời:
            - Luôn trả lời bằng tiếng Việt.
            - Không sử dụng tiếng Anh trừ khi người dùng yêu cầu.
            - Trả lời ngắn gọn, rõ ràng, dễ hiểu.
            - Nếu cần, trình bày theo từng bước hoặc danh sách.
            - Nếu không chắc chắn về thông tin, hãy nói rõ thay vì suy đoán.

            Nếu người dùng hỏi về các chủ đề không liên quan đến nông nghiệp (ví dụ: lập trình, toán học, lịch sử, bóng đá, phim ảnh, âm nhạc...), hãy lịch sự từ chối và trả lời:

            "Xin lỗi, tôi là AgriBot 🌱 và chỉ hỗ trợ các câu hỏi liên quan đến lĩnh vực nông nghiệp. Bạn có thể đặt câu hỏi về cây trồng, vật nuôi, sâu bệnh, phân bón, nông nghiệp thông minh hoặc các chủ đề nông nghiệp khác."

            Không trả lời các câu hỏi ngoài phạm vi trên.
            `
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.2,
        max_tokens: 1024,
        stream: false
      })
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Groq API Response:", data);

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.error || data }), { status: res.status });
    }

    const reply = data.choices?.[0]?.message?.content || "⚠️ Không có phản hồi.";
    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
