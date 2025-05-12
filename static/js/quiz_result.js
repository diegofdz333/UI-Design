// Parse score from query string
const params = new URLSearchParams(window.location.search);
const score = params.get("score") || 0;
const highScore = {{ high_score | tojson }};

document.getElementById("score").textContent = `You got ${score} / 4 correct!`;
document.getElementById("highScore").textContent = `Highest Score : ${high_score}`;