    // Parse score from query string
    const params = new URLSearchParams(window.location.search);
    const score = params.get("score") || 0;
    document.getElementById("score").textContent = `You got ${score} / 4 correct!`;