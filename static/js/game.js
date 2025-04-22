const signature = [1, 1, 1, 1, 1, 1];
const tempo = 500;
const noteImage = "/static/images/quarterNote.png";
const restImage = "/static/images/restNote.png";
const redNoteImage = "/static/images/quarterNoteRed.png";

const threshold = 250;

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
      playAudio("/static/audio/tap.wav", 0.2);
    }, i * tempo);
    if (signature[i] === 1) {
      setTimeout(() => {
        playAudio("/static/audio/note.mp3");
      }, i * tempo);
    }
  }
}

function startGame() {
  renderTrack();

  playIntermissionAudio();

  setTimeout(() => playQueue(), 1000);

  playIntermissionAudio(signature.length * tempo + 1000)

  // Start user input phase after initial playback
  setTimeout(() => {
    feedback.textContent = "Now you try! Press SPACE or Tap!";
    gameRunning = true;
    playStartTime = performance.now() + tempo;
    expectedHits = signature.map((val, i) =>
      val === 1 ? { time: playStartTime + i * tempo, hit: false } : null
    );

    for (let i = 0; i < signature.length; i++) {
      setTimeout(() => {
        // play backing tap noise
        playAudio("/static/audio/tap.wav", 0.2);
        const now = performance.now();
        console.log(now - expectedHits[i].time)

        // highlight current note
        const img = noteTrack.children[i];
        if (signature[i] === 1 && img) {
          img.src = redNoteImage;
          setTimeout(() => {
            img.src = noteImage;
          }, threshold);
        }

        setTimeout(() => {
          if (!expectedHits[i].hit) {
            playAudio("/static/audio/fail.mp3");
          }
        }, threshold + 50)
      }, (i + 1) * tempo);
    }

    // End game after full length
    setTimeout(() => {
      gameRunning = false;
      feedback.textContent = "Done!";
    }, signature.length * tempo);
  }, signature.length * tempo + 1000 + tempo);
}

function registerTap() {
  if (!gameRunning) return;
  const now = performance.now();
  let hit = false;
  for (const expected of expectedHits) {
    if (expected && !expected.hit && Math.abs(now - expected.time) <= threshold) {
      expected.hit = true;
      hit = true;
      playAudio("/static/audio/note.mp3");
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