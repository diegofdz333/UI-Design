const signature = [1, 0, 1, 1, 0, 1];
const tempo = 500;
const noteImage = "/static/images/quarterNote.png";
const restImage = "/static/images/restNote.png";

const noteTrack = document.getElementById("note-track");
const feedback = document.getElementById("feedback");
const tapButton = document.getElementById("tapButton");

let expectedHits = [];
let playStartTime;
let gameRunning = false;
let tapIntervalId;

function playAudio(src) {
  const audio = new Audio(src);
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

function startGame() {
  renderTrack();
  feedback.textContent = "Listen carefully!";
  for (let i = 0; i < signature.length; i++) {
    if (signature[i] === 1) {
      setTimeout(() => playAudio("/static/audio/note.mp3"), i * tempo);
    }
  }

  // Start user input phase after initial playback
  setTimeout(() => {
    feedback.textContent = "Now you try! Press SPACE or Tap!";
    gameRunning = true;
    playStartTime = performance.now();
    expectedHits = signature.map((val, i) =>
      val === 1 ? { time: playStartTime + i * tempo, hit: false } : null
    );

    // Start background beat
    let beatIndex = 0;
    tapIntervalId = setInterval(() => {
      if (beatIndex >= signature.length) {
        clearInterval(tapIntervalId);
      } else {
        playAudio("/static/audio/tap.wav");
        beatIndex++;
      }
    }, tempo);

    // End game after full length
    setTimeout(() => {
      gameRunning = false;
      feedback.textContent = "Done!";
    }, signature.length * tempo);
  }, signature.length * tempo + 500);
}

function registerTap() {
  if (!gameRunning) return;
  const now = performance.now();
  let hit = false;
  for (const expected of expectedHits) {
    if (expected && !expected.hit && Math.abs(now - expected.time) <= 150) {
      expected.hit = true;
      hit = true;
      break;
    }
  }
  if (!hit) {
    playAudio("/static/audio/fail.mp3");
    feedback.textContent = "Miss!";
    setTimeout(() => feedback.textContent = "", 500);
  }
}

// Input listeners
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    registerTap();
  }
});

tapButton.addEventListener("click", registerTap);

// Auto start game
startGame();