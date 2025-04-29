window.addEventListener('DOMContentLoaded', () => {
    const audio = new Audio('/static/audio/background.mp3');
    audio.loop = true;
    let isPlaying = false;
  
    const toggleBtn = document.getElementById('music-toggle');
  
    toggleBtn.addEventListener('click', () => {
      if (!isPlaying) {
        audio.play();
        toggleBtn.textContent = '🔇 Music Off';
        isPlaying = true;
      } else {
        audio.pause();
        toggleBtn.textContent = '🔊 Music On';
        isPlaying = false;
      }
    });
  });
  