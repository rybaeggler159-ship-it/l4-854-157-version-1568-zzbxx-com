(function () {
  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function setupMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var root = document.querySelector("[data-hero]");
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(root.querySelectorAll(".hero-dot"));
    var prev = root.querySelector("[data-hero-prev]");
    var next = root.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    if (slides.length < 2) {
      show(0);
      return;
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        restart();
      });
    }

    root.addEventListener("mouseenter", function () {
      window.clearInterval(timer);
    });

    root.addEventListener("mouseleave", restart);
    show(0);
    restart();
  }

  function setupFilters() {
    var filterInput = document.querySelector("[data-filter-input]");
    var typeSelect = document.querySelector("[data-type-select]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
    var empty = document.querySelector("[data-empty-state]");
    if (!cards.length) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get("q") || "";
    if (filterInput && initialQuery) {
      filterInput.value = initialQuery;
    }

    function apply() {
      var query = normalize(filterInput ? filterInput.value : "");
      var type = normalize(typeSelect ? typeSelect.value : "");
      var visible = 0;
      cards.forEach(function (card) {
        var text = normalize(card.getAttribute("data-search"));
        var cardType = normalize(card.getAttribute("data-type"));
        var matched = (!query || text.indexOf(query) !== -1) && (!type || cardType === type);
        card.style.display = matched ? "" : "none";
        if (matched) {
          visible += 1;
        }
      });
      if (empty) {
        empty.style.display = visible ? "none" : "block";
      }
    }

    if (filterInput) {
      filterInput.addEventListener("input", apply);
    }
    if (typeSelect) {
      typeSelect.addEventListener("change", apply);
    }
    apply();
  }

  window.createPlayer = function (settings) {
    var video = settings.video;
    var trigger = settings.trigger;
    var source = settings.source;
    var started = false;
    var hls = null;

    function start() {
      if (!video || started) {
        return;
      }
      started = true;
      if (trigger) {
        trigger.classList.add("is-hidden");
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
      var playTask = video.play();
      if (playTask && typeof playTask.catch === "function") {
        playTask.catch(function () {
          started = false;
          if (trigger) {
            trigger.classList.remove("is-hidden");
          }
        });
      }
    }

    if (trigger) {
      trigger.addEventListener("click", start);
    }
    if (video) {
      video.addEventListener("click", start);
    }
    window.addEventListener("beforeunload", function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  onReady(function () {
    setupMenu();
    setupHero();
    setupFilters();
  });
})();
