(() => {
  const overlay = document.querySelector(".overlay");
  if (!overlay) return;

  const overlayBody = overlay.querySelector(".overlay-body");
  const closeButton = overlay.querySelector(".overlay-close");
  if (!overlayBody || !closeButton) return;

  const openOverlay = (node) => {
    overlayBody.innerHTML = "";
    overlayBody.appendChild(node);
    overlay.classList.add("is-active");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  };

  const closeOverlay = () => {
    overlay.classList.remove("is-active");
    overlay.setAttribute("aria-hidden", "true");
    overlayBody.innerHTML = "";
    document.body.classList.remove("no-scroll");
  };

  const bindMedia = (media) => {
    media.addEventListener("click", () => {
      if (media.tagName === "VIDEO") {
        const zoomVideo = document.createElement("video");
        zoomVideo.src = media.currentSrc || media.src;
        zoomVideo.controls = true;
        zoomVideo.autoplay = true;
        zoomVideo.loop = true;
        zoomVideo.playsInline = true;
        zoomVideo.muted = true;
        openOverlay(zoomVideo);
      } else {
        const zoomImage = document.createElement("img");
        zoomImage.src = media.currentSrc || media.src;
        zoomImage.alt = media.alt || "Expanded view";
        openOverlay(zoomImage);
      }
    });
  };

  document.querySelectorAll("[data-zoom]").forEach(bindMedia);

  closeButton.addEventListener("click", closeOverlay);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeOverlay();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("is-active")) {
      closeOverlay();
    }
  });
})();

const detectPlatform = () => {
  const ua = navigator.userAgent || "";
  const userAgentDataPlatform = navigator.userAgentData?.platform || "";
  const legacyPlatform = navigator.platform || "";
  const source = `${ua} ${userAgentDataPlatform} ${legacyPlatform}`.toLowerCase();
  const isIOS =
    /iphone|ipad|ipod/.test(source) ||
    (legacyPlatform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = source.includes("android");

  if (isIOS || isAndroid) return null;
  if (source.includes("mac")) return "macos";
  if (source.includes("win")) return "windows";
  if (source.includes("linux")) return "linux";
  return null;
};

(() => {
  const platform = detectPlatform();

  document.querySelectorAll("[data-hero-shot]").forEach((picture) => {
    picture.classList.remove("is-windows-shot");

    if (platform !== "windows") return;

    const source = picture.querySelector("source");
    const img = picture.querySelector("img");
    let switchedToWindows = false;

    if (source && picture.dataset.darkWindows) {
      source.srcset = picture.dataset.darkWindows;
      switchedToWindows = true;
    }

    if (img && picture.dataset.lightWindows) {
      img.src = picture.dataset.lightWindows;
      switchedToWindows = true;
    }

    if (switchedToWindows && picture.dataset.frameWindows === "true") {
      picture.classList.add("is-windows-shot");
    }
  });
})();

(() => {
  const page = document.querySelector("[data-download-page]");
  if (!page) return;

  const platform = detectPlatform();
  if (!platform) return;

  // Highlight the card for the visitor's OS and float it to the front.
  const card = page.querySelector(`.platform-card[data-os="${platform}"]`);
  if (!card) return;

  card.classList.add("is-recommended");
  const badge = card.querySelector(".platform-badge");
  if (badge) badge.hidden = false;
  card.parentElement.prepend(card);
})();

(() => {
  const toggle = document.querySelector(".sidebar-toggle");
  if (!toggle) return;

  const backdrop = document.querySelector(".sidebar-backdrop");

  const setOpen = (open) => {
    document.body.classList.toggle("sidebar-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  };

  toggle.addEventListener("click", () => {
    setOpen(!document.body.classList.contains("sidebar-open"));
  });

  if (backdrop) {
    backdrop.addEventListener("click", () => setOpen(false));
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  // Close the drawer after navigating via a sidebar link on narrow screens.
  document.querySelectorAll(".docs-sidebar a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });
})();
