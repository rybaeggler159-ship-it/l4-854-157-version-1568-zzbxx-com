import { H as Hls } from "./hls.js";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

function setHeaderState() {
    const header = $(".site-header");
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 10);
}

function initMenu() {
    const button = $("[data-menu-toggle]");
    const panel = $("[data-mobile-panel]");
    if (!button || !panel) return;
    button.addEventListener("click", () => {
        const open = panel.classList.toggle("is-open");
        document.body.classList.toggle("menu-open", open);
        button.setAttribute("aria-expanded", String(open));
    });
}

function initCarousel() {
    $$("[data-carousel]").forEach((carousel) => {
        const slides = $$(".hero-slide", carousel);
        const dots = $$(".carousel-dot", carousel);
        const prev = $("[data-carousel-prev]", carousel);
        const next = $("[data-carousel-next]", carousel);
        if (!slides.length) return;
        let index = slides.findIndex((slide) => slide.classList.contains("is-active"));
        index = index < 0 ? 0 : index;
        let timer = null;

        const show = (target) => {
            index = (target + slides.length) % slides.length;
            slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
            dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
        };

        const start = () => {
            stop();
            timer = window.setInterval(() => show(index + 1), 5200);
        };

        const stop = () => {
            if (timer) window.clearInterval(timer);
        };

        if (prev) prev.addEventListener("click", () => { show(index - 1); start(); });
        if (next) next.addEventListener("click", () => { show(index + 1); start(); });
        dots.forEach((dot, i) => dot.addEventListener("click", () => { show(i); start(); }));
        carousel.addEventListener("mouseenter", stop);
        carousel.addEventListener("mouseleave", start);
        show(index);
        start();
    });
}

function matchCard(card, term, activeFilters) {
    const haystack = [
        card.dataset.title,
        card.dataset.year,
        card.dataset.region,
        card.dataset.type,
        card.dataset.genre,
        card.dataset.tags,
        card.dataset.desc
    ].join(" ").toLowerCase();

    if (term && !haystack.includes(term)) return false;

    for (const [group, value] of Object.entries(activeFilters)) {
        if (!value || value === "all") continue;
        const field = (card.dataset[group] || "").toLowerCase();
        if (!field.includes(value.toLowerCase())) return false;
    }

    return true;
}

function initFilters() {
    $$("[data-listing]").forEach((listing) => {
        const input = $("[data-search-input]", listing) || $("[data-search-input]");
        const chips = $$("[data-filter-group]", listing);
        const cards = $$(".movie-card", listing);
        const empty = $("[data-empty-state]", listing);
        const params = new URLSearchParams(window.location.search);
        const q = params.get("q");
        const activeFilters = {};

        if (input && q) input.value = q;
        chips.forEach((chip) => {
            if (chip.classList.contains("is-active")) {
                activeFilters[chip.dataset.filterGroup] = chip.dataset.filterValue || "all";
            }
        });

        const apply = () => {
            const term = input ? input.value.trim().toLowerCase() : "";
            let visible = 0;
            cards.forEach((card) => {
                const ok = matchCard(card, term, activeFilters);
                card.classList.toggle("hide-card", !ok);
                if (ok) visible += 1;
            });
            if (empty) empty.classList.toggle("is-visible", visible === 0);
        };

        chips.forEach((chip) => {
            chip.addEventListener("click", () => {
                const group = chip.dataset.filterGroup;
                activeFilters[group] = chip.dataset.filterValue || "all";
                chips
                    .filter((item) => item.dataset.filterGroup === group)
                    .forEach((item) => item.classList.toggle("is-active", item === chip));
                apply();
            });
        });

        if (input) input.addEventListener("input", apply);
        apply();
    });
}

function attachStream(video, stream) {
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
        return Promise.resolve();
    }

    if (Hls && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(stream);
        hls.attachMedia(video);
        return new Promise((resolve) => {
            hls.on(Hls.Events.MANIFEST_PARSED, resolve);
        });
    }

    video.src = stream;
    return Promise.resolve();
}

function initPlayers() {
    $$("[data-player]").forEach((player) => {
        const video = $("video", player);
        const cover = $("[data-play-button]", player);
        const stream = player.dataset.stream;
        if (!video || !cover || !stream) return;

        const play = async () => {
            player.classList.add("is-playing");
            video.controls = true;
            if (player.dataset.ready !== "1") {
                player.dataset.ready = "1";
                await attachStream(video, stream);
            }
            try {
                await video.play();
            } catch (error) {
                video.controls = true;
            }
        };

        cover.addEventListener("click", play);
        video.addEventListener("click", () => {
            if (video.paused) play();
        });
    });
}

window.addEventListener("scroll", setHeaderState, { passive: true });
document.addEventListener("DOMContentLoaded", () => {
    setHeaderState();
    initMenu();
    initCarousel();
    initFilters();
    initPlayers();
});
