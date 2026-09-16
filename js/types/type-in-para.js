/* Type: type-in-para — điền nhiều ô trong 1 đoạn văn */
(function () {
  'use strict';

  function renderTypeInPara(item) {
    return '<div class="para-fill-wrap">' +
      '<p class="para-fill-text" style="line-height:2;font-size:1.05rem">' + item._parsedHtml + '</p>' +
      '<div class="fill-actions">' +
        '<button class="btn btn-primary" id="paraCheck" type="button">✅ Nộp đoạn văn</button>' +
      '</div>' +
      '<div class="fill-hint">💡 Điền từ thích hợp vào từng ô có đánh số, rồi bấm <b>Nộp đoạn văn</b> (nhấn <b>Enter</b> để qua ô tiếp theo)</div>' +
    '</div>';
  }

  function attachTypeInPara(item) {
    const Quiz = window.Quiz, game = Quiz.game;
    const wrap = document.querySelector('#qStage .para-fill-wrap');
    const btn = document.getElementById('paraCheck');
    if (!wrap || !btn) return;
    const inputs = [...wrap.querySelectorAll('.para-blank-input')];
    let done = false;

    function doCheck() {
      if (done) return;
      done = true;
      inputs.forEach(inp => inp.disabled = true);
      btn.disabled = true;

      let correctCount = 0;
      const chosenParts = [], rightParts = [];

      inputs.forEach((inp, i) => {
        const blank = item._blanks[i] || { answers: [''] };
        const val = (inp.value || '').trim();
        const valLC = val.toLowerCase();
        const ok = val !== '' && blank.answers.some(a => valLC === String(a).toLowerCase());
        if (ok) correctCount++;
        inp.classList.add(ok ? 'correct' : 'wrong');
        chosenParts.push(val || '(bỏ trống)');
        rightParts.push(blank.answers[0]);

        if (!ok) {
          const badge = inp.closest('.para-blank-wrap');
          if (badge) {
            const show = document.createElement('span');
            show.className = 'para-blank-correct';
            show.style.cssText = 'color:#2ea36c;font-size:.85em;font-weight:700;margin-left:2px';
            show.textContent = '✅ ' + blank.answers[0];
            badge.appendChild(show);
          }
        }
      });

      game.correct += correctCount;
      Quiz.updateLiveScore();
      game.answers[game.idx] = {
        chosen: chosenParts.join(' | '),
        right: rightParts.join(' | '),
        ok: correctCount === inputs.length
      };

      if (correctCount === inputs.length) {
        Quiz.sfxCorrect();
        Quiz.showToast('✨ Điền đúng hết ' + inputs.length + ' chỗ trống!', 'good');
      } else if (correctCount > 0) {
        Quiz.sfxTick();
        Quiz.showToast('📝 Đúng ' + correctCount + '/' + inputs.length + ' chỗ trống', '');
      } else {
        Quiz.sfxWrong();
        Quiz.showToast('❌ Chưa đúng chỗ nào…', 'bad');
      }
      setTimeout(Quiz.nextStep, 2200);
    }

    btn.addEventListener('click', doCheck);
    inputs.forEach((inp, i) => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const next = inputs[i + 1];
          if (next) next.focus(); else doCheck();
        }
      });
    });
    setTimeout(() => { try { inputs[0] && inputs[0].focus(); } catch (e) {} }, 80);
  }

  window.QuizTypes['type-in-para'] = {
    label: '📝 Điền đoạn văn',
    render: renderTypeInPara,
    attach: attachTypeInPara,
    showsQText: false,
  };
})();
