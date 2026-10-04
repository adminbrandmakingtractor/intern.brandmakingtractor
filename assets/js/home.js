/* Homepage-only behaviour: sample certificate large-preview modal. */
(function () {
  const modal = document.getElementById("sampleCertModal");
  const body = document.getElementById("sampleCertModalBody");
  const source = document.querySelector(".cert-zoom .sample-cert-svg");
  if (!modal || !body || !source) return;

  let lastFocus = null;

  function open() {
    if (!body.firstChild) {
      const clone = source.cloneNode(true);
      // Keep ids unique in the document (title + seal text paths).
      clone.querySelectorAll("[id]").forEach((el) => { el.id = "m-" + el.id; });
      clone.querySelectorAll("textPath").forEach((tp) => tp.setAttribute("href", "#m-" + tp.getAttribute("href").slice(1)));
      clone.setAttribute("aria-labelledby", "m-sampleCertTitle");
      body.appendChild(clone);
    }
    lastFocus = document.activeElement;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    modal.querySelector("[data-close-sample-cert]").focus();
  }

  function close() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  document.querySelectorAll("[data-open-sample-cert]").forEach((btn) => btn.addEventListener("click", open));
  modal.querySelector("[data-close-sample-cert]").addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("open")) close(); });
})();
