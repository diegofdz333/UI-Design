const questions = [
  {
    // we'll ignore `audio` here and build the measure manually
    correct: 0,
    images: [
      "/static/placeholders/img1.jpg",
      "/static/placeholders/img2.jpg",
      "/static/placeholders/img3.jpg",
      "/static/placeholders/img4.jpg"
    ]
  },
  // … your other questions unchanged …
  {
    audio: "/static/audio/q2.mp3",
    correct: 2,
    images: [
      "/static/placeholders/img5.jpg",
      "/static/placeholders/img6.jpg",
      "/static/placeholders/img7.jpg",
      "/static/placeholders/img8.jpg"
    ]
  },
  // etc.
];

let currentQuestion = 0;
let score = 0;
const playAudioButton = document.getElementById("play-audio");
const questionHeader = document.getElementById("question-header");
const optionsContainer = document.getElementById("options-container");

let audio = null;
let playing = false;
let timeouts = [];

function clearScheduled() {
  timeouts.forEach(clearTimeout);
  timeouts = [];
}

function playRhythm() {
  const bpm = 60;               // 60 BPM → 1 beat/sec
  const beatMs = 60000 / bpm;   // ms per quarter note

  // Metronome clicks on every beat: 1, 2, 3, 4
  for (let i = 0; i < 4; i++) {
    timeouts.push(setTimeout(() => {
      new Audio("/static/audio/tap.wav").play();
    }, i * beatMs));
  }

  // Notes on 1, the “&” of 2 (i.e. 1.5), 3, and 4
  [0, 1.5 * beatMs, 2 * beatMs, 3 * beatMs].forEach(t => {
    timeouts.push(setTimeout(() => {
      new Audio("/static/audio/note.mp3").play();
    }, t));
  });

  // When the bar ends, reset
  timeouts.push(setTimeout(() => {
    playing = false;
    playAudioButton.style.backgroundImage = "url('/static/images/audioButton.png')";
  }, 4 * beatMs));
}

function renderQuestion() {
  const q = questions[currentQuestion];
  questionHeader.textContent = `Question ${currentQuestion + 1}: What do you hear?`;
  optionsContainer.innerHTML = "";

  q.images.forEach((src, idx) => {
    const img = document.createElement("img");
    img.src = src;
    img.onclick = () => handleAnswer(idx);
    optionsContainer.appendChild(img);
  });

  // reset any scheduled audio
  clearScheduled();
  playing = false;
  playAudioButton.style.backgroundImage = "url('/static/images/audioButton.png')";

  // for non-built rhythms, load the single clip
  if (q.audio) {
    audio = new Audio(q.audio);
  } else {
    audio = null;
  }
}

function handleAnswer(selectedIndex) {
  if (selectedIndex === questions[currentQuestion].correct) {
    score++;
  }
  currentQuestion++;
  // stop anything playing
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  } else {
    clearScheduled();
  }
  playing = false;
  playAudioButton.style.backgroundImage = "url('/static/images/audioButton.png')";

  if (currentQuestion < questions.length) {
    renderQuestion();
  } else {
    window.location.href = `/quiz_result?score=${score}`;
  }
}

playAudioButton.onclick = () => {
  // if we're already playing, stop everything
  if (playing) {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    } else {
      clearScheduled();
    }
    playing = false;
    playAudioButton.style.backgroundImage = "url('/static/images/audioButton.png')";
    return;
  }

  // start playback
  playing = true;
  playAudioButton.style.backgroundImage = "url('/static/images/stopButton.png')";

  if (currentQuestion === 0 && !questions[0].audio) {
    // first question: build our 1-measure rhythm
    playRhythm();
  } else if (audio) {
    // fallback: just play the single clip
    audio.currentTime = 0;
    audio.play();
    audio.onended = () => {
      playing = false;
      playAudioButton.style.backgroundImage = "url('/static/images/audioButton.png')";
    };
  }
};

renderQuestion();
