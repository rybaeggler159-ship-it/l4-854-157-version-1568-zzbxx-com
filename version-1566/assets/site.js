(function () {
  const mobileToggle = document.querySelector('[data-menu-toggle]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');
  if (mobileToggle && mobilePanel) {
    mobileToggle.addEventListener('click', function () {
      mobilePanel.classList.toggle('is-open');
    });
  }

  const carousel = document.querySelector('[data-hero-carousel]');
  if (carousel) {
    const slides = Array.from(carousel.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(carousel.querySelectorAll('[data-hero-dot]'));
    const prev = carousel.querySelector('[data-hero-prev]');
    const next = carousel.querySelector('[data-hero-next]');
    let current = 0;
    let timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    function restart() {
      window.clearInterval(timer);
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

    show(0);
    restart();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderSearch(input, panel) {
    const keyword = normalize(input.value);
    const list = Array.isArray(window.MOVIE_SEARCH_INDEX) ? window.MOVIE_SEARCH_INDEX : [];
    if (!keyword) {
      panel.classList.remove('is-open');
      panel.innerHTML = '';
      return;
    }
    const matches = list.filter(function (item) {
      return normalize(item.title + ' ' + item.region + ' ' + item.type + ' ' + item.genre + ' ' + item.tags).includes(keyword);
    }).slice(0, 12);
    if (!matches.length) {
      panel.innerHTML = '<a href="./categories.html"><strong>没有找到匹配结果</strong><span>进入分类页继续浏览</span></a>';
      panel.classList.add('is-open');
      return;
    }
    panel.innerHTML = matches.map(function (item) {
      const title = escapeHtml(item.title);
      const line = escapeHtml(item.region + ' / ' + item.type + ' / ' + item.year + ' / ' + item.genre);
      const url = String(item.url || '').replace(/[^a-zA-Z0-9_.-]/g, '');
      return '<a href="./' + url + '"><strong>' + title + '</strong><span>' + line + '</span></a>';
    }).join('');
    panel.classList.add('is-open');
  }

  document.querySelectorAll('[data-site-search]').forEach(function (input) {
    const wrap = input.closest('.header-search');
    const panel = wrap ? wrap.querySelector('[data-search-results]') : null;
    if (!panel) {
      return;
    }
    input.addEventListener('input', function () {
      renderSearch(input, panel);
    });
    input.addEventListener('focus', function () {
      renderSearch(input, panel);
    });
    document.addEventListener('click', function (event) {
      if (!wrap.contains(event.target)) {
        panel.classList.remove('is-open');
      }
    });
  });

  document.querySelectorAll('[data-filter-root]').forEach(function (root) {
    const input = root.querySelector('[data-filter-search]');
    const genre = root.querySelector('[data-filter-genre]');
    const year = root.querySelector('[data-filter-year]');
    const count = root.querySelector('[data-filter-count]');
    const scope = root.parentElement || document;
    const cards = Array.from(scope.querySelectorAll('.movie-card'));

    function update() {
      const keyword = normalize(input ? input.value : '');
      const genreValue = normalize(genre ? genre.value : '');
      const yearValue = normalize(year ? year.value : '');
      let visible = 0;
      cards.forEach(function (card) {
        const haystack = normalize(card.dataset.title + ' ' + card.dataset.genre + ' ' + card.dataset.tags + ' ' + card.dataset.year);
        const matchesKeyword = !keyword || haystack.includes(keyword);
        const matchesGenre = !genreValue || normalize(card.dataset.genre + ' ' + card.dataset.tags).includes(genreValue);
        const matchesYear = !yearValue || normalize(card.dataset.year) === yearValue;
        const ok = matchesKeyword && matchesGenre && matchesYear;
        card.classList.toggle('is-hidden-by-filter', !ok);
        if (ok) {
          visible += 1;
        }
      });
      if (count) {
        count.textContent = visible + ' 部';
      }
    }

    [input, genre, year].forEach(function (node) {
      if (node) {
        node.addEventListener('input', update);
        node.addEventListener('change', update);
      }
    });
    update();
  });
})();
