import { h } from "preact"

// "✏️ Suggest an edit": readers select text on a page (or press the button under the title), say what it
// should say, and the fix goes to the DM Desk inbox in the vault (Apps Script web app, WikiSuggest.gs).
// The DM and the wiki owner open their personal link once (…/#desk=<key>); after that this browser sends
// their edits as theirs and they are applied directly. Everyone else's edits wait for a yes/no.

const GREEK_ROOT = "el"

const LABEL = { en: "✏️ Suggest an edit", el: "✏️ Προτείνετε διόρθωση" }

// Runs in the browser (stringified below). Listeners are attached once; SPA navigation keeps them.
function clientScript() {
  if (window.__dsSuggestEdit) return
  window.__dsSuggestEdit = true

  const KEY = "dsDeskKey"
  const ROLE = "dsDeskRole"
  const OTHER = "Someone else"
  const T = {
    en: {
      fix: "✏️ Suggest an edit",
      title: "Suggest an edit",
      intro:
        "Spotted a mistake or something missing? Tell us here. The DM or the wiki owner checks every suggestion before it goes on the wiki.",
      asDm: "Sending as the DM: your edit is applied directly.",
      asOwner:
        "Sending as the wiki owner: your edit is applied directly, unless it conflicts with the DM.",
      quote: "Text on the page (select it before pressing the button, or paste it)",
      should: "What should it say? (leave empty to remove that text)",
      note: "Anything else? Why, or where it comes from (optional)",
      who: "Who are you? (optional, e.g. Edric's player)",
      vis: "Can this go on the public wiki?",
      public: "Public",
      secret: "Secret: never publish it",
      later: "Secret for now: it can be revealed later",
      send: "Send",
      cancel: "Cancel",
      close: "Close",
      empty: "Write what it should say, or a note.",
      sending: "Sending…",
      doneReader:
        "Thank you! Your suggestion ({id}) is waiting for the DM or the wiki owner to approve it.",
      doneTrusted: "Thank you! Edit {id} will be on the wiki after the next update.",
      busy: "Too many suggestions right now. Please try again in an hour.",
      error: "Couldn't send it. Check your connection and try again.",
      linkDm: "Edit link saved: this browser now sends edits as the DM.",
      linkOwner: "Edit link saved: this browser now sends edits as the wiki owner.",
      linkSaved: "Edit link saved.",
      badLink: "This edit link isn't valid any more. Edits from this browser count as a reader's.",
      forgot: "Edit link removed from this browser.",
    },
    el: {
      fix: "✏️ Διόρθωση",
      title: "Πρόταση διόρθωσης",
      intro:
        "Βρήκατε κάποιο λάθος ή κάτι που λείπει; Γράψτε το εδώ. Ο DM ή ο διαχειριστής του wiki ελέγχει κάθε πρόταση πριν μπει στο wiki.",
      asDm: "Αποστολή ως DM: η διόρθωση εφαρμόζεται απευθείας.",
      asOwner:
        "Αποστολή ως διαχειριστής του wiki: η διόρθωση εφαρμόζεται απευθείας, εκτός αν έρχεται σε αντίθεση με τον DM.",
      quote: "Κείμενο της σελίδας (επιλέξτε το πριν πατήσετε το κουμπί ή επικολλήστε το)",
      should: "Τι πρέπει να γράφει; (αφήστε το κενό για να αφαιρεθεί το κείμενο)",
      note: "Κάτι άλλο; Γιατί ή από πού προέρχεται (προαιρετικό)",
      who: "Ποιος/ποια είστε; (προαιρετικό, π.χ. παίκτης/παίκτρια του Edric)",
      vis: "Μπορεί να μπει στο δημόσιο wiki;",
      public: "Δημόσιο",
      secret: "Μυστικό: να μη δημοσιευτεί ποτέ",
      later: "Μυστικό προς το παρόν: μπορεί να αποκαλυφθεί αργότερα",
      send: "Αποστολή",
      cancel: "Άκυρο",
      close: "Κλείσιμο",
      empty: "Γράψτε τι πρέπει να γράφει ή ένα σχόλιο.",
      sending: "Αποστολή…",
      doneReader:
        "Ευχαριστούμε! Η πρότασή σας ({id}) περιμένει έγκριση από τον DM ή τον διαχειριστή του wiki.",
      doneTrusted: "Ευχαριστούμε! Η διόρθωση {id} θα εμφανιστεί στο wiki με την επόμενη ενημέρωση.",
      busy: "Πάρα πολλές προτάσεις αυτή τη στιγμή. Δοκιμάστε ξανά σε μία ώρα.",
      error: "Η αποστολή απέτυχε. Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.",
      linkDm: "Ο σύνδεσμος αποθηκεύτηκε: οι διορθώσεις από αυτόν τον browser στέλνονται ως DM.",
      linkOwner:
        "Ο σύνδεσμος αποθηκεύτηκε: οι διορθώσεις από αυτόν τον browser στέλνονται ως διαχειριστής του wiki.",
      linkSaved: "Ο σύνδεσμος αποθηκεύτηκε.",
      badLink:
        "Αυτός ο σύνδεσμος δεν ισχύει πια. Οι διορθώσεις από αυτόν τον browser μετράνε ως προτάσεις αναγνώστη.",
      forgot: "Ο σύνδεσμος αφαιρέθηκε από αυτόν τον browser.",
    },
  }

  const store = {
    get(k) {
      try {
        return localStorage.getItem(k)
      } catch (e) {
        return null
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, v)
      } catch (e) {
        /* private window: the edit link only lasts this visit */
      }
    },
    del(k) {
      try {
        localStorage.removeItem(k)
      } catch (e) {
        /* nothing stored */
      }
    },
  }
  const lang = () =>
    document.documentElement.lang === "el" || (document.body.dataset.slug || "").startsWith("el/")
      ? "el"
      : "en"
  const t = (k) => T[lang()][k]
  const host = () => document.querySelector(".suggest-edit[data-endpoint]")
  const forgetKey = () => {
    store.del(KEY)
    store.del(ROLE)
  }

  async function post(endpoint, body) {
    // text/plain body: no CORS preflight, which Apps Script can't answer
    const res = await fetch(endpoint, { method: "POST", body: JSON.stringify(body) })
    return res.json()
  }

  async function checkKey(endpoint) {
    const key = store.get(KEY)
    if (!key) return OTHER
    const known = store.get(ROLE)
    if (known) return known
    try {
      const r = await post(endpoint, { action: "whoami", key })
      if (r.valid) {
        store.set(ROLE, r.role)
        return r.role
      }
      forgetKey()
      toast(t("badLink"))
    } catch (e) {
      /* offline: ask again next time */
    }
    return OTHER
  }

  function toast(text) {
    let el = document.getElementById("ds-suggest-toast")
    if (!el) {
      el = document.createElement("div")
      el.id = "ds-suggest-toast"
      el.setAttribute("role", "status")
      document.body.appendChild(el)
    }
    el.textContent = text
    el.hidden = false
    clearTimeout(el._timer)
    el._timer = setTimeout(() => (el.hidden = true), 6000)
  }

  // Personal edit link: …/#desk=<key> saves the key, #desk=forget removes it.
  function readHash() {
    const m = location.hash.match(/^#desk=([A-Za-z0-9]+)$/)
    if (!m) return
    history.replaceState(history.state, "", location.pathname + location.search)
    if (m[1] === "forget") {
      forgetKey()
      toast(t("forgot"))
      return
    }
    store.set(KEY, m[1])
    store.del(ROLE)
    const h = host()
    if (!h) {
      toast(t("linkSaved"))
      return
    }
    checkKey(h.dataset.endpoint).then((role) => {
      if (role === "DM") toast(t("linkDm"))
      else if (role === "Wiki owner") toast(t("linkOwner"))
    })
  }

  // Floating button next to selected text
  let selText = ""
  function floatButton() {
    let b = document.getElementById("ds-suggest-float")
    if (!b) {
      b = document.createElement("button")
      b.id = "ds-suggest-float"
      b.type = "button"
      b.hidden = true
      b.addEventListener("pointerdown", (e) => e.preventDefault()) // keep the selection
      b.addEventListener("click", () => {
        b.hidden = true
        openPanel(selText)
      })
      document.body.appendChild(b)
    }
    return b
  }

  function onSelection() {
    const b = floatButton()
    const sel = window.getSelection()
    const text = sel && !sel.isCollapsed ? sel.toString().trim() : ""
    const article = document.querySelector("article")
    const inside =
      text &&
      article &&
      sel.rangeCount &&
      article.contains(sel.getRangeAt(0).commonAncestorContainer)
    if (!host() || !inside) {
      b.hidden = true
      selText = ""
      return
    }
    selText = text.slice(0, 2000)
    const r = sel.getRangeAt(0).getBoundingClientRect()
    b.textContent = t("fix")
    b.hidden = false
    const maxLeft = document.documentElement.clientWidth - b.offsetWidth - 8
    b.style.top = window.scrollY + r.bottom + 8 + "px"
    b.style.left =
      window.scrollX +
      Math.max(8, Math.min(r.left + r.width / 2 - b.offsetWidth / 2, maxLeft)) +
      "px"
  }

  let selTimer
  document.addEventListener("selectionchange", () => {
    clearTimeout(selTimer)
    selTimer = setTimeout(onSelection, 250)
  })

  // The panel
  function dialog() {
    let d = document.getElementById("ds-suggest-dialog")
    if (d) return d
    d = document.createElement("dialog")
    d.id = "ds-suggest-dialog"
    d.setAttribute("aria-labelledby", "ds-suggest-title")
    d.innerHTML = `
<form class="ds-suggest-form" novalidate>
  <h2 id="ds-suggest-title" data-t="title"></h2>
  <p class="ds-suggest-intro"></p>
  <label><span data-t="quote"></span><textarea name="quote" rows="3" maxlength="2000"></textarea></label>
  <label><span data-t="should"></span><textarea name="should" rows="4" maxlength="4000"></textarea></label>
  <label><span data-t="note"></span><textarea name="note" rows="2" maxlength="2000"></textarea></label>
  <label class="ds-suggest-who"><span data-t="who"></span><input name="who" maxlength="80" autocomplete="off"></label>
  <fieldset class="ds-suggest-vis" hidden>
    <legend data-t="vis"></legend>
    <label><input type="radio" name="visibility" value="public" checked> <span data-t="public"></span></label>
    <label><input type="radio" name="visibility" value="secret"> <span data-t="secret"></span></label>
    <label><input type="radio" name="visibility" value="secret-for-now"> <span data-t="later"></span></label>
  </fieldset>
  <label class="ds-suggest-trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
  <p class="ds-suggest-status" role="status"></p>
  <div class="ds-suggest-actions">
    <button type="button" class="ds-cancel" data-t="cancel"></button>
    <button type="submit" class="ds-send" data-t="send"></button>
  </div>
</form>`
    document.body.appendChild(d)
    const f = d.querySelector("form")
    d.querySelector(".ds-cancel").addEventListener("click", () => d.close())
    d.addEventListener("click", (e) => {
      if (e.target === d) d.close() // click on the backdrop
    })
    f.addEventListener("submit", (e) => {
      e.preventDefault()
      send(d, f)
    })
    return d
  }

  function setStatus(d, text, isError) {
    const p = d.querySelector(".ds-suggest-status")
    p.textContent = text
    p.classList.toggle("error", !!isError)
  }

  function applyRole(d, role) {
    const trusted = role === "DM" || role === "Wiki owner"
    d.dataset.role = role
    d.querySelector(".ds-suggest-intro").textContent = trusted
      ? role === "DM"
        ? t("asDm")
        : t("asOwner")
      : t("intro")
    d.querySelector(".ds-suggest-intro").classList.toggle("trusted", trusted)
    d.querySelector(".ds-suggest-vis").hidden = !trusted
    d.querySelector(".ds-suggest-who").hidden = trusted
  }

  function openPanel(quote) {
    const h = host()
    if (!h) return
    const d = dialog()
    const f = d.querySelector("form")
    d.querySelectorAll("[data-t]").forEach((el) => (el.textContent = t(el.dataset.t)))
    d.lang = lang()
    f.reset()
    f.elements.quote.value = quote || ""
    d.dataset.done = ""
    d.querySelector(".ds-cancel").hidden = false
    d.querySelector(".ds-send").disabled = false
    setStatus(d, "")
    const known = store.get(ROLE)
    applyRole(d, known || OTHER)
    if (!d.open) d.showModal()
    ;(quote ? f.elements.should : f.elements.quote).focus()
    if (store.get(KEY) && !known) checkKey(h.dataset.endpoint).then((role) => applyRole(d, role))
  }

  async function send(d, f) {
    if (d.dataset.done) {
      d.close()
      return
    }
    const h = host()
    const el = f.elements
    const data = {
      quote: el.quote.value.trim(),
      should: el.should.value.trim(),
      note: el.note.value.trim(),
    }
    if (!h || (!data.quote && !data.should && !data.note)) {
      setStatus(d, t("empty"), true)
      return
    }
    const button = d.querySelector(".ds-send")
    button.disabled = true
    setStatus(d, t("sending"))
    try {
      const vis = f.querySelector("input[name=visibility]:checked")
      const r = await post(h.dataset.endpoint, {
        action: "suggest",
        key: store.get(KEY) || "",
        page: h.dataset.path,
        title: h.dataset.title,
        url: location.href.split("#")[0],
        lang: lang(),
        quote: data.quote,
        should: data.should,
        note: data.note,
        who: el.who.value.trim(),
        visibility: vis ? vis.value : "public",
        website: el.website.value,
      })
      if (!r.ok) throw new Error(r.error || "failed")
      if (r.role === OTHER && store.get(KEY)) forgetKey()
      else if (r.role !== OTHER) store.set(ROLE, r.role)
      setStatus(d, (r.role === OTHER ? t("doneReader") : t("doneTrusted")).replace("{id}", r.id))
      d.dataset.done = "1"
      d.querySelector(".ds-cancel").hidden = true
      button.textContent = t("close")
      button.disabled = false
      button.focus()
    } catch (err) {
      setStatus(d, err && err.message === "busy" ? t("busy") : t("error"), true)
      button.disabled = false
    }
  }

  document.addEventListener("click", (e) => {
    const open = e.target.closest && e.target.closest(".suggest-edit-open")
    if (open) openPanel(selText)
  })
  readHash()
  document.addEventListener("nav", readHash)
  window.addEventListener("hashchange", readHash)
}

export const SuggestEdit = (opts) => {
  const endpoint = String(opts?.endpoint ?? "").trim()

  const Component = ({ fileData, displayClass }) => {
    const path = (fileData.relativePath ?? "").replace(/\\/g, "/")
    // Nothing until the web app URL is set, and nothing on folder or tag listings.
    if (!endpoint || !/\.md$/i.test(path)) return null
    const greek = (fileData.slug ?? "").startsWith(GREEK_ROOT + "/")
    const title = String(fileData.frontmatter?.title ?? path.split("/").pop().replace(/\.md$/i, ""))
    return h(
      "div",
      {
        class: ["suggest-edit", displayClass].filter(Boolean).join(" "),
        "data-endpoint": endpoint,
        "data-path": path,
        "data-title": title,
      },
      h("button", { type: "button", class: "suggest-edit-open" }, greek ? LABEL.el : LABEL.en),
    )
  }

  Component.css = `
.suggest-edit {
  display: flex;
  justify-content: flex-end;
  margin: 0.25rem 0 0.5rem;
}
.suggest-edit-open,
#ds-suggest-float {
  font-family: var(--bodyFont);
  font-size: 0.9rem;
  color: var(--gray);
  background: none;
  border: 1px solid var(--lightgray);
  border-radius: 999px;
  padding: 0.15rem 0.7rem;
  cursor: pointer;
}
.suggest-edit-open:hover,
#ds-suggest-float:hover {
  color: var(--secondary);
  border-color: var(--secondary);
}
#ds-suggest-float {
  position: absolute;
  z-index: 50;
  background: var(--light);
  color: var(--secondary);
  border-color: var(--secondary);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
}
#ds-suggest-float[hidden],
#ds-suggest-toast[hidden] {
  display: none;
}
#ds-suggest-dialog {
  box-sizing: border-box;
  width: min(34rem, calc(100vw - 2rem));
  max-height: calc(100vh - 2rem);
  padding: 1.25rem;
  color: var(--dark);
  background: var(--light);
  border: 1px solid var(--secondary);
  border-radius: 8px;
}
#ds-suggest-dialog::backdrop {
  background: rgba(0, 0, 0, 0.6);
}
.ds-suggest-form h2 {
  margin: 0 0 0.5rem;
  font-family: var(--headerFont);
  color: var(--secondary);
  font-size: 1.3rem;
}
.ds-suggest-intro {
  margin: 0 0 1rem;
  color: var(--darkgray);
  font-size: 0.95rem;
}
.ds-suggest-intro.trusted {
  color: var(--secondary);
}
.ds-suggest-form > label,
.ds-suggest-vis {
  display: block;
  margin: 0 0 0.8rem;
  font-size: 0.95rem;
}
.ds-suggest-form > label[hidden],
.ds-suggest-vis[hidden] {
  display: none;
}
.ds-suggest-form > label > span {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--darkgray);
}
.ds-suggest-form textarea,
.ds-suggest-form input[name="who"] {
  box-sizing: border-box;
  width: 100%;
  font: inherit;
  color: var(--dark);
  background: var(--lightgray);
  border: 1px solid var(--gray);
  border-radius: 4px;
  padding: 0.4rem 0.5rem;
  resize: vertical;
}
.ds-suggest-form textarea:focus,
.ds-suggest-form input:focus {
  outline: 2px solid var(--secondary);
  outline-offset: 1px;
}
.ds-suggest-vis {
  border: 1px solid var(--lightgray);
  border-radius: 4px;
  padding: 0.4rem 0.7rem 0.6rem;
}
.ds-suggest-vis legend {
  color: var(--darkgray);
  padding: 0 0.3rem;
}
.ds-suggest-vis label {
  display: block;
  margin-top: 0.25rem;
}
.ds-suggest-trap {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.ds-suggest-status {
  min-height: 1.2em;
  margin: 0 0 0.8rem;
  color: var(--secondary);
}
.ds-suggest-status.error {
  color: var(--tertiary);
}
.ds-suggest-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}
.ds-suggest-actions button {
  font: inherit;
  padding: 0.35rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid var(--gray);
  background: none;
  color: var(--darkgray);
}
.ds-suggest-actions button[hidden] {
  display: none;
}
.ds-suggest-actions .ds-send {
  border-color: var(--secondary);
  background: var(--secondary);
  color: var(--light);
  font-weight: 600;
}
.ds-suggest-actions .ds-send:disabled {
  opacity: 0.6;
  cursor: wait;
}
#ds-suggest-toast {
  position: fixed;
  left: 50%;
  bottom: 1.5rem;
  transform: translateX(-50%);
  z-index: 60;
  max-width: calc(100vw - 2rem);
  padding: 0.6rem 1rem;
  color: var(--dark);
  background: var(--lightgray);
  border: 1px solid var(--secondary);
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}
@media print {
  .suggest-edit,
  #ds-suggest-float {
    display: none;
  }
}
`

  Component.afterDOMLoaded = "(" + clientScript.toString() + ")()"
  return Component
}
