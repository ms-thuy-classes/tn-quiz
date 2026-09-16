/* Type: listening — nhiều câu con trên 1 trang */
(function () {
  'use strict';
  const esc = window.esc, shuffle = window.shuffle;

  function subTypeLabel(t) {
    return {
      single: 'Chọn 1 đáp án',
      multi: 'Chọn nhiều đáp án',
      fill: 'Điền từ (có sẵn)',
      'type-in': 'Gõ đáp án',
      'type-in-para': 'Điền đoạn văn',
      match: 'Ghép (dropdown)'
    }[t] || t;
  }

  function renderListening(item) {
    const LETTERS = ['A','B','C','D','E','F','G','H'];

    // Chuẩn bị dữ liệu cho từng sub
    (item._subs || []).forEach(sub => {
      if (sub.qtype === 'single') {
        sub._shuffled = shuffle((sub.o || []).map((t, i) => ({ text: t, correct: i === sub.a })));
      } else if (sub.qtype === 'multi') {
        sub._shuffled = shuffle((sub.o || []).map((t, i) => ({ text: t, correct: (sub.a || []).includes(i) })));
      } else if (sub.qtype === 'fill') {
        if (sub.words && sub.words.length) sub._shuffledWords = shuffle(sub.words);
      } else if (sub.qtype === 'type-in-para') {
        const srcText = sub.text != null ? sub.text : (sub.passage != null ? sub.passage : sub.q);
        const parsed = window.parseParaBlanks(srcText);
        sub._blanks = parsed.blanks;
        sub._parsedHtml = parsed.html;
      }
    });

    let html = '<div class="sub-list">';
    (item._subs || []).forEach((sub, si) => {
      html += '<div class="sub-q" data-sub="' + si + '">';
      html += '<div class="sub-head"><span class="sub-no">' + (si + 1) + '</span><span class="sub-type">' + subTypeLabel(sub.qtype) + '</span></div>';
      html += '<p class="sub-text">' + esc(sub.q || '').split('____').join('<span class="blank">&nbsp;</span>') + '</p>';

      if (sub.qtype === 'single') {
        html += '<div class="options">' + sub._shuffled.map((opt, i) =>
          '<button class="opt sub-opt" data-sub="' + si + '" data-i="' + i + '" type="button">' +
            '<span class="opt-letter">' + LETTERS[i] + '</span>' +
            '<span class="opt-text">' + esc(opt.text) + '</span>' +
          '</button>').join('') + '</div>';
      }
      else if (sub.qtype === 'multi') {
        html += '<div class="options">' + sub._shuffled.map((opt, i) =>
          '<button class="opt sub-multi" data-sub="' + si + '" data-i="' + i + '" type="button">' +
            '<span class="opt-letter">' + LETTERS[i] + '</span>' +
            '<span class="opt-text">' + esc(opt.text) + '</span>' +
            '<span class="multi-check" aria-hidden="true">✓</span>' +
          '</button>').join('') + '</div>';
      }
      else if (sub.qtype === 'fill') {
        if (sub._shuffledWords) {
          html += '<div class="word-bank"><div class="word-bank-label">💎 Chọn từ:</div><div class="word-bank-chips">' +
            sub._shuffledWords.map(w =>
              '<button class="word-chip sub-chip" data-sub="' + si + '" data-word="' + esc(w) + '" type="button">' + esc(w) + '</button>'
            ).join('') + '</div></div>';
        }
        html += '<input class="fill-input sub-fill-input" data-sub="' + si + '" type="text" autocomplete="off" ' +
          'placeholder="' + (sub._shuffledWords ? 'Từ đã chọn...' : 'Gõ từ em nghe được...') + '"' +
          (sub._shuffledWords ? ' readonly' : '') + '>';
      }
      else if (sub.qtype === 'type-in') {
        html += '<input class="fill-input sub-fill-input sub-typein-input" data-sub="' + si + '" type="text" autocomplete="off" ' +
          'placeholder="✍️ Gõ đáp án em nghe được...">';
      }
      else if (sub.qtype === 'type-in-para') {
        html += '<div class="para-fill-wrap para-fill-sub">' +
          '<p class="para-fill-text" style="line-height:2;font-size:1.02rem">' + sub._parsedHtml + '</p>' +
        '</div>';
      }
      else if (sub.qtype === 'match') {
        html += '<div class="match-opts"><b>📋 Phương án:</b><br>' +
          (sub.options || []).map((op, i) => '<b>' + LETTERS[i] + '.</b> ' + esc(op) + '<br>').join('') +
        '</div>';
        html += '<div class="match-rows">';
        (sub.rows || []).forEach((row, ri) => {
          html += '<div class="match-row"><span class="row-label">' + esc(row.left) + '</span>' +
            '<select data-row="' + ri + '"><option value="">— ? —</option>' +
            (sub.options || []).map((op, i) => '<option value="' + i + '">' + LETTERS[i] + '</option>').join('') +
            '</select></div>';
        });
        html += '</div>';
      }

      html += '</div>';
    });
    html += '</div>';
    html += '<button class="btn btn-primary listen-submit" id="listenSubmit" type="button">✅ Nộp bài nghe</button>';
    return html;
  }

  function attachListening(item) {
    const Quiz = window.Quiz, game = Quiz.game;
    const stage = document.getElementById('qStage');
    const subs = item._subs || [];
    const LETTERS = ['A','B','C','D','E','F','G','H'];

    stage.querySelectorAll('.sub-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const si = btn.dataset.sub;
        stage.querySelectorAll('.sub-opt[data-sub="' + si + '"]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        Quiz.sfxTick();
      });
    });

    stage.querySelectorAll('.sub-multi').forEach(btn => {
      btn.addEventListener('click', () => { btn.classList.toggle('picked'); Quiz.sfxTick(); });
    });

    stage.querySelectorAll('.sub-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const si = chip.dataset.sub;
        stage.querySelectorAll('.sub-chip[data-sub="' + si + '"]').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        const input = stage.querySelector('.sub-fill-input[data-sub="' + si + '"]');
        if (input) { input.value = chip.dataset.word; input.classList.remove('correct', 'wrong'); }
        Quiz.sfxTick();
      });
    });

    document.getElementById('listenSubmit').addEventListener('click', function () {
      const submit = this;
      if (submit.disabled) return;
      let correctCount = 0;
      const details = [];

      subs.forEach((sub, si) => {
        const wrap = stage.querySelector('.sub-q[data-sub="' + si + '"]');
        let ok = false, chosenText = '—', rightText = '—';
        let alreadyPushed = false;

        if (sub.qtype === 'single') {
          const sel = wrap.querySelector('.sub-opt.selected');
          const selI = sel ? +sel.dataset.i : -1;
          chosenText = selI >= 0 ? sub._shuffled[selI].text : '(không chọn)';
          rightText = sub.o[sub.a];
          ok = selI >= 0 && sub._shuffled[selI].correct;
          wrap.querySelectorAll('.sub-opt').forEach((b, bi) => {
            b.disabled = true;
            if (sub._shuffled[bi].correct) b.classList.add('correct');
            else if (bi === selI) b.classList.add('wrong');
            else b.classList.add('dim');
          });
        }
        else if (sub.qtype === 'multi') {
          const picked = [...wrap.querySelectorAll('.sub-multi.picked')].map(b => +b.dataset.i);
          const correctSet = sub._shuffled.map((o, i) => o.correct ? i : -1).filter(i => i >= 0);
          chosenText = picked.map(i => sub._shuffled[i].text).join(', ') || '(không chọn)';
          rightText = sub._shuffled.filter(o => o.correct).map(o => o.text).join(', ');
          ok = picked.length === correctSet.length && picked.every(i => correctSet.includes(i));
          wrap.querySelectorAll('.sub-multi').forEach((b, bi) => {
            b.disabled = true;
            if (sub._shuffled[bi].correct) b.classList.add('correct');
            else if (picked.includes(bi)) b.classList.add('wrong');
            else b.classList.add('dim');
          });
        }
        else if (sub.qtype === 'fill') {
          const input = wrap.querySelector('.sub-fill-input');
          const val = (input.value || '').trim().toLowerCase();
          chosenText = input.value.trim() || '(không điền)';
          rightText = sub.a[0];
          ok = sub.a.some(ans => val === ans.toLowerCase());
          input.disabled = true;
          input.classList.add(ok ? 'correct' : 'wrong');
          wrap.querySelectorAll('.sub-chip').forEach(c => c.disabled = true);
          if (!ok) {
            const show = document.createElement('div');
            show.className = 'fill-show';
            show.innerHTML = '✅ Đáp án: <b>' + esc(sub.a[0]) + '</b>';
            wrap.appendChild(show);
          }
        }
        else if (sub.qtype === 'type-in') {
          const input = wrap.querySelector('.sub-fill-input');
          const val = (input.value || '').trim();
          chosenText = val || '(không điền)';
          const answers = Array.isArray(sub.a) ? sub.a : [sub.a];
          rightText = answers[0] || '—';
          ok = val !== '' && answers.some(ans => typeof ans === 'string' && val.toLowerCase() === ans.trim().toLowerCase());
          input.disabled = true;
          input.classList.add(ok ? 'correct' : 'wrong');
          if (!ok) {
            const show = document.createElement('div');
            show.className = 'fill-show';
            show.innerHTML = '✅ Đáp án: <b>' + esc(rightText) + '</b>';
            wrap.appendChild(show);
          }
        }
        else if (sub.qtype === 'type-in-para') {
          const inputs = [...wrap.querySelectorAll('.para-blank-input')];
          let allOk = true;
          const chosenParts = [], rightParts = [];

          inputs.forEach((inp, bi) => {
            const blank = (sub._blanks && sub._blanks[bi]) || { answers: [''] };
            const val = (inp.value || '').trim();
            const isRight = val !== '' && blank.answers.some(a => val.toLowerCase() === String(a).toLowerCase());
            if (!isRight) allOk = false;

            inp.disabled = true;
            inp.classList.add(isRight ? 'correct' : 'wrong');
            chosenParts.push(val || '(bỏ trống)');
            rightParts.push(blank.answers[0]);

            if (!isRight) {
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

          ok = allOk;
          chosenText = chosenParts.join(' | ');
          rightText = rightParts.join(' | ');

          details.push({
            q: 'Đoạn văn điền từ (Câu ' + (si + 1) + ')',
            chosen: chosenText,
            right: rightText,
            ok: ok,
            vi: sub.vi,
            ex: sub.ex,
            _isPara: true,
            _originalText: sub.text || sub.passage || sub.q,
            _blanks: sub._blanks
          });
          alreadyPushed = true;
        }
        else if (sub.qtype === 'match') {
          const rows = sub.rows || [];
          const picks = []; let rowOk = true;
          rows.forEach((row, ri) => {
            const sel = wrap.querySelector('select[data-row="' + ri + '"]');
            const v = sel.value === '' ? -1 : +sel.value;
            sel.disabled = true;
            const good = v === row.a;
            if (!good) rowOk = false;
            sel.classList.add(good ? 'sel-correct' : 'sel-wrong');
            picks.push(v >= 0 ? LETTERS[v] : '—');
            if (!good) {
              const hint = document.createElement('span');
              hint.className = 'row-hint';
              hint.textContent = '✅ ' + LETTERS[row.a];
              sel.parentNode.appendChild(hint);
            }
          });
          ok = rowOk;
          chosenText = picks.join(', ');
          rightText = rows.map(r => LETTERS[r.a]).join(', ');
        }

        if (ok) correctCount++;
        if (!alreadyPushed) {
          details.push({ q: sub.q, chosen: chosenText, right: rightText, ok, vi: sub.vi, ex: sub.ex });
        }
      });

      game.correct += correctCount;
      Quiz.updateLiveScore();
      game.answers[game.idx] = {
        chosen: correctCount + '/' + subs.length,
        ok: correctCount === subs.length,
        details
      };

      submit.disabled = true;
      submit.textContent = '✅ Đã nộp · Đúng ' + correctCount + '/' + subs.length;

      if (correctCount === subs.length) { Quiz.sfxCorrect(); Quiz.showToast('🎧 Tuyệt vời! Đúng hết ' + subs.length + ' câu!', 'good'); }
      else if (correctCount > 0) { Quiz.sfxTick(); Quiz.showToast('🎧 Đúng ' + correctCount + '/' + subs.length + ' câu!', ''); }
      else { Quiz.sfxWrong(); Quiz.showToast('🎧 Chưa đúng câu nào… xem đáp án nhé!', 'bad'); }

      setTimeout(Quiz.nextStep, 2600);
    });
  }

  window.QuizTypes.listening = {
    label: '🎧 Listening',
    render: renderListening,
    attach: attachListening,
    showsQText: false,
  };
})();
