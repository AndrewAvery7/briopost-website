// /film/: start the film with the sound on.
// Browsers only allow a film to start by itself with sound when they trust the visit (Chrome on a computer often
// does; iPhones and most phones never do). So: try to start it with sound; if the browser refuses, show one big
// "Play with sound" button, and a single tap starts it with the volume up. The film is never muted by this page.
(function () {
  var video = document.getElementById('briopost-film');
  var button = document.querySelector('.film-play');
  if (!video || !button) return;

  function hideButton() { button.hidden = true; }
  function showButton() { if (video.paused) button.hidden = false; }

  function playWithSound() {
    video.muted = false;
    video.volume = 1;
    var p = video.play();
    if (p && typeof p.then === 'function') p.then(hideButton, showButton);
    else hideButton();
  }

  button.addEventListener('click', playWithSound);
  video.addEventListener('play', hideButton);
  // After the film ends, offer the big button again for a replay. Pausing mid-film leaves the player's own controls.
  video.addEventListener('ended', showButton);

  playWithSound();
})();
