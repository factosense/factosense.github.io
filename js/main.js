(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const vendors = [
    { name: "Siemens", logo: "assets/vendors/siemens.png" },
    { name: "Rockwell Automation / Allen-Bradley", logo: "assets/vendors/rockwell-automation.png" },
    { name: "Mitsubishi Electric", logo: "assets/vendors/mitsubishi-electric.png" },
    { name: "Omron", logo: "assets/vendors/omron.png" },
    { name: "Schneider Electric", logo: "assets/vendors/schneider-electric.png" },
    { name: "Beckhoff", logo: "assets/vendors/beckhoff.png" },
    { name: "Delta Electronics", logo: "assets/vendors/delta.png" },
    { name: "ABB", logo: "assets/vendors/abb.png" },
    { name: "Panasonic", logo: "assets/vendors/panasonic.png" },
    { name: "Fuji Electric", logo: "assets/vendors/fuji-electric.png" },
    { name: "Yaskawa", logo: "assets/vendors/yaskawa.png" },
    { name: "Keyence", logo: "assets/vendors/keyence.png" },
  ];


  function setupReveal() {
    const items = document.querySelectorAll(".reveal");

    items.forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 45}ms`);
    });

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    document.documentElement.classList.add("supports-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.01, rootMargin: "0px 0px 12% 0px" }
    );

    items.forEach((item) => observer.observe(item));
  }

  function setupNav() {
    const nav = document.querySelector("[data-site-nav]");
    if (!nav) return;
    const navItems = Array.from(document.querySelectorAll(".nav-link[href^='#']"))
      .map((link) => {
        const section = document.querySelector(link.getAttribute("href"));
        return section ? { link, section } : null;
      })
      .filter(Boolean);
    let ticking = false;

    function setActiveNav(activeId) {
      navItems.forEach(({ link, section }) => {
        const isActive = section.id === activeId;
        link.classList.toggle("is-active", isActive);
        if (isActive) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    }

    function updateNavState() {
      nav.classList.toggle("is-scrolled", window.scrollY > 24);

      const activationLine = nav.offsetHeight + Math.min(window.innerHeight * 0.22, 180);
      const current = navItems.reduce((active, item) => {
        const top = item.section.getBoundingClientRect().top;
        return top <= activationLine ? item : active;
      }, null);

      setActiveNav(current ? current.section.id : "");
    }

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          updateNavState();
          ticking = false;
        });
      },
      { passive: true }
    );

    window.addEventListener("resize", updateNavState, { passive: true });
    updateNavState();

    const toggle = nav.querySelector(".nav-toggle");

    function setMenu(open) {
      nav.classList.toggle("is-open", open);
      if (toggle) toggle.setAttribute("aria-expanded", String(open));
    }

    if (toggle) {
      toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
    }

    nav.querySelectorAll(".nav-links a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenu(false);
    });
  }

  function setupCounters() {
    const counters = document.querySelectorAll("[data-counter]");

    const run = (counter) => {
      const target = Number(counter.dataset.target || 0);
      const duration = reduceMotion ? 1 : 1100;
      const started = performance.now();

      function tick(now) {
        const t = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        counter.textContent = Math.round(target * eased);
        if (t < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) {
      counters.forEach(run);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          run(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((counter) => observer.observe(counter));
  }



  function setupVendorWall() {
    const wall = document.querySelector("[data-vendor-wall]");
    if (!wall) return;

    const logo = (vendor, hidden) => `
      <div class="vendor-logo"${hidden ? ' aria-hidden="true"' : ""}>
        <img src="${vendor.logo}" alt="${hidden ? "" : `${vendor.name} logo`}" width="280" height="116" loading="lazy" decoding="async">
      </div>
    `;
    // The track scrolls by half its width, so it holds the row four times; only the first copy is announced.
    const row = (list, reverse) => `
      <div class="marquee-track${reverse ? " marquee-track-reverse" : ""}">
        ${list.map((vendor) => logo(vendor, false)).join("")}
        ${[...list, ...list, ...list].map((vendor) => logo(vendor, true)).join("")}
      </div>
    `;
    const half = Math.ceil(vendors.length / 2);
    const first = vendors.slice(0, half);
    const second = vendors.slice(half);

    wall.innerHTML = row(first, false) + row(second, true);
  }

  function setupDemoForm() {
    const form = document.getElementById("demoForm");
    if (!form) return;

    function updateFormState() {
      const trackedFields = ["name", "email", "phone", "company", "message"];
      const data = new FormData(form);

      trackedFields.forEach((field) => {
        const input = form.elements[field];
        if (!input) return;
        input.classList.toggle("is-filled", String(data.get(field) || "").trim().length > 0);
      });
    }

    form.addEventListener("input", updateFormState);
    form.addEventListener("change", updateFormState);
    updateFormState();

    const endpoint = "https://script.google.com/macros/s/AKfycbyJlz8oA76StBjC2pTJCw81QGJ4tjuNA4a-LDZjHSvy13g4_IK7nss8-6GWnwvb85FI/exec";
    const button = form.querySelector('button[type="submit"]');
    const status = document.createElement("div");
    status.className = "form-status";
    status.setAttribute("role", "status");
    status.hidden = true;
    form.appendChild(status);

    function showStatus(text, isError) {
      status.textContent = text;
      status.classList.toggle("is-error", isError);
      status.hidden = false;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const data = new FormData(form);
      const payload = {
        name: String(data.get("name") || "").trim(),
        email: String(data.get("email") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        company: String(data.get("company") || "").trim(),
        message: String(data.get("message") || "").trim(),
      };

      button.disabled = true;
      status.hidden = true;
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || "Submission failed");
        form.reset();
        updateFormState();
        showStatus("Thanks! Your demo request has been received. We will get back to you shortly.", false);
      } catch (error) {
        console.error(error);
        showStatus("Something went wrong sending your request. Please try again or email us at info@funoonlab.com.", true);
      } finally {
        button.disabled = false;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupReveal();
    setupNav();
    setupCounters();
    setupVendorWall();
    setupDemoForm();
  });
})();
