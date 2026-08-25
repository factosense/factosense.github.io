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

  function fitCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function fit() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    fit();
    window.addEventListener("resize", fit);

    return {
      ctx,
      size: () => canvas.getBoundingClientRect(),
    };
  }

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
    const navItems = Array.from(document.querySelectorAll(".navbar-collapse a[href^='#']"))
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
      nav.classList.toggle("nav-scrolled", window.scrollY > 24);

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

    document.querySelectorAll(".navbar-collapse .nav-link, .navbar-collapse .btn").forEach((link) => {
      link.addEventListener("click", () => {
        const menu = document.querySelector(".navbar-collapse.show");
        if (!menu || !window.bootstrap) return;
        window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
      });
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

  function setupHeroCanvas() {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas) return;
    const { ctx, size } = fitCanvas(canvas);
    let active = !reduceMotion;
    let frameId = 0;
    const nodes = Array.from({ length: 46 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00028,
      vy: (Math.random() - 0.5) * 0.00028,
    }));

    function draw() {
      const { width: w, height: h } = size();
      ctx.clearRect(0, 0, w, h);

      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > 1) node.vx *= -1;
        if (node.y < 0 || node.y > 1) node.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = (a.x - b.x) * w;
          const dy = (a.y - b.y) * h;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 150) continue;
          ctx.strokeStyle = `rgba(0, 172, 167, ${(1 - dist / 150) * 0.22})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x * w, a.y * h);
          ctx.lineTo(b.x * w, b.y * h);
          ctx.stroke();
        }
      }

      nodes.forEach((node, index) => {
        ctx.beginPath();
        ctx.arc(node.x * w, node.y * h, index % 4 === 0 ? 2.4 : 1.7, 0, Math.PI * 2);
        ctx.fillStyle = index % 3 === 0 ? "rgba(156, 239, 237, .76)" : "rgba(0, 172, 167, .72)";
        ctx.fill();
      });

      if (active) frameId = requestAnimationFrame(draw);
    }

    draw();

    if ("IntersectionObserver" in window && !reduceMotion) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          active = entry.isIntersecting;
          if (active && !frameId) draw();
          if (!active && frameId) {
            cancelAnimationFrame(frameId);
            frameId = 0;
          }
        },
        { rootMargin: "160px" }
      );
      observer.observe(canvas);
    }
  }

  function setupOperationsChart() {
    const canvas = document.getElementById("operationsChart");
    if (!canvas) return;
    const { ctx, size } = fitCanvas(canvas);
    let active = !reduceMotion;
    let frameId = 0;
    const points = Array.from({ length: 64 }, (_, index) => 62 + Math.sin(index * 0.28) * 13 + Math.random() * 8);
    let frame = 0;

    function update() {
      points.shift();
      const last = points[points.length - 1];
      points.push(Math.max(34, Math.min(96, last + (Math.random() - 0.46) * 7)));
    }

    function draw() {
      frame += 1;
      if (frame % 34 === 0) update();

      const { width: w, height: h } = size();
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(255, 255, 255, .08)";
      ctx.lineWidth = 1;
      for (let y = 0; y <= 4; y += 1) {
        ctx.beginPath();
        ctx.moveTo(0, (h / 4) * y);
        ctx.lineTo(w, (h / 4) * y);
        ctx.stroke();
      }

      const min = 20;
      const max = 100;
      const point = (index, value) => [
        (index / (points.length - 1)) * w,
        h - ((value - min) / (max - min)) * h,
      ];

      ctx.beginPath();
      points.forEach((value, index) => {
        const [x, y] = point(index, value);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = "#00aca7";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(0, 172, 167, .45)";
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const tail = point(points.length - 1, points[points.length - 1]);
      ctx.beginPath();
      ctx.arc(tail[0], tail[1], 5, 0, Math.PI * 2);
      ctx.fillStyle = "#9cefed";
      ctx.fill();

      if (active) frameId = requestAnimationFrame(draw);
    }

    draw();

    if ("IntersectionObserver" in window && !reduceMotion) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          active = entry.isIntersecting;
          if (active && !frameId) draw();
          if (!active && frameId) {
            cancelAnimationFrame(frameId);
            frameId = 0;
          }
        },
        { rootMargin: "120px" }
      );
      observer.observe(canvas);
    }
  }

  function setupVendorWall() {
    const wall = document.querySelector("[data-vendor-wall]");
    if (!wall) return;

    wall.innerHTML = vendors
      .map(
        (vendor) => `
          <div class="vendor-logo">
            <img src="${vendor.logo}" alt="${vendor.name} logo" width="280" height="116" loading="lazy" decoding="async">
          </div>
        `
      )
      .join("");
  }

  function setupDemoForm() {
    const form = document.getElementById("demoForm");
    if (!form) return;

    function updateFormState() {
      const trackedFields = ["name", "email", "company", "role", "message"];
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

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const data = new FormData(form);
      const subject = `FactoSense demo request - ${data.get("company") || "New customer"}`;
      const body = [
        "Hello FactoSense team,",
        "",
        "I would like to book a demo.",
        "",
        `Name: ${data.get("name") || ""}`,
        `Work email: ${data.get("email") || ""}`,
        `Company: ${data.get("company") || ""}`,
        `Role: ${data.get("role") || ""}`,
        "",
        "What FactoSense should help with first:",
        data.get("message") || "",
      ].join("\n");

      window.location.href = `mailto:info@funoonlab.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupReveal();
    setupNav();
    setupCounters();
    setupHeroCanvas();
    setupOperationsChart();
    setupVendorWall();
    setupDemoForm();
  });
})();
