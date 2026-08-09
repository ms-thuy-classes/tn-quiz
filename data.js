/* ============================================================
   DATABASE BÀI QUIZ — Learn with Ms. Thúy
   Mỗi phần tử trong POSTS là một bài post độc lập
   ============================================================ */

const POSTS = [
  /* ---------- BÀI 1: LỚP 11 VOCABULARY (quiz gốc) ---------- */
  {
    id: "vocab-class-11-daily",
    title: "Vocabulary & Grammar · Lớp 11 · Daily Routines",
    tags: ["Lớp 11", "Vocabulary", "Grammar"],
    cover: "🌞",
    gradient: "linear-gradient(135deg,#7a67ee,#5a9df5 55%,#3ecfa0)",
    description: "30 câu đục lỗ & đồng nghĩa về thói quen hàng ngày. Kèm giải thích tiếng Việt.",
    duration: "45 phút",
    questionCount: 30,
    parts: [
      {
        type: "mcq",
        name: "Phần 1 · Trắc nghiệm đục lỗ",
        hint: "Choose the correct answer",
        questions: [
          { q: "What time ________ Minh get up every morning?",
            o: ["do", "does", "is", "are"], a: 1,
            vi: "Minh thức dậy lúc mấy giờ mỗi sáng?",
            ex: "Câu hỏi thì hiện tại đơn với chủ ngữ số ít (Minh)." },
          { q: "He ________ up at five thirty.",
            o: ["get", "getting", "gets", "got"], a: 2,
            vi: "Anh ấy thức dậy lúc năm giờ rưỡi.",
            ex: "Chủ ngữ số ít (He) động từ thêm -s." },
          { q: "My brother loves ________ books in his free time.",
            o: ["read", "reads", "reading", "to reading"], a: 2,
            vi: "Anh trai tôi thích đọc sách vào thời gian rảnh.",
            ex: "Cấu trúc love + V-ing (thích làm gì)." }
        ]
      },
      /* ---------- Dạng 2: FILL IN THE BLANK ---------- */
      {
        type: "fill",
        name: "Phần 2 · Điền từ thích hợp",
        hint: "Type the correct word",
        questions: [
          { q: "She ________ (take) a shower every morning.",
            a: ["takes"], vi: "Cô ấy tắm vòi sen mỗi sáng.",
            ex: "Chủ ngữ she → động từ thêm -s: takes." },
          { q: "They ________ (go) to school by bus.",
            a: ["go"], vi: "Họ đi học bằng xe buýt.",
            ex: "Chủ ngữ số nhiều they → động từ nguyên mẫu." },
          { q: "My mother ________ (cook) dinner every evening.",
            a: ["cooks"], vi: "Mẹ tôi nấu bữa tối mỗi chiều.",
            ex: "Chủ ngữ số ít → thêm -s." }
        ]
      }
    ]
  },

  /* ---------- BÀI 2: LỚP 10 - READING + MCQ ---------- */
  {
    id: "reading-class-10-environment",
    title: "Reading Comprehension · Lớp 10 · Environment",
    tags: ["Lớp 10", "Reading", "Environment"],
    cover: "🌍",
    gradient: "linear-gradient(135deg,#3ecfa0,#5a9df5 55%,#8ecdfd)",
    description: "Đọc đoạn văn về bảo vệ môi trường và trả lời 5 câu hỏi.",
    duration: "20 phút",
    questionCount: 5,
    parts: [
      {
        type: "reading",
        name: "Reading · Environment",
        passage: `Climate change is one of the most serious problems facing our planet today. Rising temperatures are causing ice caps to melt, sea levels to rise, and extreme weather events to become more frequent. Scientists agree that human activities, especially the burning of fossil fuels like coal and oil, are the main cause of global warming.

To help protect the environment, we can take simple actions in our daily lives. For example, we can reduce energy consumption by turning off lights when we leave a room, use public transportation instead of driving, and recycle paper, plastic, and glass. Planting trees is another effective way to fight climate change, because trees absorb carbon dioxide from the air.

Many countries are also developing renewable energy sources such as solar, wind, and hydroelectric power. These sources are much cleaner than fossil fuels and will never run out. If everyone works together, we can create a healthier planet for future generations.`,
        questions: [
          { q: "What is the main cause of global warming according to the passage?",
            o: ["Natural disasters", "Human activities like burning fossil fuels", "Volcanic eruptions", "Animal migration"],
            a: 1,
            vi: "Nguyên nhân chính của sự nóng lên toàn cầu là hoạt động của con người như đốt nhiên liệu hóa thạch.",
            ex: "Dòng 4–5: 'Scientists agree that human activities... are the main cause'." },
          { q: "Which of the following is NOT mentioned as a way to help the environment?",
            o: ["Turning off lights", "Using public transport", "Buying electric cars", "Planting trees"],
            a: 2,
            vi: "Mua xe điện KHÔNG được đề cập trong bài.",
            ex: "Bài chỉ nói đến: tiết kiệm điện, phương tiện công cộng, tái chế, trồng cây." },
          { q: "Why are trees helpful in fighting climate change?",
            o: ["They provide shade", "They absorb carbon dioxide", "They produce fruit", "They attract rain"],
            a: 1,
            vi: "Cây xanh giúp ích bằng cách hấp thụ CO₂ từ không khí.",
            ex: "Dòng 9: 'trees absorb carbon dioxide from the air'." }
        ]
      }
    ]
  },

  /* ---------- BÀI 3: LỚP 7 - MATCHING + SYNONYM ---------- */
  {
    id: "matching-class-7-animals",
    title: "Matching & Synonyms · Lớp 7 · Animals",
    tags: ["Lớp 7", "Vocabulary", "Matching"],
    cover: "🦁",
    gradient: "linear-gradient(135deg,#ffb62e,#ffb28f 55%,#ff8fb1)",
    description: "Ghép từ vựng về động vật với nghĩa tiếng Việt, và chọn từ đồng nghĩa.",
    duration: "15 phút",
    questionCount: 8,
    parts: [
      /* ---------- Dạng 4: MATCHING ---------- */
      {
        type: "matching",
        name: "Phần 1 · Ghép từ vựng – nghĩa",
        hint: "Ghép mỗi từ bên trái với nghĩa đúng bên phải",
        pairs: [
          { left: "habitat",   right: "môi trường sống" },
          { left: "endangered", right: "có nguy cơ tuyệt chủng" },
          { left: "predator",  right: "động vật săn mồi" },
          { left: "mammal",    right: "động vật có vú" },
          { left: "reptile",   right: "bò sát" }
        ]
      },
      /* ---------- Dạng 5: SYNONYM với highlight ---------- */
      {
        type: "synonym",
        name: "Phần 2 · Từ đồng nghĩa",
        hint: "Choose the word CLOSEST in meaning to the highlighted word",
        questions: [
          { q: "The tiger is a <mark>fierce</mark> predator.",
            keyword: "fierce",
            o: ["gentle", "aggressive", "friendly", "quiet"], a: 1,
            vi: "Con hổ là một kẻ săn mồi hung dữ.",
            ex: "Fierce = hung dữ, dữ tợn. Aggressive là từ gần nghĩa nhất." },
          { q: "Whales are <mark>enormous</mark> animals.",
            keyword: "enormous",
            o: ["tiny", "huge", "average", "small"], a: 1,
            vi: "Cá voi là những con vật khổng lồ.",
            ex: "Enormous = khổng lồ = huge." }
        ]
      },
      {
        type: "antonym",
        name: "Phần 3 · Từ trái nghĩa",
        hint: "Choose the word OPPOSITE in meaning to the highlighted word",
        questions: [
          { q: "The cat looks very <mark>friendly</mark>.",
            keyword: "friendly",
            o: ["aggressive", "kind", "warm", "gentle"], a: 0,
            vi: "Con mèo trông rất thân thiện. Trái nghĩa là hung dữ.",
            ex: "Friendly (thân thiện) ↔ Aggressive (hung dữ)." }
        ]
      }
    ]
  },

  /* ---------- BÀI 4: LỚP 5 (tiểu học) ---------- */
  {
    id: "vocab-class-5-colors",
    title: "Vocabulary · Lớp 5 · Colors & Shapes",
    tags: ["Lớp 5", "Vocabulary"],
    cover: "🎨",
    gradient: "linear-gradient(135deg,#ff8fb1,#ffb28f 55%,#ffb62e)",
    description: "Làm quen với màu sắc và hình khối cơ bản bằng tiếng Anh.",
    duration: "10 phút",
    questionCount: 6,
    parts: [
      {
        type: "mcq",
        name: "Phần 1 · Chọn đáp án đúng",
        hint: "Choose the correct answer",
        questions: [
          { q: "What color is the sun? ☀️",
            o: ["Blue", "Yellow", "Green", "Purple"], a: 1,
            vi: "Mặt trời có màu vàng.",
            ex: "Sun = mặt trời, có màu vàng (yellow)." },
          { q: "A circle has ________ sides.",
            o: ["3", "4", "no", "5"], a: 2,
            vi: "Hình tròn không có cạnh.",
            ex: "Circle = hình tròn, không có cạnh thẳng." }
        ]
      },
      {
        type: "fill",
        name: "Phần 2 · Điền tên màu",
        hint: "Type the color name",
        questions: [
          { q: "Grass is ________. (màu của cỏ)",
            a: ["green"], vi: "Cỏ có màu xanh lá.",
            ex: "Grass = cỏ, màu xanh lá = green." },
          { q: "The sky is ________. (màu của bầu trời)",
            a: ["blue"], vi: "Bầu trời có màu xanh dương.",
            ex: "Sky = bầu trời, màu xanh dương = blue." }
        ]
      }
    ]
  },

  /* ---------- BÀI 5: IELTS ---------- */
  {
    id: "ielts-academic-vocab",
    title: "IELTS Academic · Advanced Vocabulary",
    tags: ["IELTS", "Vocabulary", "Academic"],
    cover: "🎓",
    gradient: "linear-gradient(135deg,#5a48d6,#7a67ee 55%,#3ecfa0)",
    description: "Từ vựng học thuật trình độ cao dành cho IELTS 6.5+.",
    duration: "25 phút",
    questionCount: 10,
    parts: [
      {
        type: "synonym",
        name: "Synonyms · Academic Level",
        hint: "Choose the closest synonym",
        questions: [
          { q: "The government implemented <mark>stringent</mark> policies.",
            keyword: "stringent",
            o: ["lenient", "strict", "flexible", "optional"], a: 1,
            vi: "Chính phủ đã thực thi các chính sách nghiêm ngặt.",
            ex: "Stringent = nghiêm ngặt = strict. Đây là từ học thuật quan trọng cho IELTS Writing." },
          { q: "His argument was completely <mark>fallacious</mark>.",
            keyword: "fallacious",
            o: ["logical", "misleading", "accurate", "truthful"], a: 1,
            vi: "Lập luận của anh ấy hoàn toàn sai lầm, gây hiểu lầm.",
            ex: "Fallacious = sai lầm, đánh lừa = misleading." }
        ]
      },
      {
        type: "antonym",
        name: "Antonyms · Academic Level",
        hint: "Choose the opposite word",
        questions: [
          { q: "She gave a <mark>candid</mark> answer to the question.",
            keyword: "candid",
            o: ["honest", "deceitful", "frank", "direct"], a: 1,
            vi: "Cô ấy đưa ra câu trả lời thẳng thắn. Trái nghĩa là lừa dối.",
            ex: "Candid (thẳng thắn) ↔ Deceitful (gian dối)." }
        ]
      }
    ]
  },

  /* ---------- BÀI 6: TOEIC ---------- */
  {
    id: "toeic-business-vocab",
    title: "TOEIC · Business English Vocabulary",
    tags: ["TOEIC", "Business", "Vocabulary"],
    cover: "💼",
    gradient: "linear-gradient(135deg,#39a7e6,#5a9df5 55%,#7a67ee)",
    description: "Từ vựng tiếng Anh thương mại thường gặp trong bài thi TOEIC.",
    duration: "20 phút",
    questionCount: 6,
    parts: [
      {
        type: "mcq",
        name: "Part 1 · Business Vocabulary",
        hint: "Choose the correct word to complete the sentence",
        questions: [
          { q: "The quarterly ________ will be presented at the meeting.",
            o: ["revenue", "employee", "building", "schedule"], a: 0,
            vi: "Doanh thu hàng quý sẽ được trình bày trong cuộc họp.",
            ex: "Revenue (doanh thu) là thuật ngữ tài chính phổ biến trong TOEIC." },
          { q: "Please ________ the attached document before the conference call.",
            o: ["review", "arrive", "purchase", "decorate"], a: 0,
            vi: "Vui lòng xem lại tài liệu đính kèm trước cuộc gọi hội nghị.",
            ex: "Review (xem lại) thường đi với document/report trong ngữ cảnh công việc." }
        ]
      }
    ]
  }
];
