/* ============================================================
   Learn with Ms. Thúy — Quiz Engine (Full v4 + Timer & Progress + Type-In + Type-In-Para)
   Hỗ trợ: mcq | fill | type-in | type-in-para | reading | matching | synonym | antonym | listening
   Tính điểm: Thang 10 · điểm mỗi câu = 10 / tổng_số_câu
   ============================================================ */

// ===== Helpers (global safe) =====
if (typeof window.esc !== 'function') {
  window.esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
if (typeof window.shuffle !== 'function') {
  window.shuffle = function(a){
    a = a.slice();
    for(let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
}
if (typeof window.REDUCED === 'undefined') {
  window.REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
}
const esc = window.esc;
const shuffle = window.shuffle;
const REDUCED = window.REDUCED;

/* ============================================================
   PARAGRAPH BLANK PARSER — dùng cho dạng "type-in-para"
   Cú pháp trong đoạn văn: ____đáp_án____ (có thể nhiều đáp án đúng,
   phân cách bằng dấu "|", ví dụ: ____color|colour____)
   Trả về: { html, blanks }
     html   -> đoạn văn đã escape, mỗi chỗ trống được thay bằng 1 ô input
               có số thứ tự (1), (2), (3)... tự động
     blanks -> mảng [{ answers: [...] }] theo đúng thứ tự xuất hiện
   ============================================================ */
if (typeof window.parseParaBlanks !== 'function') {
  window.parseParaBlanks = function(text){
    const raw = String(text == null ? '' : text);
    // Tách chuỗi theo cặp ____...____ (không tham lam) — kết quả xen kẽ:
    // [đoạn text, đáp_án, đoạn text, đáp_án, ..., đoạn text]
    const parts = raw.split(/____(.+?)____/g);
    const blanks = [];
    let html = '';

    parts.forEach((part, i) => {
      if (i % 2 === 0) {
        html += esc(part);
      } else {
        const answers = part.split('|').map(a => a.trim()).filter(Boolean);
        const bIdx = blanks.length;
        blanks.push({ answers: answers.length ? answers : [part.trim()] });
        html +=
          '<span class="para-blank-wrap" style="display:inline-flex;align-items:baseline;gap:3px;margin:0 2px;vertical-align:baseline">' +
            '<sup class="para-blank-num" style="color:var(--primary-deep,#5a4fcf);font-weight:700;font-size:.72em">(' + (bIdx + 1) + ')</sup>' +
            '<input class="para-blank-input" data-blank="' + bIdx + '" type="text" autocomplete="off" spellcheck="false" ' +
              'placeholder="(' + (bIdx + 1) + ')" ' +
              'style="min-width:88px;max-width:170px;padding:3px 9px;border:2px solid var(--primary-soft,#e4e0fb);' +
              'border-radius:8px;font:inherit;font-size:.95em;text-align:center;background:#fff;color:inherit">' +
          '</span>';
      }
    });

    return { html, blanks };
  };
}
const parseParaBlanks = window.parseParaBlanks;

/* ============================================================
   AUDIO — Web Audio API (SFX)
   ============================================================ */
let audioCtx = null;
let soundOn = localStorage.getItem('lwm-sound') !== '0';

function ctx(){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if(audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function tone(freq, delay, dur, type='triangle', vol=.18){
  if(!soundOn) return;
  try{
    const c = ctx(), t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .02);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + .05);
  }catch(e){}
}
const sfxTick    = () => tone(740, 0, .06, 'sine', .07);
const sfxCorrect = () => { tone(659.25,0,.14); tone(830.61,.09,.14); tone(987.77,.18,.22); };
const sfxWrong   = () => { tone(233.08,0,.2,'sawtooth',.1); tone(164.81,.17,.32,'sawtooth',.1); };
const sfxFanfare = () => [523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,i*.11,.25));

/* ============================================================
   TOAST
   ============================================================ */
let toastTimer;
function showToast(html, type=''){
  const el = document.getElementById('toast');
  if(!el) return;
  el.innerHTML = html;
  el.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1900);
}

/* ============================================================
   MODAL
   ============================================================ */
let modalAction = null;
function openModal(title, msg, okText, cb){
  const m = document.getElementById('modal');
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMsg').textContent = msg;
  document.getElementById('modalOk').textContent = okText;
  modalAction = cb;
  m.hidden = false;
}
function closeModal(){
  document.getElementById('modal').hidden = true;
  modalAction = null;
}

/* ============================================================
   CONFETTI
   ============================================================ */
function launchConfetti(){
  if(REDUCED) return;
  const cv = document.getElementById('confettiCanvas');
  if(!cv) return;
  const cctx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  const COLORS = ['#7a67ee','#3ecfa0','#ffb62e','#ff8fb1','#8ecdfd','#ffb28f'];
  const P = [];
  const make = (x,y,vx,vy) => P.push({
    x,y,vx,vy,s:6+Math.random()*6,
    c:COLORS[Math.floor(Math.random()*COLORS.length)],
    r:Math.random()*Math.PI, vr:(Math.random()-.5)*.28,
    round:Math.random()<.3
  });
  for(let i=0;i<90;i++)  make(-10, cv.height*(.15+Math.random()*.4), 4+Math.random()*7, -(3+Math.random()*5));
  for(let i=0;i<90;i++)  make(cv.width+10, cv.height*(.15+Math.random()*.4), -(4+Math.random()*7), -(3+Math.random()*5));
  const t0 = performance.now();
  (function loop(now){
    cctx.clearRect(0,0,cv.width,cv.height);
    for(let i=P.length-1;i>=0;i--){
      const p = P[i];
      p.vy += .14; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      if(p.y > cv.height + 30){ P.splice(i,1); continue; }
      cctx.save(); cctx.translate(p.x,p.y); cctx.rotate(p.r); cctx.fillStyle = p.c;
      if(p.round){ cctx.beginPath(); cctx.arc(0,0,p.s/2,0,7); cctx.fill(); }
      else cctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*.62);
      cctx.restore();
    }
    if(P.length && now - t0 < 7500) requestAnimationFrame(loop);
    else cctx.clearRect(0,0,cv.width,cv.height);
  })(t0);
}

/* ============================================================
   REVIEW CARD HELPER
   ============================================================ */
function reviewCard(partName, qText, chosen, right, vi, ex, q){
  const art = document.createElement('article');
  art.className = 'review-item';
  let qHtml = esc(qText || '').split('____').join('<span class="blank">&nbsp;</span>');
  if(q && (q._partType === 'synonym' || q._partType === 'antonym') && q.keyword){
    const regex = new RegExp('\\b' + q.keyword.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\b','i');
    qHtml = qHtml.replace(regex, '<mark>' + q.keyword + '</mark>');
  }
  art.innerHTML =
    '<div class="review-head"><span class="badge-wrong">Chưa đúng</span>' +
    '<span style="font-family:Space Mono,monospace;font-size:.75rem;color:var(--ink-faint)">' + esc(partName || '') + '</span></div>' +
    '<p class="review-q">' + qHtml + '</p>' +
    '<div class="review-ans wrong">❌ Em chọn: <b>&nbsp;' + esc(chosen) + '</b></div>' +
    '<div class="review-ans right">✅ Đáp án: <b>&nbsp;' + esc(right) + '</b></div>' +
    (vi ? '<p class="review-vi">🇻🇳 ' + esc(vi) + '</p>' : '') +
    (ex ? '<p class="review-ex">💡 ' + esc(ex) + '</p>' : '');
  return art;
}

/* ============================================================
   REVIEW HELPER — dạng "type-in-para" (điền vào đoạn văn)
   Hiển thị lại cả đoạn văn, chỗ nào em điền sai sẽ gạch ngang +
   đáp án đúng bên cạnh; chỗ nào đúng thì tô xanh.
   ============================================================ */
function paraReviewHtml(item, ans){
  const chosenArr = String((ans && ans.chosen) || '').split(' | ');
  const raw = String(
    item.text != null ? item.text :
    (item.passage != null ? item.passage : (item.q || ''))
  );
  const parts = raw.split(/____(.+?)____/g);
  let html = '';
  let bIdx = 0;
  parts.forEach((part, i) => {
    if(i % 2 === 0){
      html += esc(part);
    } else {
      const answers = part.split('|').map(a => a.trim()).filter(Boolean);
      const rightAns = answers[0] || part.trim();
      const userVal = (chosenArr[bIdx] || '').trim();
      const isRight = answers.some(a => userVal.toLowerCase() === a.toLowerCase());
      html += isRight
        ? ' <mark class="para-ans-right" style="background:#d7f5e6;color:#177a4d;padding:1px 6px;border-radius:6px">' + esc(rightAns) + '</mark> '
        : ' <span class="para-ans-wrong" style="text-decoration:line-through;color:#c0435a">' + esc(userVal || '(bỏ trống)') + '</span>' +
          '<mark class="para-ans-right" style="background:#d7f5e6;color:#177a4d;padding:1px 6px;border-radius:6px;margin-left:4px">' + esc(rightAns) + '</mark> ';
      bIdx++;
    }
  });
  return html;
}

/* ============================================================
   POST PAGE INIT
   ============================================================ */
async function initPostPage(){
  const params = new URLSearchParams(location.search);
  const postId = params.get('id');

  if(!postId){
    location.href = 'index.html';
    return;
  }

  // ===== Sound button =====
  const soundBtn = document.getElementById('soundBtn');
  function updateSoundBtn(){
    soundBtn.textContent = soundOn ? '🔊' : '🔇';
    soundBtn.setAttribute('aria-pressed', soundOn);
  }
  updateSoundBtn();
  soundBtn.onclick = () => {
    soundOn = !soundOn;
    localStorage.setItem('lwm-sound', soundOn ? '1' : '0');
    updateSoundBtn();
    if(soundOn) sfxTick();
  };

  // ===== FETCH POST DATA =====
  let post = null;
  document.getElementById('introTitle').innerHTML = '<div class="spinner" style="margin:0"></div>';
  document.getElementById('introDesc').textContent = 'Đang tải bài học...';

  try {
    const res = await fetch('data/' + encodeURIComponent(postId) + '.json');
    if(!res.ok) throw new Error('Không tìm thấy bài');
    post = await res.json();
  } catch(e) {
    document.body.innerHTML =
      '<div style="max-width:500px;margin:100px auto;padding:30px;background:#fff;border-radius:22px;text-align:center;box-shadow:0 10px 30px rgba(60,50,120,.12)">' +
      '<h2 style="font-family:Fraunces,serif;font-size:2rem;margin-bottom:14px">😢 Không tìm thấy bài</h2>' +
      '<p style="color:#5d5e7e;margin-bottom:20px">' + esc(e.message) + '</p>' +
      '<a href="index.html" class="btn btn-primary">← Quay về trang chủ</a></div>';
    return;
  }

  // ===== RENDER INTRO =====
  document.title = post.title + ' · Learn with Ms. Thúy';
  document.getElementById('introTitle').innerHTML = esc(post.title).replace(/ · /g, '<br>');
  document.getElementById('introDesc').innerHTML = '<b>' + esc(post.description) + '</b>';
  document.getElementById('introEyebrow').textContent = '📘 ' + post.tags.join(' · ');

  const chips = document.getElementById('introChips');
  chips.innerHTML = '';
  const labelMap = {
    mcq:'🧩 Trắc nghiệm',
    fill:'✏️ Điền từ (có sẵn)',
    'type-in':'⌨️ Gõ đáp án',
    'type-in-para':'📝 Điền đoạn văn',
    reading:'📖 Reading',
    matching:'🔗 Matching',
    synonym:'🔁 Đồng nghĩa',
    antonym:'↔️ Trái nghĩa',
    listening:'🎧 Listening'
  };
  [...new Set(post.parts.map(p => p.type))].forEach(t => {
    const li = document.createElement('li');
    li.textContent = labelMap[t] || t;
    chips.appendChild(li);
  });

  /* ============================================================
     GAME STATE — tính điểm thang 10 + TIMER
     ============================================================ */
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
          const parsed = parseParaBlanks(srcText);
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
      const shuffledQuestions = shuffle(part.questions || []);
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
    // === TIMER STATE ===
    timeLimit: post.timeLimit || 0, // giây, 0 = không giới hạn
    timeLeft: post.timeLimit || 0,
    timerInterval: null
  };

  game.total = game.items.reduce((s, it) => s + (it._points || 1), 0);
  game.pointPerQ = +(10 / game.total).toFixed(4);

  document.getElementById('qTotal').textContent = game.total;

  const pointHint = document.createElement('p');
  pointHint.style.cssText = 'font-size:.85rem;color:var(--ink-faint);margin-top:6px;font-family:var(--font-mono)';
  pointHint.textContent = '💯 Thang điểm 10 · ' + game.total + ' câu · mỗi câu = ' + game.pointPerQ.toLocaleString('vi-VN') + ' điểm';
  document.getElementById('introDesc').insertAdjacentElement('afterend', pointHint);

  const nameInput = document.getElementById('playerName');
  nameInput.value = localStorage.getItem('lwm-name') || '';

  // ===== SCREEN SWITCH =====
  function showScreen(name){
    document.querySelectorAll('.screen').forEach(s => { s.classList.remove('active'); s.hidden = true; });
    const el = document.getElementById('screen' + name.charAt(0).toUpperCase() + name.slice(1));
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('active'));
    window.scrollTo({top:0, behavior:'auto'});
  }

  document.getElementById('startForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if(!name){ nameInput.focus(); return; }
    localStorage.setItem('lwm-name', name);
    game.name = name;
    sfxTick();
    showScreen('quiz');
    renderQuestion();
    updateProgressUI(); // Cập nhật UI ngay khi bắt đầu
    startTimer();       // Bắt đầu đếm giờ
  });

  document.getElementById('exitBtn').addEventListener('click', () => {
    openModal('Thoát bài quiz?', 'Kết quả hiện tại sẽ không được lưu.', 'Thoát', () => {
      location.href = 'index.html';
    });
  });
  document.getElementById('modalOk').addEventListener('click', () => { const cb = modalAction; closeModal(); cb && cb(); });
  document.getElementById('modal').addEventListener('click', e => { if(e.target.dataset.close !== undefined) closeModal(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !document.getElementById('modal').hidden) closeModal(); });

   // ===== Helper cập nhật live score ===== 
  function updateLiveScore(){ 
    const pill = document.getElementById('liveScore'); 
    if (!pill) return; 
    const liveScore = +(game.correct * game.pointPerQ).toFixed(1); 
    
    // HIỂN THỊ RÕ: Số câu đúng / Tổng số câu hỏi (bao gồm cả sub-questions của listening/reading)
    pill.textContent = `✓ ${game.correct}/${game.total} (${liveScore}đ)`; 
    
    // Kích hoạt animation bump 
    pill.classList.remove('bump');  
    void pill.offsetWidth; // force reflow 
    pill.classList.add('bump'); 
  }

  // ===== TIMER & PROGRESS UI HELPERS =====
  function updateTimerUI() {
    const el = document.getElementById('timerDisplay');
    const pill = document.getElementById('timerPill');
    if (!el) return;

    if (game.timeLimit <= 0) {
      el.textContent = '∞';
      return;
    }

    const m = Math.floor(game.timeLeft / 60);
    const s = game.timeLeft % 60;
    el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    // Cảnh báo đỏ khi còn dưới 60 giây
    if (game.timeLeft <= 60) {
      pill.classList.add('danger');
    } else {
      pill.classList.remove('danger');
    }
  }

  function startTimer() {
    if (game.timeLimit <= 0) {
      updateTimerUI();
      return;
    }
    game.timeLeft = game.timeLimit;
    updateTimerUI();
    
    game.timerInterval = setInterval(() => {
      game.timeLeft--;
      updateTimerUI();
      
      if (game.timeLeft <= 0) {
        clearInterval(game.timerInterval);
        showToast('⏰ Hết giờ làm bài! Tự động nộp bài...', 'bad');
        sfxWrong();
        finish(true); // true = nộp bài cưỡng bức do hết giờ
      }
    }, 1000);
  }

  function updateProgressUI() {
    // 1. Thanh tiến trình (dựa trên số lượng màn hình/item)
    const progressPct = ((game.idx) / game.items.length) * 100;
    const pBar = document.getElementById('progressFill');
    if (pBar) pBar.style.width = progressPct + '%';

    // 2. Số câu đang làm / tổng số
    const qNow = document.getElementById('qNow');
    const qTotal = document.getElementById('qTotal');
    if (qNow) qNow.textContent = game.idx + 1;
    if (qTotal) qTotal.textContent = game.items.length;

    // 3. Điểm số trực tiếp
    updateLiveScore();
  }

  /* ============================================================
     RENDER QUESTION
     ============================================================ */
  function renderQuestion(){
    const item = game.items[game.idx];
    const stage = document.getElementById('qStage');
    
    let html = '';

    if (item._partType === 'listening') {
      html += '<div class="audio-bar">' +
        '<div class="audio-info"><span class="audio-emoji">🎧</span>' +
          '<div><b>' + esc(item._partName) + '</b>' +
          '<span class="audio-hint">' + esc(item._partHint || 'Nghe audio và trả lời các câu hỏi bên dưới nhé!') + '</span></div>' +
        '</div>' +
        '<audio id="listenAudio" controls preload="metadata" src="' + esc(item._audio || '') + '"></audio>' +
      '</div>';
      if (item._image) {
        html += '<div class="listening-img-wrap"><img class="listening-img" src="' + esc(item._image) + '" alt="Hình minh họa bài nghe" loading="lazy"></div>';
      }
    }

    html += '<div class="q-card">' +
      '<span class="q-num">' + String(game.idx+1).padStart(2,'0') + '</span>' +
      '<div class="q-meta"><span class="part-chip" style="background:var(--primary-soft);color:var(--primary-deep)">' + esc(item._partName) + '</span>' +
      '<span style="color:var(--ink-faint);font-size:.85rem;font-style:italic">' + esc(item._partHint || '') + '</span></div>';

    if (item._partType !== 'matching' && item._partType !== 'listening' && item._partType !== 'type-in-para') {
      html += '<h2 class="q-text">' + renderQuestionText(item) + '</h2>';
    }

    html += renderBodyByType(item);
    html += '</div>';
    stage.innerHTML = html;
    attachEventsByType(item);
    
    // Cập nhật progress bar và counter mỗi khi render câu mới
    updateProgressUI();
  }

  function renderQuestionText(item){
    let q = esc(item.q || '').split('____').join('<span class="blank">&nbsp;</span>');
    if((item._partType === 'synonym' || item._partType === 'antonym') && item.keyword){
      const regex = new RegExp('\\b' + item.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      q = q.replace(regex, '<mark>' + item.keyword + '</mark>');
    }
    return q;
  }

  function renderBodyByType(item){
    switch(item._partType){
      case 'mcq':
      case 'synonym':
      case 'antonym':
        return renderMCQ(item);
      case 'reading':
        return renderMCQ(item); // reading vẫn dùng layout MCQ nhưng có passage
      case 'fill':
        return renderFill(item);
      case 'type-in':
        return renderTypeIn(item);
      case 'type-in-para':
        return renderTypeInPara(item);
      case 'matching':
        return renderMatching(item);
      case 'listening':
        return renderListening(item);
      default: return '<p>Chưa hỗ trợ dạng này.</p>';
    }
  }

  /* ============================================================
     MCQ / SYNONYM / ANTONYM / READING
     ============================================================ */
  function renderMCQ(item){
    const shuffled = shuffle(item.o.map((t,i) => ({text:t, correct:i===item.a})));
    item._shuffled = shuffled;
    const LETTERS = ['A','B','C','D','E','F'];
    let html = '';
    if(item._passage){
      html += '<div class="reading-passage">' +
        esc(item._passage).split('\n\n').map(p => '<p style="margin-bottom:14px">' + esc(p) + '</p>').join('') +
      '</div>';
    }
    html += '<div class="options">' +
      shuffled.map((opt,i) =>
        '<button class="opt" data-i="' + i + '" type="button">' +
          '<span class="opt-letter">' + LETTERS[i] + '</span>' +
          '<span class="opt-text">' + esc(opt.text) + '</span>' +
        '</button>'
      ).join('') +
    '</div>';
    return html;
  }

  /* ============================================================
     FILL (word bank)
     ============================================================ */
  function renderFill(item){
    const pool = (item && Array.isArray(item.words) && item.words.length)
      ? item.words
      : (item && Array.isArray(item.a) ? item.a : ['answer']);
    const shuffledWords = shuffle(pool);
    item._shuffledWords = shuffledWords;

    return '<div class="fill-wrap">' +
      '<div class="word-bank">' +
        '<div class="word-bank-label">💎 Chọn từ trong khung:</div>' +
        '<div class="word-bank-chips">' +
          shuffledWords.map((w,i) =>
            '<button class="word-chip" data-word="' + esc(w) + '" data-i="' + i + '" type="button">' +
              esc(w) +
            '</button>'
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

  /* ============================================================
     TYPE-IN (gõ đáp án — KHÔNG có word bank)
     Dùng cho: test thường, reading (có passage), listening (sub-q)
     ============================================================ */
  function renderTypeIn(item){
    let html = '';
    if(item._passage){
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

  /* ============================================================
     TYPE-IN-PARA (điền từ ngay trên cả đoạn văn — có đánh số (1)(2)...)
     Cấu trúc dữ liệu 1 câu trong part.questions:
       { "text": "Yesterday I went to the ____market____ to buy ____vegetables|veggies____.",
         "vi": "...", "ex": "..." }
     Dùng được cho: bài tập thường (part.type = "type-in-para"),
     reading (đoạn văn chính là bài đọc), và listening (sub.qtype = "type-in-para").
     ============================================================ */
  function renderTypeInPara(item){
    return '<div class="para-fill-wrap">' +
      '<p class="para-fill-text" style="line-height:2;font-size:1.05rem">' + item._parsedHtml + '</p>' +
      '<div class="fill-actions">' +
        '<button class="btn btn-primary" id="paraCheck" type="button">✅ Nộp đoạn văn</button>' +
      '</div>' +
      '<div class="fill-hint">💡 Điền từ thích hợp vào từng ô có đánh số, rồi bấm <b>Nộp đoạn văn</b> (nhấn <b>Enter</b> để qua ô tiếp theo)</div>' +
    '</div>';
  }

  /* ============================================================
     MATCHING (ghép 2 cột)
     ============================================================ */
  function renderMatching(item){
    const left = shuffle(item._pairs.map((p,i) => ({text:p.left, idx:i})));
    const right = shuffle(item._pairs.map((p,i) => ({text:p.right, idx:i})));
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

  /* ============================================================
     LISTENING — nhiều câu con trên 1 trang
     ============================================================ */
  function subTypeLabel(t){
    return {
      single:'Chọn 1 đáp án',
      multi:'Chọn nhiều đáp án',
      fill:'Điền từ (có sẵn)',
      'type-in':'Gõ đáp án',
      'type-in-para':'Điền đoạn văn',
      match:'Ghép (dropdown)'
    }[t] || t;
  }

  function renderListening(item){
    const LETTERS = ['A','B','C','D','E','F','G','H'];

    (item._subs || []).forEach(sub => {
      if(sub.qtype === 'single'){
        sub._shuffled = shuffle((sub.o || []).map((t,i) => ({text:t, correct:i === sub.a})));
      } else if(sub.qtype === 'multi'){
        sub._shuffled = shuffle((sub.o || []).map((t,i) => ({text:t, correct:(sub.a || []).includes(i)})));
      } else if(sub.qtype === 'fill'){
        if(sub.words && sub.words.length) sub._shuffledWords = shuffle(sub.words);
      } else if(sub.qtype === 'type-in-para'){
        const srcText = sub.text != null ? sub.text : (sub.passage != null ? sub.passage : sub.q);
        const parsed = parseParaBlanks(srcText);
        sub._blanks = parsed.blanks;
        sub._parsedHtml = parsed.html;
      }
      // type-in: không cần xử lý gì thêm
    });

    let html = '<div class="sub-list">';
    (item._subs || []).forEach((sub, si) => {
      html += '<div class="sub-q" data-sub="' + si + '">';
      html += '<div class="sub-head"><span class="sub-no">' + (si+1) + '</span><span class="sub-type">' + subTypeLabel(sub.qtype) + '</span></div>';
      html += '<p class="sub-text">' + esc(sub.q || '').split('____').join('<span class="blank">&nbsp;</span>') + '</p>';

      if(sub.qtype === 'single'){
        html += '<div class="options">' + sub._shuffled.map((opt,i) =>
          '<button class="opt sub-opt" data-sub="' + si + '" data-i="' + i + '" type="button">' +
            '<span class="opt-letter">' + LETTERS[i] + '</span>' +
            '<span class="opt-text">' + esc(opt.text) + '</span>' +
          '</button>').join('') + '</div>';
      }
      else if(sub.qtype === 'multi'){
        html += '<div class="options">' + sub._shuffled.map((opt,i) =>
          '<button class="opt sub-multi" data-sub="' + si + '" data-i="' + i + '" type="button">' +
            '<span class="opt-letter">' + LETTERS[i] + '</span>' +
            '<span class="opt-text">' + esc(opt.text) + '</span>' +
            '<span class="multi-check" aria-hidden="true">✓</span>' +
          '</button>').join('') + '</div>';
      }
      else if(sub.qtype === 'fill'){
        if(sub._shuffledWords){
          html += '<div class="word-bank"><div class="word-bank-label">💎 Chọn từ:</div><div class="word-bank-chips">' +
            sub._shuffledWords.map(w =>
              '<button class="word-chip sub-chip" data-sub="' + si + '" data-word="' + esc(w) + '" type="button">' + esc(w) + '</button>'
            ).join('') + '</div></div>';
        }
        html += '<input class="fill-input sub-fill-input" data-sub="' + si + '" type="text" autocomplete="off" ' +
          'placeholder="' + (sub._shuffledWords ? 'Từ đã chọn...' : 'Gõ từ em nghe được...') + '"' +
          (sub._shuffledWords ? ' readonly' : '') + '>';
      }
      else if(sub.qtype === 'type-in'){
        // ⌨️ Dạng gõ đáp án — không có word bank
        html += '<input class="fill-input sub-fill-input sub-typein-input" data-sub="' + si + '" type="text" autocomplete="off" ' +
          'placeholder="✍️ Gõ đáp án em nghe được...">';
      }
      else if(sub.qtype === 'type-in-para'){
        // 📝 Dạng điền vào cả đoạn văn — nhiều ô có đánh số (1)(2)(3)...
        html += '<div class="para-fill-wrap para-fill-sub">' +
          '<p class="para-fill-text" style="line-height:2;font-size:1.02rem">' + sub._parsedHtml + '</p>' +
        '</div>';
      }
      else if(sub.qtype === 'match'){
        html += '<div class="match-opts"><b>📋 Phương án:</b><br>' +
          (sub.options || []).map((op,i) => '<b>' + LETTERS[i] + '.</b> ' + esc(op) + '<br>').join('') +
        '</div>';
        html += '<div class="match-rows">';
        (sub.rows || []).forEach((row, ri) => {
          html += '<div class="match-row"><span class="row-label">' + esc(row.left) + '</span>' +
            '<select data-row="' + ri + '"><option value="">— ? —</option>' +
            (sub.options || []).map((op,i) => '<option value="' + i + '">' + LETTERS[i] + '</option>').join('') +
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

  /* ============================================================
     ATTACH EVENTS
     ============================================================ */
  function attachEventsByType(item){
    switch(item._partType){
      case 'mcq':
      case 'synonym':
      case 'antonym':
      case 'reading':
        document.querySelectorAll('#qStage .opt').forEach(btn => {
          btn.addEventListener('click', () => handleMCQ(btn, item));
        });
        break;
      case 'fill': handleFill(item); break;
      case 'type-in': handleTypeIn(item); break;
      case 'type-in-para': handleTypeInPara(item); break;
      case 'matching': handleMatching(item); break;
      case 'listening': handleListening(item); break;
    }
  }

  /* ============================================================
     HANDLERS
     ============================================================ */
  function handleMCQ(btn, item){
    const all = [...document.querySelectorAll('#qStage .opt')];
    all.forEach(b => b.disabled = true);
    const i = +btn.dataset.i;
    const chosen = item._shuffled[i];
    game.answers[game.idx] = {chosen: chosen.text, ok: chosen.correct};
    if(chosen.correct){
      btn.classList.add('correct');
      all.forEach((b,j) => { if(j !== i) b.classList.add('dim'); });
      game.correct++;
      updateLiveScore();
      sfxCorrect();
      showToast('✨ Chính xác! + ' + game.pointPerQ.toLocaleString('vi-VN') + ' điểm', 'good');
      setTimeout(nextStep, 1000);
    } else {
      btn.classList.add('wrong');
      all.forEach((b,j) => { if(j !== i) b.classList.add('dim'); });
      sfxWrong();
      showToast('❌ Chưa đúng…', 'bad');
      setTimeout(nextStep, 1500);
    }
  }

  function handleFill(item){
    const input = document.getElementById('fillInput');
    const check = document.getElementById('fillCheck');
    const clear = document.getElementById('fillClear');
    const chips = [...document.querySelectorAll('#qStage .word-chip')];

    let selectedChip = null;
    let done = false;

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        if(done) return;
        if(selectedChip) selectedChip.classList.remove('selected');
        chip.classList.add('selected');
        selectedChip = chip;
        input.value = chip.dataset.word;
        input.classList.remove('correct','wrong');
        sfxTick();
      });
    });

    clear.addEventListener('click', () => {
      if(done) return;
      input.value = '';
      input.classList.remove('correct','wrong');
      if(selectedChip){
        selectedChip.classList.remove('selected');
        selectedChip = null;
      }
    });

    function doCheck(){
      if(done) return;
      const val = input.value.trim().toLowerCase();
      if(!val){
        showToast('💡 Em hãy chọn một từ trong khung trước nhé!', '');
        return;
      }
      done = true;

      chips.forEach(c => {
        c.disabled = true;
        if(c !== selectedChip) c.classList.add('dim');
      });
      clear.disabled = true;
      check.disabled = true;

      const ok = item.a.some(ans => val === ans.toLowerCase());
      game.answers[game.idx] = {chosen: input.value.trim(), ok};

      if(ok){
        input.classList.add('correct');
        if(selectedChip){
          selectedChip.classList.add('chip-correct');
        }
        game.correct++;
        updateLiveScore();
        sfxCorrect();
        showToast('✨ Chính xác! + ' + game.pointPerQ.toLocaleString('vi-VN') + ' điểm', 'good');
        setTimeout(nextStep, 1200);
      } else {
        input.classList.add('wrong');
        if(selectedChip){
          selectedChip.classList.add('chip-wrong');
        }
        sfxWrong();

        const correctWord = item.a[0].toLowerCase();
        chips.forEach(c => {
          if(c.dataset.word.toLowerCase() === correctWord){
            c.classList.add('chip-correct');
            c.classList.remove('dim');
          }
        });

        const show = document.createElement('div');
        show.className = 'fill-show';
        show.innerHTML = '✅ Đáp án đúng: <b>' + esc(item.a[0]) + '</b>';
        document.querySelector('.fill-wrap').appendChild(show);
        showToast('❌ Chưa đúng rồi…', 'bad');
        setTimeout(nextStep, 2200);
      }
    }

    input.addEventListener('keydown', e => { if(e.key === 'Enter') doCheck(); });
    check.addEventListener('click', doCheck);
  }

  /* ============================================================
     HANDLER TYPE-IN (gõ đáp án)
     ============================================================ */
  function handleTypeIn(item){
    const input = document.getElementById('typeinInput');
    const check = document.getElementById('typeinCheck');
    if(!input || !check) return;

    let done = false;

    function doCheck(){
      if(done) return;
      const val = input.value.trim();
      if(!val){
        showToast('💡 Em hãy gõ đáp án trước nhé!', '');
        input.focus();
        return;
      }
      done = true;
      input.disabled = true;
      check.disabled = true;

      const valLC = val.toLowerCase();
      const answers = Array.isArray(item.a) ? item.a : [item.a];
      const ok = answers.some(ans => 
        typeof ans === 'string' && valLC === ans.trim().toLowerCase()
      );

      game.answers[game.idx] = {chosen: val, ok};

      if(ok){
        input.classList.add('correct');
        game.correct++;
        updateLiveScore();
        sfxCorrect();
        showToast('✨ Chính xác! + ' + game.pointPerQ.toLocaleString('vi-VN') + ' điểm', 'good');
        setTimeout(nextStep, 1200);
      } else {
        input.classList.add('wrong');
        sfxWrong();
        const correctWord = answers[0];
        const show = document.createElement('div');
        show.className = 'fill-show';
        show.innerHTML = '✅ Đáp án đúng: <b>' + esc(correctWord) + '</b>';
        document.querySelector('.typein-wrap').appendChild(show);
        showToast('❌ Chưa đúng rồi…', 'bad');
        setTimeout(nextStep, 2200);
      }
    }

    input.addEventListener('keydown', e => { if(e.key === 'Enter') doCheck(); });
    check.addEventListener('click', doCheck);
    // Auto focus input (desktop friendly)
    setTimeout(() => { try { input.focus(); } catch(e){} }, 80);
  }

  /* ============================================================
     HANDLER TYPE-IN-PARA (điền vào đoạn văn — nhiều ô trong 1 đoạn)
     Chấm điểm theo từng ô: mỗi ô đúng +1 (đã tính trong _points),
     ô nào sai sẽ hiện đáp án đúng ngay cạnh ô đó.
     ============================================================ */
  function handleTypeInPara(item){
    const wrap = document.querySelector('#qStage .para-fill-wrap');
    const btn = document.getElementById('paraCheck');
    if(!wrap || !btn) return;
    const inputs = [...wrap.querySelectorAll('.para-blank-input')];
    let done = false;

    function doCheck(){
      if(done) return;
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
        if(ok) correctCount++;
        inp.classList.add(ok ? 'correct' : 'wrong');
        chosenParts.push(val || '(bỏ trống)');
        rightParts.push(blank.answers[0]);

        if(!ok){
          const badge = inp.closest('.para-blank-wrap');
          if(badge){
            const show = document.createElement('span');
            show.className = 'para-blank-correct';
            show.style.cssText = 'color:#2ea36c;font-size:.85em;font-weight:700;margin-left:2px';
            show.textContent = '✅ ' + blank.answers[0];
            badge.appendChild(show);
          }
        }
      });

      game.correct += correctCount;
      updateLiveScore();
      game.answers[game.idx] = {
        chosen: chosenParts.join(' | '),
        right: rightParts.join(' | '),
        ok: correctCount === inputs.length
      };

      if(correctCount === inputs.length){
        sfxCorrect();
        showToast('✨ Điền đúng hết ' + inputs.length + ' chỗ trống!', 'good');
      } else if(correctCount > 0){
        sfxTick();
        showToast('📝 Đúng ' + correctCount + '/' + inputs.length + ' chỗ trống', '');
      } else {
        sfxWrong();
        showToast('❌ Chưa đúng chỗ nào…', 'bad');
      }
      setTimeout(nextStep, 2200);
    }

    btn.addEventListener('click', doCheck);
    inputs.forEach((inp, i) => {
      inp.addEventListener('keydown', e => {
        if(e.key === 'Enter'){
          e.preventDefault();
          const next = inputs[i+1];
          if(next) next.focus(); else doCheck();
        }
      });
    });
    setTimeout(() => { try { inputs[0] && inputs[0].focus(); } catch(e){} }, 80);
  }

  function handleMatching(item){
    let selL = null, selR = null;
    if (item._completed) return;

    document.querySelectorAll('#qStage .match-item').forEach(el => {
      el.addEventListener('click', () => {
        if(item._completed) return;
        if(el.classList.contains('matched')) return;
        if(el.dataset.side === 'L'){
          if(selL) selL.classList.remove('selected');
          selL = el; el.classList.add('selected');
        } else {
          if(selR) selR.classList.remove('selected');
          selR = el; el.classList.add('selected');
        }
        sfxTick();
        if(selL && selR){
          const li = +selL.dataset.i, ri = +selR.dataset.i;
          if(li === ri){
            selL.classList.remove('selected'); selR.classList.remove('selected');
            selL.classList.add('matched'); selR.classList.add('matched');
            sfxCorrect();
            item._matches++;
            game.correct++;
            updateLiveScore();
            const countEl = document.getElementById('matchCount');
            if(countEl) countEl.textContent = item._matches;

            if(item._matches === item._pairs.length){
              item._completed = true;
              game.answers[game.idx] = {chosen: 'matched all', ok: true};
              showToast('🎉 Ghép hết rồi!', 'good');
              const statusEl = document.querySelector('#qStage .matching-wrap span:last-child');
              if(statusEl) statusEl.textContent = '✅ Hoàn thành';
              document.querySelectorAll('#qStage .match-item:not(.matched)').forEach(el => {
                el.style.opacity = '0.5';
                el.style.cursor = 'default';
              });
              setTimeout(nextStep, 1000);
            }
          } else {
            selL.classList.add('wrong-pair'); selR.classList.add('wrong-pair');
            sfxWrong();
            const a = selL, b = selR;
            setTimeout(() => {
              a.classList.remove('wrong-pair','selected');
              b.classList.remove('wrong-pair','selected');
            }, 500);
          }
          selL = null; selR = null;
        }
      });
    });
  }

  function handleListening(item){
    const stage = document.getElementById('qStage');
    const subs = item._subs || [];
    const LETTERS = ['A','B','C','D','E','F','G','H'];

    stage.querySelectorAll('.sub-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const si = btn.dataset.sub;
        stage.querySelectorAll('.sub-opt[data-sub="'+si+'"]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        sfxTick();
      });
    });

    stage.querySelectorAll('.sub-multi').forEach(btn => {
      btn.addEventListener('click', () => { btn.classList.toggle('picked'); sfxTick(); });
    });

    stage.querySelectorAll('.sub-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const si = chip.dataset.sub;
        stage.querySelectorAll('.sub-chip[data-sub="'+si+'"]').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        const input = stage.querySelector('.sub-fill-input[data-sub="'+si+'"]');
        if(input){ input.value = chip.dataset.word; input.classList.remove('correct','wrong'); }
        sfxTick();
      });
    });

    document.getElementById('listenSubmit').addEventListener('click', function(){
      const submit = this;
      if(submit.disabled) return;
      let correctCount = 0;
      const details = [];

      subs.forEach((sub, si) => {
        const wrap = stage.querySelector('.sub-q[data-sub="'+si+'"]');
        let ok = false, chosenText = '—', rightText = '—';

        if(sub.qtype === 'single'){
          const sel = wrap.querySelector('.sub-opt.selected');
          const selI = sel ? +sel.dataset.i : -1;
          chosenText = selI >= 0 ? sub._shuffled[selI].text : '(không chọn)';
          rightText = sub.o[sub.a];
          ok = selI >= 0 && sub._shuffled[selI].correct;
          wrap.querySelectorAll('.sub-opt').forEach((b,bi) => {
            b.disabled = true;
            if(sub._shuffled[bi].correct) b.classList.add('correct');
            else if(bi === selI) b.classList.add('wrong');
            else b.classList.add('dim');
          });
        }
        else if(sub.qtype === 'multi'){
          const picked = [...wrap.querySelectorAll('.sub-multi.picked')].map(b => +b.dataset.i);
          const correctSet = sub._shuffled.map((o,i) => o.correct ? i : -1).filter(i => i >= 0);
          chosenText = picked.map(i => sub._shuffled[i].text).join(', ') || '(không chọn)';
          rightText = sub._shuffled.filter(o => o.correct).map(o => o.text).join(', ');
          ok = picked.length === correctSet.length && picked.every(i => correctSet.includes(i));
          wrap.querySelectorAll('.sub-multi').forEach((b,bi) => {
            b.disabled = true;
            if(sub._shuffled[bi].correct) b.classList.add('correct');
            else if(picked.includes(bi)) b.classList.add('wrong');
            else b.classList.add('dim');
          });
        }
        else if(sub.qtype === 'fill'){
          const input = wrap.querySelector('.sub-fill-input');
          const val = (input.value || '').trim().toLowerCase();
          chosenText = input.value.trim() || '(không điền)';
          rightText = sub.a[0];
          ok = sub.a.some(ans => val === ans.toLowerCase());
          input.disabled = true;
          input.classList.add(ok ? 'correct' : 'wrong');
          wrap.querySelectorAll('.sub-chip').forEach(c => c.disabled = true);
          if(!ok){
            const show = document.createElement('div');
            show.className = 'fill-show';
            show.innerHTML = '✅ Đáp án: <b>' + esc(sub.a[0]) + '</b>';
            wrap.appendChild(show);
          }
        }
        else if(sub.qtype === 'type-in'){
          // ⌨️ Xử lý type-in cho listening
          const input = wrap.querySelector('.sub-fill-input');
          const val = (input.value || '').trim();
          chosenText = val || '(không điền)';
          const answers = Array.isArray(sub.a) ? sub.a : [sub.a];
          rightText = answers[0] || '—';
          ok = val !== '' && answers.some(ans => 
            typeof ans === 'string' && val.toLowerCase() === ans.trim().toLowerCase()
          );
          input.disabled = true;
          input.classList.add(ok ? 'correct' : 'wrong');
          if(!ok){
            const show = document.createElement('div');
            show.className = 'fill-show';
            show.innerHTML = '✅ Đáp án: <b>' + esc(rightText) + '</b>';
            wrap.appendChild(show);
          }
        }
               else if(sub.qtype === 'type-in-para'){ 
          // 📝 Xử lý điền đoạn văn cho listening
          const inputs = [...wrap.querySelectorAll('.para-blank-input')]; 
          let allOk = true; 
          const chosenParts = [], rightParts = []; 
          
          inputs.forEach((inp, bi) => { 
            const blank = (sub._blanks && sub._blanks[bi]) || { answers: [''] }; 
            const val = (inp.value || '').trim(); 
            const isRight = val !== '' && blank.answers.some(a => val.toLowerCase() === String(a).toLowerCase()); 
            if(!isRight) allOk = false; 
            
            inp.disabled = true; 
            inp.classList.add(isRight ? 'correct' : 'wrong'); 
            chosenParts.push(val || '(bỏ trống)'); 
            rightParts.push(blank.answers[0]); 
            
            if(!isRight){ 
              const badge = inp.closest('.para-blank-wrap'); 
              if(badge){ 
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
          
          // LƯU THÊM DỮ LIỆU ĐỂ REVIEW HIỂN THỊ ĐOẠN VĂN ĐẦY ĐỦ
          details.push({ 
            q: `Đoạn văn điền từ (Câu ${si+1})`, 
            chosen: chosenText, 
            right: rightText, 
            ok: ok, 
            vi: sub.vi, 
            ex: sub.ex,
            _isPara: true,
            _originalText: sub.text || sub.passage || sub.q, // Lưu đoạn văn gốc
            _blanks: sub._blanks // Lưu mảng đáp án
          }); 
        }
        else if(sub.qtype === 'match'){
          const rows = sub.rows || [];
          const picks = []; let rowOk = true;
          rows.forEach((row, ri) => {
            const sel = wrap.querySelector('select[data-row="'+ri+'"]');
            const v = sel.value === '' ? -1 : +sel.value;
            sel.disabled = true;
            const good = v === row.a;
            if(!good) rowOk = false;
            sel.classList.add(good ? 'sel-correct' : 'sel-wrong');
            picks.push(v >= 0 ? LETTERS[v] : '—');
            if(!good){
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

        if(ok) correctCount++;
        details.push({ q: sub.q, chosen: chosenText, right: rightText, ok, vi: sub.vi, ex: sub.ex });
      });

      game.correct += correctCount;
      updateLiveScore();
      game.answers[game.idx] = {
        chosen: correctCount + '/' + subs.length,
        ok: correctCount === subs.length,
        details
      };

      submit.disabled = true;
      submit.textContent = '✅ Đã nộp · Đúng ' + correctCount + '/' + subs.length;

      if(correctCount === subs.length){ sfxCorrect(); showToast('🎧 Tuyệt vời! Đúng hết ' + subs.length + ' câu!', 'good'); }
      else if(correctCount > 0){ sfxTick(); showToast('🎧 Đúng ' + correctCount + '/' + subs.length + ' câu!', ''); }
      else { sfxWrong(); showToast('🎧 Chưa đúng câu nào… xem đáp án nhé!', 'bad'); }

      setTimeout(nextStep, 2600);
    });
  }

  /* ============================================================
     NEXT / FINISH
     ============================================================ */
  function nextStep(){
    const au = document.getElementById('listenAudio');
    if(au) au.pause();

    if(game.idx >= game.items.length - 1){ finish(); return; }
    const card = document.querySelector('#qStage .q-card');
    if(card) card.style.animation = 'screenIn .25s reverse forwards';
    setTimeout(() => { 
      game.idx++; 
      renderQuestion(); 
      updateProgressUI(); 
    }, 220);
  }

  function finish(isForced = false){
    // Dừng timer ngay khi vào màn hình kết quả
    if (game.timerInterval) {
      clearInterval(game.timerInterval);
      game.timerInterval = null;
    }

    const { items, answers, correct, name, start } = game;
    const total = game.total || items.length;
    const pointPerQ = game.pointPerQ || (10 / total);

    const finalScore = +(correct * pointPerQ).toFixed(1);
    const pct = Math.round(correct / total * 100);
    const wrongs = items.filter((q,i) => !answers[i] || !answers[i].ok);
    const mins = Math.floor((Date.now() - start)/60000);
    const secs = Math.floor(((Date.now() - start)/1000) % 60);

    let title, msg;
    
    // Ưu tiên thông báo hết giờ nếu bị forced
    if (isForced) {
      title = '⏰ Hết giờ, <span>' + esc(name) + '</span>!';
      msg = 'Bài làm đã được tự động nộp. Em xem lại kết quả và rút kinh nghiệm nhé.';
    } else if(finalScore >= 9.5){ 
      title='🏆 Điểm tuyệt đối, <span>'+esc(name)+'</span>!'; 
      msg='Cô Thúy cực kỳ tự hào về em!'; 
    } else if(finalScore >= 8){ 
      title='🎉 Xuất sắc, <span>'+esc(name)+'</span>!'; 
      msg='Em đã chinh phục bài quiz với số điểm rất cao!'; 
    } else if(finalScore >= 6.5){ 
      title='👏 Giỏi lắm, <span>'+esc(name)+'</span>!'; 
      msg='Chỉ cần ôn thêm vài câu nữa là đạt mức xuất sắc!'; 
    } else if(finalScore >= 5){ 
      title='💪 Khá tốt, <span>'+esc(name)+'</span>!'; 
      msg='Xem lại các câu sai bên dưới để cải thiện nhé.'; 
    } else { 
      title='🌱 Cố lên, <span>'+esc(name)+'</span>!'; 
      msg='Đọc kỹ giải thích rồi làm lại một lần nữa nhé!'; 
    }

    const wrap = document.getElementById('resultWrap');
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
              '<stop offset="0%" stop-color="#7a67ee"/><stop offset="55%" stop-color="#5a9df5"/><stop offset="100%" stop-color="#3ecfa0"/>' +
            '</linearGradient></defs>' +
            '<circle class="ring-bg" cx="80" cy="80" r="70"/>' +
            '<circle class="ring-fg" id="ringFg" cx="80" cy="80" r="70"/>' +
          '</svg>' +
          '<div class="ring-center"><div class="ring-pct" id="pctText">0%</div><div class="ring-label">chính xác</div></div>' +
        '</div>' +
        '<div class="score-details">' +
          '<div class="score-big"><b style="font-size:3rem;background:var(--grad-main);-webkit-background-clip:text;background-clip:text;color:transparent">' + finalScore.toFixed(1) + '</b><span style="font-size:1.4rem">/ 10 điểm</span></div>' +
          '<div class="mini-stats">' +
            '<div class="mini-stat"><b>' + correct + '/' + total + '</b><span>câu đúng</span></div>' +
            '<div class="mini-stat"><b>' + pointPerQ.toLocaleString('vi-VN') + '</b><span>điểm / câu</span></div>' +
            '<div class="mini-stat"><b>' + mins + ':' + String(secs).padStart(2,'0') + '</b><span>thời gian</span></div>' +
            '<div class="mini-stat"><b>' + wrongs.length + '</b><span>câu cần ôn</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="result-actions">' +
        '<a href="post.html?id=' + encodeURIComponent(post.id) + '" class="btn btn-primary">🔁 Làm lại</a>' +
        '<a href="index.html" class="btn btn-ghost">🏠 Về trang chủ</a>' +
        '<button class="btn btn-ghost" id="reviewBtn">📖 Xem câu sai</button>' +
      '</div>' +
      '<div class="review"><h2>📝 Câu chưa đúng (' + wrongs.length + ')</h2>' +
      '<p class="review-sub">Đọc kỹ nghĩa tiếng Việt và giải thích nhé.</p>' +
      '<div id="reviewList"></div></div>';

    showScreen('result');

    const C = 439.82;
    const ring = document.getElementById('ringFg');
    ring.style.strokeDashoffset = C;
    setTimeout(() => ring.style.strokeDashoffset = C * (1 - pct/100), 200);
    const t0 = performance.now();
    (function count(now){
      const k = Math.min(1,(now-t0)/1200);
      const e = 1 - Math.pow(1-k,3);
      document.getElementById('pctText').textContent = Math.round(pct*e) + '%';
      if(k<1) requestAnimationFrame(count);
    })(t0);

        const list = document.getElementById('reviewList'); 
    if(!wrongs.length){ 
      list.innerHTML = '<div class="review-perfect">🎉 Tuyệt đối! Em làm đúng hết ' + game.total + ' câu · đạt ' + finalScore.toFixed(1) + '/10 điểm! 🎉</div>'; 
    } else { 
      wrongs.forEach(q => { 
        const ans = answers[items.indexOf(q)] || {chosen: '—'}; 
 
        // === XỬ LÝ RIÊNG CHO LISTENING ===
        if(q._partType === 'listening'){ 
          (ans.details || []).filter(d => !d.ok).forEach(d => { 
            if (d._isPara) {
              // Nếu là lỗi điền đoạn văn, hiển thị review đẹp mắt có gạch chân
              const art = document.createElement('article'); 
              art.className = 'review-item'; 
              const mockItem = { text: d._originalText, _blanks: d._blanks };
              const mockAns = { chosen: d.chosen }; // d.chosen đã có dạng "từ 1 | từ 2"
              
              art.innerHTML = 
                '<div class="review-head"><span class="badge-wrong">Chưa đúng</span>' + 
                '<span style="font-family:Space Mono,monospace;font-size:.75rem;color:var(--ink-faint)">' + esc(q._partName || '') + ' - ' + esc(d.q) + '</span></div>' + 
                '<p class="review-q para-review-text" style="line-height:1.9; margin-top:8px;">' + paraReviewHtml(mockItem, mockAns) + '</p>' + 
                (d.vi ? '<p class="review-vi">🇻🇳 ' + esc(d.vi) + '</p>' : '') + 
                (d.ex ? '<p class="review-ex">💡 ' + esc(d.ex) + '</p>' : ''); 
              list.appendChild(art);
            } else {
              // Các dạng listening khác (single, multi, fill thường)
              list.appendChild(reviewCard(q._partName, d.q, d.chosen, d.right, d.vi, d.ex)); 
            }
          }); 
          return; 
        } 
 
        // === XỬ LÝ RIÊNG CHO TYPE-IN-PARA THƯỜNG ===
        if(q._partType === 'type-in-para'){ 
          const art = document.createElement('article'); 
          art.className = 'review-item'; 
          art.innerHTML = 
            '<div class="review-head"><span class="badge-wrong">Chưa đúng</span>' + 
            '<span style="font-family:Space Mono,monospace;font-size:.75rem;color:var(--ink-faint)">' + esc(q._partName || '') + '</span></div>' + 
            '<p class="review-q para-review-text" style="line-height:1.9">' + paraReviewHtml(q, ans) + '</p>' + 
            (q.vi ? '<p class="review-vi">🇻🇳 ' + esc(q.vi) + '</p>' : '') + 
            (q.ex ? '<p class="review-ex">💡 ' + esc(q.ex) + '</p>' : ''); 
          list.appendChild(art); 
          return; 
        } 
 
        // === CÁC DẠNG KHÁC (MCQ, Fill, Type-in thường) ===
        const answersArr = Array.isArray(q.a) ? q.a : [q.a]; 
        const rightAns = (q._partType === 'fill' || q._partType === 'type-in') 
          ? answersArr[0] 
          : (q._partType === 'matching') ? 'matched all' 
          : (q.o ? q.o[q.a] : '—'); 
        list.appendChild(reviewCard(q._partName, q.q, ans.chosen, rightAns, q.vi, q.ex, q)); 
      }); 
    }
    document.getElementById('reviewBtn').onclick = () =>
      document.querySelector('.review').scrollIntoView({behavior:'smooth'});

    if(finalScore >= 8 && !isForced){ 
      setTimeout(launchConfetti, 350); 
      setTimeout(sfxFanfare, 300); 
    }
  }
}
