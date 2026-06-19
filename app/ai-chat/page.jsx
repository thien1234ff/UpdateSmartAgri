"use client";
import { useState, useRef, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import * as Dialog from "@radix-ui/react-dialog";
import { announce } from "../../utils/announce";

export default function Agribot() {
  const [messages, setMessages] = useState([
    { role: "bot", content: "Xin chào! Tôi là AgriBot 🌱. Bạn muốn hỏi gì về nông nghiệp thông minh hôm nay?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  // Cuộn khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Khi tin nhắn thay đổi 

  // Gửi tin nhắn và nhận phản hồi từ API
  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    announce("Đã gửi tin nhắn. Đang đợi phản hồi...", "info");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json(); // Lấy phản hồi từ API
      if (!res.ok) {
        throw new Error(data.error || "Lỗi kết nối, vui lòng thử lại sau.");
      }
      setMessages([...newMessages, { role: "bot", content: data.reply }]);
      announce(`AgriBot trả lời: ${data.reply}`, "info");
    } catch (err) {
      setMessages([...newMessages, { role: "bot", content: `⚠️ Lỗi: ${err.message}` }]);
      announce(`Lỗi kết nối: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-white to-emerald-100">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-2xl flex flex-col h-full">
          {/* Header với animation */}
          <div className="text-center mb-6 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-400 to-emerald-600 mb-4 shadow-lg">
              <span className="text-3xl text-white">🌱</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-800 mb-2">
              AgriBot Assistant
            </h1>
            <p className="text-emerald-600 font-light">Trợ lý thông minh cho nông nghiệp hiện đại</p>
          </div>
          
          {/* Chat container với glassmorphism effect */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden flex flex-col h-full max-h-[600px] border border-white/20">
            {/* Header của chatbox */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4 flex items-center shadow-md">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3 shadow-md">
                  <span className="text-xl">🌱</span>
                </div>
                <div className="absolute bottom-0 right-2 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">AgriBot</h2>
                <p className="text-emerald-100 text-sm">Đang trực tuyến</p>
              </div>
              
              {/* Nút mở Dialog */}
              <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Dialog.Trigger asChild>
                  <button className="ml-auto text-white bg-emerald-700/30 hover:bg-emerald-700/50 p-2 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </button>
                </Dialog.Trigger>
                
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                  <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6 w-full max-w-md z-50">
                    {/* Dialog Title - BẮT BUỘC cho accessibility */}
                    <Dialog.Title className="text-lg font-semibold text-emerald-800 mb-2">
                      Thông tin về AgriBot
                    </Dialog.Title>
                    
                    {/* Dialog Description - BẮT BUỘC cho accessibility */}
                    <Dialog.Description className="text-sm text-gray-600 mb-4">
                      AgriBot là trợ lý ảo hỗ trợ giải đáp các thắc mắc về nông nghiệp thông minh.
                    </Dialog.Description>
                    
                    <div className="text-sm text-gray-700 space-y-2">
                      <p>AgriBot có thể giúp bạn với:</p>
                      <ul className="list-disc pl-5">
                        <li>Các vấn đề về trồng trọt và chăm sóc cây</li>
                        <li>Kỹ thuật nông nghiệp hiện đại</li>
                        <li>Giải đáp thắc mắc về phân bón và thuốc bảo vệ thực vật</li>
                        <li>Công nghệ trong nông nghiệp</li>
                      </ul>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <Dialog.Close asChild>
                        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                          Đóng
                        </button>
                      </Dialog.Close>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
            
            {/* Khu vực hiển thị tin nhắn */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-emerald-50/30 to-green-100/30">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-message-in`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {msg.role === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-200 to-emerald-300 flex items-center justify-center mr-2 flex-shrink-0 shadow-sm">
                      <span className="text-sm">🌱</span>
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" 
                    ? "bg-gradient-to-r from-emerald-600 to-green-500 text-white rounded-br-none shadow-md" 
                    : "bg-white border border-emerald-100 rounded-bl-none shadow-sm"}`}>
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                  
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center ml-2 flex-shrink-0 shadow-sm">
                      <span className="text-white text-xs font-medium">You</span>
                    </div>
                  )}
                </div>
              ))} 
              
              {loading && (
                <div className="flex justify-start animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-200 to-emerald-300 flex items-center justify-center mr-2">
                    <span className="text-sm">🌱</span>
                  </div>
                  <div className="bg-white border border-emerald-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Khu vực nhập tin nhắn */}
            <div className="p-4 border-t border-emerald-100/50 bg-white/50">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Nhập câu hỏi về nông nghiệp..."
                  className="flex-1 border border-emerald-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 bg-white/80 transition-all duration-300"
                  disabled={loading}
                /> 
                <button 
                  onClick={sendMessage} 
                  disabled={loading || !input.trim()}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-5 py-3 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
              
              <p className="text-xs text-center text-emerald-600/70 mt-3">
                AgriBot có thể đưa ra các khuyến nghị không chính xác. Luôn tham khảo ý kiến chuyên gia khi cần.
              </p>
            </div>
          </div>

          {/* Gợi ý câu hỏi nhanh */}
          <div className="mt-6 animate-fade-in-up">
            <p className="text-center text-emerald-700 text-sm font-medium mb-2">Câu hỏi thường gặp:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Cách trồng cà chua hữu cơ?",
                "Phòng bệnh cho lúa?",
                "Công nghệ tưới tiêu tiết kiệm?",
                "Giống cây trồng mới?"
              ].map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(question)}
                  className="text-xs bg-emerald-100 text-emerald-700 px-3 py-2 rounded-full hover:bg-emerald-200 transition-colors duration-200"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes message-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.7s ease-out forwards;
        }
        .animate-message-in {
          animation: message-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}