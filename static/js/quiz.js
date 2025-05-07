// quiz.js
// Five custom-built rhythm quiz questions (all using playRhythm)

const questions = [
  {
    correct: 2,
    images: [
      "/static/quizChoices/rhythm-1.png",
      "/static/quizChoices/rhythm-2.png",
      "/static/quizChoices/rhythm-3.png",
      "/static/quizChoices/rhythm-4.png"
    ]
  },
  {
    correct: 0,
    images: [
      "/static/quizChoices/rhythm-1.png",
      "/static/quizChoices/rhythm-3.png",
      "/static/quizChoices/rhythm-4.png",
      "/static/quizChoices/rhythm-2.png"
    ]
  },
  {
    correct: 1,
    images: [
      "/static/quizChoices/rhythm-4.png",
      "/static/quizChoices/rhythm-2.png",
      "/static/quizChoices/rhythm-1.png",
      "/static/quizChoices/rhythm-3.png"
    ]
  },
  {
    correct: 3,
    images: [
      "/static/quizChoices/rhythm-3.png",
      "/static/quizChoices/rhythm-1.png",
      "/static/quizChoices/rhythm-2.png",
      "/static/quizChoices/rhythm-4.png"
    ]
  },
];

let currentQuestion = 0;
let score = 0;

// we'll store this each time we shuffle
let shuffledCorrectIndex = null;

const playAudioButton   = document.getElementById("play-audio");
const questionHeader    = document.getElementById("question-header");
const optionsContainer  = document.getElementById("options-container");
const quizContainer     = document.querySelector(".quiz-container");

// positioning context for Next button
quizContainer.style.position = "relative";

// ——— Utility: Fisher–Yates shuffle ———
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ——— Create Next Question button ———
const nextButton = document.createElement("button");
nextButton.id          = "next-question-button";
nextButton.textContent = "Next Question";
Object.assign(nextButton.style, {
  position:     "absolute",
  bottom:       "0",
  borderRadius: "6px",   // match Quit button
  display:      "none"
});
quizContainer.appendChild(nextButton);

// compute horizontal position once
const GAP = 10; // px
const gridLeft  = optionsContainer.offsetLeft;
const gridWidth = optionsContainer.offsetWidth;
nextButton.style.left = `${gridLeft + gridWidth + GAP}px`;

// advance logic
nextButton.addEventListener("click", () => {
  nextButton.style.display = "none";
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    renderQuestion();
  } else {
    window.location.href = `/quiz_result?score=${score}`;
  }
});

let playing  = false;
let timeouts = [];

function clearScheduled() {
  timeouts.forEach(clearTimeout);
  timeouts = [];
}

function playRhythm(offsetBeats) {
  const bpm    = 60;
  const beatMs = 60000 / bpm;

  // metronome clicks
  for (let i = 0; i < 4; i++) {
    timeouts.push(setTimeout(() => {
      new Audio("/static/audio/tap.wav").play();
    }, i * beatMs));
  }

  // melody notes
  offsetBeats.forEach(beat => {
    timeouts.push(setTimeout(() => {
      new Audio("/static/audio/note.mp3").play();
    }, beat * beatMs));
  });

  // reset icon after bar
  timeouts.push(setTimeout(() => {
    playing = false;
    playAudioButton.style.backgroundImage = "url('/static/images/audioButton.png')";
  }, 4 * beatMs));
}

function getPatternOffsets(idx) {
  return [
    [0, 2,   2.5, 3],
    [0, 1,   1.5, 3],
    [0, 1.5, 2,   3],
    [0, 1,   1.5, 2, 3]
  ][idx];
}

function renderQuestion() {
  nextButton.style.display = "none";

  const q = questions[currentQuestion];

  // 1) grab the correct image src
  const correctSrc = q.images[q.correct];

  // 2) shuffle all images
  const shuffled = shuffleArray(q.images);

  // 3) find where the correct one landed
  shuffledCorrectIndex = shuffled.indexOf(correctSrc);

  // render
  questionHeader.textContent = `Question ${currentQuestion + 1}: What do you hear?`;
  optionsContainer.innerHTML = "";
  shuffled.forEach((src, idx) => {
    const img = document.createElement("img");
    img.src = src;
    img.onclick = () => handleAnswer(idx);
    optionsContainer.appendChild(img);
  });

  clearScheduled();
  playing = false;
  playAudioButton.style.backgroundImage = "url('/static/images/audioButton.png')";

  // update progress
  document.getElementById("progress-bar").textContent =
    `Question ${currentQuestion + 1} of ${questions.length}`;
  const pct = ((currentQuestion + 1) / questions.length) * 100;
  document.getElementById("visual-fill").style.width = `${pct}%`;
}

function handleAnswer(selectedIndex) {
  // disable all further clicks
  document.querySelectorAll(".options img").forEach(img => img.onclick = null);

  // correct / wrong highlight
  const images = document.querySelectorAll(".options img");
  if (selectedIndex === shuffledCorrectIndex) {
    images[selectedIndex].classList.add("correct");
    score++;
  } else {
    images[selectedIndex].classList.add("wrong");
    images[shuffledCorrectIndex].classList.add("correct");
  }

  clearScheduled();
  playing = false;
  playAudioButton.style.backgroundImage = "url('/static/images/audioButton.png')";

  // show the Next button
  nextButton.style.display = "inline-block";
}

playAudioButton.onclick = () => {
  if (playing) {
    clearScheduled();
    playing = false;
    playAudioButton.style.backgroundImage = "url('/static/images/audioButton.png')";
    return;
  }
  playing = true;
  playAudioButton.style.backgroundImage = "url('/static/images/stopButton.png')";
  playRhythm(getPatternOffsets(currentQuestion));
};

// start the first question
renderQuestion();
