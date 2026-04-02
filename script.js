const root = document.documentElement;
const body = document.body;
const themeButtons = Array.from(document.querySelectorAll("[data-theme-value]"));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const canonicalLink = document.getElementById("canonical-link");
const ogUrl = document.getElementById("og-url");
const orgSchema = document.getElementById("org-schema");

const themeColors = {
  light: "#f7f3ea",
  dark: "#090714",
  sun: "#f7e39a"
};

function resolveSiteUrl() {
  const { origin, pathname } = window.location;
  const isLocal =
    origin.startsWith("file:") ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1");

  return {
    pageUrl: isLocal ? "https://example.com/" : `${origin}${pathname}`,
    siteUrl: isLocal ? "https://example.com" : origin
  };
}

function updateSeoUrls() {
  const { pageUrl, siteUrl } = resolveSiteUrl();

  if (canonicalLink) {
    canonicalLink.href = pageUrl;
  }

  if (ogUrl) {
    ogUrl.content = pageUrl;
  }

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) {
    ogImage.content = `${siteUrl}/assets/images/social-preview.png`;
  }

  if (orgSchema) {
    const schema = JSON.parse(orgSchema.textContent);
    schema.url = siteUrl;
    schema.logo = `${siteUrl}/assets/images/cocologo.png`;
    orgSchema.textContent = JSON.stringify(schema);
  }
}

function applyTheme(theme) {
  body.dataset.theme = theme;
  themeButtons.forEach((button) => {
    const isActive = button.dataset.themeValue === theme;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (themeColorMeta) {
    themeColorMeta.content = themeColors[theme] || themeColors.light;
  }

  localStorage.setItem("coco-theme", theme);
}

themeButtons.forEach((button) => {
  button.addEventListener("click", () => applyTheme(button.dataset.themeValue));
});

const savedTheme = localStorage.getItem("coco-theme");
if (savedTheme && themeColors[savedTheme]) {
  applyTheme(savedTheme);
}

updateSeoUrls();

if (!prefersReducedMotion) {
  const revealElements = Array.from(document.querySelectorAll(".reveal"));

  function revealInView() {
    revealElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.96) {
        element.classList.add("is-visible");
      }
    });
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.01, rootMargin: "0px 0px -4% 0px" }
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });

  revealInView();
  window.addEventListener("load", revealInView, { once: true });
} else {
  document.querySelectorAll(".reveal").forEach((element) => {
    element.classList.add("is-visible");
  });
}

function formatMetric(value, format, suffix) {
  if (format === "decimal") {
    return `${value.toFixed(1)}${suffix || ""}`;
  }

  return `${Math.round(value).toLocaleString()}${suffix || ""}`;
}

const animatedMetrics = document.querySelectorAll("[data-target]");
const metricObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const element = entry.target;
      const target = Number(element.dataset.target);
      const format = element.dataset.format || "number";
      const suffix = element.dataset.suffix || "";
      const duration = prefersReducedMotion ? 0 : 1400;

      if (duration === 0) {
        element.textContent = formatMetric(target, format, suffix);
        observer.unobserve(element);
        return;
      }

      const startTime = performance.now();

      function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;
        element.textContent = formatMetric(current, format, suffix);

        if (progress < 1) {
          requestAnimationFrame(tick);
          return;
        }

        observer.unobserve(element);
      }

      requestAnimationFrame(tick);
    });
  },
  { threshold: 0.4 }
);

animatedMetrics.forEach((metric) => metricObserver.observe(metric));
