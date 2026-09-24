/* Types: mcq, synonym, antonym, reading (dùng chung layout MCQ) */
(function () {
  'use strict';
  const esc = window.esc, shuffle = window.shuffle;
  function formatOption(text) {
  return esc(text).replace(
    /\[(.*?)\]/g,
    '<span class="under">$1</span>'
  );
}

  function renderMCQ(item) {
    const shuffled = shuffle(item.o.map((t, i) => ({ text: t, correct: i === item.a })));
    item._shuffled = shuffled;
    const LETTERS = ['A','B','C','D','E','F'];
    let html = '';
    if (item._passage) {
      html += '<div class="reading-passage">' +
        esc(item._passage).split('\n\n').map(p => '<p style="margin-bottom:14px">' + esc(p) + '</p>').join('') +
      '</div>';
    }
    html += '<div class="options">' +
      shuffled.map((opt, i) =>
        '<button class="opt" data-i="' + i + '" type="button">' +
          '<span class="opt-letter">' + LETTERS[i] + '</span>' +
         '<span class="opt-text">' + formatOption(opt.text) + '</span>' +
        '</button>'
      ).join('') +
    '</div>';
    return html;
  }

  function attachMCQ(item) {
    document.querySelectorAll('#qStage .opt').forEach(btn => {
      btn.addEventListener('click', () => handleMCQ(btn, item));
    });
  }

  function handleMCQ(btn, item) {
    const Quiz = window.Quiz, game = Quiz.game;
    const all = [...document.querySelectorAll('#qStage .opt')];
    all.forEach(b => b.disabled = true);
    const i = +btn.dataset.i;
    const chosen = item._shuffled[i];
    game.answers[game.idx] = { chosen: chosen.text, ok: chosen.correct };

    if (chosen.correct) {
      btn.classList.add('correct');
      all.forEach((b, j) => { if (j !== i) b.classList.add('dim'); });
      game.correct++;
      Quiz.updateLiveScore();
      Quiz.sfxCorrect();
      Quiz.showToast('✨ Chính xác! + ' + game.pointPerQ.toLocaleString('vi-VN') + ' điểm', 'good');
      setTimeout(Quiz.nextStep, 1000);
    } else {
      btn.classList.add('wrong');
      all.forEach((b, j) => { if (j !== i) b.classList.add('dim'); });
      Quiz.sfxWrong();
      Quiz.showToast('❌ Chưa đúng…', 'bad');
      setTimeout(Quiz.nextStep, 1500);
    }
  }

  const base = { render: renderMCQ, attach: attachMCQ };
  window.QuizTypes.mcq     = Object.assign({ label: '🧩 Trắc nghiệm' },   base);
  window.QuizTypes.synonym = Object.assign({ label: '🔁 Đồng nghĩa' },   base);
  window.QuizTypes.antonym = Object.assign({ label: '↔️ Trái nghĩa' },   base);
  window.QuizTypes.reading = Object.assign({ label: '📖 Reading' },       base);
})();
