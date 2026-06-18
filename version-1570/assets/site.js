(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function initMobileNav() {
    var button = document.querySelector('[data-mobile-menu]');
    var nav = document.querySelector('[data-mobile-nav]');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  function initHeroCarousel() {
    var carousel = document.querySelector('[data-hero-carousel]');
    if (!carousel) {
      return;
    }
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
    var prev = carousel.querySelector('[data-hero-prev]');
    var next = carousel.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot') || 0));
        restart();
      });
    });
    show(0);
    restart();
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function initFilters() {
    var panel = document.querySelector('[data-filter-panel]');
    if (!panel) {
      return;
    }
    var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card[data-title]'));
    var search = panel.querySelector('[data-filter-search]');
    var region = panel.querySelector('[data-filter-region]');
    var type = panel.querySelector('[data-filter-type]');
    var year = panel.querySelector('[data-filter-year]');
    var category = panel.querySelector('[data-filter-category]');
    var counter = panel.querySelector('[data-filter-count]');

    function matches(card) {
      var query = normalize(search && search.value);
      var regionValue = normalize(region && region.value);
      var typeValue = normalize(type && type.value);
      var yearValue = normalize(year && year.value);
      var categoryValue = normalize(category && category.value);
      var haystack = normalize([
        card.dataset.title,
        card.dataset.region,
        card.dataset.type,
        card.dataset.year,
        card.dataset.category,
        card.dataset.tags
      ].join(' '));

      if (query && haystack.indexOf(query) === -1) {
        return false;
      }
      if (regionValue && normalize(card.dataset.region) !== regionValue) {
        return false;
      }
      if (typeValue && normalize(card.dataset.type) !== typeValue) {
        return false;
      }
      if (yearValue && normalize(card.dataset.year) !== yearValue) {
        return false;
      }
      if (categoryValue && normalize(card.dataset.category) !== categoryValue) {
        return false;
      }
      return true;
    }

    function apply() {
      var visible = 0;
      cards.forEach(function (card) {
        var ok = matches(card);
        card.classList.toggle('is-hidden', !ok);
        if (ok) {
          visible += 1;
        }
      });
      if (counter) {
        counter.textContent = visible + ' 部影片';
      }
    }

    [search, region, type, year, category].forEach(function (control) {
      if (!control) {
        return;
      }
      control.addEventListener('input', apply);
      control.addEventListener('change', apply);
    });
    apply();
  }

  function initPlayer() {
    var video = document.querySelector('.movie-player');
    if (!video) {
      return;
    }
    var source = video.getAttribute('data-src');
    var overlay = document.querySelector('[data-player-overlay]');
    var status = document.querySelector('[data-player-status]');
    var hlsInstance = null;
    var loaded = false;

    function setStatus(message) {
      if (status) {
        status.textContent = message;
      }
    }

    function loadSource() {
      if (loaded || !source) {
        return;
      }
      loaded = true;
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setStatus('播放源加载完成');
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            setStatus('网络错误，正在重试加载');
            hlsInstance.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            setStatus('媒体错误，正在尝试恢复');
            hlsInstance.recoverMediaError();
          } else {
            setStatus('播放器错误，当前浏览器无法播放此线路');
            hlsInstance.destroy();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        setStatus('浏览器原生 HLS 播放已启用');
      } else {
        setStatus('当前浏览器不支持 HLS，请更换浏览器访问');
      }
    }

    function play() {
      loadSource();
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          setStatus('请再次点击播放按钮开始播放');
        });
      }
    }

    function toggle() {
      if (video.paused) {
        play();
      } else {
        video.pause();
      }
    }

    document.querySelectorAll('[data-player-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        var action = button.getAttribute('data-player-action');
        if (action === 'play') {
          play();
        }
        if (action === 'toggle') {
          toggle();
        }
        if (action === 'mute') {
          video.muted = !video.muted;
          setStatus(video.muted ? '已静音' : '已取消静音');
        }
        if (action === 'fullscreen') {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (video.requestFullscreen) {
            video.requestFullscreen();
          }
        }
      });
    });

    video.addEventListener('click', toggle);
    video.addEventListener('play', function () {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      setStatus('正在播放');
    });
    video.addEventListener('pause', function () {
      setStatus('已暂停');
    });
    video.addEventListener('ended', function () {
      setStatus('播放结束');
    });
    window.addEventListener('pagehide', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  ready(function () {
    initMobileNav();
    initHeroCarousel();
    initFilters();
    initPlayer();
  });
})();
