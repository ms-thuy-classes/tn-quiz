/* ============================================================
   Learn with Ms. Thúy — Quiz Engine (split v5 + defensive)
   Fix: tất cả getElementById được guard null, không crash khi
        element không tồn tại trong DOM.
   ============================================================ */
async function initPostPage() {
  const esc = window.esc;
  const $  = id  => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);
     // ============================================================
  // 🏠 TỰ ĐỘNG CHÈN NÚT HOME VÀO TOPBAR (không cần sửa HTML)
  // ============================================================
  (function injectHomeButton() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    if (topbar.querySelector('.btn-home')) return; // đã có thì bỏ qua

    // Tạo container bọc nút Home + nút Sound
    let actions = topbar.querySelector('.topbar-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'topbar-actions';
      // Chuyển soundBtn (nếu có) vào actions
      const sBtn = topbar.querySelector('#soundBtn');
      if (sBtn) {
        topbar.removeChild(sBtn);
        actions.appendChild(sBtn);
      }
      topbar.appendChild(actions);
    }

    // Tạo nút Home
    const home = document.createElement('a');
    home.href = 'index.html';
    home.className = 'btn-home';
    home.title = 'Về trang chủ';
    home.innerHTML = '🏠 <span>Trang chủ</span>';

    // Chèn Home lên trước soundBtn
    actions.insertBefore(home, actions.firstChild);
  })();

  const params = new URLSearchParams(location.search);
  const postId = params.get('id');
  if (!postId) { location.href = 'index.html'; return; }

  // ============================================================
  // SOUND BUTTON (guard null)
  // ============================================================
  const soundBtn = $('soundBtn');
  function updateSoundBtn() {
    if (!soundBtn) return;
    soundBtn.textContent = window.getSoundOn() ? '🔊' : '🔇';
    soundBtn.setAttribute('aria-pressed', String(window.getSoundOn()));
  }
  updateSoundBtn();
  if (soundBtn) {
    soundBtn.onclick = () => {
      window.setSoundOn(!window.getSoundOn());
      updateSoundBtn();
      if (window.getSoundOn()) window.sfxTick();
    };
  }

  // ============================================================
  // FETCH DATA
  // ============================================================
  let post = null;
  const introTitleEl = $('introTitle');
  const introDescEl  = $('introDesc');
  if (introTitleEl) introTitleEl.innerHTML = '<div class="spinner" style="margin:0"></div>';
  if (introDescEl)  introDescEl.textContent = 'Đang tải bài học...';

  try {
    const res = await fetch('data/' + encodeURIComponent(postId) + '.json');
    if (!res.ok) throw new Error('Không tìm thấy bài');
    post = await res.json();
  } catch (e) {
    document.body.innerHTML =
      '<div style="max-width:500px;margin:100px auto;padding:30px;background:#fff;border-radius:22px;text-align:center;box-shadow:0 10px 30px rgba(60,50,120,.12)">' +
      '<h2 style="font-family:Fraunces,serif;font-size:2rem;margin-bottom:14px">😢 Không tìm thấy bài</h2>' +
      '<p style="color:#5d5e7e;margin-bottom:20px">' + esc(e.message) + '</p>' +
      '<a href="index.html" class="btn btn-primary">← Quay về trang chủ</a></div>';
    return;
  }

  // ============================================================
  // RENDER INTRO
  // ============================================================
  document.title = post.title + ' · Learn with Ms. Thúy';
  if (introTitleEl) introTitleEl.innerHTML = esc(post.title).replace(/ · /g, '<br>');
  if (introDescEl)  introDescEl.innerHTML = '<b>' + esc(post.description) + '</b>';

  const introEyebrow = $('introEyebrow');
  if (introEyebrow) introEyebrow.textContent = '📘 ' + (post.tags || []).join(' · ');

  const chips = $('introChips');
  if (chips) {
    chips.innerHTML = '';
    [...new Set(post.parts.map(p => p.type))].forEach(t => {
      const li = document.createElement('li');
      const def = window.QuizTypes[t];
      li.textContent = (def && def.label) || t;
      chips.appendChild(li);
    });
  }

  // ============================================================
  // GAME STATE
  // ============================================================
  let game = {
    post,
    items: post.parts.flatMap(part => {
      if (part.type === 'listening') {
        const subsCount = (part.questions || []).length;
        return [{
          _partType: 'listening',
          _partName: part.name,
          _partHint: part.hint,
          _audio: part.audio,
          _image: part.image,
          _subs: part.questions || [],
          _points: subsCount,
        }];
      }
      if (part.type === 'matching') {
        const pairsCount = (part.pairs || []).length;
        return [{
          _partType: part.type, _partName: part.name, _partHint: part.hint,
          _pairs: part.pairs, _matches: 0, _completed: false,
          _points: pairsCount,
        }];
      }
      if (part.type === 'type-in-para') {
        return (part.questions || []).map(q => {
          const srcText = q.text != null ? q.text : (q.passage != null ? q.passage : q.q);
          const parsed = window.parseParaBlanks(srcText);
          return {
            ...q,
            _partType: 'type-in-para',
            _partName: part.name,
            _partHint: part.hint,
            _parsedHtml: parsed.html,
            _blanks: parsed.blanks,
            _points: parsed.blanks.length || 1,
          };
        });
      }
      const shuffledQuestions = window.shuffle(part.questions || []);
      return shuffledQuestions.map(q => ({
        ...q,
        _partType: part.type, _partName: part.name, _partHint: part.hint,
        _passage: part.passage, _pairs: part.pairs,
        _points: 1,
      }));
    }),
    idx: 0,
    correct: 0,
    answers: [],
    name: '',
    start: Date.now(),
    timeLimit: post.timeLimit || 0,
    timeLeft: post.timeLimit || 0,
    timerInterval: null
  };

  game.total = game.items.reduce((s, it) => s + (it._points || 1), 0);
  game.pointPerQ = +(10 / game.total).toFixed(4);

  (function assignCumulativePoints() {
    let cum = 0;
    game.items.forEach(it => { it._cumBefore = cum; cum += (it._points || 1); });
  })();

  const qTotalInit = $('qTotal');
  if (qTotalInit) qTotalInit.textContent = game.total;

  const pointHint = document.createElement('p');
  pointHint.style.cssText = 'font-size:.85rem;color:var(--ink-faint);margin-top:6px;font-family:var(--font-mono)';
  pointHint.textContent = '💯 Thang điểm 10 · ' + game.total + ' câu · mỗi câu = ' +
                          game.pointPerQ.toLocaleString('vi-VN') + ' điểm';
  if (introDescEl) introDescEl.insertAdjacentElement('afterend', pointHint);

  const nameInput = $('playerName');
  if (nameInput) nameInput.value = localStorage.getItem('lwm-name') || '';

  // ============================================================
  // 🔌 BRIDGE — cho types/*.js
  // ============================================================
  window.Quiz = {
    game: game,
    nextStep:        (...a) => nextStep(...a),
    updateLiveScore: (...a) => updateLiveScore(...a),
    finish:          (...a) => finish(...a),
    esc:        window.esc,
    shuffle:    window.shuffle,
    showToast:  window.showToast,
    sfxCorrect: window.sfxCorrect,
    sfxWrong:   window.sfxWrong,
    sfxTick:    window.sfxTick,
  };

  // ============================================================
  // SCREEN SWITCH
  // ============================================================
  function showScreen(name) {
  $$('.screen').forEach(s => { s.classList.remove('active'); s.hidden = true; });
  const el = $('screen' + name.charAt(0).toUpperCase() + name.slice(1));
  if (!el) return;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('active'));

  // 🎯 Ẩn topbar khi vào làm bài / xem kết quả, chỉ hiện ở intro
  const topbar = document.querySelector('.topbar');
  if (topbar) {
    topbar.style.display = (name === 'intro') ? '' : 'none';
  }

  window.scrollTo({ top: 0, behavior: 'auto' });
}

  // ============================================================
  // EVENTS
  // ============================================================
  const startForm = $('startForm');
  if (startForm) {
    startForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) { if (nameInput) nameInput.focus(); return; }
      localStorage.setItem('lwm-name', name);
      game.name = name;
      window.sfxTick();
      showScreen('quiz');
      renderQuestion();
      updateProgressUI();
      startTimer();
    });
  }

  const exitBtn = $('exitBtn');
  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      window.openModal('Thoát bài quiz?', 'Kết quả hiện tại sẽ không được lưu.', 'Thoát', () => {
        location.href = 'index.html';
      });
    });
  }

  const modalOkBtn = $('modalOk');
  if (modalOkBtn) {
    modalOkBtn.addEventListener('click', () => {
      const cb = window.getModalAction();
      window.closeModal();
      if (cb) cb();
    });
  }

  const modalEl = $('modal');
  if (modalEl) {
    modalEl.addEventListener('click', e => {
      if (e.target.dataset.close !== undefined) window.closeModal();
    });
  }

  document.addEventListener('keydown', e => {
    const m = $('modal');
    if (e.key === 'Escape' && m && !m.hidden) window.closeModal();
  });

  // ============================================================
  // LIVE SCORE
  // ============================================================
  function updateLiveScore() {
    const pill = $('liveScore');
    if (!pill) return;
    const liveScore = +(game.correct * game.pointPerQ).toFixed(1);
    pill.textContent = '✓ ' + game.correct + '/' + game.total + ' (' + liveScore + 'đ)';
    pill.classList.remove('bump');
    void pill.offsetWidth;
    pill.classList.add('bump');
  }

  // ============================================================
  // TIMER
  // ============================================================
  function updateTimerUI() {
    const el   = $('timerDisplay');
    const pill = $('timerPill');
    if (!el) return;
    if (game.timeLimit <= 0) { el.textContent = '∞'; return; }
    const m = Math.floor(game.timeLeft / 60);
    const s = game.timeLeft % 60;
    el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    if (pill) {
      if (game.timeLeft <= 60) pill.classList.add('danger');
      else pill.classList.remove('danger');
    }
  }

  function startTimer() {
    if (game.timeLimit <= 0) { updateTimerUI(); return; }
    game.timeLeft = game.timeLimit;
    updateTimerUI();
    game.timerInterval = setInterval(() => {
      game.timeLeft--;
      updateTimerUI();
      if (game.timeLeft <= 0) {
        clearInterval(game.timerInterval);
        window.showToast('⏰ Hết giờ làm bài! Tự động nộp bài...', 'bad');
        window.sfxWrong();
        finish(true);
      }
    }, 1000);
  }

  // ============================================================
  // PROGRESS
  // ============================================================
  function updateProgressUI() {
    const item = game.items[game.idx];
    const cumBefore = item ? (item._cumBefore || 0) : 0;
    const progressPct = (cumBefore / (game.total || 1)) * 100;

    const pBar = $('progressFill');
    if (pBar) pBar.style.width = progressPct + '%';

    const qNow   = $('qNow');
    const qTotal = $('qTotal');
    if (qNow)   qNow.textContent = cumBefore + 1;
    if (qTotal) qTotal.textContent = game.total;

    updateLiveScore();
  }

  // ============================================================
  // RENDER QUESTION (registry)
  // ============================================================
  function renderQuestionText(item) {
    let q = esc(item.q || '').split('____').join('<span class="blank">&nbsp;</span>');
    if ((item._partType === 'synonym' || item._partType === 'antonym') && item.keyword) {
      const regex = new RegExp('\\b' + item.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      q = q.replace(regex, '<mark>' + item.keyword + '</mark>');
    }
    return q;
  }

  function renderQuestion() {
    const item  = game.items[game.idx];
    const stage = $('qStage');
    if (!stage) return;

    const typeDef = window.QuizTypes[item._partType];
    if (!typeDef) {
      stage.innerHTML = '<div class="q-card"><p>❌ Chưa hỗ trợ dạng: <b>' +
                        esc(item._partType) + '</b></p></div>';
      return;
    }

    let html = '';

    // Audio bar riêng cho listening
    if (item._partType === 'listening') {
      html += '<div class="audio-bar">' +
        '<div class="audio-info"><span class="audio-emoji">🎧</span>' +
          '<div><b>' + esc(item._partName) + '</b>' +
          '<span class="audio-hint">' +
            esc(item._partHint || 'Nghe audio và trả lời các câu hỏi bên dưới nhé!') +
          '</span></div>' +
        '</div>' +
        '<audio id="listenAudio" controls preload="metadata" src="' +
          esc(item._audio || '') + '"></audio>' +
      '</div>';
      if (item._image) {
        html += '<div class="listening-img-wrap"><img class="listening-img" src="' +
                esc(item._image) + '" alt="Hình minh họa bài nghe" loading="lazy"></div>';
      }
    }

    html += '<div class="q-card">' +
      '<span class="q-num">' + String(game.idx + 1).padStart(2, '0') + '</span>' +
      '<div class="q-meta">' +
        '<span class="part-chip" style="background:var(--primary-soft);color:var(--primary-deep)">' +
          esc(item._partName) +
        '</span>' +
        '<span style="color:var(--ink-faint);font-size:.85rem;font-style:italic">' +
          esc(item._partHint || '') +
        '</span>' +
      '</div>';

    if (typeDef.showsQText !== false) {
      html += '<h2 class="q-text">' + renderQuestionText(item) + '</h2>';
    }

    html += typeDef.render(item);
    html += '</div>';

    stage.innerHTML = html;
    typeDef.attach(item);
    updateProgressUI();
  }

  // ============================================================
  // NEXT / FINISH
  // ============================================================
  function nextStep() {
    const au = $('listenAudio');
    if (au) au.pause();

    if (game.idx >= game.items.length - 1) { finish(); return; }

    const card = document.querySelector('#qStage .q-card');
    if (card) card.style.animation = 'screenIn .25s reverse forwards';

    setTimeout(() => {
      game.idx++;
      renderQuestion();
      updateProgressUI();
    }, 220);
  }

  function finish(isForced) {
    isForced = !!isForced;
    if (game.timerInterval) {
      clearInterval(game.timerInterval);
      game.timerInterval = null;
    }

    const { items, answers, correct, name, start } = game;
    const total      = game.total || items.length;
    const pointPerQ  = game.pointPerQ || (10 / total);
    const finalScore = +(correct * pointPerQ).toFixed(1);
    const pct        = Math.round(correct / total * 100);
    const wrongs     = items.filter((q, i) => !answers[i] || !answers[i].ok);
    const mins       = Math.floor((Date.now() - start) / 60000);
    const secs       = Math.floor(((Date.now() - start) / 1000) % 60);

    let title, msg;
    if (isForced) {
      title = '⏰ Hết giờ, <span>' + esc(name) + '</span>!';
      msg   = 'Bài làm đã được tự động nộp. Em xem lại kết quả và rút kinh nghiệm nhé.';
    } else if (finalScore >= 9.5) {
      title = '🏆 Điểm tuyệt đối, <span>' + esc(name) + '</span>!';
      msg   = 'Cô Thúy cực kỳ tự hào về em!';
    } else if (finalScore >= 8) {
      title = '🎉 Xuất sắc, <span>' + esc(name) + '</span>!';
      msg   = 'Em đã chinh phục bài quiz với số điểm rất cao!';
    } else if (finalScore >= 6.5) {
      title = '👏 Giỏi lắm, <span>' + esc(name) + '</span>!';
      msg   = 'Chỉ cần ôn thêm vài câu nữa là đạt mức xuất sắc!';
    } else if (finalScore >= 5) {
      title = '💪 Khá tốt, <span>' + esc(name) + '</span>!';
      msg   = 'Xem lại các câu sai bên dưới để cải thiện nhé.';
    } else {
      title = '🌱 Cố lên, <span>' + esc(name) + '</span>!';
      msg   = 'Đọc kỹ giải thích rồi làm lại một lần nữa nhé!';
    }

    const wrap = $('resultWrap');
    if (!wrap) return;

    wrap.innerHTML =
      '<div class="result-head">' +
        '<span class="eyebrow">📊 Kết quả bài làm</span>' +
        '<h1>' + title + '</h1>' +
        '<p class="result-msg">' + esc(msg) + '</p>' +
      '</div>' +
      '<div class="score-board">' +
        '<div class="ring-box">' +
          '<svg viewBox="0 0 160 160"><defs>' +
            '<linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">' +
              '<stop offset="0%" stop-color="#7a67ee"/>' +
              '<stop offset="55%" stop-color="#5a9df5"/>' +
              '<stop offset="100%" stop-color="#3ecfa0"/>' +
            '</linearGradient></defs>' +
            '<circle class="ring-bg" cx="80" cy="80" r="70"/>' +
            '<circle class="ring-fg" id="ringFg" cx="80" cy="80" r="70"/>' +
          '</svg>' +
          '<div class="ring-center">' +
            '<div class="ring-pct" id="pctText">0%</div>' +
            '<div class="ring-label">chính xác</div>' +
          '</div>' +
        '</div>' +
        '<div class="score-details">' +
          '<div class="score-big">' +
            '<b style="font-size:3rem;background:var(--grad-main);-webkit-background-clip:text;background-clip:text;color:transparent">' +
              finalScore.toFixed(1) +
            '</b><span style="font-size:1.4rem">/ 10 điểm</span>' +
          '</div>' +
          '<div class="mini-stats">' +
            '<div class="mini-stat"><b>' + correct + '/' + total + '</b><span>câu đúng</span></div>' +
            '<div class="mini-stat"><b>' + pointPerQ.toLocaleString('vi-VN') + '</b><span>điểm / câu</span></div>' +
            '<div class="mini-stat"><b>' + mins + ':' + String(secs).padStart(2, '0') + '</b><span>thời gian</span></div>' +
            '<div class="mini-stat"><b>' + wrongs.length + '</b><span>câu cần ôn</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="result-actions">' +
        '<a href="post.html?id=' + encodeURIComponent(post.id) + '" class="btn btn-primary">🔁 Làm lại</a>' +
        '<a href="index.html" class="btn btn-ghost">🏠 Về trang chủ</a>' +
        '<button class="btn btn-ghost" id="reviewBtn">📖 Xem câu sai</button>' +
      '</div>' +
      '<div class="review">' +
        '<h2>📝 Câu chưa đúng (' + wrongs.length + ')</h2>' +
        '<p class="review-sub">Đọc kỹ nghĩa tiếng Việt và giải thích nhé.</p>' +
        '<div id="reviewList"></div>' +
      '</div>';

    showScreen('result');

    // ===== Animated ring =====
    const C = 439.82;
    const ring = $('ringFg');
    if (ring) {
      ring.style.strokeDashoffset = C;
      setTimeout(() => { ring.style.strokeDashoffset = C * (1 - pct / 100); }, 200);
    }

    const pctEl = $('pctText');
    const t0 = performance.now();
    (function count(now) {
      const k = Math.min(1, (now - t0) / 1200);
      const e = 1 - Math.pow(1 - k, 3);
      if (pctEl) pctEl.textContent = Math.round(pct * e) + '%';
      if (k < 1) requestAnimationFrame(count);
    })(t0);

    // ===== REVIEW LIST =====
    const list = $('reviewList');
    if (list) {
      if (!wrongs.length) {
        list.innerHTML = '<div class="review-perfect">🎉 Tuyệt đối! Em làm đúng hết ' +
                         game.total + ' câu · đạt ' + finalScore.toFixed(1) + '/10 điểm! 🎉</div>';
      } else {
        wrongs.forEach(q => {
          const ans = answers[items.indexOf(q)] || { chosen: '—' };

          // ---------- Listening ----------
          if (q._partType === 'listening') {
            (ans.details || []).filter(d => !d.ok).forEach(d => {
              if (d._isPara) {
                const art = document.createElement('article');
                art.className = 'review-item';
                const mockItem = { text: d._originalText, _blanks: d._blanks };
                const mockAns  = { chosen: d.chosen };
                art.innerHTML =
                  '<div class="review-head">' +
                    '<span class="badge-wrong">Chưa đúng</span>' +
                    '<span style="font-family:Space Mono,monospace;font-size:.75rem;color:var(--ink-faint)">' +
                      esc(q._partName || '') + ' - ' + esc(d.q) +
                    '</span>' +
                  '</div>' +
                  '<p class="review-q para-review-text" style="line-height:1.9;margin-top:8px;">' +
                    window.paraReviewHtml(mockItem, mockAns) +
                  '</p>' +
                  (d.vi ? '<p class="review-vi">🇻🇳 ' + esc(d.vi) + '</p>' : '') +
                  (d.ex ? '<p class="review-ex">💡 ' + esc(d.ex) + '</p>' : '');
                list.appendChild(art);
              } else {
                list.appendChild(
                  window.reviewCard(q._partName, d.q, d.chosen, d.right, d.vi, d.ex)
                );
              }
            });
            return;
          }

          // ---------- type-in-para ----------
          if (q._partType === 'type-in-para') {
            const art = document.createElement('article');
            art.className = 'review-item';
            art.innerHTML =
              '<div class="review-head">' +
                '<span class="badge-wrong">Chưa đúng</span>' +
                '<span style="font-family:Space Mono,monospace;font-size:.75rem;color:var(--ink-faint)">' +
                  esc(q._partName || '') +
                '</span>' +
              '</div>' +
              '<p class="review-q para-review-text" style="line-height:1.9">' +
                window.paraReviewHtml(q, ans) +
              '</p>' +
              (q.vi ? '<p class="review-vi">🇻🇳 ' + esc(q.vi) + '</p>' : '') +
              (q.ex ? '<p class="review-ex">💡 ' + esc(q.ex) + '</p>' : '');
            list.appendChild(art);
            return;
          }

          // ---------- Các dạng còn lại (mcq, mcq-img, fill, type-in, matching) ----------
          const answersArr = Array.isArray(q.a) ? q.a : [q.a];
          const rightAns =
            (q._partType === 'fill' || q._partType === 'type-in') ? answersArr[0] :
            (q._partType === 'matching') ? 'matched all' :
            (q.o ? q.o[q.a] : '—');

          list.appendChild(
            window.reviewCard(q._partName, q.q, ans.chosen, rightAns, q.vi, q.ex, q)
          );
        });
      }
    }

    const reviewBtn = $('reviewBtn');
    if (reviewBtn) {
      reviewBtn.onclick = () => {
        const rv = document.querySelector('.review');
        if (rv) rv.scrollIntoView({ behavior: 'smooth' });
      };
    }

    if (finalScore >= 8 && !isForced) {
      setTimeout(window.launchConfetti, 350);
      setTimeout(window.sfxFanfare, 300);
    }
  }
}
