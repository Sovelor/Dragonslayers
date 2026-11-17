import { h } from "preact"

// Image lightbox: click a picture on a wiki page and it opens large on a dark full-screen layer, like
// Wikipedia or Facebook. Esc, the ✕ button or a click outside closes it; ← → (or the arrows, or a swipe on
// a phone) move between the pictures of the page. The component draws nothing itself: it only brings the
// styles and the script. Images inside links that go somewhere else stay ordinary links.

// Runs in the browser (stringified below). Listeners are attached once; SPA navigation keeps them.
function clientScript() {
  if (window.__dsLightbox) return
  window.__dsLightbox = true

  const T = {
    en: {
      close: "Close",
      prev: "Previous picture",
      next: "Next picture",
      dialog: "Picture viewer",
    },
    el: {
      close: "Κλείσιμο",
      prev: "Προηγούμενη εικόνα",
      next: "Επόμενη εικόνα",
      dialog: "Προβολή εικόνας",
    },
  }
  const lang = () => (document.documentElement.lang === "el" ? "el" : "en")
  const t = (k) => T[lang()][k]

  const IMG_URL = /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i
  const FILE_NAME = /\.(png|jpe?g|gif|webp|avif|svg)$/i

  // Pictures inside the page text (not the explorer, graph, popovers, buttons or tiny icons).
  const zoomable = (img) => {
    if (!img.closest("article")) return false
    if (
      img.closest(".popover, .explorer, .graph, .search, nav, header, .suggest-edit, #ds-lightbox")
    )
      return false
    if (img.classList.contains("emoji")) return false
    const a = img.closest("a")
    if (a) {
      const href = a.getAttribute("href") || ""
      if (!IMG_URL.test(href)) return false // a link to another page: leave it alone
    }
    const w = img.naturalWidth || img.width
    return !(img.complete && w && w < 48)
  }

  const pageImages = () => Array.from(document.querySelectorAll("article img")).filter(zoomable)

  const markZoomable = () => {
    document.querySelectorAll("article img").forEach((img) => {
      if (zoomable(img)) img.classList.add("ds-zoomable")
      else img.classList.remove("ds-zoomable")
    })
  }

  let box, view, cap, count, prevBtn, nextBtn, closeBtn
  let list = []
  let index = 0
  let lastFocus = null
  let touchX = null

  const build = () => {
    if (box) return
    box = document.createElement("div")
    box.id = "ds-lightbox"
    box.setAttribute("role", "dialog")
    box.setAttribute("aria-modal", "true")
    box.hidden = true
    box.innerHTML =
      '<button type="button" class="ds-lb-btn ds-lb-close">✕</button>' +
      '<button type="button" class="ds-lb-btn ds-lb-prev">‹</button>' +
      '<button type="button" class="ds-lb-btn ds-lb-next">›</button>' +
      '<figure class="ds-lb-figure"><img class="ds-lb-img" alt=""><figcaption class="ds-lb-cap"></figcaption></figure>' +
      '<div class="ds-lb-count"></div>'
    document.body.appendChild(box)
    view = box.querySelector(".ds-lb-img")
    cap = box.querySelector(".ds-lb-cap")
    count = box.querySelector(".ds-lb-count")
    prevBtn = box.querySelector(".ds-lb-prev")
    nextBtn = box.querySelector(".ds-lb-next")
    closeBtn = box.querySelector(".ds-lb-close")

    closeBtn.addEventListener("click", close)
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      step(-1)
    })
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      step(1)
    })
    // A click anywhere outside the picture and the buttons closes it.
    box.addEventListener("click", (e) => {
      if (e.target === view || e.target.closest(".ds-lb-btn")) return
      close()
    })
    box.addEventListener(
      "touchstart",
      (e) => {
        touchX = e.touches.length === 1 ? e.touches[0].clientX : null
      },
      { passive: true },
    )
    box.addEventListener(
      "touchend",
      (e) => {
        if (touchX === null || list.length < 2) return
        const dx = e.changedTouches[0].clientX - touchX
        touchX = null
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
      },
      { passive: true },
    )
  }

  const label = (img) => {
    const text = (img.getAttribute("title") || img.getAttribute("alt") || "").trim()
    return text && !FILE_NAME.test(text) ? text : ""
  }

  const show = () => {
    const img = list[index]
    view.src = img.currentSrc || img.src
    view.alt = img.getAttribute("alt") || ""
    const text = label(img)
    cap.textContent = text
    cap.hidden = !text
    const many = list.length > 1
    prevBtn.hidden = nextBtn.hidden = count.hidden = !many
    count.textContent = index + 1 + " / " + list.length
  }

  const step = (d) => {
    if (list.length < 2) return
    index = (index + d + list.length) % list.length
    show()
  }

  const open = (img) => {
    build()
    list = pageImages()
    index = Math.max(0, list.indexOf(img))
    if (!list.length) list = [img]
    lastFocus = document.activeElement
    box.setAttribute("aria-label", t("dialog"))
    closeBtn.setAttribute("aria-label", t("close"))
    closeBtn.title = t("close")
    prevBtn.setAttribute("aria-label", t("prev"))
    prevBtn.title = t("prev")
    nextBtn.setAttribute("aria-label", t("next"))
    nextBtn.title = t("next")
    show()
    box.hidden = false
    document.documentElement.classList.add("ds-lb-open")
    closeBtn.focus({ preventScroll: true })
  }

  function close() {
    if (!box || box.hidden) return
    box.hidden = true
    view.removeAttribute("src")
    document.documentElement.classList.remove("ds-lb-open")
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true })
    lastFocus = null
  }

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)
      return
    const img = e.target instanceof Element ? e.target.closest("img") : null
    if (!img || !zoomable(img)) return
    e.preventDefault()
    open(img)
  })

  document.addEventListener("keydown", (e) => {
    if (!box || box.hidden) return
    if (e.key === "Escape") {
      e.preventDefault()
      close()
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      step(-1)
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      step(1)
    } else if (e.key === "Tab") {
      // Keep keyboard focus inside the viewer.
      const btns = [closeBtn, prevBtn, nextBtn].filter((b) => !b.hidden)
      const i = btns.indexOf(document.activeElement)
      e.preventDefault()
      btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus()
    }
  })

  // SPA navigation: close the viewer and mark the new page's pictures.
  document.addEventListener("nav", () => {
    close()
    markZoomable()
    // Images that were still loading get marked once they have a size.
    document.querySelectorAll("article img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", markZoomable, { once: true })
    })
  })
  markZoomable()
}

export const ImageLightbox = () => {
  const Component = () => h("span", { class: "ds-lightbox-anchor", hidden: true })

  Component.css = `
article img.ds-zoomable {
  cursor: zoom-in;
}
html.ds-lb-open {
  overflow: hidden;
}
#ds-lightbox {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 8, 6, 0.96);
  animation: ds-lb-in 0.15s ease-out;
}
#ds-lightbox[hidden] {
  display: none;
}
@keyframes ds-lb-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  #ds-lightbox { animation: none; }
}
#ds-lightbox .ds-lb-figure {
  margin: 0;
  max-width: 100vw;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}
#ds-lightbox .ds-lb-img {
  display: block;
  max-width: 94vw;
  max-height: 86vh;
  width: auto;
  height: auto;
  margin: 0;
  object-fit: contain;
  border-radius: 3px;
  box-shadow: 0 4px 28px rgba(0, 0, 0, 0.6);
  cursor: default;
  background: none;
}
#ds-lightbox .ds-lb-cap {
  max-width: 90vw;
  color: #eadfc4;
  font-size: 1rem;
  text-align: center;
}
#ds-lightbox .ds-lb-cap[hidden] {
  display: none;
}
#ds-lightbox .ds-lb-count {
  position: absolute;
  left: 50%;
  bottom: 0.8rem;
  transform: translateX(-50%);
  color: #cbbd9f;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
}
#ds-lightbox .ds-lb-btn {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.8rem;
  height: 2.8rem;
  padding: 0;
  font: inherit;
  font-size: 1.7rem;
  line-height: 1;
  color: #eadfc4;
  background: rgba(20, 17, 15, 0.7);
  border: 1px solid #6f624f;
  border-radius: 50%;
  cursor: pointer;
}
#ds-lightbox .ds-lb-btn:hover,
#ds-lightbox .ds-lb-btn:focus-visible {
  color: #14110f;
  background: #c9a24a;
  border-color: #c9a24a;
  outline: none;
}
#ds-lightbox .ds-lb-btn[hidden] {
  display: none;
}
#ds-lightbox .ds-lb-close {
  top: 0.9rem;
  right: 0.9rem;
  font-size: 1.2rem;
}
#ds-lightbox .ds-lb-prev {
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
}
#ds-lightbox .ds-lb-next {
  right: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
}
@media (max-width: 600px) {
  #ds-lightbox .ds-lb-btn { width: 2.4rem; height: 2.4rem; }
  #ds-lightbox .ds-lb-prev { left: 0.4rem; }
  #ds-lightbox .ds-lb-next { right: 0.4rem; }
}
@media print {
  #ds-lightbox,
  .ds-lightbox-anchor {
    display: none;
  }
}
`

  Component.afterDOMLoaded = "(" + clientScript.toString() + ")()"
  return Component
}
