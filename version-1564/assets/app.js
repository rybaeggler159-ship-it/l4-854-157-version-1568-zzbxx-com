document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setupHero();
  setupFilters();
});

function setupMobileMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-mobile-nav]");
  if (!toggle || !nav) {
    return;
  }
  toggle.addEventListener("click", () => {
    nav.classList.toggle("is-open");
  });
}

function setupHero() {
  const root = document.querySelector("[data-hero]");
  if (!root) {
    return;
  }
  const slides = Array.from(root.querySelectorAll("[data-hero-slide]"));
  const dots = Array.from(root.querySelectorAll("[data-hero-dot]"));
  const prev = root.querySelector("[data-hero-prev]");
  const next = root.querySelector("[data-hero-next]");
  let index = slides.findIndex((slide) => slide.classList.contains("is-active"));
  if (index < 0) {
    index = 0;
  }

  const show = (nextIndex) => {
    if (!slides.length) {
      return;
    }
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === index);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
    });
  };

  if (prev) {
    prev.addEventListener("click", () => show(index - 1));
  }
  if (next) {
    next.addEventListener("click", () => show(index + 1));
  }
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const target = Number(dot.getAttribute("data-hero-dot"));
      if (Number.isFinite(target)) {
        show(target);
      }
    });
  });
  window.setInterval(() => show(index + 1), 5600);
}

function setupFilters() {
  const cards = Array.from(document.querySelectorAll("[data-card]"));
  const input = document.querySelector("[data-search-input]");
  const category = document.querySelector("[data-filter-category]");
  const region = document.querySelector("[data-filter-region]");
  const type = document.querySelector("[data-filter-type]");
  const empty = document.querySelector("[data-empty-state]");

  if (!cards.length || (!input && !category && !region && !type)) {
    return;
  }

  const matches = (card) => {
    const query = normalize(input ? input.value : "");
    const target = normalize([
      card.dataset.title,
      card.dataset.region,
      card.dataset.type,
      card.dataset.year,
      card.dataset.tags,
      card.dataset.category
    ].join(" "));
    const cardCategory = card.dataset.category || "";
    const cardRegion = card.dataset.region || "";
    const cardType = card.dataset.type || "";
    const selectedCategory = category ? category.value : "";
    const selectedRegion = region ? region.value : "";
    const selectedType = type ? type.value : "";

    if (query && !target.includes(query)) {
      return false;
    }
    if (selectedCategory && cardCategory !== selectedCategory) {
      return false;
    }
    if (selectedRegion && !cardRegion.includes(selectedRegion)) {
      return false;
    }
    if (selectedType && !cardType.includes(selectedType)) {
      return false;
    }
    return true;
  };

  const apply = () => {
    let visible = 0;
    cards.forEach((card) => {
      const ok = matches(card);
      card.style.display = ok ? "" : "none";
      if (ok) {
        visible += 1;
      }
    });
    if (empty) {
      empty.classList.toggle("is-visible", visible === 0);
    }
  };

  [input, category, region, type].forEach((control) => {
    if (control) {
      control.addEventListener("input", apply);
      control.addEventListener("change", apply);
    }
  });
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}
