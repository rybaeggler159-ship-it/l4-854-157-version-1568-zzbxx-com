(function () {
  'use strict';

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function initMobileMenu() {
    var button = $('.menu-toggle');
    var panel = $('.mobile-panel');

    if (!button || !panel) {
      return;
    }

    button.addEventListener('click', function () {
      var open = panel.hasAttribute('hidden');
      panel.toggleAttribute('hidden', !open);
      button.setAttribute('aria-expanded', String(open));
    });
  }

  function initCoverFallbacks() {
    $all('.js-cover-image').forEach(function (image) {
      image.addEventListener('error', function () {
        var wrap = image.closest('.poster-wrap');
        if (wrap) {
          wrap.classList.add('is-missing-cover');
        }
        image.style.display = 'none';
      }, { once: true });
    });
  }

  function initHeroCarousel() {
    var hero = $('[data-hero]');

    if (!hero) {
      return;
    }

    var slides = $all('[data-hero-slide]', hero);
    var dots = $all('[data-hero-dot]', hero);
    var prev = $('[data-hero-prev]', hero);
    var next = $('[data-hero-next]', hero);
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5600);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        restart();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.dataset.heroDot || 0));
        restart();
      });
    });

    if (slides.length > 1) {
      restart();
    }
  }

  function initFilters() {
    $all('[data-filter-panel]').forEach(function (panel) {
      var list = panel.closest('section').querySelector('[data-filter-list]') || document.querySelector('[data-filter-list]');
      var cards = list ? $all('.movie-card', list) : [];
      var keyword = $('[data-filter-keyword]', panel);
      var year = $('[data-filter-year]', panel);
      var region = $('[data-filter-region]', panel);
      var type = $('[data-filter-type]', panel);
      var reset = $('[data-filter-reset]', panel);
      var status = $('[data-filter-status]', panel);

      if (!list || !cards.length) {
        return;
      }

      function match(card) {
        var q = normalize(keyword && keyword.value);
        var y = normalize(year && year.value);
        var r = normalize(region && region.value);
        var t = normalize(type && type.value);
        var haystack = normalize([
          card.dataset.title,
          card.dataset.region,
          card.dataset.type,
          card.dataset.year,
          card.dataset.category,
          card.dataset.genre,
          card.textContent
        ].join(' '));

        return (!q || haystack.indexOf(q) !== -1) &&
          (!y || normalize(card.dataset.year) === y) &&
          (!r || normalize(card.dataset.region) === r) &&
          (!t || normalize(card.dataset.type) === t);
      }

      function apply() {
        var visible = 0;
        cards.forEach(function (card) {
          var ok = match(card);
          card.toggleAttribute('hidden', !ok);
          if (ok) {
            visible += 1;
          }
        });
        if (status) {
          status.textContent = '当前显示 ' + visible + ' / ' + cards.length + ' 部影片';
        }
      }

      [keyword, year, region, type].forEach(function (control) {
        if (control) {
          control.addEventListener('input', apply);
          control.addEventListener('change', apply);
        }
      });

      if (reset) {
        reset.addEventListener('click', function () {
          if (keyword) keyword.value = '';
          if (year) year.value = '';
          if (region) region.value = '';
          if (type) type.value = '';
          apply();
        });
      }

      apply();
    });
  }

  function movieCardTemplate(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return '' +
      '<article class="movie-card" data-title="' + escapeHtml(movie.title) + '" data-region="' + escapeHtml(movie.region) + '" data-type="' + escapeHtml(movie.type) + '" data-year="' + escapeHtml(movie.year) + '" data-category="' + escapeHtml(movie.category) + '" data-genre="' + escapeHtml(movie.genre) + '">' +
        '<a class="movie-card-link" href="' + escapeHtml(movie.url) + '" aria-label="查看' + escapeHtml(movie.title) + '">' +
          '<figure class="poster-wrap" data-cover-title="' + escapeHtml(movie.title) + '">' +
            '<img class="js-cover-image" src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '海报" loading="lazy">' +
            '<span class="poster-badge">' + escapeHtml(movie.year) + '</span>' +
          '</figure>' +
          '<div class="movie-card-body">' +
            '<div class="movie-card-meta"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span></div>' +
            '<h3>' + escapeHtml(movie.title) + '</h3>' +
            '<p>' + escapeHtml(movie.oneLine) + '</p>' +
            '<div class="movie-card-tags">' + tags + '</div>' +
            '<div class="movie-card-foot"><span>' + escapeHtml(movie.genre) + '</span><strong>推荐 ' + escapeHtml(movie.score) + '</strong></div>' +
          '</div>' +
        '</a>' +
      '</article>';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initSearchPage() {
    var input = $('[data-search-input]');
    var resultBox = $('[data-search-results]');
    var summary = $('[data-search-summary]');

    if (!input || !resultBox || !window.MOVIES) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';
    input.value = initialQuery;

    function runSearch() {
      var q = normalize(input.value);
      var results = window.MOVIES.filter(function (movie) {
        var haystack = normalize([
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          (movie.tags || []).join(' '),
          movie.oneLine
        ].join(' '));
        return !q || haystack.indexOf(q) !== -1;
      });

      var limited = results.slice(0, 240);
      resultBox.innerHTML = limited.map(movieCardTemplate).join('');
      initCoverFallbacks();

      if (summary) {
        if (q) {
          summary.textContent = '关键词“' + input.value + '”共匹配 ' + results.length + ' 部影片，当前展示前 ' + limited.length + ' 部。';
        } else {
          summary.textContent = '当前展示全部片库中的前 ' + limited.length + ' 部推荐影片。';
        }
      }
    }

    input.addEventListener('input', runSearch);
    runSearch();
  }

  function initPlayer() {
    $all('[data-player]').forEach(function (shell) {
      var video = $('video', shell);
      var button = $('[data-player-button]', shell);
      var status = $('[data-player-status]', shell);
      var source = shell.dataset.hls;
      var started = false;

      if (!video || !button || !source) {
        return;
      }

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      function start() {
        if (started) {
          video.play().catch(function () {});
          return;
        }

        started = true;
        shell.classList.add('is-playing');
        setStatus('正在加载播放源…');

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.addEventListener('loadedmetadata', function () {
            video.play().catch(function () {
              setStatus('浏览器阻止自动播放，请再次点击播放按钮。');
            });
          }, { once: true });
          setStatus('已使用浏览器原生 HLS 播放。');
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false
          });

          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            setStatus('播放源加载完成。');
            video.play().catch(function () {
              setStatus('浏览器阻止自动播放，请点击视频控件继续。');
            });
          });
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setStatus('播放源加载失败，请刷新页面或稍后重试。');
            }
          });
          return;
        }

        video.src = source;
        setStatus('当前浏览器不支持 HLS.js，已尝试直接加载播放源。');
        video.play().catch(function () {});
      }

      button.addEventListener('click', start);
      video.addEventListener('play', function () {
        shell.classList.add('is-playing');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initCoverFallbacks();
    initHeroCarousel();
    initFilters();
    initSearchPage();
    initPlayer();
  });
})();
