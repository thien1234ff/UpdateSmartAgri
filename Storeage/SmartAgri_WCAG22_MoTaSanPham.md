# BÁO CÁO THUYẾT MINH SẢN PHẨM DỰ THI
## NỀN TẢNG NÔNG NGHIỆP SỐ CHO MỌI NGƯỜI – SMART AGRICULTURE (SMARTAGRI)
### Tối ưu hóa Trải nghiệm và Tuân thủ Tiêu chuẩn Tiếp cận Số Toàn cầu WCAG 2.2 AA

---

### MỤC LỤC
1. GIỚI THIỆU CHUNG & Ý TƯỞNG PHÁT TRIỂN (PRODUCT OVERVIEW)
2. ĐỐI TƯỢNG NGƯỜI DÙNG MỤC TIÊU (INCLUSIVE TARGET AUDIENCE)
3. CÁC TÍNH NĂNG CHÍNH CỦA SẢN PHẨM (PRODUCT FEATURES)
4. HỆ THỐNG TRỢ LÝ TIẾP CẬN SỐ TỰ ĐỘNG & BẢNG ĐIỀU KHIỂN THÔNG MINH (A11Y ASSISTANT)
5. GIẢI PHÁP KỸ THUẬT & MINH CHỨNG TUÂN THỦ TIÊU CHUẨN WCAG 2.2 AA
6. HƯỚNG DẪN ĐÁNH GIÁ NHANH DÀNH CHO BAN GIÁM KHẢO (QUICK DEMO GUIDE)
7. KẾT LUẬN & TẦM NHÌN PHÁT TRIỂN BỀN VỮNG

---

## 1. GIỚI THIỆU CHUNG & Ý TƯỞNG PHÁT TRIỂN (PRODUCT OVERVIEW)

Trong bối cảnh chuyển đổi số nông nghiệp tại Việt Nam diễn ra mạnh mẽ, phần lớn các ứng dụng và trang web hiện hành vẫn bỏ quên một nhóm đối tượng quan trọng: **người khuyết tật, người cao tuổi và những người gặp khó khăn trong việc vận động hoặc suy giảm thị lực**. Nhóm đối tượng này, bao gồm cả những thương bệnh binh hoặc nông dân lớn tuổi, thường gặp rào cản lớn khi tiếp cận thông tin kỹ thuật nông vụ hay mua bán trực tuyến nông sản.

**Smart Agriculture (SmartAgri)** ra đời với sứ mệnh xóa bỏ khoảng cách công nghệ đó bằng triết lý **Thiết kế Hòa nhập (Inclusive Design)**. SmartAgri không chỉ đơn thuần là một website thương mại điện tử kết hợp cổng thông tin kỹ thuật nông nghiệp thông minh, mà là một nền tảng tiên phong tại Việt Nam tích hợp sâu tiêu chuẩn **WCAG 2.2 AA (Web Content Accessibility Guidelines)** ngay từ lõi kiến trúc mã nguồn.

Sản phẩm đảm bảo sự hòa nhập toàn diện thông qua việc tối ưu tương tác bàn phím, tương thích hoàn hảo với các trình đọc màn hình phổ biến, và tích hợp sẵn một **Hệ thống Trợ lý Tiếp cận Số chủ động (Agri Accessibility Assistant)** có giọng đọc tiếng Việt tự nhiên giúp phản hồi mọi trạng thái hệ thống bằng âm thanh thời gian thực.

---

## 2. ĐỐI TƯỢNG NGƯỜI DÙNG MỤC TIÊU (INCLUSIVE TARGET AUDIENCE)

SmartAgri hướng tới xây dựng một hệ sinh thái nông nghiệp số tiếp cận không giới hạn, phục vụ cho:
1. **Người khiếm thị hoặc người suy giảm thị lực (người có mắt kém, người lớn tuổi đục thủy tinh thể)**: Họ có thể nghe toàn bộ nội dung web thông qua giọng đọc tiếng Việt tích hợp hoặc phần mềm đọc màn hình chuyên dụng (NVDA, JAWS, VoiceOver, TalkBack).
2. **Người khuyết tật vận động chi trên hoặc hạn chế điều khiển chuột**: Nhóm người dùng này có thể sử dụng bàn phím thông thường hoặc các thiết bị chuyển mạch hỗ trợ để duyệt web dễ dàng thông qua phím Tab và phím tắt.
3. **Người mù màu hoặc nhạy cảm với ánh sáng**: Giao diện cung cấp độ tương phản cực cao, biểu thị rõ ràng thông tin mà không phụ thuộc hoàn toàn vào màu sắc, hỗ trợ chuyển đổi giao diện tương phản (Contrast Mode).
4. **Nhà nông phổ thông & Người tiêu dùng đại chúng**: Người dùng được trải nghiệm một giao diện tối giản, hiện đại, tải trang siêu tốc và cấu trúc thông tin cực kỳ mạch lạc.

---

## 3. CÁC TÍNH NĂNG CHÍNH CỦA SẢN PHẨM (PRODUCT FEATURES)

Nền tảng SmartAgri tích hợp đầy đủ các tiện ích công nghệ hiện đại phục vụ chuỗi cung ứng và kỹ thuật canh tác nông nghiệp:

*   **Cửa hàng thương mại điện tử nông sản (Products)**: Tìm kiếm sản phẩm thông minh, lọc theo danh mục, xem chi tiết sản phẩm qua Modal tương tác và hệ thống giỏ hàng riêng biệt theo từng tài khoản (`cart_userUid`) giúp cô lập thông tin giỏ hàng của từng cá nhân an toàn trên bộ nhớ `localStorage`.
*   **Quy trình Thanh toán & Quản lý Đơn hàng (Checkout & Orders)**: Form thanh toán nhập liệu tối ưu hỗ trợ tính khoảng cách giao nhận, tích hợp thanh toán quét mã QR tự động. Trang theo dõi lịch sử đơn hàng trực quan.
*   **Dự báo Thời tiết nông nghiệp chuyên sâu (Weather)**: Hiển thị các chỉ số thời tiết thời gian thực (nhiệt độ, độ ẩm, lượng mưa, tốc độ gió) và đưa ra các lời khuyên nông vụ cụ thể cho từng loại cây trồng.
*   **Dự đoán Năng suất cây trồng bằng AI (Crop Prediction)**: Nhập các thông số đất đai (lượng mưa, độ ẩm, diện tích) để công cụ phân tích AI dự đoán năng suất thu hoạch dự kiến, giảm thiểu rủi ro canh tác.
*   **Diễn đàn Kết nối & Trao đổi kỹ thuật (Forum)**: Nơi nhà nông có thể viết bài, đặt câu hỏi thảo luận và nhận tư vấn trực tiếp từ các kỹ sư nông nghiệp hoặc các nhà nông khác.
*   **Cổng Kiến thức & Tin tức nông nghiệp (Knowledge)**: Thư viện tổng hợp kỹ thuật chăm sóc cây trồng, phòng trừ sâu bệnh và cập nhật xu hướng công nghệ sinh học mới nhất.
*   **Trợ lý tư vấn tự động Chatbot AI (AI Chat)**: Tích hợp mô hình ngôn ngữ lớn để trả lời các câu hỏi về nông nghiệp của người dân 24/7.

---

## 4. HỆ THỐNG TRỢ LÝ TIẾP CẬN SỐ TỰ ĐỘNG & BẢNG ĐIỀU KHIỂN THÔNG MINH (A11Y ASSISTANT)

Điểm nhấn công nghệ vượt trội của SmartAgri nằm ở **Bộ Công cụ Hỗ trợ Tiếp cận số Agri Accessibility Assistant** được phát triển độc quyền:

1. **Bảng điều khiển Trợ lý Tiếp cận số (Accessibility Panel)**: Kích hoạt nhanh bằng tổ hợp phím `Alt + A` hoặc biểu tượng nổi ở góc màn hình. Bảng điều khiển được chia thành các tab chức năng trực quan:
   *   **Tab Đọc trang**: Quét cấu trúc tài liệu HTML hiện tại (số lượng heading, nút, biểu mẫu) và đọc to toàn bộ trang web (phím tắt `Alt + R`, hỗ trợ tạm dừng `Alt + P`, tiếp tục `Alt + C` và dừng hẳn `Alt + S`).
   *   **Tab Tiêu điểm**: Kích hoạt chế độ đọc theo con trỏ focus. Khi người dùng di chuyển bàn phím bằng phím Tab qua các nút bấm hoặc ô nhập, trợ lý sẽ phát âm giải thích bằng tiếng Việt (ví dụ: *"Hộp nhập Họ tên, trống"*, *"Nút Tài khoản của tôi"*).
   *   **Tab Chuyển trang**: Cung cấp sơ đồ trang web (Sitemap) thu nhỏ dưới dạng các nút bấm trực quan để người dùng bàn phím hoặc screen reader nhảy nhanh đến các phân hệ mà không cần tìm kiếm trên thanh điều hướng chính.
   *   **Tab Trợ lý AI**: Cho phép trò chuyện trực tiếp với AI để hỏi về nội dung hiển thị trên trang hiện tại hoặc yêu cầu hướng dẫn thao tác (AI tự phân tích DOM để trả lời).
   *   **Tab Cài đặt**: Tùy chỉnh ngôn ngữ giọng đọc, tốc độ đọc (từ `0.5x` đến `2.0x`), âm lượng và cao độ của giọng nói nhân tạo (Web Speech API).
2. **Khả năng tương thích bàn phím của Bảng điều khiển**:
   *   Hỗ trợ phím `Tab` để di chuyển focus tuần tự qua tất cả các tab chức năng (thiết lập `tabIndex={0}` trên toàn bộ tiêu đề tab).
   *   Hỗ trợ chuyển đổi nhanh giữa các tab bằng phím **Mũi tên Trái / Mũi tên Phải** (`ArrowLeft`/`ArrowRight`) đi kèm âm thanh thông báo chuyển hướng tab tức thì.
   *   Thiết lập **Focus Trap** trong bảng điều khiển để người dùng bàn phím không bị lạc tiêu điểm ra ngoài nền web khi đang thao tác trong bảng trợ lý. Nhấn `ESC` để đóng nhanh.

---

## 5. GIẢI PHÁP KỸ THUẬT & MINH CHỨNG TUÂN THỦ TIÊU CHUẨN WCAG 2.2 AA

SmartAgri giải quyết triệt để các tiêu chí kỹ thuật khắt khe của chuẩn WCAG 2.2 cấp độ AA bằng các giải pháp lập trình Web tối ưu:

### Tiêu chí 4.1.3: Thông báo trạng thái (Status Messages) - Đạt chuẩn AA
*   **Vấn đề**: Khi có các sự kiện tải trang ngầm hoặc thông báo đẩy (như thêm hàng vào giỏ thành công, lỗi đăng nhập, cập nhật số lượng), người dùng khiếm thị hoặc hạn chế nhìn không thể biết được nếu họ không di chuyển tiêu điểm đến vùng thông báo đó.
*   **Giải pháp**: Xây dựng hệ thống **Global Accessibility Announcement System**. Hệ thống sử dụng một queue trung tâm (`announcementService`) để đẩy thông báo đến hai vùng ARIA Live Region ẩn trong DOM:
    *   `aria-live="polite"` với `role="status"`: Dùng cho thông báo thành công hoặc thông tin thông thường (ví dụ: *"Đã thêm Phân bón NPK vào giỏ hàng."*).
    *   `aria-live="assertive"` với `role="alert"`: Dùng cho thông báo lỗi khẩn cấp (ví dụ: *"Mật khẩu không hợp lệ, vui lòng nhập ít nhất 6 ký tự."*).
*   **Đồng bộ Visual Toast**: Mọi thông báo trực quan trên màn hình (Visual Toasts) đều được ánh xạ tự động sang giọng đọc Screen Reader qua Live Region này. Bản thân hộp Toast hiển thị trực quan được ẩn đi bằng `aria-hidden="true"` để loại bỏ hoàn toàn hiện tượng đọc lặp lại (double-announcing).
*   **Trì hoãn điều hướng (TTS Navigation Alignment)**: Đối với các luồng chuyển hướng quan trọng (như Đăng nhập, Đăng ký, Đăng xuất thành công), hệ thống thiết lập độ trễ chuyển hướng **3 giây** (3000ms). Khoảng trễ này đảm bảo các công cụ đọc màn hình và bộ tổng hợp giọng nói của trình duyệt hoàn tất việc phát âm thông báo trạng thái trước khi tải trang mới.

### Tiêu chí 2.1.1: Bàn phím (Keyboard) - Đạt chuẩn A
*   **Giải pháp**: Toàn bộ các tương tác (bao gồm cả việc mở/đóng modal, điều chỉnh thanh trượt tăng giảm số lượng sản phẩm, chọn phương thức thanh toán) đều được thiết kế để thao tác hoàn hảo bằng các phím `Tab`, `Shift + Tab`, `Space`, `Enter`, `ESC` và các phím mũi tên.

### Tiêu chí 2.4.1: Bỏ qua các khối (Bypass Blocks / Skip Link) - Đạt chuẩn A
*   **Vấn đề**: Người dùng bàn phím phải nhấn Tab hàng chục lần qua thanh Menu điều hướng lặp đi lặp lại ở đầu trang để xuống được nội dung chính.
*   **Giải pháp**: Triển khai nút **"Bỏ qua đến nội dung chính"** (Skip Link) ẩn ở đầu trang. Khi người dùng nhấn Tab lần đầu tiên, nút này sẽ hiển thị lên với độ tương phản cao. 
*   **Tối ưu thông minh trên Trang chủ**: Khi focus vào Skip Link trên Trang chủ (`/`), hệ thống tự động cập nhật liên kết trỏ thẳng tới phân khu Sản phẩm nổi bật (`#products`), đồng thời gắn thuộc tính `tabIndex={-1}` vào section này để focus nhảy trực tiếp vào thẻ sản phẩm đầu tiên khi nhấn Tab tiếp theo.

### Tiêu chí 2.4.7: Tiêu điểm rõ ràng (Focus Visible) - Đạt chuẩn A
*   **Giải pháp**: Ghi đè hiệu ứng focus mặc định của trình duyệt bằng một Focus Indicator thiết kế riêng có độ tương phản kép trong globals.css:
    ```css
    outline: 3px solid #f97316 !important;
    outline-offset: 3px !important;
    box-shadow: 0 0 0 2px #ffffff, 0 0 0 5px #f97316 !important;
    ```
    Đường viền màu cam nổi bật kết hợp vòng đệm màu trắng giúp người dùng dễ dàng nhận diện vị trí con trỏ bàn phím trên mọi nền màu sắc khác nhau (trắng, xám hay xanh lá cây).

### Tiêu chí 1.1.1: Nội dung phi văn bản (Non-text Content) - Đạt chuẩn A
*   **Giải pháp**: Cung cấp thuộc tính `alt` mô tả chính xác nội dung cho toàn bộ hình ảnh sản phẩm, thời tiết và infographic kiến thức. Đối với các nút bấm chỉ sử dụng Icon (như biểu tượng Kính lúp tìm kiếm, biểu tượng Giỏ hàng, nút Đóng modal, nút Đăng xuất), hệ thống thiết lập thuộc tính `aria-label` tương ứng (ví dụ: `aria-label="Tìm kiếm"`, `aria-label="Tài khoản của tôi"`).

### Tiêu chí 1.4.1: Sử dụng màu sắc (Use of Color) - Đạt chuẩn A
*   **Giải pháp**: Mọi thông điệp báo lỗi form ngoài việc hiển thị chữ đỏ còn đi kèm biểu tượng ký tự trực quan (như `❌`, `🎉`) và thông báo văn bản hiển thị rõ ràng, giúp người dùng mù màu vẫn nhận biết được lỗi dễ dàng.

### Tiêu chí 1.3.1: Thông tin và Mối quan hệ (Info and Relationships) - Đạt chuẩn A
*   **Giải pháp**: Tổ chức cấu trúc mã nguồn ngữ nghĩa (Semantic HTML5) khoa học: các thẻ `<header>`, `<main>`, `<footer>`, `<section>` phân định rõ ràng. Phân cấp Heading (`h1` duy nhất cho mỗi trang, tiếp nối là các tiêu đề phụ `h2` - `h6` đúng thứ tự phân bậc) để các công cụ đọc màn hình có thể dựng sơ đồ trang chính xác cho người dùng.

---

## 6. HƯỚNG DẪN ĐÁNH GIÁ NHANH DÀNH CHO BAN GIÁM KHẢO (QUICK DEMO GUIDE)

Để trải nghiệm các tính năng tiếp cận số đột phá của SmartAgri trong 3 phút, Ban Giám khảo có thể thực hiện theo các bước sau:

1.  **Thử nghiệm Điều hướng bằng Bàn phím & Skip Link**:
    *   Truy cập trang chủ SmartAgri. Nhấn phím **Tab** đầu tiên ngay sau khi tải trang.
    *   Nút **"Bỏ qua đến nội dung chính"** sẽ hiển thị nổi bật ở góc trên bên trái. Nhấn **Enter**, màn hình sẽ tự động cuộn và di chuyển tiêu điểm trực tiếp đến thẻ sản phẩm đầu tiên trong phần **Sản phẩm nổi bật**.
2.  **Sử dụng Bảng Trợ lý Tiếp cận (Accessibility Toolbar)**:
    *   Nhấn tổ hợp phím **Alt + A** (trên Windows) để mở nhanh bảng trợ lý.
    *   Sử dụng phím **Tab** hoặc các phím **Mũi tên Trái / Mũi tên Phải** để duyệt qua các tab chức năng. Trợ lý ảo sẽ tự động phát âm giới thiệu các tab bằng giọng đọc tiếng Việt.
    *   Chuyển sang tab **Tiêu điểm**, bấm nút bật chế độ đọc tiêu điểm. Sau đó nhấn phím Tab để di chuyển quanh trang web, bạn sẽ nghe thấy trợ lý đọc to nội dung và loại phần tử đang được chọn.
    *   Chuyển sang tab **Chuyển trang**, sử dụng phím Tab/Enter để nhảy nhanh đến trang *"Dự báo thời tiết"* hoặc *"Dự đoán năng suất"*.
3.  **Trải nghiệm Thông báo trạng thái thời gian thực**:
    *   Thêm một sản phẩm vào giỏ hàng bằng bàn phím. Hệ thống sẽ phát giọng đọc: *"Đã thêm [Tên sản phẩm] vào giỏ hàng."* đồng thời hiển thị thông báo Visual Toast trực quan.
    *   Mở giỏ hàng, nhấn nút tăng số lượng. Hệ thống sẽ đọc: *"Số lượng đã cập nhật thành hai"* (hỗ trợ chuyển số thành chữ tiếng Việt thân thiện).
    *   Thực hiện thanh toán đơn hàng thành công để nghe thông báo âm thanh đặt hàng thành công mà không bị chuyển trang đột ngột trước khi nghe hết.
    *   Vào trang Đăng nhập, nhập sai định dạng email hoặc mật khẩu và nhấn Enter để nghe trợ lý đọc to các lỗi Validation ngữ nghĩa.

---

## 7. KẾT LUẬN & TẦM NHÌN PHÁT TRIỂN BỀN VỮNG

Nền tảng **Smart Agriculture (SmartAgri)** là một minh chứng thực tiễn về việc ứng dụng công nghệ tiếp cận số WCAG 2.2 AA vào lĩnh vực nông nghiệp tại Việt Nam. Bằng cách ưu tiên tối đa cho trải nghiệm hòa nhập (Inclusive Experience), sản phẩm không chỉ giúp người khuyết tật, người cao tuổi tự tin làm chủ công nghệ, canh tác thông minh và tự chủ mua sắm nông sản, mà còn nâng tầm tiêu chuẩn phát triển phần mềm nhân văn và bền vững cho cộng đồng.

Chúng tôi cam kết sẽ tiếp tục nghiên cứu và mở rộng các giải pháp tiếp cận số nâng cao, hướng tới tích hợp điều khiển giọng nói toàn diện để đồng hành cùng mọi nhà nông Việt Nam trên hành trình chuyển đổi số nông nghiệp nước nhà.
