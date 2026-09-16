/* Type: matching — ghép 2 cột */
(function () {
  'use strict';
  const esc = window.esc, shuffle = window.shuffle;

  function renderMatching(item) {
    const left  = shuffle(item._pairs.map((p, i) => ({ text: p.left,  idx: i })));
    const right = shuffle(item._pairs.map((p, i) => ({ text: p.right, idx: i })));
    item._left = left; item._right = right;
    item._matches = 0;
    item._completed = false;

    return '<div class="matching-wrap">' +
      '<p style="color:var(--ink-soft);font-size:.95rem;margin-bottom:12px">🎯 Ghép từng từ bên trái với nghĩa tiếng Việt bên phải.</p>' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:.9rem;color:var(--ink-soft)">' +
        '<span>Đã ghép: <b id="matchCount">0</b>/' + item._pairs.length + '</span>' +
        '<span>' + (item._completed ? '✅ Hoàn thành' : '⏳ Đang ghép...') + '</span>' +
      '</div>' +
      '<div class="matching-grid">' +
        '<div class="matching-col"><div class="matching-col-head">🔤 English</div>' +
          left.map(x => '<div class="match-item" data-side="L" data-i="' + x.idx + '">' + esc(x.text) + '</div>').join('') +
        '</div>' +
        '<div class="matching-col"><div class="matching-col-head">🇻🇳 Tiếng Việt</div>' +
          right.map(x => '<div class="match-item" data-side="R" data-i="' + x.idx + '">' + esc(x.text) + '</div>').join('') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function attachMatching(item) {
    const Quiz = window.Quiz, game = Quiz.game;
    let selL = null, selR = null;
    if (item._completed) return;

    document.querySelectorAll('#qStage .match-item').forEach(el => {
      el.addEventListener('click', () => {
        if (item._completed) return;
        if (el.classList.contains('matched')) return;

        if (el.dataset.side === 'L') {
          if (selL) selL.classList.remove('selected');
          selL = el; el.classList.add('selected');
        } else {
          if (selR) selR.classList.remove('selected');
          selR = el; el.classList.add('selected');
        }
        Quiz.sfxTick();

        if (selL && selR) {
          const li = +selL.dataset.i, ri = +selR.dataset.i;
          if (li === ri) {
            selL.classList.remove('selected'); selR.classList.remove('selected');
            selL.classList.add('matched');     selR.classList.add('matched');
            Quiz.sfxCorrect();
            item._matches++;
            game.correct++;
            Quiz.updateLiveScore();
            const countEl = document.getElementById('matchCount');
            if (countEl) countEl.textContent = item._matches;

            if (item._matches === item._pairs.length) {
              item._completed = true;
              game.answers[game.idx] = { chosen: 'matched all', ok: true };
              Quiz.showToast('🎉 Ghép hết rồi!', 'good');
              const statusEl = document.querySelector('#qStage .matching-wrap span:last-child');
              if (statusEl) statusEl.textContent = '✅ Hoàn thành';
              document.querySelectorAll('#qStage .match-item:not(.matched)').forEach(x => {
                x.style.opacity = '0.5'; x.style.cursor = 'default';
              });
              setTimeout(Quiz.nextStep, 1000);
            }
          } else {
            selL.classList.add('wrong-pair'); selR.classList.add('wrong-pair');
            Quiz.sfxWrong();
            const a = selL, b = selR;
            setTimeout(() => {
              a.classList.remove('wrong-pair', 'selected');
              b.classList.remove('wrong-pair', 'selected');
            }, 500);
          }
          selL = null; selR = null;
        }
      });
    });
  }

  window.QuizTypes.matching = {
    label: '🔗 Matching',
    render: renderMatching,
    attach: attachMatching,
    showsQText: false,
  };
})();
