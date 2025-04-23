// quiz.js
// Five custom-built rhythm quiz questions (all using playRhythm)

const questions = [
  {
    // Original Question 1: one-measure rhythm (quarter, eighth, quarter, quarter)
    correct: 2,
    images: [
      "/static/quizChoices/rhythm-1.png",
      "/static/quizChoices/rhythm-2.png",
      "/static/quizChoices/rhythm-3.png",
      "/static/quizChoices/rhythm-4.png"
    ]
  },
  {
    // Question 2: syncopation on 1, & of 2, 3, 4
    correct: 0,
    images: [
      "/static/quizChoices/rhythm-1.png",
      "/static/quizChoices/rhythm-3.png",
      "/static/quizChoices/rhythm-4.png",
      "/static/quizChoices/rhythm-2.png"
    ]
  },
  {
    // Question 3: off-beat accents (& of 1, 2, & of 3, 4)
    correct: 1,
    images: [
      "/static/quizChoices/rhythm-4.png",
      "/static/quizChoices/rhythm-2.png",
      "/static/quizChoices/rhythm-1.png",
      "/static/quizChoices/rhythm-3.png"
    ]
  },
  {
    // Question 4: half-note pulse (beats 1 and 3 only)
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
const playAudioButton = document.getElementById("play-audio");
const questionHeader = document.getElementById("question-header");
const optionsContainer = document.getElementById("options-container");

let playing = false;
let timeouts = [];

function clearScheduled() {
  timeouts.forEach(clearTimeout);
  timeouts = [];
}

function playRhythm(offsetBeats) {
  const bpm = 60;
  const beatMs = 60000 / bpm;

  // Metronome click on every beat
  for (let i = 0; i < 4; i++) {
    timeouts.push(setTimeout(() => {
      new Audio("/static/audio/tap.wav").play();
    }, i * beatMs));
  }

  // Play notes at given offsets
  offsetBeats.forEach(beat => {
    timeouts.push(setTimeout(() => {
      new Audio("/static/audio/note.mp3").play();
    }, beat * beatMs));
  });

  // Reset after bar
  timeouts.push(setTimeout(() => {
    playing = false;
    playAudioButton.style.backgroundImage = "url('/static/images/audioButton.png')";
  }, 4 * beatMs));
}

function getPatternOffsets(idx) {
  const patterns = [
    [0, 2, 2.5, 3],
    [0, 1, 1.5, 3],
    [0, 1.5, 2, 3], 
    [0, 1, 1.5, 2, 3]
  ];
  return patterns[idx];
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

  clearScheduled();
  playing = false;
  playAudioButton.style.backgroundImage = "url('/static/images/audioButton.png')";

  // update progress bar here:
  document.getElementById("progress-bar").textContent = `Question ${currentQuestion + 1} of ${questions.length}`;

  // Update progress text
document.getElementById("progress-bar").textContent =
`Question ${currentQuestion + 1} of ${questions.length}`;

// Update visual progress fill
const percent = ((currentQuestion + 1) / questions.length) * 100;
document.getElementById("visual-fill").style.width = `${percent}%`;
}


function handleAnswer(selectedIndex) {
  if (selectedIndex === questions[currentQuestion].correct) score++;
  currentQuestion++;
  clearScheduled();
  playing = false;
  playAudioButton.style.backgroundImage = "url('/static/images/audioButton.png')";

  if (currentQuestion < questions.length) {
    renderQuestion();
  } else {
    window.location.href = `/quiz_result?score=${score}`;
  }
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

  const offsets = getPatternOffsets(currentQuestion);
  playRhythm(offsets);
};

// Start
renderQuestion();
