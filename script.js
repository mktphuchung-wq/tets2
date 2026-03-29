const story = document.getElementById("story");
const scenes = Array.from(document.querySelectorAll(".scene"));
const revealItems = Array.from(document.querySelectorAll(".reveal"));
const heroTitle = document.querySelector(".sink-target");
const introCard = document.getElementById("intro-card");
const sparkleLayer = document.querySelector(".sparkle-layer");
const riverTrack = document.getElementById("riverTrack");
const riseParticles = document.getElementById("riseParticles");
const parallaxItems = Array.from(document.querySelectorAll("[data-parallax]"));
const soundtrackFrame = document.getElementById("globalSoundtrack");
const heroStartBtn = document.getElementById("heroStartBtn");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let soundtrackWidget = null;
let soundtrackReady = false;
let soundtrackPendingPlay = false;

if (scenes[0]) {
  scenes[0].classList.add("is-visible");
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      } else {
        entry.target.classList.remove("is-visible");
      }
    });
  },
  {
    root: story,
    threshold: 0.55
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

const updateTitleSink = () => {
  if (!heroTitle || !introCard || !story || prefersReducedMotion) return;

  const cardTop = introCard.offsetTop - story.scrollTop;
  const start = story.clientHeight * 0.95;
  const end = story.clientHeight * 0.36;
  const progress = clamp((start - cardTop) / (start - end), 0, 1);

  const sinkY = progress * 94;
  const sinkScale = 1 - progress * 0.1;
  const sinkOpacity = 1 - progress * 0.76;
  const sinkBlur = progress * 2.7;

  heroTitle.style.setProperty("--sink-y", `${sinkY.toFixed(2)}px`);
  heroTitle.style.setProperty("--sink-scale", sinkScale.toFixed(3));
  heroTitle.style.setProperty("--sink-opacity", sinkOpacity.toFixed(3));
  heroTitle.style.setProperty("--sink-blur", `${sinkBlur.toFixed(2)}px`);
};

const updateParallax = () => {
  if (!story || prefersReducedMotion) return;

  const viewportCenter = story.scrollTop + story.clientHeight / 2;
  parallaxItems.forEach((item) => {
    const factor = Number(item.dataset.parallax || 0);
    if (!Number.isFinite(factor)) return;

    const scene = item.closest(".scene");
    if (!scene) return;

    const sceneCenter = scene.offsetTop + scene.offsetHeight / 2;
    const distance = sceneCenter - viewportCenter;
    const normalized = clamp(distance / story.clientHeight, -1, 1);
    const y = normalized * factor * 140;
    item.style.setProperty("--parallax-y", `${y.toFixed(2)}px`);
  });
};

const updateRiverLoopMetrics = () => {
  if (!riverTrack) return;

  const originals = Array.from(riverTrack.children).filter(
    (item) => !item.classList.contains("is-clone")
  );
  if (!originals.length) return;

  const first = originals[0];
  const last = originals[originals.length - 1];
  const gap = parseFloat(getComputedStyle(riverTrack).columnGap || "0") || 0;
  const originalWidth = last.offsetLeft + last.offsetWidth - first.offsetLeft;
  const loopShift = originalWidth + gap;

  riverTrack.style.setProperty("--river-loop-shift", `${loopShift.toFixed(2)}px`);

  // Keep speed stable across different screen widths.
  const duration = clamp(loopShift / 44, 20, 48);
  riverTrack.style.setProperty("--river-duration", `${duration.toFixed(2)}s`);
};

const initRiverLoop = () => {
  if (!riverTrack) return;

  if (riverTrack.dataset.loopReady !== "1") {
    const originals = Array.from(riverTrack.children);
    originals.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.classList.add("is-clone");
      clone.setAttribute("aria-hidden", "true");
      riverTrack.appendChild(clone);
    });
    riverTrack.dataset.loopReady = "1";
  }

  updateRiverLoopMetrics();
};

const addSparkles = () => {
  if (!sparkleLayer || prefersReducedMotion) return;

  const total = 18;
  for (let i = 0; i < total; i += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle";

    const clusterX = i < 10 ? Math.random() * 55 + 5 : Math.random() * 45 + 45;
    const clusterY = i < 10 ? Math.random() * 28 + 6 : Math.random() * 28 + 64;

    sparkle.style.setProperty("--x", `${clusterX.toFixed(2)}%`);
    sparkle.style.setProperty("--y", `${clusterY.toFixed(2)}%`);
    sparkle.style.setProperty("--size", `${(Math.random() * 7 + 4).toFixed(2)}px`);
    sparkle.style.setProperty("--duration", `${(Math.random() * 3.4 + 4.2).toFixed(2)}s`);
    sparkle.style.setProperty("--delay", `${(Math.random() * 3.4).toFixed(2)}s`);
    sparkleLayer.appendChild(sparkle);
  }
};

const addRiseParticles = () => {
  if (!riseParticles || prefersReducedMotion) return;

  const amount = 16;
  for (let i = 0; i < amount; i += 1) {
    const dot = document.createElement("span");
    dot.className = "rise-dot";
    dot.style.setProperty("--dot-x", `${(Math.random() * 82 + 9).toFixed(2)}%`);
    dot.style.setProperty("--dot-size", `${(Math.random() * 3.2 + 2.4).toFixed(2)}px`);
    dot.style.setProperty("--dot-duration", `${(Math.random() * 2.5 + 4.8).toFixed(2)}s`);
    dot.style.setProperty("--dot-delay", `${(Math.random() * 3.6).toFixed(2)}s`);
    riseParticles.appendChild(dot);
  }
};

const requestSoundtrackPlay = () => {
  soundtrackPendingPlay = true;
  if (!soundtrackWidget || !soundtrackReady) return;

  try {
    soundtrackWidget.play();
  } catch (error) {
    // Browser policy can still block if user gesture is missing.
  }
};

const scrollToIntroScene = () => {
  if (!story || scenes.length < 2) return;

  story.scrollTo({
    top: scenes[1].offsetTop,
    behavior: prefersReducedMotion ? "auto" : "smooth"
  });
};

const bindHeroStartButton = () => {
  if (!heroStartBtn) return;

  heroStartBtn.addEventListener("click", () => {
    requestSoundtrackPlay();
    scrollToIntroScene();
  });
};

const initGlobalSoundtrack = () => {
  if (!soundtrackFrame || !window.SC || typeof window.SC.Widget !== "function") return;

  soundtrackWidget = window.SC.Widget(soundtrackFrame);
  soundtrackWidget.bind(window.SC.Widget.Events.READY, () => {
    soundtrackReady = true;
    if (soundtrackPendingPlay) {
      requestSoundtrackPlay();
    }
  });
};

let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateTitleSink();
    updateParallax();
    ticking = false;
  });
};

const init = () => {
  initGlobalSoundtrack();
  bindHeroStartButton();
  initRiverLoop();
  addSparkles();
  addRiseParticles();
  updateTitleSink();
  updateParallax();

  if (story) {
    story.addEventListener("scroll", onScroll, { passive: true });
  }
};

init();
window.addEventListener("resize", () => {
  updateRiverLoopMetrics();
  updateTitleSink();
  updateParallax();
});

window.addEventListener("load", updateRiverLoopMetrics);
