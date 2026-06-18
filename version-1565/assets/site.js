(function () {
    "use strict";

    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function initMenu() {
        var toggle = document.querySelector("[data-menu-toggle]");
        if (!toggle) {
            return;
        }
        toggle.addEventListener("click", function () {
            document.body.classList.toggle("nav-open");
        });
        document.querySelectorAll("[data-mobile-nav] a").forEach(function (link) {
            link.addEventListener("click", function () {
                document.body.classList.remove("nav-open");
            });
        });
    }

    function initHero() {
        var root = document.querySelector("[data-hero]");
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
        var prev = root.querySelector("[data-hero-prev]");
        var next = root.querySelector("[data-hero-next]");
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
                start();
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot") || 0));
                start();
            });
        });
        root.addEventListener("mouseenter", stop);
        root.addEventListener("mouseleave", start);
        start();
    }

    function cardMatchesFilter(card, filterValue) {
        if (!filterValue || filterValue === "all") {
            return true;
        }
        var type = normalize(card.getAttribute("data-type"));
        var region = normalize(card.getAttribute("data-region"));
        var year = normalize(card.getAttribute("data-year"));
        var search = normalize(card.getAttribute("data-search"));
        var filter = normalize(filterValue);
        return type.indexOf(filter) !== -1 || region.indexOf(filter) !== -1 || year === filter || search.indexOf(filter) !== -1;
    }

    function initSearch() {
        document.querySelectorAll(".filter-scope").forEach(function (scope) {
            var input = scope.querySelector("[data-site-search]");
            var cards = Array.prototype.slice.call(scope.querySelectorAll(".filter-card"));
            var empty = scope.querySelector("[data-empty-state]");
            var buttons = Array.prototype.slice.call(scope.querySelectorAll("[data-filter]"));
            var activeFilter = "all";

            function apply() {
                var query = normalize(input ? input.value : "");
                var visibleCount = 0;
                cards.forEach(function (card) {
                    var search = normalize(card.getAttribute("data-search"));
                    var matched = search.indexOf(query) !== -1 && cardMatchesFilter(card, activeFilter);
                    card.style.display = matched ? "" : "none";
                    if (matched) {
                        visibleCount += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle("is-visible", visibleCount === 0);
                }
            }

            if (input) {
                input.addEventListener("input", apply);
            }
            buttons.forEach(function (button, index) {
                if (index === 0) {
                    button.classList.add("is-active");
                }
                button.addEventListener("click", function () {
                    activeFilter = button.getAttribute("data-filter") || "all";
                    buttons.forEach(function (item) {
                        item.classList.toggle("is-active", item === button);
                    });
                    apply();
                });
            });
        });
    }

    function mountPlayer(source) {
        var player = document.querySelector("[data-player]");
        if (!player || !source) {
            return;
        }
        var video = player.querySelector("video");
        var cover = player.querySelector(".player-cover");
        var button = player.querySelector("[data-play-button]");
        var started = false;
        var hls = null;

        function start() {
            if (!video) {
                return;
            }
            player.classList.add("is-playing");
            if (!started) {
                started = true;
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
            }
            var playAction = video.play();
            if (playAction && typeof playAction.catch === "function") {
                playAction.catch(function () {});
            }
        }

        if (button) {
            button.addEventListener("click", start);
        }
        if (cover) {
            cover.addEventListener("click", start);
        }
        video.addEventListener("click", function () {
            if (!started) {
                start();
            }
        });
        window.addEventListener("beforeunload", function () {
            if (hls) {
                hls.destroy();
            }
        });
    }

    ready(function () {
        initMenu();
        initHero();
        initSearch();
    });

    window.MovieSite = {
        mountPlayer: mountPlayer
    };
})();
