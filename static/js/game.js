// static/js/game.js

// Audio & Timing Setup ------------------------------------------------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// 🛠️ AUTOPLAY WORKAROUND: resume on first gesture
let _audioResumed = false;
function ensureAudioContextResumed() {
  if (!_audioResumed && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  _audioResumed = true;
}

// Buffers: click, system tone, user tone, countdown bell
let clickBuffer, systemBuffer, userBuffer, countdownBuffer;
async function loadAudio(url) {
  const resp = await fetch(url);
  const data = await resp.arrayBuffer();
  return await audioCtx.decodeAudioData(data);
}
Promise.all([
  loadAudio('/static/audio/tap.wav'),        // metronome click
  loadAudio('/static/audio/note.mp3'),       // system reference tone
  loadAudio('/static/audio/user.mp3'),       // user feedback tone
  loadAudio('/static/audio/countdown.mp3')   // countdown bell
]).then(buffers => {
  [clickBuffer, systemBuffer, userBuffer, countdownBuffer] = buffers;
});

// Play with optional gain
function playBuffer(buffer, when = audioCtx.currentTime, gainValue = 1.0) {
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = gainValue;
  src.connect(gainNode).connect(audioCtx.destination);
  src.start(when);
}
const playClickAt       = t => playBuffer(clickBuffer,     t, 0.3);
const playSystemNoteAt  = t => playBuffer(systemBuffer,    t, 1.0);
const playUserNoteAt    = t => playBuffer(userBuffer,      t, 1.0);
const playCountdownAt   = t => playBuffer(countdownBuffer, t, 1.0);

// Schedule a visual callback in sync with audio clock
function scheduleVisual(audioTime, callback) {
  const delay = Math.max(0, (audioTime - audioCtx.currentTime) * 1000);
  setTimeout(callback, delay);
}

// Game Constants & State ---------------------------------------------
const LIVES          = 5;
const INITIAL_SCORE  = 0;
const INITIAL_LEVEL  = 1;
const INITIAL_SIGLEN = 6;
const BPM            = 60;   // slowed for comfort
const PERFECT_MS = 200;
const ALMOST_MS  = 500;  // almost window

const STATES = {
  TUTORIAL:  'TUTORIAL',
  DEMO:      'DEMO',
  COUNTDOWN: 'COUNTDOWN',
  PLAY:      'PLAY',
  ENDROUND:  'ENDROUND',
  GAMEOVER:  'GAMEOVER'
};

let currentState, lives, score, level, sigLen, beatDur, pattern;
let expectedHits, phaseStartTime;

// UI Elements ---------------------------------------------------------
const body       = document.body;
const noteTrack  = document.getElementById('note-track');
const feedback   = document.getElementById('feedback');
const tapButton  = document.getElementById('tapButton');
const stageLabel = document.getElementById('stage-label');
const scoreEl    = document.getElementById('score');
const livesEl    = document.getElementById('lives');

const QUARTER_NOTE_IMG = '/static/images/quarterNote.png';
const QUARTER_REST_IMG = '/static/images/quarterRest.png';
const EIGHTH_NOTE_IMG  = '/static/images/eighthNote.png';
const EIGHTH_REST_IMG  = '/static/images/eighthRest.png';

// Initialization ------------------------------------------------------
function initGame() {
  lives     = LIVES;
  score     = INITIAL_SCORE;
  level     = INITIAL_LEVEL;
  sigLen    = INITIAL_SIGLEN;
  beatDur   = 60 / BPM;  // seconds per beat
  updateUI();
  currentState = STATES.TUTORIAL;
  showTutorial();
}
window.addEventListener('DOMContentLoaded', initGame);

// Tutorial Overlay ----------------------------------------------------
// static/js/game.js

// Tutorial Overlay ----------------------------------------------------
// Updated Tutorial Phase with Feedback Logic
// static/js/game.js
// ✅ Updated showTutorial function
function showTutorial() {
  currentState = STATES.TUTORIAL;
  ensureAudioContextResumed();

  const overlay = document.createElement('div');
  overlay.className = 'overlay tutorial';
  document.body.appendChild(overlay);

  const title = document.createElement('h2');
  title.textContent = 'Tutorial';
  title.style.cssText = 'color:#fff;font-size:2.5em;margin:1em 0;';
  overlay.appendChild(title);

  const bar = document.createElement('div');
  bar.className = 'note-track';
  bar.style.cssText = 'background:#f0f0f0;padding:1em;border-radius:14px;display:inline-flex;gap:1.5em;';
  overlay.appendChild(bar);

  const tapOverlay = document.createElement('button');
  tapOverlay.textContent = 'Tap! / Space';
  tapOverlay.className = 'tap-button';
  tapOverlay.style.margin = '1em 0';
  overlay.appendChild(tapOverlay);

  const arrow = document.createElement('div');
  arrow.textContent = '⬇ 点击音符或按 空格';
  arrow.style.cssText = 'color:#fff;font-size:1em;animation:pulse 1s infinite;';
  overlay.appendChild(arrow);

  const ctrl = document.createElement('div');
  ctrl.className = 'tooltip-controls';
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn-next';
  nextBtn.textContent = 'Next';
  nextBtn.style.cssText = 'font-size:1.1em;margin-right:.5em;';
  const skipBtn = document.createElement('button');
  skipBtn.className = 'btn-skip';
  skipBtn.textContent = 'Skip';
  skipBtn.style.fontSize = '1.1em';
  ctrl.append(nextBtn, skipBtn);
  overlay.appendChild(ctrl);

  const notes = [
    { type: 'quarter', isNote: true,  src: QUARTER_NOTE_IMG, msg: '🎹🔔 Quarter note: One Tap per Beat' },
    { type: 'quarter', isNote: false, src: QUARTER_REST_IMG, msg: '🔕 Quarter Rest: No Tap per Beat' },
    { type: 'eighth',  isNote: true,  src: EIGHTH_NOTE_IMG,  msg: '🎹🎹🔔 Two Eighth Notes: Two Taps Per Beat' }
  ];

  let idx = 0;
  let tapCount = 0;
  let selectedImg = null;

  const icons = notes.map((note, i) => {
    const img = document.createElement('img');
    img.src = note.src;
    img.className = 'note-image';
    img.style.cursor = 'pointer';
    bar.appendChild(img);

    img.addEventListener('click', () => {
      icons.forEach((ic, j) => {
        ic.classList.remove('perfect-hit', 'missed-hit', 'highlight-target');
        ic.style.opacity = j === i ? '1' : '0.3';
        ic.style.transform = 'scale(1)';
      });
      selectedImg = img;
      tapCount = 0;
      img.classList.remove('confirmed-hit');
      img.classList.add('highlight-target');
      img.style.transform = 'scale(1.6)';

      const t = audioCtx.currentTime;
      if (note.type === 'quarter' && note.isNote) {
        playSystemNoteAt(t);
        playClickAt(t);
      } else if (note.type === 'eighth') {
        playSystemNoteAt(t);
        playSystemNoteAt(t + beatDur / 2);
        playClickAt(t);
      } else {
        playClickAt(t);
      }

      arrow.textContent = notes[i].msg;
      idx = i;
    });
    return img;
  });

  function giveFeedback(hit) {
    if (!selectedImg) return;
    playUserNoteAt(audioCtx.currentTime);
    if (hit) {
      selectedImg.classList.add('perfect-hit');
      setTimeout(() => {
        selectedImg.classList.remove('perfect-hit');
        selectedImg.classList.add('confirmed-hit');  // ✅ 永久绿色高亮
      }, 300);
    } else {
      selectedImg.classList.add('missed-hit');
      setTimeout(() => selectedImg.classList.remove('missed-hit'), 300);
    }
  }

  function onUserTap() {
    const note = notes[idx];
    if (note.type === 'quarter' && note.isNote) {
      giveFeedback(true);
    } else if (note.type === 'eighth' && note.isNote) {
      tapCount++;
      if (tapCount >= 2) {
        giveFeedback(true);
      }
    } else if (!note.isNote) {
      giveFeedback(false);
    }
  }

  function nextStep() {
    const note = notes[idx];
  
    if (!note.isNote && selectedImg && !selectedImg.classList.contains('confirmed-hit')) {
      selectedImg.classList.add('confirmed-hit');
    }
  
    idx++;
    if (idx >= notes.length) return finishTutorial();
    icons[idx].click();
  }

  function finishTutorial() {
    document.removeEventListener('keydown', onSpace);
    tapOverlay.removeEventListener('click', onUserTap);
    overlay.remove();
    startDemo();
  }

  function onSpace(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      onUserTap();
    }
  }

  tapOverlay.addEventListener('click', onUserTap);
  document.addEventListener('keydown', onSpace);
  nextBtn.addEventListener('click', nextStep);
  skipBtn.addEventListener('click', finishTutorial);

  icons[0].click();
}

// DEMO Phase ----------------------------------------------------------
function startDemo() {
  currentState = STATES.DEMO;
  // build pattern: quarter or eighth, note or rest
  pattern = Array.from({ length: sigLen }, () => {
    const type = Math.random() < 0.3 ? 'eighth' : 'quarter';
    let note = Math.random() < 0.75;
    if (type === 'eighth') note = true; // ✅ 不允许 eighth rest
    return { type, note };
  });  
  renderPattern();

  feedback.textContent   = 'Listening…';
  
  document.getElementById('mode-title').textContent = 'Demo Mode';
  const bpmNow = Math.min(BPM + (level - 1) * 20, 200);
  stageLabel.textContent = `Level ${level} — ${bpmNow} BPM`;


  phaseStartTime         = audioCtx.currentTime + 0.1;

  pattern.forEach((e, i) => {
    const baseTime = phaseStartTime + i * beatDur;

    // metronome click + visual ghost at the start of every beat
    playClickAt(baseTime);
    scheduleVisual(baseTime, () => {
      const img = noteTrack.children[i];
      img.classList.add('system-hit');
      setTimeout(() => img.classList.remove('system-hit'), 250);
    });

    // if it's a rest, we still want to ghost‐highlight at the half‐beat for eighth‐rests
    if (!e.note) {
      if (e.type === 'eighth') {
        scheduleVisual(baseTime + 0.5 * beatDur, () => {
          const img = noteTrack.children[i];
          img.classList.add('system-hit');
          setTimeout(() => img.classList.remove('system-hit'), 250);
        });
      }
      return;
    }

    // for actual notes:
    if (e.type === 'quarter') {
      // one tone at the top of the beat
      playSystemNoteAt(baseTime + 0.01);
      scheduleVisual(baseTime + 0.01, () => {
        const img = noteTrack.children[i];
        img.classList.add('system-hit');
        setTimeout(() => img.classList.remove('system-hit'), 250);
      });
    } else {
      // two half-beat tones
      [0, 0.5].forEach(o => {
        const t = baseTime + o * beatDur;
        playSystemNoteAt(t + 0.01);
        scheduleVisual(t + 0.01, () => {
          const img = noteTrack.children[i];
          img.classList.add('system-hit');
          setTimeout(() => img.classList.remove('system-hit'), 250);
        });
      });
    }
  });

  // after demo → countdown
  const demoEnd = phaseStartTime + sigLen * beatDur;
  scheduleVisual(demoEnd + 0.1, startCountdown);
}


// COUNTDOWN -----------------------------------------------------------
function startCountdown() {
  currentState = STATES.COUNTDOWN;
  const overlayEl = document.createElement('div');
  overlayEl.className = 'overlay';
  const counterEl = document.createElement('div');
  counterEl.id = 'countdown-number';
  overlayEl.append(counterEl);
  body.appendChild(overlayEl);

  const startTime = audioCtx.currentTime + 0.05;
  playCountdownAt(startTime);

  const steps = [
    { text: '3', offset: 0.0 },
    { text: '2', offset: 0.9 },
    { text: '1', offset: 1.7 },
    { text: 'GO!', offset: 2.5 }
  ];
  steps.forEach(({ text, offset }) => {
    const t = startTime + offset;
    scheduleVisual(t, () => {
      counterEl.textContent = text;
      if (text === 'GO!') {
        setTimeout(() => overlayEl.remove(), 600);
        // **one-beat buffer** before play begins:
        scheduleVisual(t + beatDur + 0.1, startPlay);
      }
    });
  });
}

// PLAY Phase ----------------------------------------------------------
function startPlay() {
  ensureAudioContextResumed();
  currentState = STATES.PLAY;
  expectedHits = [];
  feedback.textContent   = 'Your Turn!';
  
  document.getElementById('mode-title').textContent = 'Play Mode';
  const bpmNow = Math.min(BPM + (level - 1) * 20, 200);
  stageLabel.textContent = `Level ${level} — ${bpmNow} BPM`;


  tapButton.disabled     = false;
  phaseStartTime         = audioCtx.currentTime + 0.1;

  // build expectedHits per cell
  pattern.forEach((e, i) => {
    const baseTime = phaseStartTime + i * beatDur;
    let slots = [];
    if (e.note) {
      if (e.type === 'quarter') {
        slots = [ baseTime ];
      } else {
        slots = [ baseTime, baseTime + 0.5 * beatDur ];
      }
    }
    expectedHits[i] = { slots, hitFlags: slots.map(() => false) };
  });

  // schedule metronome, ghost cues & passive misses
  pattern.forEach((e, i) => {
    const baseTime = phaseStartTime + i * beatDur;

    // click + flash
    playClickAt(baseTime);
    scheduleVisual(baseTime, () => {
      const img = noteTrack.children[i];
      img.classList.add('system-hit');
      setTimeout(() => img.classList.remove('system-hit'), 200);
    });

    if (e.note) {
      if (e.type === 'quarter') {
        playSystemNoteAt(baseTime + 0.01);
        scheduleVisual(baseTime + 0.01, () => {
          const img = noteTrack.children[i];
          img.classList.add('system-hit');
          setTimeout(() => img.classList.remove('system-hit'), 200);
        });
      } else {
        [0, 0.5].forEach(o => {
          const t = baseTime + o * beatDur;
          playSystemNoteAt(t + 0.01);
          scheduleVisual(t + 0.01, () => {
            const img = noteTrack.children[i];
            img.classList.add('system-hit');
            setTimeout(() => img.classList.remove('system-hit'), 200);
          });
        });
      }
    }

    // passive-miss visuals & life loss
    expectedHits[i].slots.forEach(slotTime => {
      scheduleVisual(slotTime + ALMOST_MS/1000 + 0.05, () => {
        const j = expectedHits[i].slots.indexOf(slotTime);
        if (!expectedHits[i].hitFlags[j]) {
          expectedHits[i].hitFlags[j] = true;
          loseLife();
          const img = noteTrack.children[i];
          img.classList.add('missed-hit');
          setTimeout(() => img.classList.remove('missed-hit'), 300);
        }
      });
    });
  });

  const playEnd = phaseStartTime + sigLen * beatDur;
  scheduleVisual(playEnd + ALMOST_MS/1000, endRound);
}

// END ROUND & GAME OVER ----------------------------------------------
function endRound() {
  currentState = STATES.ENDROUND;
  tapButton.disabled = true;
  const hits = expectedHits.reduce((sum, cell) =>
    sum + cell.hitFlags.filter(Boolean).length, 0
  );
  score += (550 - beatDur*1000) * hits;
  updateUI();
  if (lives <= 0) return showGameOver();

  const overlayEl = document.createElement('div');
  overlayEl.className = 'overlay';
  const msgEl = document.createElement('div');
  msgEl.textContent = 'Round Complete!';
  msgEl.style.cssText = 'color:#fff;font-size:2em;';
  overlayEl.append(msgEl);
  body.append(overlayEl);

  setTimeout(() => {
    overlayEl.remove();
    level++;
    const newBPM = BPM + (level - 1) * 20;
    beatDur = 60 / Math.min(newBPM, 200);
    if (level % 6 === 0) sigLen++;
    startDemo();
  }, 1500);
}

function showGameOver() {
  currentState = STATES.GAMEOVER;
  const overlayEl = document.createElement('div');
  overlayEl.className = 'overlay';
  const box = document.createElement('div');
  box.className = 'gameover-box';
  const msg = document.createElement('div');
  msg.className = 'gameover-message';
  msg.textContent = `Game Over! Final Score: ${score}`;
  const btns = document.createElement('div');
  btns.className = 'gameover-buttons';
  const restart = document.createElement('button');
  restart.className = 'tap-button';
  restart.textContent = 'Restart';
  restart.onclick = () => { overlayEl.remove(); initGame(); };
  const quit = document.createElement('button');
  quit.className = 'home-button';
  quit.textContent = 'Quit';
  quit.onclick = () => { window.location = '/'; };
  btns.append(restart, quit);
  box.append(msg, btns);
  overlayEl.append(box);
  body.append(overlayEl);
}

// Helpers -------------------------------------------------------------
function renderPattern() {
  noteTrack.innerHTML = '';
  pattern.forEach(e => {
    const img = document.createElement('img');
    img.src = e.type === 'quarter'
      ? (e.note ? QUARTER_NOTE_IMG : QUARTER_REST_IMG)
      : (e.note ? EIGHTH_NOTE_IMG   : EIGHTH_REST_IMG);
    img.className = 'note-image';
    noteTrack.append(img);
  });
}

function updateUI() {
  scoreEl.textContent = `Score: ${score}`;
  livesEl.innerHTML   = '';
  for (let i = 0; i < lives; i++) {
    const h = document.createElement('img');
    h.src = '/static/images/heart.png';
    h.alt = 'Life';
    h.style.cssText = 'width:24px;margin:0 4px;';
    livesEl.append(h);
  }
}

function loseLife() {
  if (lives > 0) {
    lives--;
    updateUI();
  }
}

// User Input ----------------------------------------------------------
function handleTap() {
  ensureAudioContextResumed();
  if (currentState !== STATES.PLAY) return;

  const now = audioCtx.currentTime;
  playUserNoteAt(now); // 播放音效立即安排，不等画面

  // 使用 requestAnimationFrame 让视觉反馈延迟一帧，避免与音频播放不同步
  requestAnimationFrame(() => {
    let best = { di: null, ds: null, diff: Infinity };

    // 找到最接近当前时间的未命中 slot
    expectedHits.forEach((cell, i) => {
      cell.slots.forEach((t, j) => {
        if (!cell.hitFlags[j]) {
          const d = Math.abs((t - now) * 1000);
          if (d < best.diff) best = { di: i, ds: j, diff: d };
        }
      });
    });

    let cssClass;
    if (best.di !== null && best.diff < ALMOST_MS) {
      // 命中目标
      const cell = expectedHits[best.di];
      cell.hitFlags[best.ds] = true; // ✅ 立即标记避免重复命中
      cssClass = best.diff <= PERFECT_MS ? 'perfect-hit' : 'almost-hit';
      score += cssClass === 'perfect-hit' ? 2 : 1;
    } else {
      // 完全 miss：判定最近音符为错误高亮
      const rel = (now - phaseStartTime) / beatDur;
      const nearest = Math.round(rel);
      best.di = Math.max(0, Math.min(pattern.length - 1, nearest));
      cssClass = 'missed-hit';
      loseLife();
    }

    // ✅ 只高亮一个 note
    const img = noteTrack.children[best.di];
    img.classList.add(cssClass);
    updateUI();
    setTimeout(() => img.classList.remove(cssClass), 300);
  });
}


tapButton.addEventListener('click', handleTap);
document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    ensureAudioContextResumed();
    e.preventDefault();
    handleTap();
  }
});
