const questions = [
    {
      audio: "/static/audio/ballad.mp3",
      correct: 0,
      images: [
        "/static/placeholders/img1.jpg",
        "/static/placeholders/img2.jpg",
        "/static/placeholders/img3.jpg",
        "/static/placeholders/img4.jpg"
      ]
    },
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
    {
      audio: "/static/audio/q3.mp3",
      correct: 1,
      images: [
        "/static/placeholders/img9.jpg",
        "/static/placeholders/img10.jpg",
        "/static/placeholders/img11.jpg",
        "/static/placeholders/img12.jpg"
      ]
    },
    {
      audio: "/static/audio/q4.mp3",
      correct: 3,
      images: [
        "/static/placeholders/img13.jpg",
        "/static/placeholders/img14.jpg",
        "/static/placeholders/img15.jpg",
        "/static/placeholders/img16.jpg"
      ]
    },
    {
      audio: "/static/audio/q5.mp3",
      correct: 2,
      images: [
        "/static/placeholders/img17.jpg",
        "/static/placeholders/img18.jpg",
        "/static/placeholders/img19.jpg",
        "/static/placeholders/img20.jpg"
      ]
    }
  ];

  let currentQuestion = 0;
  let score = 0;
  const playAudioButton = document.getElementById("play-audio");
  const questionHeader = document.getElementById("question-header");
  const optionsContainer = document.getElementById("options-container");

  let audio = new Audio();
  let playing = false;

  function renderQuestion() {
    const q = questions[currentQuestion];
    questionHeader.textContent = `Question ${currentQuestion + 1}: What do you hear?`;
    optionsContainer.innerHTML = "";

    q.images.forEach((src, index) => {
      const img = document.createElement("img");
      img.src = src;
      img.onclick = () => handleAnswer(index);
      optionsContainer.appendChild(img);
    });

    playAudioButton.style.backgroundImage = "url('/static/images/audioButton.png')";
    audio = new Audio(q.audio);
    playing = false;
  }

  function handleAnswer(selectedIndex) {
    if (selectedIndex === questions[currentQuestion].correct) {
      score++;
    }
    currentQuestion++;
    audio.pause();
      audio.currentTime = 0;
      playing = false;
      playAudioButton.style.backgroundImage = "url('/static/images/audioButton.png')";
    if (currentQuestion < questions.length) {
      renderQuestion();
    } else {
      window.location.href = `/quiz_result?score=${score}`;
    }
  }

  playAudioButton.onclick = () => {
    if (!playing) {
      audio.currentTime = 0;
      audio.play();
      playing = true;
      playAudioButton.style.backgroundImage = "url('/static/images/stopButton.png')";
      audio.onended = () => {
        playing = false;
        playAudioButton.style.backgroundImage = "url('/static/images/audioButton.png')";
      };
    } else {
      audio.pause();
      audio.currentTime = 0;
      playing = false;
      playAudioButton.style.backgroundImage = "url('/static/images/audioButton.png')";
    }
  };

  renderQuestion();