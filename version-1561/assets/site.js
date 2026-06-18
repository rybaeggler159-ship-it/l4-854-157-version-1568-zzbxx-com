(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupMobileMenu() {
    var button = document.querySelector("[data-mobile-menu-button]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!button || !nav) {
      return;
    }

    button.addEventListener("click", function () {
      button.classList.toggle("is-open");
      nav.classList.toggle("is-open");
    });
  }

  function setupHeroSlider() {
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
    var current = 0;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }
  }

  function setupImageFallbacks() {
    document.querySelectorAll("[data-cover-image]").forEach(function (image) {
      image.addEventListener("error", function () {
        image.classList.add("is-missing");
        image.setAttribute("aria-hidden", "true");
      }, { once: true });
    });
  }

  function textOf(card) {
    return [
      card.getAttribute("data-title") || "",
      card.getAttribute("data-year") || "",
      card.getAttribute("data-type") || "",
      card.getAttribute("data-genre") || ""
    ].join(" ").toLowerCase();
  }

  function setupFilterPanels() {
    document.querySelectorAll("[data-filter-panel]").forEach(function (panel) {
      var section = panel.closest("section") || document;
      var cards = Array.prototype.slice.call(section.querySelectorAll("[data-movie-card]"));
      var textInput = panel.querySelector("[data-filter-text]");
      var yearSelect = panel.querySelector("[data-filter-year]");
      var typeSelect = panel.querySelector("[data-filter-type]");
      var resetButton = panel.querySelector("[data-filter-reset]");
      var count = panel.querySelector("[data-filter-count]");

      function apply() {
        var query = (textInput && textInput.value || "").trim().toLowerCase();
        var year = yearSelect && yearSelect.value || "";
        var type = typeSelect && typeSelect.value || "";
        var visible = 0;

        cards.forEach(function (card) {
          var matched = true;
          if (query) {
            matched = textOf(card).indexOf(query) !== -1;
          }
          if (matched && year) {
            matched = (card.getAttribute("data-year") || "") === year;
          }
          if (matched && type) {
            matched = (card.getAttribute("data-type") || "") === type;
          }
          card.classList.toggle("is-hidden", !matched);
          if (matched) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = String(visible);
        }
      }

      [textInput, yearSelect, typeSelect].forEach(function (element) {
        if (element) {
          element.addEventListener("input", apply);
          element.addEventListener("change", apply);
        }
      });

      if (resetButton) {
        resetButton.addEventListener("click", function () {
          if (textInput) {
            textInput.value = "";
          }
          if (yearSelect) {
            yearSelect.value = "";
          }
          if (typeSelect) {
            typeSelect.value = "";
          }
          apply();
        });
      }
    });
  }

  function setupRankTabs() {
    var tabs = document.querySelector("[data-rank-tabs]");
    if (!tabs) {
      return;
    }

    var buttons = Array.prototype.slice.call(tabs.querySelectorAll("[data-rank-tab]"));
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-rank-panel]"));

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var key = button.getAttribute("data-rank-tab");
        buttons.forEach(function (item) {
          item.classList.toggle("is-active", item === button);
        });
        panels.forEach(function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-rank-panel") === key);
        });
      });
    });
  }

  function setupPlayer() {
    document.querySelectorAll("[data-video-player]").forEach(function (player) {
      var video = player.querySelector("video");
      var playButton = player.querySelector("[data-play-button]");
      if (!video) {
        return;
      }

      var source = video.getAttribute("data-src");
      var hlsInstance = null;

      function startPlayback() {
        if (!source) {
          return;
        }

        if (player.getAttribute("data-ready") !== "true") {
          if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90
            });
            hlsInstance.loadSource(source);
            hlsInstance.attachMedia(video);
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
              video.play().catch(function () {});
            });
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = source;
            video.addEventListener("loadedmetadata", function () {
              video.play().catch(function () {});
            }, { once: true });
          } else {
            video.src = source;
            video.play().catch(function () {});
          }

          player.setAttribute("data-ready", "true");
        } else {
          video.play().catch(function () {});
        }

        if (playButton) {
          playButton.classList.add("is-hidden");
        }
      }

      if (playButton) {
        playButton.addEventListener("click", startPlayback);
      }
      video.addEventListener("play", function () {
        if (playButton) {
          playButton.classList.add("is-hidden");
        }
      });
      video.addEventListener("pause", function () {
        if (playButton && player.getAttribute("data-ready") !== "true") {
          playButton.classList.remove("is-hidden");
        }
      });

      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  function setupLikeButtons() {
    document.querySelectorAll("[data-like-button], [data-favorite-button]").forEach(function (button) {
      button.addEventListener("click", function () {
        button.classList.toggle("is-active");
      });
    });
  }

  function cardHtml(item) {
    var title = escapeHtml(item.title);
    var oneLine = escapeHtml(item.oneLine || "");
    var url = escapeHtml(item.url);
    var cover = escapeHtml(item.cover);
    var category = escapeHtml(item.category);
    var year = escapeHtml(item.year);
    var views = formatCount(item.views) + "播放";
    var likes = formatCount(item.likes) + "赞";

    return [
      '<a class="movie-card" href="' + url + '" data-movie-card data-title="' + title + '" data-year="' + year + '" data-type="' + escapeHtml(item.type) + '" data-genre="' + escapeHtml(item.genre) + '">',
      '  <div class="movie-cover image-shell">',
      '    <img src="' + cover + '" alt="' + title + '" loading="lazy" data-cover-image>',
      '    <div class="movie-hover-layer"><span class="play-badge">▶</span></div>',
      '    <span class="category-badge">' + category + '</span>',
      '  </div>',
      '  <div class="movie-card-body">',
      '    <h3>' + title + '</h3>',
      '    <p>' + oneLine + '</p>',
      '    <div class="movie-meta-line"><span>' + year + '</span><span>' + views + '</span><span>' + likes + '</span></div>',
      '  </div>',
      '</a>'
    ].join("");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatCount(value) {
    var number = Number(value) || 0;
    if (number >= 10000) {
      return (number / 10000).toFixed(1) + "万";
    }
    return String(number);
  }

  function setupSearchPage() {
    var form = document.querySelector("[data-live-search-form]");
    var input = document.querySelector("[data-live-search-input]");
    var results = document.querySelector("[data-search-results]");
    var count = document.querySelector("[data-search-result-count]");
    var data = window.MOVIE_SEARCH_DATA || [];

    if (!form || !input || !results || !data.length) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get("q") || "";
    input.value = initialQuery;

    function render(query) {
      var normalized = query.trim().toLowerCase();
      if (!normalized) {
        count.textContent = "请输入关键词开始搜索。";
        return;
      }

      var matched = data.filter(function (item) {
        var haystack = [
          item.title,
          item.year,
          item.region,
          item.type,
          item.genre,
          item.category,
          item.oneLine,
          (item.tags || []).join(" ")
        ].join(" ").toLowerCase();
        return haystack.indexOf(normalized) !== -1;
      }).slice(0, 120);

      results.innerHTML = matched.map(cardHtml).join("");
      setupImageFallbacks();
      count.textContent = "找到 " + matched.length + " 个结果" + (matched.length === 120 ? "，已显示前 120 个" : "") + "。";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var query = input.value.trim();
      var nextUrl = query ? ("search.html?q=" + encodeURIComponent(query)) : "search.html";
      window.history.replaceState({}, "", nextUrl);
      render(query);
    });

    input.addEventListener("input", function () {
      render(input.value);
    });

    if (initialQuery) {
      render(initialQuery);
    }
  }

  ready(function () {
    setupMobileMenu();
    setupHeroSlider();
    setupImageFallbacks();
    setupFilterPanels();
    setupRankTabs();
    setupPlayer();
    setupLikeButtons();
    setupSearchPage();
  });
})();
