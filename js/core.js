/* ============================================================
   Learn with Ms. Thúy — Quiz Core Utilities
   ============================================================ */
(function () {
  'use strict';

  // ===== Helpers =====
  if (typeof window.esc !== 'function') {
    window.esc = s => String(s).replace(/[&<>"]/g, c => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]
    ));
     
  }
   window.formatMarkedText = function(text){
  return window.esc(text == null ? '' : text)
    .replace(/\[(.*?)\]/g, '<span class="under">$1</span>');
};
  if (typeof window.shuffle !== 'function') {
    window.shuffle = function (a) {
      a = a.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
  }
  if (typeof window.REDUCED === 'undefined') {
    window.REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ===== Paragraph Blank Parser =====
  if (typeof window.parseParaBlanks !== 'function') {
    window.parseParaBlanks = function (text) {
      const raw = String(text == null ? '' : text);
      const parts = raw.split(/____(.+?)____/g);
      const blanks = [];
      let html = '';
      parts.forEach((part, i) => {
        if (i % 2 === 0) {
          html += window.esc(part);
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

  // ===== Audio SFX =====
  let audioCtx = null;
  let soundOn = localStorage.getItem('lwm-sound') !== '0';
  function ctx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function tone(freq, delay, dur, type, vol) {
    if (!soundOn) return;
    try {
      const c = ctx(), t = c.currentTime + delay;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || .18, t + .02);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t); o.stop(t + dur + .05);
    } catch (e) {}
  }
  window.sfxTick    = () => tone(740, 0, .06, 'sine', .07);
  window.sfxCorrect = () => { tone(659.25,0,.14); tone(830.61,.09,.14); tone(987.77,.18,.22); };
  window.sfxWrong   = () => { tone(233.08,0,.2,'sawtooth',.1); tone(164.81,.17,.32,'sawtooth',.1); };
  window.sfxFanfare = () => [523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,i*.11,.25));
  window.getSoundOn = () => soundOn;
  window.setSoundOn = v => { soundOn = !!v; localStorage.setItem('lwm-sound', soundOn ? '1' : '0'); };

  // ===== Toast =====
  let toastTimer;
  window.showToast = function (html, type) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.innerHTML = html;
    el.className = 'toast show ' + (type || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1900);
  };

  // ===== Modal =====
  let modalAction = null;
  window.openModal = function (title, msg, okText, cb) {
    const m = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMsg').textContent = msg;
    document.getElementById('modalOk').textContent = okText;
    modalAction = cb;
    m.hidden = false;
  };
  window.closeModal = function () {
    document.getElementById('modal').hidden = true;
    modalAction = null;
  };
  window.getModalAction = () => modalAction;

  // ===== Confetti =====
  window.launchConfetti = function () {
    if (window.REDUCED) return;
    const cv = document.getElementById('confettiCanvas');
    if (!cv) return;
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
  };

  // ===== Review Card Helper =====
  window.reviewCard = function (partName, qText, chosen, right, vi, ex, q) {
    const esc = window.esc;
    const art = document.createElement('article');
    art.className = 'review-item';
    let qHtml = window.formatMarkedText(qText || '').split('____').join('<span class="blank">&nbsp;</span>');
    if (q && (q._partType === 'synonym' || q._partType === 'antonym') && q.keyword) {
      const regex = new RegExp('\\b' + q.keyword.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\b','i');
      qHtml = qHtml.replace(regex, '<mark>' + q.keyword + '</mark>');
    }
    // 🖼️ Hiển thị hình cho dạng mcq-img khi review
    let imgHtml = '';
    if (q && q._partType === 'mcq-img') {
      const src = q.img || q.image;
      if (src) {
        imgHtml =
          '<div style="text-align:center;margin:10px 0">' +
            '<img src="' + esc(src) + '" alt="Hình câu hỏi" loading="lazy" ' +
              'style="max-width:100%;max-height:220px;padding:4px;background:#fff;' +
              'border:2px solid var(--primary-soft,#e4e0fb);border-radius:10px;object-fit:contain">' +
          '</div>';
      }
    }
    art.innerHTML =
      '<div class="review-head"><span class="badge-wrong">Chưa đúng</span>' +
      '<span style="font-family:Space Mono,monospace;font-size:.75rem;color:var(--ink-faint)">' + esc(partName || '') + '</span></div>' +
      '<p class="review-q">' + qHtml + '</p>' +
      imgHtml +
      '<div class="review-ans wrong">❌ Em chọn: <b>&nbsp;' + window.formatMarkedText(chosen) + '</b></div>' +
      '<div class="review-ans right">✅ Đáp án: <b>&nbsp;' + window.formatMarkedText(right) + '</b></div>' +
      (vi ? '<p class="review-vi">🇻🇳 ' + esc(vi) + '</p>' : '') +
      (ex ? '<p class="review-ex">💡 ' + esc(ex) + '</p>' : '');
    return art;
  };

  // ===== Para Review Helper =====
  window.paraReviewHtml = function (item, ans) {
    const esc = window.esc;
    const chosenArr = String((ans && ans.chosen) || '').split(' | ');
    const raw = String(
      item.text != null ? item.text :
      (item.passage != null ? item.passage : (item.q || ''))
    );
    const parts = raw.split(/____(.+?)____/g);
    let html = '';
    let bIdx = 0;
    parts.forEach((part, i) => {
      if (i % 2 === 0) { html += esc(part); }
      else {
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
  };

  // ===== Type Registry =====
  window.QuizTypes = window.QuizTypes || {};
})();
