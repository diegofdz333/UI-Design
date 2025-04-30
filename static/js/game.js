let lives = 5;
let score = 0;
let level = 0;
let signature = [];
let sigLength = 6;
let tempo = 500;

let introTimeouts = [];
let playingIntro = false;

function generateSignature(length = 6) {
  const sig = [];
  for (let i = 0; i < length; i++) {
    sig.push(Math.random() < 0.75 ? 1 : 0); // 75% chance for a note
  }
  return sig;
}
const noteImage = "/static/images/quarterNote.png";
const restImage = "/static/images/restNote.png";
const redNoteImage = "/static/images/quarterNoteRed.png";

const threshold = 150;

const noteTrack = document.getElementById("note-track");
const feedback = document.getElementById("feedback");
const tapButton = document.getElementById("tapButton");

let expectedHits = [];
let playStartTime;
let gameRunning = false;
let tapIntervalId;

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

function playIntermissionAudio(wait = 0) {
  setTimeout(() => {
    for (let i = 0; i < 3; i++)  {
      setTimeout(() => {
        playAudio("/static/audio/tap.wav", 0.2 * (i + 1));
      }, i * 150);
    }
  }, wait)
}

function playQueue() {
  feedback.textContent = "Listen carefully!";

  for (let i = 0; i < signature.length; i++) {
    setTimeout(() => {
      // highlight current note
      const img = noteTrack.children[i];
      if (signature[i] === 1 && img) {
        img.src = redNoteImage;
        setTimeout(() => {
          img.src = noteImage;
        }, threshold * 2);
      }
    }, i * tempo);
  }

  for (let i = 0; i < sigLength; i++) {
    setTimeout(() => {
      playAudio("/static/audio/tap.wav", 0.2);
    }, i * tempo + threshold);
    if (signature[i] === 1) {
      setTimeout(() => {
        playAudio("/static/audio/note.mp3");
      }, i * tempo + threshold);
    }
  }
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
    playIntermissionAudio()
    setTimeout(() => playQueue(), 1000);
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
  console.log("Start Game: " + round)
  signature = generateSignature(sigLength);
  updateUI();
  renderTrack();

  playIntermissionAudio();

  setTimeout(() => playQueue(), 1000 - threshold);

  playIntermissionAudio(signature.length * tempo + 1000)

  // Start user input phase after initial playback
  setTimeout(() => {
    feedback.textContent = "Now you try! Press SPACE or Tap!";
    gameRunning = true;
    playStartTime = performance.now() + tempo;
    expectedHits = signature.map((val, i) =>
      val === 1 ? { 
        time: playStartTime + i * tempo,
        hit: false,
        missed: false,
      } : null
    );

    for (let i = 0; i < signature.length; i++) {
      setTimeout(() => {
        // highlight current note
        const img = noteTrack.children[i];
        if (signature[i] === 1 && img) {
          img.src = redNoteImage;
          setTimeout(() => {
            img.src = noteImage;
          }, threshold * 2);
        }
      }, (i + 1) * tempo - threshold);
    }

    for (let i = 0; i < signature.length; i++) {
      setTimeout(() => {
        // play backing tap noise
        playAudio("/static/audio/tap.wav", 0.2);
        const now = performance.now();

        setTimeout(() => {
          if (!expectedHits[i].hit && !expectedHits[i].missed) {
            expectedHits[i].missed = true;
            playAudio("/static/audio/fail.mp3");
            loseLife();
          }
        }, threshold + 50)
      }, (i + 1) * tempo);
    }

    // End game after full length
    setTimeout(() => {
      gameRunning = false;
      feedback.textContent = "Done!";
    endRound(round);
    }, signature.length * tempo);
  }, signature.length * tempo + 1000 + tempo);
}

function registerTap() {
  if (!gameRunning) return;
  const now = performance.now();
  let miss = true;
  for (const expected of expectedHits) {
    if (expected && !expected.hit && Math.abs(now - expected.time) <= threshold) {
      expected.hit = true;
      miss = false;
      playAudio("/static/audio/note.mp3");
      break;
    }
    // Give leaway in double counting misses
    if (expected && expected.miss && Math.abs(now - expected.time) <= threshold * 2) {
      miss = false;
      break;
    }
  }
  if (miss) {
    // Give leaway in double counting misses
    for (const expected of expectedHits) {
      if (expected && !expected.miss && Math.abs(now - expected.time) <= threshold * 2) {
        expected.miss = true;
        break;
      }
    }

    playAudio("/static/audio/fail.mp3");
    loseLife();
    feedback.textContent = "Miss!";
    setTimeout(() => feedback.textContent = "", 500);
  }
}

// Input listeners
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

function endRound(round = 0) {
  gameRunning = false;
  if (lives <= 0) {
    feedback.textContent = "Game Over!";
    return;
  }

  score += (550 - tempo) * sigLength;
  level += 1;

  if (level % 3 == 0) {
    if (level % 6 == 0) {
      sigLength += 1;
    } else {
      tempo -= 50;
    }
  }

  updateUI();
  setTimeout(() => {
    startGame(round + 1); // loop to next level
  }, 1500);
}

function loseLife() {
  lives--;
  updateUI();
  if (lives <= 0) {
    gameRunning = false;
    feedback.textContent = "Game Over!";
  }
}

function updateUI() {
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  if (scoreEl) scoreEl.textContent = `Score: ${score}`;
  if (livesEl) {
    livesEl.innerHTML = '';
    for (let i = 0; i < lives; i++) {
      const img = document.createElement('img');
      img.src = '/static/images/heart.png';
      img.alt = 'Heart';
      img.style.width = '30px';
      img.style.margin = '0 5px';
      livesEl.appendChild(img);
    }
  }
}
