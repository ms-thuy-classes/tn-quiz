/* Type: fill — điền từ với word bank */
(function () {
  'use strict';
  const esc = window.esc, shuffle = window.shuffle;

  function renderFill(item) {
    const pool = (item && Array.isArray(item.words) && item.words.length)
      ? item.words
      : (item && Array.isArray(item.a) ? item.a : ['answer']);
    const shuffledWords = shuffle(pool);
    item._shuffledWords = shuffledWords;

    return '<div class="fill-wrap">' +
      '<div class="word-bank">' +
        '<div class="word-bank-label">💎 Chọn từ trong khung:</div>' +
        '<div class="word-bank-chips">' +
          shuffledWords.map((w, i) =>
            '<button class="word-chip" data-word="' + esc(w) + '" data-i="' + i + '" type="button">' + esc(w) + '</button>'
          ).join('') +
        '</div>' +
      '</div>' +
      '<input class="fill-input" id="fillInput" type="text" autocomplete="off" ' +
        'placeholder="Từ em chọn sẽ hiện ở đây..." readonly>' +
      '<div class="fill-actions">' +
        '<button class="btn btn-ghost" id="fillClear" type="button">🗑️ Xóa chọn</button>' +
        '<button class="btn btn-primary" id="fillCheck" type="button">✓ Kiểm tra</button>' +
      '</div>' +
      '<div class="fill-hint">💡 Bấm vào một từ ở khung trên, rồi bấm <b>Kiểm tra</b></div>' +
    '</div>';
  }

  function attachFill(item) {
    const Quiz = window.Quiz, game = Quiz.game;
    const input = document.getElementById('fillInput');
    const check = document.getElementById('fillCheck');
    const clear = document.getElementById('fillClear');
    const chips = [...document.querySelectorAll('#qStage .word-chip')];

    let selectedChip = null, done = false;

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        if (done) return;
        if (selectedChip) selectedChip.classList.remove('selected');
        chip.classList.add('selected');
        selectedChip = chip;
        input.value = chip.dataset.word;
        input.classList.remove('correct', 'wrong');
        Quiz.sfxTick();
      });
    });

    clear.addEventListener('click', () => {
      if (done) return;
      input.value = '';
      input.classList.remove('correct', 'wrong');
      if (selectedChip) { selectedChip.classList.remove('selected'); selectedChip = null; }
    });

    function doCheck() {
      if (done) return;
      const val = input.value.trim().toLowerCase();
      if (!val) { Quiz.showToast('💡 Em hãy chọn một từ trong khung trước nhé!', ''); return; }
      done = true;

      chips.forEach(c => {
        c.disabled = true;
        if (c !== selectedChip) c.classList.add('dim');
      });
      clear.disabled = true;
      check.disabled = true;

      const ok = item.a.some(ans => val === ans.toLowerCase());
      game.answers[game.idx] = { chosen: input.value.trim(), ok };

      if (ok) {
        input.classList.add('correct');
        if (selectedChip) selectedChip.classList.add('chip-correct');
        game.correct++;
        Quiz.updateLiveScore();
        Quiz.sfxCorrect();
        Quiz.showToast('✨ Chính xác! + ' + game.pointPerQ.toLocaleString('vi-VN') + ' điểm', 'good');
        setTimeout(Quiz.nextStep, 1200);
      } else {
        input.classList.add('wrong');
        if (selectedChip) selectedChip.classList.add('chip-wrong');
        Quiz.sfxWrong();
        const correctWord = item.a[0].toLowerCase();
        chips.forEach(c => {
          if (c.dataset.word.toLowerCase() === correctWord) {
            c.classList.add('chip-correct');
            c.classList.remove('dim');
          }
        });
        const show = document.createElement('div');
        show.className = 'fill-show';
        show.innerHTML = '✅ Đáp án đúng: <b>' + esc(item.a[0]) + '</b>';
        document.querySelector('.fill-wrap').appendChild(show);
        Quiz.showToast('❌ Chưa đúng rồi…', 'bad');
        setTimeout(Quiz.nextStep, 2200);
      }
    }

    input.addEventListener('keydown', e => { if (e.key === 'Enter') doCheck(); });
    check.addEventListener('click', doCheck);
  }

  window.QuizTypes.fill = {
    label: '✏️ Điền từ (có sẵn)',
    render: renderFill,
    attach: attachFill,
  };
})();
