(function () {
    function qs(selector, parent) {
        return (parent || document).querySelector(selector);
    }

    function qsa(selector, parent) {
        return Array.prototype.slice.call((parent || document).querySelectorAll(selector));
    }

    function text(value) {
        return value === undefined || value === null ? "" : String(value);
    }

    function escapeHtml(value) {
        return text(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function viewText(number) {
        var value = Number(number) || 0;
        if (value >= 10000) {
            return (value / 10000).toFixed(1) + "万";
        }
        return String(value);
    }

    var menuButton = qs("[data-menu-toggle]");
    var mobilePanel = qs("[data-mobile-panel]");

    if (menuButton && mobilePanel) {
        menuButton.addEventListener("click", function () {
            mobilePanel.classList.toggle("is-open");
        });
    }

    var hero = qs("[data-hero]");
    if (hero) {
        var slides = qsa("[data-hero-slide]", hero);
        var dots = qsa("[data-hero-dot]", hero);
        var activeIndex = 0;

        function setHero(index) {
            if (!slides.length) {
                return;
            }

            activeIndex = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === activeIndex);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === activeIndex);
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                var index = Number(dot.getAttribute("data-hero-dot"));
                setHero(index);
            });
        });

        window.setInterval(function () {
            setHero(activeIndex + 1);
        }, 5000);
    }

    qsa("[data-sort-panel]").forEach(function (panel) {
        var grid = qs("[data-sort-grid]");
        if (!grid) {
            return;
        }

        var originalCards = qsa(".movie-card", grid);
        qsa("[data-sort]", panel).forEach(function (button) {
            button.addEventListener("click", function () {
                var mode = button.getAttribute("data-sort");
                qsa("[data-sort]", panel).forEach(function (item) {
                    item.classList.toggle("is-active", item === button);
                });

                var cards = originalCards.slice();
                if (mode === "views") {
                    cards.sort(function (a, b) {
                        return Number(b.dataset.views) - Number(a.dataset.views);
                    });
                } else if (mode === "likes") {
                    cards.sort(function (a, b) {
                        return Number(b.dataset.likes) - Number(a.dataset.likes);
                    });
                } else if (mode === "year") {
                    cards.sort(function (a, b) {
                        return Number(b.dataset.year) - Number(a.dataset.year);
                    });
                }

                cards.forEach(function (card) {
                    grid.appendChild(card);
                });
            });
        });
    });

    var searchResults = qs("#search-results");
    var searchStatus = qs("#search-status");
    if (searchResults && searchStatus && window.movieSearchIndex) {
        var params = new URLSearchParams(window.location.search);
        var query = (params.get("q") || "").trim();
        var largeSearchInput = qs("[data-large-search] input");

        if (largeSearchInput) {
            largeSearchInput.value = query;
        }

        function renderCard(movie) {
            var tags = Array.isArray(movie.tags) ? movie.tags.slice(0, 3).join(" · ") : "";
            return [
                '<a class="movie-card" href="' + escapeHtml(movie.url) + '">',
                '    <div class="movie-card-poster">',
                '        <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
                '        <span class="movie-card-category">' + escapeHtml(movie.category) + '</span>',
                '        <span class="movie-card-duration">' + escapeHtml(movie.duration) + '</span>',
                '        <span class="movie-card-play">▶</span>',
                '    </div>',
                '    <div class="movie-card-body">',
                '        <h3>' + escapeHtml(movie.title) + '</h3>',
                '        <p>' + escapeHtml(movie.oneLine) + '</p>',
                '        <div class="movie-card-meta">',
                '            <span>' + escapeHtml(movie.year) + '</span>',
                '            <span>' + escapeHtml(movie.region) + '</span>',
                '            <span>' + viewText(movie.views) + '播放</span>',
                '        </div>',
                '        <div class="search-card-tags">' + escapeHtml(tags) + '</div>',
                '    </div>',
                '</a>'
            ].join("");
        }

        if (!query) {
            searchStatus.innerHTML = '<p class="empty-state">请输入关键词查找影片。</p>';
        } else {
            var lowerQuery = query.toLowerCase();
            var results = window.movieSearchIndex.filter(function (movie) {
                var haystack = [
                    movie.title,
                    movie.category,
                    movie.year,
                    movie.region,
                    movie.genre,
                    movie.oneLine,
                    Array.isArray(movie.tags) ? movie.tags.join(" ") : ""
                ].join(" ").toLowerCase();
                return haystack.indexOf(lowerQuery) !== -1;
            });

            searchStatus.innerHTML = '<p>搜索 <strong>' + escapeHtml(query) + '</strong> 找到 <strong>' + results.length + '</strong> 部影片</p>';
            searchResults.innerHTML = results.slice(0, 240).map(renderCard).join("");

            if (!results.length) {
                searchResults.innerHTML = '<div class="empty-state wide-empty">未找到相关影片</div>';
            }
        }
    }
})();
