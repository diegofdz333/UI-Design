let lives = 5;
let score = 0;
let level = 0;
let signature = [];
let sigLength = 6;
let tempo = 500;

let introTimeouts = [];
let playingIntro = false;

const noteImage = "/static/images/quarterNote.png";
const restImage = "/static/images/restNote.png";
const redNoteImage = "/static/images/quarterNoteRed.png";

const threshold = 150;

const noteTrack = document.getElementById("note-track");
const feedback = document.getElementById("feedback");
const tapButton = document.getElementById("tapButton");
const stageLabel = document.getElementById("stage-label");
const character = document.getElementById("character");

let expectedHits = [];
let playStartTime;
let gameRunning = false;

function generateSignature(length = 6) {
  const sig = [];
  for (let i = 0; i < length; i++) {
    sig.push(Math.random() < 0.75 ? 1 : 0); // 75% chance for a note
  }
  return sig;
}

function playAudio(src, vol = 1.0) {
  const audio = new Audio(src);
  audio.volume = vol;
  audio.play();
}

function renderTrack() {
  noteTrack.innerHTML = "";
  for (let i = 0; i < signature.length; i++) {
    const img = document.createElement("img");
    img.src = signature[i] === 1 ? noteImage : restImage;
    img.className = "note-image";
    noteTrack.appendChild(img);
  }
}

const intermissionSteps = 4;
function playIntermissionAudio(wait = 0) {
  setTimeout(() => {
    for (let i = 0; i < intermissionSteps; i++) {
      setTimeout(() => {
        playAudio("/static/audio/tap.wav", 0.2);
      }, i * tempo);
    }
  }, wait);
  return intermissionSteps * tempo;
}

function playQueue(wait = 0) {
  setTimeout(() => {
    feedback.textContent = "Listen carefully!";
    for (let i = 0; i < sigLength; i++) {
      setTimeout(() => {
        const img = noteTrack.children[i];
        if (img) {
          img.classList.add("highlighted");
          setTimeout(() => img.classList.remove("highlighted"), threshold * 2);
        }
      }, i * tempo);
      setTimeout(() => {
        playAudio("/static/audio/tap.wav", 0.2);
        if (signature[i] === 1) 
          playAudio("/static/audio/note.mp3");
      }, i * tempo + threshold);
    }
  }, wait - threshold);
  return sigLength * tempo;
}

function playIntro() {
  playingIntro = true;
  let waitTime = 0;
  console.log(1)
  introTimeouts.push(setTimeout(() => {
    feedback.textContent = "Welcome to Rhythm Rhythm!";
  }, waitTime));
  waitTime += 5000;
  console.log(2)
  introTimeouts.push(setTimeout(() => {
    feedback.textContent = "In this game you will need to click the \"Tap!\" buttor or spacebar to the rhythm";
  }, waitTime));
  waitTime += 5000;
  console.log(3)
  introTimeouts.push(setTimeout(() => {
    feedback.textContent = "Each round, you will see the signature you need to follow";
    signature = generateSignature(6);
    updateUI();
    renderTrack();
  }, waitTime));
  waitTime += 5000;
  introTimeouts.push(setTimeout(() => {
    feedback.textContent = "You will then hear what you have to replicate after a queue.";
    playIntermissionAudio();
  }, waitTime));
  waitTime += 5000;
  introTimeouts.push(setTimeout(() => {
    let wait2 = playIntermissionAudio()
    playQueue(wait2)
  }, waitTime));
  waitTime += 7000;
  introTimeouts.push(setTimeout(() => {
    console.log("Intro")
    feedback.textContent = "After another sound prompt you will have to replicate what you heard";
    playIntermissionAudio();
  }, waitTime));
  waitTime += 5000;
  introTimeouts.push(setTimeout(() => {
    console.log("Intro 2")
    feedback.textContent = "Good Luck!";
  }, waitTime));
  waitTime += 5000;
 
  introTimeouts.push(setTimeout(() => {
    if (playingIntro) {
      startGame();
    }
    playingIntro = false;
  }, waitTime));
}

function startGame(round = 0) {
  console.log("Start Game")
  signature = generateSignature(sigLength);
  updateUI();
  renderTrack();

  let wait = 0;

  wait += playIntermissionAudio();
  wait += playQueue(wait);  
  wait += playIntermissionAudio(wait);

  // Start user input phase after playback
  setTimeout(() => {
    feedback.textContent = "Now you try! Press SPACE or Tap!";
    stageLabel.textContent = "🎮 Your Turn";
    gameRunning = true;
    playStartTime = performance.now();

    expectedHits = signature.map((val, i) =>
      val === 1
        ? {
            time: playStartTime + i * tempo,
            hit: false,
            missed: false,
          }
        : null
    );

    for (let i = 0; i < signature.length; i++) {
      setTimeout(() => {
        const img = noteTrack.children[i];
        if (img) {
          img.classList.add("highlighted");
          setTimeout(() => {
            img.classList.remove("highlighted")
          }, threshold * 2);
        }
      }, i * tempo - threshold);
    }

    for (let i = 0; i < signature.length; i++) {
      setTimeout(() => {
        playAudio("/static/audio/tap.wav", 0.2);
        const now = performance.now();
        console.log(now - expectedHits[i].time)

        setTimeout(() => {
          if (expectedHits[i] && !expectedHits[i].hit && !expectedHits[i].missed) {
            expectedHits[i].missed = true;
            playAudio("/static/audio/fail.mp3");
            loseLife();
          }
        }, threshold + 50);
      }, i * tempo);
    }

    setTimeout(() => {
      gameRunning = false;
      feedback.textContent = "Done!";
    endRound(round);
    }, signature.length * tempo);
  }, wait);
}

function registerTap() {
  if (!gameRunning) return;
  const now = performance.now();
  let miss = true;

  for (let i = 0; i < expectedHits.length; i++) {
    const expected = expectedHits[i];
    if (expected && !expected.hit && Math.abs(now - expected.time) <= threshold) {
      expected.hit = true;
      miss = false;
      playAudio("/static/audio/note.mp3");
      moveCharacterTo(noteTrack.children[i]);
      break;
    }
    if (expected && expected.miss && Math.abs(now - expected.time) <= threshold * 2) {
      miss = false;
      break;
    }
  }

  if (miss) {
    for (const expected of expectedHits) {
      if (expected && !expected.miss && Math.abs(now - expected.time) <= threshold * 2) {
        expected.miss = true;
        break;
      }
    }

    playAudio("/static/audio/fail.mp3");
    loseLife();
    feedback.textContent = "Miss!";
    setTimeout(() => (feedback.textContent = ""), 500);
  }
}

function moveCharacterTo(noteElement) {
  if (!noteElement || !character) return;

  const noteRect = noteElement.getBoundingClientRect();
  const trackRect = noteTrack.getBoundingClientRect();

  const offsetX = noteRect.left - trackRect.left + noteRect.width / 2 - 30;
  const offsetY = noteRect.top - trackRect.top - 70;

  character.style.left = `${offsetX}px`;
  character.style.top = `${offsetY}px`;
  character.classList.remove("hidden");

  character.classList.add("jump");
  setTimeout(() => character.classList.remove("jump"), 300);
}

function endRound(round = 0) {
  gameRunning = false;
  if (lives <= 0) {
    feedback.textContent = "Game Over!";
    stageLabel.textContent = "🛑 Game Over";
    return;
  }

  score += ( 100 * (550 - tempo)) * sigLength;
  level += 1;

  if (level % 3 === 0) {
    if (level % 6 === 0) {
      sigLength += 1;
    } else {
      tempo = Math.max(200, tempo - 50);
    }
  }

  updateUI();
  setTimeout(() => {
    startGame(round + 1); // loop to next level
  }, 0);
}

function loseLife() {
  lives--;
  updateUI();
  if (lives <= 0) {
    gameRunning = false;
    feedback.textContent = "Game Over!";
    stageLabel.textContent = "🛑 Game Over";
  }
}

function updateUI() {
  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");

  if (scoreEl) scoreEl.textContent = `Score: ${score}`;
  if (livesEl) {
    livesEl.innerHTML = "";
    for (let i = 0; i < lives; i++) {
      const img = document.createElement("img");
      img.src = "/static/images/heart.png";
      img.alt = "Heart";
      img.style.width = "30px";
      img.style.margin = "0 5px";
      livesEl.appendChild(img);
    }
  }
}

function registerTap() {
  if (!gameRunning) return;
  const now = performance.now();

  let closestIndex = -1;
  let minDiff = Infinity;

  for (let i = 0; i < expectedHits.length; i++) {
    const expected = expectedHits[i];
    if (expected && !expected.hit && !expected.miss) {
      const diff = Math.abs(now - expected.time);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
  }

  if (closestIndex === -1) return;

  const expected = expectedHits[closestIndex];
  const noteElement = noteTrack.children[closestIndex];

  moveCharacterTo(noteElement); // 先跳过去

  if (minDiff <= threshold) {
    expected.hit = true;
    playAudio("/static/audio/note.mp3");
    noteElement.classList.add("correct-hit");
    setTimeout(() => noteElement.classList.remove("correct-hit"), 400);
  } else {
    expected.miss = true;
    playAudio("/static/audio/fail.mp3");
    loseLife();
    feedback.textContent = "Miss!";
    noteElement.classList.add("missed-hit");
    setTimeout(() => {
      feedback.textContent = "";
      noteElement.classList.remove("missed-hit");
    }, 500);
  }
}

function moveCharacterTo(noteElement) {
  const character = document.getElementById("character");
  if (!noteElement || !character) return;

  const noteRect = noteElement.getBoundingClientRect();
  const trackRect = noteTrack.getBoundingClientRect();

  const offsetX = noteRect.left - trackRect.left + (noteRect.width / 2) - (character.width / 2);
  const offsetY = noteRect.top - trackRect.top - character.height + 10;

  character.style.left = `${offsetX}px`;
  character.style.top = `${offsetY}px`;
  character.classList.remove("hidden");

  character.classList.add("jump");
  setTimeout(() => character.classList.remove("jump"), 300);
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    skipIntro = true;
    registerTap();
  }
  if (playingIntro) {
    playingIntro = false;
    for (timeout in introTimeouts) {
      clearTimeout(timeout);
    }
    startGame();
  }
});

tapButton.addEventListener("click", registerTap);

// Auto start game
playIntro();