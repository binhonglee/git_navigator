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
        zoomImage.src = media.src;
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

(() => {
  const primaryDownload = document.querySelector("[data-primary-download]");
  if (!primaryDownload) return;

  const platform = (() => {
    const ua = navigator.userAgent || "";
    const userAgentDataPlatform = navigator.userAgentData?.platform || "";
    const legacyPlatform = navigator.platform || "";
    const source = `${ua} ${userAgentDataPlatform} ${legacyPlatform}`.toLowerCase();

    if (source.includes("mac")) return "macos";
    if (source.includes("win")) return "windows";
    if (source.includes("linux")) return "linux";
    return null;
  })();

  if (!platform) return;

  const url = primaryDownload.dataset[`url${platform[0].toUpperCase()}${platform.slice(1)}`];
  const label = primaryDownload.dataset[`label${platform[0].toUpperCase()}${platform.slice(1)}`];

  if (url) {
    primaryDownload.href = url;
  }

  if (label) {
    primaryDownload.textContent = label;
    primaryDownload.setAttribute("aria-label", label);
  }

  document.querySelectorAll(`.platform-button[data-platform="${platform}"]`).forEach((button) => {
    button.hidden = true;
    button.classList.add("is-hidden-platform");
    button.style.display = "none";
    button.setAttribute("aria-hidden", "true");
    button.setAttribute("tabindex", "-1");
  });
})();
