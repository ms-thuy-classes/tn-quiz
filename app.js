/* ============================================================
   Learn with Ms. Thúy — Quiz Engine (Full v3)
   Hỗ trợ: mcq | fill | reading | matching | synonym | antonym | listening
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
    mcq:'🧩 Trắc nghiệm', fill:'✏️ Điền từ', reading:'📖 Reading',
    matching:'🔗 Matching', synonym:'🔁 Đồng nghĩa', antonym:'↔️ Trái nghĩa',
    listening:'🎧 Listening'
  };
  [...new Set(post.parts.map(p => p.type))].forEach(t => {
    const li = document.createElement('li');
    li.textContent = labelMap[t] || t;
    chips.appendChild(li);
  });

  /* ============================================================
     GAME STATE — tính điểm thang 10
     Quy tắc đếm câu:
       • MCQ, Fill, Reading, Synonym, Antonym: mỗi câu = 1
       • Matching: mỗi cặp = 1 câu
       • Listening: mỗi câu con = 1 câu
     ============================================================ */
  let game = {
    post,
    items: post.parts.flatMap(part => {

      // 🎧 LISTENING: số câu = số câu con
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

      // 🔗 MATCHING: số câu = số cặp
      if (part.type === 'matching') {
        const pairsCount = (part.pairs || []).length;
        return [{
          _partType: part.type, _partName: part.name, _partHint: part.hint,
          _pairs: part.pairs, _matches: 0, _completed: false,
          _points: pairsCount,
        }];
      }

      // 📖 Các dạng còn lại: mỗi câu = 1
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
    start: Date.now()
  };

  // ✅ Tổng số câu toàn bài
  game.total = game.items.reduce((s, it) => s + (it._points || 1), 0);

  // ✅ Điểm mỗi câu (thang 10)
  game.pointPerQ = +(10 / game.total).toFixed(4);

  document.getElementById('qTotal').textContent = game.total;

  // ✅ Hiển thị "mỗi câu = X điểm" dưới mô tả
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
    const liveScore = +(game.correct * game.pointPerQ).toFixed(1);
    pill.textContent = '✓ ' + game.correct + ' (' + liveScore + 'đ)';
    pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
  }

  /* ============================================================
     RENDER QUESTION
     ============================================================ */
  function renderQuestion(){
    const item = game.items[game.idx];
    const stage = document.getElementById('qStage');
    document.getElementById('progressFill').style.width = (game.idx / game.items.length * 100) + '%';
    document.getElementById('qNow').textContent = game.idx + 1;

    let html = '';

    // 🎧 LISTENING: audio-bar + image nằm NGOÀI q-card
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

    if (item._partType !== 'matching' && item._partType !== 'listening') {
      html += '<h2 class="q-text">' + renderQuestionText(item) + '</h2>';
    }

    html += renderBodyByType(item);
    html += '</div>';
    stage.innerHTML = html;
    attachEventsByType(item);
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
      case 'reading':
        return renderMCQ(item);
      case 'fill':
        return renderFill(item);
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
    if(item._partType === 'reading' && item._passage){
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
    return {single:'Chọn 1 đáp án', multi:'Chọn nhiều đáp án', fill:'Điền từ', match:'Ghép (dropdown)'}[t] || t;
  }

  function renderListening(item){
    const LETTERS = ['A','B','C','D','E','F','G','H'];

    // Xáo trộn đáp án từng câu con
    (item._subs || []).forEach(sub => {
      if(sub.qtype === 'single'){
        sub._shuffled = shuffle((sub.o || []).map((t,i) => ({text:t, correct:i === sub.a})));
      } else if(sub.qtype === 'multi'){
        sub._shuffled = shuffle((sub.o || []).map((t,i) => ({text:t, correct:(sub.a || []).includes(i)})));
      } else if(sub.qtype === 'fill'){
        if(sub.words && sub.words.length) sub._shuffledWords = shuffle(sub.words);
      }
    });

    let html = '<div class="sub-list">';
    (item._subs || []).forEach((sub, si) => {
      html += '<div class="sub-q" data-sub="' + si + '">';
      html += '<div class="sub-head"><span class="sub-no">' + (si+1) + '</span><span class="sub-type">' + subTypeLabel(sub.qtype) + '</span></div>';
      html += '<p class="sub-text">' + esc(sub.q || '').split('____').join('<span class="blank">&nbsp;</span>') + '</p>';

      // 1️⃣ Single choice
      if(sub.qtype === 'single'){
        html += '<div class="options">' + sub._shuffled.map((opt,i) =>
          '<button class="opt sub-opt" data-sub="' + si + '" data-i="' + i + '" type="button">' +
            '<span class="opt-letter">' + LETTERS[i] + '</span>' +
            '<span class="opt-text">' + esc(opt.text) + '</span>' +
          '</button>').join('') + '</div>';
      }
      // 2️⃣ Multiple choice
      else if(sub.qtype === 'multi'){
        html += '<div class="options">' + sub._shuffled.map((opt,i) =>
          '<button class="opt sub-multi" data-sub="' + si + '" data-i="' + i + '" type="button">' +
            '<span class="opt-letter">' + LETTERS[i] + '</span>' +
            '<span class="opt-text">' + esc(opt.text) + '</span>' +
            '<span class="multi-check" aria-hidden="true">✓</span>' +
          '</button>').join('') + '</div>';
      }
      // 3️⃣ Fill (word bank optional)
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
      // 4️⃣ Matching dropdown
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
            game.correct++;          // ✅ mỗi cặp đúng = 1 câu đúng
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

    // Single: chọn 1
    stage.querySelectorAll('.sub-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const si = btn.dataset.sub;
        stage.querySelectorAll('.sub-opt[data-sub="'+si+'"]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        sfxTick();
      });
    });

    // Multi: toggle
    stage.querySelectorAll('.sub-multi').forEach(btn => {
      btn.addEventListener('click', () => { btn.classList.toggle('picked'); sfxTick(); });
    });

    // Word chips cho fill
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

    // ===== NỘP BÀI =====
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

      game.correct += correctCount;   // ✅ mỗi câu con đúng = 1 câu
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
    // Tạm dừng audio khi chuyển câu
    const au = document.getElementById('listenAudio');
    if(au) au.pause();

    if(game.idx >= game.items.length - 1){ finish(); return; }
    const card = document.querySelector('#qStage .q-card');
    if(card) card.style.animation = 'screenIn .25s reverse forwards';
    setTimeout(() => { game.idx++; renderQuestion(); }, 220);
  }

  function finish(){
    const { items, answers, correct, name, start } = game;
    const total = game.total || items.length;
    const pointPerQ = game.pointPerQ || (10 / total);

    // ✅ Điểm cuối theo thang 10
    const finalScore = +(correct * pointPerQ).toFixed(1);
    const pct = Math.round(correct / total * 100);
    const wrongs = items.filter((q,i) => !answers[i] || !answers[i].ok);
    const mins = Math.floor((Date.now() - start)/60000);
    const secs = Math.floor(((Date.now() - start)/1000) % 60);

    // Lời nhắn theo bậc điểm /10
    let title, msg;
    if(finalScore >= 9.5){ title='🏆 Điểm tuyệt đối, <span>'+esc(name)+'</span>!'; msg='Cô Thúy cực kỳ tự hào về em!'; }
    else if(finalScore >= 8){ title='🎉 Xuất sắc, <span>'+esc(name)+'</span>!'; msg='Em đã chinh phục bài quiz với số điểm rất cao!'; }
    else if(finalScore >= 6.5){ title='👏 Giỏi lắm, <span>'+esc(name)+'</span>!'; msg='Chỉ cần ôn thêm vài câu nữa là đạt mức xuất sắc!'; }
    else if(finalScore >= 5){ title='💪 Khá tốt, <span>'+esc(name)+'</span>!'; msg='Xem lại các câu sai bên dưới để cải thiện nhé.'; }
    else { title='🌱 Cố lên, <span>'+esc(name)+'</span>!'; msg='Đọc kỹ giải thích rồi làm lại một lần nữa nhé!'; }

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

    // Ring animation
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

    // Review list
    const list = document.getElementById('reviewList');
    if(!wrongs.length){
      list.innerHTML = '<div class="review-perfect">🎉 Tuyệt đối! Em làm đúng hết ' + total + ' câu · đạt ' + finalScore.toFixed(1) + '/10 điểm! 🎉</div>';
    } else {
      wrongs.forEach(q => {
        const ans = answers[items.indexOf(q)] || {chosen: '—'};

        if(q._partType === 'listening'){
          (ans.details || []).filter(d => !d.ok).forEach(d => {
            list.appendChild(reviewCard(q._partName, d.q, d.chosen, d.right, d.vi, d.ex));
          });
          return;
        }

        const rightAns = (q._partType === 'fill') ? q.a[0] :
                          (q._partType === 'matching') ? 'matched all' :
                          (q.o ? q.o[q.a] : '—');
        list.appendChild(reviewCard(q._partName, q.q, ans.chosen, rightAns, q.vi, q.ex, q));
      });
    }

    document.getElementById('reviewBtn').onclick = () =>
      document.querySelector('.review').scrollIntoView({behavior:'smooth'});

    if(finalScore >= 8){ setTimeout(launchConfetti, 350); setTimeout(sfxFanfare, 300); }
  }
}
