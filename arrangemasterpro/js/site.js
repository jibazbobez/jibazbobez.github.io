"use strict";
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle"),
    nav = document.querySelector("#site-nav");
  function placeMobileMenu() {
    if (!toggle || !nav) return;
    const parent = nav.parentElement.getBoundingClientRect();
    const button = toggle.getBoundingClientRect();
    const width = Math.min(220, parent.width);
    nav.style.setProperty(
      "--menu-left",
      Math.max(0, Math.min(button.left - parent.left, parent.width - width)) +
        "px",
    );
  }
  window.addEventListener("resize", placeMobileMenu);
  document.addEventListener("click", (event) => {
    if (
      !nav?.classList.contains("open") ||
      nav.contains(event.target) ||
      toggle.contains(event.target)
    )
      return;
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  });
  nav?.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  });
  toggle?.addEventListener("click", () => {
    placeMobileMenu();
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
  });
  nav?.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle?.setAttribute("aria-expanded", "false");
    }),
  );
  // Smooth anchor scrolling and screenshot enlargement follow the original site.
  document.querySelectorAll('a[href^="#"]').forEach((link) =>
    link.addEventListener("click", (event) => {
      const target = document.getElementById(
        link.getAttribute("href").slice(1),
      );
      if (target) {
        event.preventDefault();
        target.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
        history.replaceState(null, "", link.getAttribute("href"));
      }
    }),
  );
  const tabs = [...document.querySelectorAll("[data-example]")];
  function selectExample(tab, focus = false) {
    tabs.forEach((t) => {
      const chosen = t === tab;
      t.setAttribute("aria-selected", String(chosen));
      t.tabIndex = chosen ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !chosen;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectExample(tab));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (i + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (i + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectExample(tabs[next], true);
      }
    });
  });
  const material = document.getElementById("material");
  if (material) {
    const materials = {
      vinyl: {
        price: 5.2,
        note: "ORACAL 651 reference: $28.95 for 24 in × 10 yd. About $5.20/m². Excludes print, laminate and tax.",
      },
      acrylic: {
        price: 59.15,
        note: "Clear cast acrylic, nominal 1/8 in (3.2 mm): $10.99 for 12 × 24 in. About $59.15/m², Inventables SKU 23876-11.",
      },
      holo: {
        price: 23.46,
        note: "TeckWrap holographic vinyl reference: $10.90 for 12 in × 5 ft. About $23.46/m²; exclude tax and freight.",
      },
      wood: {
        price: 38.6,
        note: "Duro laserable veneer / MDF-core sheet: $6.95 for 11¾ × 23¾ in. About $38.60/m².",
      },
      jersey: {
        price: 2.37,
        note: "100% polyester Micro Mesh, 61 in width: $3.35/yd at roll quantity. About $2.37/m².",
      },
    };
    const price = document.getElementById("material-price"),
      volume = document.getElementById("material-volume"),
      rate = document.getElementById("saving-rate");
    const usd = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
      number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
    function update() {
      const p = Number(price.value),
        v = Number(volume.value),
        r = Number(rate.value);
      const valid =
        price.value !== "" &&
        volume.value !== "" &&
        Number.isFinite(p) &&
        Number.isFinite(v) &&
        p >= 0 &&
        v >= 0;
      document.getElementById("rate-label").textContent = r + "%";
      document.getElementById("saving-money").textContent = valid
        ? usd.format((p * v * r) / 100)
        : "—";
      document.getElementById("saving-area").textContent = valid
        ? number.format((v * r) / 100) + " m²"
        : "—";
      document.getElementById("saving-year").textContent = valid
        ? usd.format(((p * v * r) / 100) * 12)
        : "—";
      document.getElementById("saved-strip").style.width = r + "%";
    }
    material.addEventListener("change", () => {
      price.value = materials[material.value].price.toFixed(2);
      document.getElementById("material-reference").textContent =
        materials[material.value].note;
      update();
    });
    document
      .getElementById("savings-form")
      .addEventListener("submit", (e) => e.preventDefault());
    [price, volume, rate].forEach((el) => el.addEventListener("input", update));
    document.getElementById("material-reference").textContent =
      materials.vinyl.note;
    update();
  }
  const dialog = document.getElementById("image-dialog");
  let previousFocus, gallery = [], galleryIndex = 0;
  const image = document.getElementById("dialog-image"),
    caption = document.getElementById("dialog-caption"),
    previous = dialog?.querySelector(".dialog-previous"),
    next = dialog?.querySelector(".dialog-next");
  function showGalleryImage(index) {
    galleryIndex = (index + gallery.length) % gallery.length;
    const link = gallery[galleryIndex];
    image.src = link.href;
    image.alt = link.querySelector("img")?.alt || "Enlarged illustration";
    const label = link.closest("figure")?.querySelector("figcaption strong, figcaption > span")?.textContent.trim() || image.alt;
    caption.textContent = gallery.length > 1 ? `${label} · ${galleryIndex + 1} / ${gallery.length}` : label;
    const grouped = gallery.length > 1;
    previous.hidden = next.hidden = !grouped;
    dialog.dataset.gallery = String(grouped);
  }
  document.querySelectorAll(".screenshot-preview").forEach((link) =>
    link.addEventListener("click", (event) => {
      if (!dialog?.showModal) return;
      event.preventDefault();
      previousFocus = link;
      const group = link.closest(".comparison-grid");
      gallery = group ? [...group.querySelectorAll(".screenshot-preview")] : [link];
      showGalleryImage(gallery.indexOf(link));
      dialog.showModal();
    }),
  );
  dialog?.querySelector(".dialog-close")?.addEventListener("click", () => dialog.close());
  previous?.addEventListener("click", () => showGalleryImage(galleryIndex - 1));
  next?.addEventListener("click", () => showGalleryImage(galleryIndex + 1));
  image?.addEventListener("click", () => {
    if (gallery.length > 1) showGalleryImage(galleryIndex + 1);
  });
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.classList.contains("dialog-figure")) dialog.close();
  });
  dialog?.addEventListener("keydown", (event) => {
    if (gallery.length <= 1) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      showGalleryImage(galleryIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  dialog?.addEventListener("close", () => previousFocus?.focus());

  const contentsLinks = [...document.querySelectorAll('.doc-toc a[href^="#"]')];
  const contentsSections = contentsLinks.map(link => ({link, heading: document.getElementById(link.hash.slice(1))})).filter(section => section.heading);
  let contentsUpdatePending = false;
  function updateContents() {
    contentsUpdatePending = false;
    const boundary = (document.querySelector('.main-header')?.getBoundingClientRect().bottom || 80) + 32;
    let active;
    for (const section of contentsSections) {
      if (section.heading.getBoundingClientRect().top <= boundary) active = section;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) active = contentsSections.at(-1);
    contentsSections.forEach(section => {
      if (section === active) section.link.setAttribute('aria-current','location');
      else section.link.removeAttribute('aria-current');
    });
    if (active) {
      const panel = active.link.closest('.doc-toc-inner');
      if (panel && panel.scrollHeight > panel.clientHeight) {
        const box = panel.getBoundingClientRect(), link = active.link.getBoundingClientRect();
        if (link.top < box.top + 8) panel.scrollTop -= box.top + 8 - link.top;
        else if (link.bottom > box.bottom - 8) panel.scrollTop += link.bottom - box.bottom + 8;
      }
    }
  }
  if (contentsSections.length) {
    updateContents();
    window.addEventListener('scroll', () => {
      if (contentsUpdatePending) return;
      contentsUpdatePending = true;
      requestAnimationFrame(updateContents);
    }, {passive:true});
    window.addEventListener('resize',updateContents);
  }
  const video = document.querySelector(".hero-video-bg video");
  if (video) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) video.pause();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) video.pause();
      else if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
        video.play().catch(() => {});
    });
    new IntersectionObserver((entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) video.pause();
        else if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
          video.play().catch(() => {});
      }),
    ).observe(video);
  }
});
