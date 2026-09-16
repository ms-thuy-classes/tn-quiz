/* Type: mcq-img — Trắc nghiệm có hình minh họa
   Hình căn giữa, có khung bao, kích cỡ phù hợp
   Data JSON:
   {
     "type": "mcq-img",
     "name": "Look and choose",
     "hint": "Nhìn hình rồi chọn đáp án đúng nhé!",
     "questions": [
       { "q": "What does this image show?",
         "img": "images/apple.png",
         "o": ["An apple","A banana","An orange","A grape"],
         "a": 0, "vi": "...", "ex": "..." }
     ]
   }
*/
(function () {
  'use strict';
  const esc = window.esc, shuffle = window.shuffle;

  function renderMCQImg(item) {
    const shuffled = shuffle(item.o.map((t, i) => ({ text: t, correct: i === item.a })));
    item._shuffled = shuffled;
    const LETTERS = ['A','B','C','D','E','F'];

    const imgSrc = item.img || item.image || '';
    let html = '';

    // ① Hình căn giữa, có khung bao, kích cỡ phù hợp
    if (imgSrc) {
      html +=
        '<div class="mcq-img-wrap" style="display:flex;justify-content:center;margin:14px 0 22px">' +
          '<img class="mcq-img" src="' + esc(imgSrc) + '" alt="Hình minh họa câu hỏi" ' +
            'loading="lazy" ' +
            'style="display:block;max-width:100%;max-height:340px;width:auto;object-fit:contain;' +
            'background:#fff;padding:6px;' +
            'border:3px solid var(--primary-soft,#e4e0fb);border-radius:16px;' +
            'box-shadow:0 10px 26px rgba(60,50,120,.14)">' +
        '</div>';
    }

    // ② Câu hỏi
    html += '<h2 class="q-text" style="text-align:center">' +
      esc(item.q || 'What does this image show?') +
    '</h2>';

    // ③ 4 phương án A/B/C/D
    html += '<div class="options">' +
      shuffled.map((opt, i) =>
        '<button class="opt" data-i="' + i + '" type="button">' +
          '<span class="opt-letter">' + LETTERS[i] + '</span>' +
          '<span class="opt-text">' + esc(opt.text) + '</span>' +
        '</button>'
      ).join('') +
    '</div>';

    return html;
  }

  // Dùng lại attachMCQ / handleMCQ trong file mcq.js bằng cách
  // tái sử dụng chính object của QuizTypes.mcq.
  function attachMCQImg(item) {
    window.QuizTypes.mcq.attach(item); // tái dùng logic đã có
  }

  window.QuizTypes['mcq-img'] = {
    label: '🖼️ Trắc nghiệm hình ảnh',
    render: renderMCQImg,
    attach: attachMCQImg,
    showsQText: false, // renderMCQImg tự render câu hỏi
  };
})();
