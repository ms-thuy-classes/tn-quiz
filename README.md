# 🌷 Learn with Ms. Thúy

Nền tảng quiz tiếng Anh dành cho học sinh Việt Nam — từ lớp 1 đến lớp 12, IELTS & TOEIC.

## ✨ Tính năng
- 🎨 Giao diện gradient pastel, mượt mà, responsive
- 🏷️ Tag theo lớp (1–12), IELTS, TOEIC, Grammar, Vocabulary, Reading...
- 📝 5 dạng bài tập:
  1. **Trắc nghiệm** (Multiple choice)
  2. **Điền từ** (Fill in the blank - gõ đáp án)
  3. **Reading** (đoạn văn có thanh cuộn + câu hỏi)
  4. **Matching** (ghép từ vựng / đồng nghĩa, cùng 1 trang)
  5. **Synonym / Antonym** (có highlight từ khóa)
- 🔊 Âm thanh Web Audio API (không cần file ngoài)
- 🎊 Pháo giấy khi điểm > 90%
- 📖 Giải thích tiếng Việt cho từng câu

## 🚀 Cách chạy
Mở `index.html` bằng Live Server hoặc `npx serve .`

## 📂 Cấu trúc data
Mỗi bài post là một object trong `data.js` (mảng `POSTS`):
```js
{
  id: "slug-url",
  title: "Tiêu đề bài",
  tags: ["Lớp 11", "Vocabulary"],
  cover: "🌞",
  description: "Mô tả ngắn",
  duration: "30 phút",
  parts: [ { type: "mcq|fill|reading|matching|synonym", ... } ]
}
Prompt
Bạn là bộ chuyển đổi text → JSON cho quiz engine tiếng Anh.
Hãy chuyển nội dung bài test dưới đây thành JSON đúng format sau:

{
  "title": "Tên bài",
  "description": "Mô tả",
  "tags": ["tag1", "tag2"],
  "timeLimit": 900,
  "parts": [
    {
      "type": "mcq|type-in|fill|reading|listening|synonym|antonym|matching",
      "name": "Tên phần",
      "hint": "Gợi ý",
      "passage": "...",      // chỉ reading
      "audio": "...",        // chỉ listening
      "image": "...",        // chỉ listening
      "questions": [...],    // mcq, type-in, fill, reading, synonym, antonym
      "pairs": [...]         // matching
    }
  ]
}

Quy tắc câu hỏi:
- MCQ: {"q":"...","o":["A","B","C","D"],"a":0,"vi":"...","ex":"..."} (a là index)
- TYPE-IN/FILL: {"q":"...","a":["ans1","ans2"],"vi":"..."} (a là mảng string)
- SYNONYM/ANTONYM: {"q":"...","keyword":"word","o":["..."],"a":0}
- LISTENING questions: thêm "qtype":"single|multi|type-in|fill"
- MATCHING pairs: {"left":"...","right":"..."}

Nội dung bài test:
[PASTE TEXT Ở ĐÂY]

Chỉ trả về JSON thuần, không markdown.
