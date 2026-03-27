# Hướng dẫn Deploy EduAI lên Vercel

Dưới đây là cách nhanh nhất để đưa dự án của bạn lên mạng:

## Cách 1: Sử dụng Link Clone (Nhanh nhất)

Click vào link dưới đây để Vercel tự động tạo Project từ GitHub của bạn:

[**Deploy to Vercel**](https://vercel.com/new/clone?repository-url=https://github.com/Hungdz3/EduAichatbot)

---

## Cách 2: Các bước thủ công

Nếu bạn muốn tự tạo Project trên Dashboard của Vercel:

1.  Truy cập [Vercel New Project](https://vercel.com/new).
2.  Chọn repository **Hungdz3/EduAichatbot**.
    - **Lưu ý về Tên Project:** Tên dự án nên là chữ thường, không có dấu, có thể dùng dấu chấm, gạch dưới hoặc gạch ngang (Ví dụ: `eduai-chatbot`). Không dùng 3 dấu gạch ngang liên tiếp (`---`).
3.  **QUAN TRỌNG:** Ở mục **Environment Variables**, hãy copy-paste các biến sau từ file `.env.local` vào:

```text
NEXT_PUBLIC_SUPABASE_URL=https://mgmenuzamkwrctcfxait.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nbWVudXphbWt3cmN0Y2Z4YWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNzMzNjUsImV4cCI6MjA4OTc0OTM2NX0.fevOENz_q3xNQBYyj_4EQQiKxtw-IFN7jCysSazYZRM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nbWVudXphbWt3cmN0Y2Z4YWl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE3MzM2NSwiZXhwIjoyMDg5NzQ5MzY1fQ.MiwSp1b9BNEN0wXF7xDv_1cR8R5VuwSsgP8r5dRQy98
OPENROUTER_API_KEY=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
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
NEXT_PUBLIC_APP_NAME=EduAI
```

4.  Nhấn **Deploy**.

## Lưu ý về lỗi build
Nếu bạn gặp lỗi `npm warn deprecated`, đó chỉ là cảnh báo, **không phải nguyên nhân gây lỗi build**. Nguyên nhân chính thường là:
- Thiếu Biến môi trường (Environment Variables).
- Kết nối tới Supabase bị chặn (Check lại IP allowlist trên Supabase nếu có).

Chúc bạn thành công! 🚀
