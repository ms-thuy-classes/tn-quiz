/* Type: type-in — gõ đáp án (không word bank) */
(function () {
  'use strict';
  const esc = window.esc;

  function renderTypeIn(item) {
    let html = '';
    if (item._passage) {
      html += '<div class="reading-passage">' +
        esc(item._passage).split('\n\n').map(p => '<p style="margin-bottom:14px">' + esc(p) + '</p>').join('') +
      '</div>';
    }
    html += '<div class="typein-wrap">' +
      '<input class="fill-input typein-input" id="typeinInput" type="text" autocomplete="off" ' +
        'placeholder="✍️ Gõ đáp án của em vào đây...">' +
      '<div class="fill-actions">' +
        '<button class="btn btn-primary" id="typeinCheck" type="button">✓ Kiểm tra</button>' +
      '</div>' +
      '<div class="fill-hint">💡 Gõ từ / cụm từ em cho là đúng, rồi bấm <b>Kiểm tra</b> hoặc nhấn <b>Enter</b></div>' +
    '</div>';
    return html;
  }

  function attachTypeIn(item) {
    const Quiz = window.Quiz, game = Quiz.game;
    const input = document.getElementById('typeinInput');
    const check = document.getElementById('typeinCheck');
    if (!input || !check) return;
    let done = false;

    function doCheck() {
      if (done) return;
      const val = input.value.trim();
      if (!val) { Quiz.showToast('💡 Em hãy gõ đáp án trước nhé!', ''); input.focus(); return; }
      done = true;
      input.disabled = true;
      check.disabled = true;

      const valLC = val.toLowerCase();
      const answers = Array.isArray(item.a) ? item.a : [item.a];
      const ok = answers.some(ans => typeof ans === 'string' && valLC === ans.trim().toLowerCase());

      game.answers[game.idx] = { chosen: val, ok };

      if (ok) {
        input.classList.add('correct');
        game.correct++;
        Quiz.updateLiveScore();
        Quiz.sfxCorrect();
        Quiz.showToast('✨ Chính xác! + ' + game.pointPerQ.toLocaleString('vi-VN') + ' điểm', 'good');
        setTimeout(Quiz.nextStep, 1200);
      } else {
        input.classList.add('wrong');
        Quiz.sfxWrong();
        const show = document.createElement('div');
        show.className = 'fill-show';
        show.innerHTML = '✅ Đáp án đúng: <b>' + esc(answers[0]) + '</b>';
        document.querySelector('.typein-wrap').appendChild(show);
        Quiz.showToast('❌ Chưa đúng rồi…', 'bad');
        setTimeout(Quiz.nextStep, 2200);
      }
    }

    input.addEventListener('keydown', e => { if (e.key === 'Enter') doCheck(); });
    check.addEventListener('click', doCheck);
    setTimeout(() => { try { input.focus(); } catch (e) {} }, 80);
  }

  window.QuizTypes['type-in'] = {
    label: '⌨️ Gõ đáp án',
    render: renderTypeIn,
    attach: attachTypeIn,
  };
})();
