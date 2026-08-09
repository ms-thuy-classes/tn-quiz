/* ============================================================
   Learn with Ms. Thúy — Quiz Engine
   Hỗ trợ: mcq | fill | reading | matching | synonym | antonym
   ============================================================ */

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

/* ========== AUDIO (Web Audio API) ========== */
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
const sfxTick = () => tone(740, 0, .06, 'sine', .07);
const sfxCorrect = () => { tone(659.25,0,.14); tone(830.61,.09,.14); tone(987.77,.18,.22); };
const sfxWrong = () => { tone(233.08,0,.2,'sawtooth',.1); tone(164.81,.17,.32,'sawtooth',.1); };
const sfxFanfare = () => [523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,i*.11,.25));

/* ========== TOAST ========== */
let toastTimer;
function showToast(html, type=''){
  const el = document.getElementById('toast');
  if(!el) return;
  el.innerHTML = html;
  el.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1900);
}

/* ========== MODAL ========== */
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

/* ========== CONFETTI ========== */
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
  for(let i=0;i<90;i++) make(-10, cv.height*(.15+Math.random()*.4), 4+Math.random()*7, -(3+Math.random()*5));
  for(let i=0;i<90;i++) make(cv.width+10, cv.height*(.15+Math.random()*.4), -(4+Math.random()*7), -(3+Math.random()*5));
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
   POST PAGE — fetch detail JSON theo ?id=...
   ============================================================ */
async function initPostPage(){
  const params = new URLSearchParams(location.search);
  const postId = params.get('id');

  if(!postId){
    location.href = 'index.html';
    return;
  }

  // sound button
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
  const labelMap = {mcq:'🧩 Trắc nghiệm', fill:'✏️ Điền từ', reading:'📖 Reading', matching:'🔗 Matching', synonym:'🔁 Đồng nghĩa', antonym:'↔️ Trái nghĩa'};
  [...new Set(post.parts.map(p => p.type))].forEach(t => {
    const li = document.createElement('li');
    li.textContent = labelMap[t] || t;
    chips.appendChild(li);
  });

  // ===== GAME STATE =====
    // ===== GAME STATE =====
  let game = {
    post,
    items: post.parts.flatMap(part => {
      
      // 🔹 Xử lý đặc biệt cho Matching: không xáo trộn câu hỏi,
      // vì bản thân Matching đã tự xáo trộn 2 cột trái/phải trong renderMatching()
      if (part.type === 'matching') {
        return [{
          _partType: part.type,
          _partName: part.name,
          _partHint: part.hint,
          _pairs: part.pairs,
          _matches: 0,
          _completed: false,
        }];
      } 
      
      // 🔹 Xử lý cho Reading: giữ nguyên đoạn văn, chỉ xáo trộn câu hỏi
      else if (part.type === 'reading') {
        const shuffledQuestions = shuffle(part.questions || []);
        return shuffledQuestions.map(q => ({
          ...q,
          _partType: part.type,
          _partName: part.name,
          _partHint: part.hint,
          _passage: part.passage,   // ⚠️ Giữ nguyên đoạn văn, không xáo trộn
          _pairs: part.pairs
        }));
      }
      
      // 🔹 Xử lý cho các dạng còn lại: mcq, fill, synonym, antonym
      else {
        const shuffledQuestions = shuffle(part.questions || []);
        return shuffledQuestions.map(q => ({
          ...q,
          _partType: part.type,
          _partName: part.name,
          _partHint: part.hint,
          _passage: part.passage,
          _pairs: part.pairs
        }));
      }
    }),
    idx: 0,
    correct: 0,
    answers: [],
    name: '',
    start: Date.now()
  };

  document.getElementById('qTotal').textContent = game.items.length;
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

  // ============================================================
  // RENDER QUESTION THEO TYPE
  // ============================================================
  function renderQuestion(){
    const item = game.items[game.idx];
    const stage = document.getElementById('qStage');
    document.getElementById('progressFill').style.width = (game.idx / game.items.length * 100) + '%';
    document.getElementById('qNow').textContent = game.idx + 1;

    let html = '<div class="q-card">' +
      '<span class="q-num">' + String(game.idx+1).padStart(2,'0') + '</span>' +
      '<div class="q-meta"><span class="part-chip" style="background:var(--primary-soft);color:var(--primary-deep)">' + esc(item._partName) + '</span>' +
      '<span style="color:var(--ink-faint);font-size:.85rem;font-style:italic">' + esc(item._partHint || '') + '</span></div>';

    if (item._partType !== 'matching') {
      html += '<h2 class="q-text">' + renderQuestionText(item) + '</h2>';
    } else {
      html += '<p style="font-weight:600;font-size:1.1rem;margin-bottom:16px;">🔗 Ghép từ vựng</p>';
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
        return renderFill(item);   // ✅ ĐÃ SỬA: thêm (item)
      case 'matching':
        return renderMatching(item);
      default: return '<p>Chưa hỗ trợ dạng này.</p>';
    }
  }

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

    function renderFill(item){
    // Xáo trộn các từ trong word bank
    const pool = item.words && item.words.length ? item.words : item.a;
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

  function renderMatching(item){
    const left = shuffle(item._pairs.map((p,i) => ({text:p.left, idx:i})));
    const right = shuffle(item._pairs.map((p,i) => ({text:p.right, idx:i})));
    item._left = left; item._right = right;
    // Đặt lại _matches về 0 mỗi khi render lại (tránh lưu trạng thái cũ)
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
    }
  }

  /* ----- HANDLERS ----- */
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
      sfxCorrect();
      showToast('✨ Chính xác! Hay lắm, ' + esc(game.name) + '!', 'good');
      const pill = document.getElementById('liveScore');
      pill.textContent = '✓ ' + game.correct;
      pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
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
    
    // Click vào word chip → điền vào input
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        if(done) return;
        // Bỏ highlight chip cũ
        if(selectedChip) selectedChip.classList.remove('selected');
        // Highlight chip mới
        chip.classList.add('selected');
        selectedChip = chip;
        input.value = chip.dataset.word;
        input.classList.remove('correct','wrong');
        sfxTick();
      });
    });
    
    // Nút xóa
    clear.addEventListener('click', () => {
      if(done) return;
      input.value = '';
      input.classList.remove('correct','wrong');
      if(selectedChip){
        selectedChip.classList.remove('selected');
        selectedChip = null;
      }
    });
    
    // Kiểm tra đáp án
    function doCheck(){
      if(done) return;
      const val = input.value.trim().toLowerCase();
      if(!val){ 
        showToast('💡 Em hãy chọn một từ trong khung trước nhé!', '');
        return; 
      }
      done = true;
      
      // Khóa tất cả chip
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
        sfxCorrect();
        showToast('✨ Chính xác! Hay lắm, ' + esc(game.name) + '!', 'good');
        const pill = document.getElementById('liveScore');
        pill.textContent = '✓ ' + game.correct;
        pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
        setTimeout(nextStep, 1200);
      } else {
        input.classList.add('wrong');
        if(selectedChip){
          selectedChip.classList.add('chip-wrong');
        }
        sfxWrong();
        
        // Highlight đáp án đúng trong word bank
        const correctWord = item.a[0].toLowerCase();
        chips.forEach(c => {
          if(c.dataset.word.toLowerCase() === correctWord){
            c.classList.add('chip-correct');
            c.classList.remove('dim');
          }
        });
        
        // Hiển thị giải thích
        const show = document.createElement('div');
        show.className = 'fill-show';
        show.innerHTML = '✅ Đáp án đúng: <b>' + esc(item.a[0]) + '</b>';
        document.querySelector('.fill-wrap').appendChild(show);
        showToast('❌ Chưa đúng rồi…', 'bad');
        setTimeout(nextStep, 2200);
      }
    }
    
    check.addEventListener('click', doCheck);
  }

  function handleMatching(item){
    let selL = null, selR = null;
    // Nếu đã hoàn thành thì không cho tương tác nữa
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
            // Cập nhật số cặp đã ghép
            const countEl = document.getElementById('matchCount');
            if(countEl) countEl.textContent = item._matches;

            if(item._matches === item._pairs.length){
              // Hoàn thành toàn bộ matching
              item._completed = true;
              game.correct++; // Tăng điểm cho câu hỏi này
              game.answers[game.idx] = {chosen: 'matched all', ok: true};
              const pill = document.getElementById('liveScore');
              pill.textContent = '✓ ' + game.correct;
              pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
              showToast('🎉 Ghép hết rồi!', 'good');
              // Cập nhật trạng thái hoàn thành
              const statusEl = document.querySelector('#qStage .matching-wrap span:last-child');
              if(statusEl) statusEl.textContent = '✅ Hoàn thành';
              // Vô hiệu hóa các item còn lại
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

  function nextStep(){
    if(game.idx >= game.items.length - 1){ finish(); return; }
    const card = document.querySelector('#qStage .q-card');
    if(card) card.style.animation = 'screenIn .25s reverse forwards';
    setTimeout(() => { game.idx++; renderQuestion(); }, 220);
  }

  /* ============================================================
     FINISH
     ============================================================ */
  function finish(){
    const { items, answers, correct, name, start } = game;
    const pct = Math.round(correct / items.length * 100);
    const wrongs = items.filter((q,i) => !answers[i] || !answers[i].ok);
    const mins = Math.floor((Date.now() - start)/60000);
    const secs = Math.floor(((Date.now() - start)/1000) % 60);

    let title, msg;
    if(pct === 100){ title='🏆 Điểm tuyệt đối, <span>'+esc(name)+'</span>!'; msg='Cô Thúy cực kỳ tự hào về em!'; }
    else if(pct > 90){ title='🎉 Xuất sắc, <span>'+esc(name)+'</span>!'; msg='Em đã chinh phục bài quiz!'; }
    else if(pct >= 75){ title='👏 Giỏi lắm, <span>'+esc(name)+'</span>!'; msg='Chỉ cần ôn thêm vài câu nữa thôi!'; }
    else if(pct >= 50){ title='💪 Khá tốt, <span>'+esc(name)+'</span>!'; msg='Xem lại các câu sai bên dưới nhé.'; }
    else { title='🌱 Cố lên, <span>'+esc(name)+'</span>!'; msg='Đọc kỹ giải thích rồi làm lại nhé!'; }

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
          '<div class="score-big"><b>' + correct + '/' + items.length + '</b><span>câu đúng</span></div>' +
          '<div class="mini-stats">' +
            '<div class="mini-stat"><b>' + (correct*0.5).toLocaleString('vi-VN') + '</b><span>điểm / ' + (items.length*0.5).toLocaleString('vi-VN') + '</span></div>' +
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
      list.innerHTML = '<div class="review-perfect">🎉 Tuyệt đối! Em làm đúng hết! 🎉</div>';
    } else {
      wrongs.forEach(q => {
        const gi = items.indexOf(q);
        const ans = answers[gi] || {chosen: '—'};
        const rightAns = (q._partType === 'fill') ? q.a[0] :
                          (q._partType === 'matching') ? 'matched all' :
                          (q.o ? q.o[q.a] : '—');
        const art = document.createElement('article');
        art.className = 'review-item';
        art.innerHTML =
          '<div class="review-head">' +
            '<span class="badge-wrong">Chưa đúng</span>' +
            '<span style="font-family:Space Mono,monospace;font-size:.75rem;color:var(--ink-faint)">Câu ' + (gi+1) + '</span>' +
          '</div>' +
          '<p class="review-q">' + renderQuestionText(q) + '</p>' +
          '<div class="review-ans wrong">❌ Em chọn: <b>&nbsp;' + esc(ans.chosen) + '</b></div>' +
          '<div class="review-ans right">✅ Đáp án: <b>&nbsp;' + esc(rightAns) + '</b></div>' +
          (q.vi ? '<p class="review-vi">🇻🇳 ' + esc(q.vi) + '</p>' : '') +
          (q.ex ? '<p class="review-ex">💡 ' + esc(q.ex) + '</p>' : '');
        list.appendChild(art);
      });
    }

    document.getElementById('reviewBtn').onclick = () =>
      document.querySelector('.review').scrollIntoView({behavior:'smooth'});

    if(pct > 90){ setTimeout(launchConfetti, 350); setTimeout(sfxFanfare, 300); }
  }
}
