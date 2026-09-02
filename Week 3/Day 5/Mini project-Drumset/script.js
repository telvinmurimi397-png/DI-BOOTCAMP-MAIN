// Play Sound Function
function playSound(keyCode) {
  const audio = document.querySelector(`audio[data-key="${keyCode}"]`);
  const key = document.querySelector(`.key[data-key="${keyCode}"]`);

  if (!audio) return; // Exit if unmapped key pressed

  audio.currentTime = 0; // Rewind audio to allow rapid repetition
  audio.play();

  if (key) {
    key.classList.add('playing');
  }
}

// Remove Transition Class
function removeTransition(e) {
  if (e.propertyName !== 'transform') return;
  this.classList.remove('playing');
}

// 1. Keyboard Event Listener
window.addEventListener('keydown', (e) => {
  // e.keyCode receives numeric key code (e.g., 'A' = 65)
  playSound(e.keyCode);
});

// 2. Mouse Click Event Listeners
const keys = document.querySelectorAll('.key');

keys.forEach((key) => {
  // Listen for click on each drum button
  key.addEventListener('click', function () {
    const keyCode = this.getAttribute('data-key');
    playSound(keyCode);
  });

  // Remove active glow when animation finishes
  key.addEventListener('transitionend', removeTransition);
});