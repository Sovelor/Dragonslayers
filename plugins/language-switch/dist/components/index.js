import { h } from "preact"

// Greek pages live under content/el/. Each one names its English page in
// frontmatter, e.g. `translationOf: Characters/Badinga Alpenrok`.
const GREEK_ROOT = "el"

const stripMd = (p) => (p ?? "").replace(/\\/g, "/").replace(/\.md$/, "")
const isGreek = (file) => (file.slug ?? "").startsWith(GREEK_ROOT + "/")

// Link from `from` slug to `to` slug, the way Quartz writes relative links.
function relative(from, to) {
  const depth = from.split("/").length - 1
  const prefix = depth === 0 ? "./" : "../".repeat(depth)
  const target = to === "index" ? "" : to.replace(/(^|\/)index$/, "$1")
  return prefix + target
}

function findCounterpart(fileData, allFiles) {
  const byPath = new Map(allFiles.map((f) => [stripMd(f.relativePath), f]))
  if (isGreek(fileData)) {
    const key = fileData.frontmatter?.translationOf
    return key ? byPath.get(stripMd(String(key))) : undefined
  }
  const here = stripMd(fileData.relativePath)
  return allFiles.find(
    (f) =>
      isGreek(f) &&
      f.frontmatter?.translationOf &&
      stripMd(String(f.frontmatter.translationOf)) === here,
  )
}

export const LanguageSwitch = () => {
  const Component = ({ fileData, allFiles, displayClass }) => {
    const slug = fileData.slug ?? "index"
    const greek = isGreek(fileData)
    const other = findCounterpart(fileData, allFiles)
    // No translation yet: send readers to the other language's home page.
    const otherSlug = other?.slug ?? (greek ? "index" : GREEK_ROOT + "/index")
    const href = relative(slug, otherSlug)
    const title = other
      ? greek
        ? "Read this page in English"
        : "Διαβάστε τη σελίδα στα Ελληνικά"
      : greek
        ? "Not in English yet, go to the English home page"
        : "Δεν έχει μεταφραστεί ακόμα, μετάβαση στην ελληνική αρχική σελίδα"
    return h(
      "div",
      {
        class: ["language-switch", displayClass].filter(Boolean).join(" "),
        "data-lang": greek ? "el" : "en",
      },
      h(
        "span",
        { class: greek ? "lang" : "lang current", "aria-current": greek ? undefined : "true" },
        greek ? h("a", { href, class: "internal", title, lang: "en" }, "EN") : "EN",
      ),
      h("span", { class: "sep" }, "/"),
      h(
        "span",
        { class: greek ? "lang current" : "lang", "aria-current": greek ? "true" : undefined },
        greek ? "ΕΛ" : h("a", { href, class: "internal", title, lang: "el" }, "ΕΛ"),
      ),
    )
  }

  Component.css = `
.language-switch {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--headerFont);
  font-size: 0.95rem;
  letter-spacing: 0.06em;
  white-space: nowrap;
}
.language-switch .lang.current {
  color: var(--secondary);
  font-weight: 700;
}
.language-switch .lang a,
.language-switch .lang a.internal {
  color: var(--gray);
  border-bottom: none;
}
.language-switch .lang a:hover { color: var(--tertiary); }
.language-switch .sep { color: var(--gray); }

/* Show each language's own pages in the explorer. */
html[data-lang="en"] .explorer li:has(> .folder-container[data-folderpath="${GREEK_ROOT}/index"]) { display: none; }
html[data-lang="el"] .explorer .explorer-ul > li:not(.overflow-end):not(:has(> .folder-container[data-folderpath="${GREEK_ROOT}/index"])) { display: none; }
`

  Component.afterDOMLoaded = `
function setWikiLang() {
  const slug = document.body.dataset.slug || ""
  const lang = slug.startsWith("${GREEK_ROOT}/") ? "el" : "en"
  document.documentElement.dataset.lang = lang
  document.documentElement.lang = lang
}
setWikiLang()
document.addEventListener("nav", setWikiLang)
`
  return Component
}
