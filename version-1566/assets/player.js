import { H as Hls } from './hls-vendor-dru42stk.js';

const players = Array.from(document.querySelectorAll('[data-player]'));

players.forEach(function (player) {
  const video = player.querySelector('video[data-src]');
  const button = player.querySelector('[data-player-action="play"]');
  let hls = null;
  let attached = false;

  function attach() {
    if (!video || attached) {
      return;
    }
    const source = video.dataset.src;
    if (!source) {
      return;
    }
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
    } else if (Hls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(source);
      hls.attachMedia(video);
    } else {
      video.src = source;
    }
    attached = true;
  }

  function start() {
    attach();
    if (button) {
      button.classList.add('is-hidden');
    }
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {});
    }
  }

  if (button) {
    button.addEventListener('click', start);
  }

  if (video) {
    video.addEventListener('click', function () {
      if (!attached || video.paused) {
        start();
      }
    });
    video.addEventListener('play', function () {
      if (button) {
        button.classList.add('is-hidden');
      }
    });
  }

  window.addEventListener('beforeunload', function () {
    if (hls) {
      hls.destroy();
    }
  });
});
