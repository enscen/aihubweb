# DocAI Hub - Trợ lý Xử lý Tài liệu & Văn phòng Đa Kênh

Ứng dụng web thông minh hỗ trợ hỏi đáp, trích xuất dữ liệu, tổng hợp báo cáo từ tài liệu bằng AI (**Google Gemini** và **ChatGPT**). Được thiết kế đặc biệt cho môi trường doanh nghiệp có chính sách bảo mật khắt khe.

---

## 🚀 3 Phương Pháp Nạp Tài Liệu (Giải quyết triệt để rào cản laptop công ty)

1. **Phương pháp 1: Kéo thả / Upload File Trực Tiếp**
   - Hỗ trợ các định dạng: **PDF**, **Excel (.xlsx, .xls, .csv)**, **Word (.docx)**, **Ảnh (.png, .jpg, .webp)**, **Văn bản (.txt)**.
   - Bấm nút **"Tải tệp"** hoặc kéo thả file trực tiếp vào trình duyệt.

2. **Phương pháp 2: Tải Tự Động Từ Link OneDrive / SharePoint**
   - Hỗ trợ link chia sẻ từ OneDrive cá nhân hoặc SharePoint nội bộ công ty (chọn quyền *"Bất kỳ ai có liên kết đều xem được"*).
   - Bấm nút **"Link OneDrive"** -> Dán link -> Hệ thống tự động phân giải và tải file về đưa vào ngữ cảnh của AI.
   - Nếu bạn dán link trực tiếp vào khung chat, web sẽ tự động nhận diện và hiện nút **"Tải File Này"**.

3. **Phương pháp 3: Dán Trực Tiếp Từ Clipboard (`Ctrl + V`) (Vượt qua mọi phần mềm DLP)**
   - **Bảng tính Excel:** Chọn các ô dữ liệu trong Excel -> Nhấn `Ctrl + C` -> Quay lại web bấm `Ctrl + V` vào khung chat. Hệ thống tự động chuyển thành bảng dữ liệu Markdown để AI đối chiếu số liệu.
   - **Ảnh chụp màn hình:** Dùng Snipping Tool (`Win + Shift + S`) chụp vùng tài liệu/hóa đơn/biểu đồ -> Nhấn `Ctrl + V` vào khung chat. Ảnh chụp sẽ tự động được đính kèm.

---

## 🤖 Hỗ Trợ Đa Mô Hình AI

- **Gemini 2.0 Flash (Khuyên dùng):** Cực kỳ nhanh, cửa sổ ngữ cảnh 1 triệu tokens, xử lý trơn tru các file PDF hàng trăm trang hoặc bảng Excel hàng chục nghìn dòng.
- **Gemini 1.5 Pro:** Cửa sổ ngữ cảnh 2 triệu tokens, năng lực tư duy logic và đối chiếu dữ liệu chuyên sâu.
- **ChatGPT (GPT-4o / GPT-4o Mini):** Khả năng hành văn tự nhiên, tóm tắt và phân tích chuyên nghiệp.

---

## 🛠️ Cài đặt & Khởi chạy

### 1. Chạy trên máy tính (Local)

Yêu cầu máy đã cài **Node.js 18+**.

```bash
# Cài đặt thư viện (nếu chưa cài)
npm run dev
```

Mở trình duyệt truy cập: `http://localhost:3000`

### 2. Cấu hình API Key

Bạn có thể cấu hình theo 2 cách:
* **Cách 1 (Nhanh nhất cho người dùng):** Mở giao diện web, bấm vào nút **"Cài đặt API"** ở góc trên bên phải, dán API Key của Google Gemini hoặc OpenAI vào. Key sẽ được lưu an toàn trên trình duyệt (localStorage).
* **Cách 2 (Cố định trên máy chủ):** Tạo file `.env.local` tại thư mục gốc:
  ```env
  GEMINI_API_KEY=AIzaSy...
  OPENAI_API_KEY=sk-...
  ```

> **Cách lấy Gemini API Key miễn phí:** Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey), đăng nhập tài khoản Google và bấm **Create API Key**.

---

## 🌐 Triển khai lên mạng (Cho vợ truy cập từ bất cứ đâu)

Để vợ bạn mở được từ laptop công ty mà không cần chung mạng WiFi:

### Cách 1: Đưa lên Vercel (Miễn phí, 2 phút xong)
1. Đẩy mã nguồn này lên GitHub của bạn.
2. Truy cập [vercel.com](https://vercel.com) -> Đăng nhập và chọn **"Add New Project"** -> Chọn Repo vừa tạo.
3. Trong phần **Environment Variables**, điền `GEMINI_API_KEY` (và `OPENAI_API_KEY` nếu có).
4. Bấm **Deploy**. Vercel sẽ cấp cho bạn một đường link HTTPS (ví dụ: `https://ten-du-an.vercel.app`). Vợ bạn mở link này trên laptop công ty là dùng được ngay!

### Cách 2: Dùng Cloudflare Tunnel (Giữ server chạy trên máy nhà bạn)
Nếu muốn giữ toàn bộ dữ liệu chạy trên máy tính cá nhân của bạn:
1. Cài đặt `cloudflared`.
2. Chạy lệnh: `cloudflared tunnel --url http://localhost:3000`.
3. Cloudflare sẽ tạo 1 đường link public ngẫu nhiên (ví dụ: `https://xyz.trycloudflare.com`) để vợ bạn truy cập trực tiếp vào máy tính ở nhà.
