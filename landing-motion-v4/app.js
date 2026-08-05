/* Relens landing v2 - interacoes reais, sem dependencias */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var motionReady = document.documentElement.classList.contains("motion-ready");
  var themeSwitchTimer = null;

  /* ---------- Header: fundo solido ao rolar ---------- */

  var head = document.getElementById("site-head");

  function syncHead() {
    head.classList.toggle("is-solid", window.scrollY > 8);
  }

  window.addEventListener("scroll", syncHead, { passive: true });
  syncHead();

  /* ---------- Alternancia de tema escuro/claro ---------- */

  var themeToggle = document.querySelector(".theme-toggle");

  function setTheme(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);
    if (persist) {
      try { localStorage.setItem("rl-theme", theme); } catch (e) {}
    }
    document.documentElement.classList.add("theme-switching");
    clearTimeout(themeSwitchTimer);
    themeSwitchTimer = setTimeout(function () {
      document.documentElement.classList.remove("theme-switching");
    }, 700);
    if (themeToggle) {
      themeToggle.textContent = theme === "dark" ? "Claro" : "Escuro";
      themeToggle.setAttribute("aria-pressed", theme === "dark" ? "false" : "true");
    }
  }

  if (themeToggle) {
    var currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(currentTheme, false);
    themeToggle.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(next, true);
    });
  }

  /* ---------- Barra de aviso rotativa ---------- */

  var announce = document.querySelector("[data-announce]");

  if (announce && !reduceMotion) {
    var msgs = announce.querySelectorAll(".announce-msg");
    var current = 0;
    var timer = null;

    msgs.forEach(function (m, i) {
      if (i === 0) { m.removeAttribute("aria-hidden"); } else { m.setAttribute("aria-hidden", "true"); }
    });

    var rotate = function () {
      msgs[current].classList.remove("is-active");
      msgs[current].setAttribute("aria-hidden", "true");
      current = (current + 1) % msgs.length;
      msgs[current].classList.add("is-active");
      msgs[current].removeAttribute("aria-hidden");
    };

    var start = function () {
      if (timer === null) timer = window.setInterval(rotate, 4500);
    };

    var stop = function () {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    announce.addEventListener("mouseenter", stop);
    announce.addEventListener("mouseleave", start);
    announce.addEventListener("focusin", stop);
    announce.addEventListener("focusout", start);
    start();
  }

  /* ---------- Como funciona: abas com avanco automatico ---------- */

  var steps = Array.prototype.slice.call(document.querySelectorAll(".hiw-step"));
  var panels = steps.map(function (step) {
    return document.getElementById(step.getAttribute("aria-controls"));
  });

  if (steps.length && panels.every(Boolean)) {
    var activeIndex = 0;
    var autoTimer = null;
    var hiwGrid = document.querySelector(".hiw-stage");

    var show = function (index, focus) {
      activeIndex = index;
      steps.forEach(function (step, i) {
        var on = i === index;
        step.classList.toggle("is-active", on);
        step.setAttribute("aria-selected", on ? "true" : "false");
        if (on && focus) step.focus();
      });
      panels.forEach(function (panel, i) {
        if (i === index) {
          panel.removeAttribute("hidden");
          if (motionReady) {
            panel.classList.remove("panel-in");
            void panel.offsetWidth;
            panel.classList.add("panel-in");
          }
        } else {
          panel.setAttribute("hidden", "");
        }
      });
    };

    var startAuto = function () {
      if (reduceMotion || autoTimer !== null) return;
      autoTimer = window.setInterval(function () {
        show((activeIndex + 1) % steps.length, false);
      }, 5500);
    };

    var stopAuto = function () {
      if (autoTimer !== null) {
        window.clearInterval(autoTimer);
        autoTimer = null;
      }
    };

    steps.forEach(function (step, i) {
      step.addEventListener("click", function () {
        stopAuto();
        show(i, false);
        startAuto();
      });

      step.addEventListener("keydown", function (event) {
        var delta = null;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") delta = 1;
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") delta = -1;
        if (delta === null) return;
        event.preventDefault();
        stopAuto();
        show((activeIndex + delta + steps.length) % steps.length, true);
        startAuto();
      });
    });

    if (hiwGrid) {
      hiwGrid.addEventListener("mouseenter", stopAuto);
      hiwGrid.addEventListener("mouseleave", startAuto);
      hiwGrid.addEventListener("focusin", stopAuto);
      hiwGrid.addEventListener("focusout", startAuto);
    }

    show(0, false);

    /* Auto-avanco somente com a secao visivel: no load o passo ativo
       permanece "01 - Voce conta" ate o usuario chegar na secao. */
    if (hiwGrid && "IntersectionObserver" in window) {
      var hiwObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            startAuto();
          } else {
            stopAuto();
          }
        });
      }, { threshold: 0.2 });
      hiwObserver.observe(hiwGrid);
    } else {
      startAuto();
    }
  }

  /* ---------- Hero: respeita reducao de movimento ---------- */

  var heroVideo = document.querySelector(".hero-video");

  if (heroVideo && (reduceMotion || document.documentElement.classList.contains("net-very-slow"))) {
    heroVideo.pause();
    heroVideo.removeAttribute("autoplay");
  }

  /* ---------- Formularios de e-mail (convite + guia) ---------- */

  // TROCAR pelo endereco real quando o pre-lancamento abrir.
  var RELENS_EMAIL = "ola@relens.com.br";

  var KINDS = {
    convite: {
      subject: "Convite Relens - pre-lancamento",
      intro: "Quero receber o convite do Relens quando o pre-lancamento abrir.",
      empty: "Digite seu e-mail para receber o convite.",
      invalid: "Esse e-mail parece incompleto. Confere e tenta de novo.",
      done: "Seu cliente de e-mail abriu com o pedido preenchido. Envie quando quiser."
    },
  };

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  Array.prototype.forEach.call(document.querySelectorAll(".js-email-form"), function (form) {
    var kind = KINDS[form.getAttribute("data-kind")] || KINDS.convite;
    var input = form.querySelector("input[type='email']");
    var status = form.querySelector(".form-status");
    var defaultStatus = status ? status.textContent : "";

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var email = input.value.trim();

      if (!email) {
        status.textContent = kind.empty;
        status.classList.remove("is-success");
        status.classList.add("is-error");
        input.focus();
        return;
      }

      if (!EMAIL_RE.test(email)) {
        status.textContent = kind.invalid;
        status.classList.remove("is-success");
        status.classList.add("is-error");
        input.focus();
        return;
      }

      var subject = encodeURIComponent(kind.subject);
      var body = encodeURIComponent("Ola,\n\n" + kind.intro + "\nMeu e-mail: " + email + "\n\nObrigado!");
      window.location.href = "mailto:" + RELENS_EMAIL + "?subject=" + subject + "&body=" + body;

      status.textContent = kind.done;
      status.classList.remove("is-error");
      status.classList.add("is-success");
    });

    input.addEventListener("input", function () {
      if (status.classList.contains("is-error")) {
        status.textContent = defaultStatus;
        status.classList.remove("is-error");
      }
    });
  });

  /* ========== Motion de alto nivel (v4) ========== */

  if (motionReady && typeof Lenis !== "undefined") {
    var lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 1,
      smoothWheel: true
    });

    function raf(time) {
      lenis.raf(time);
      window.requestAnimationFrame(raf);
    }
    window.requestAnimationFrame(raf);

    /* Barra de progresso de leitura */
    var progressBar = document.createElement("div");
    progressBar.className = "scroll-progress";
    progressBar.setAttribute("aria-hidden", "true");
    document.body.appendChild(progressBar);

    /* Header some ao descer e volta ao subir */
    lenis.on("scroll", function (e) {
      progressBar.style.transform = "scaleX(" + e.progress + ")";
      head.classList.toggle("is-hidden", e.direction === 1 && e.animatedScroll > 260);
    });

    /* Âncoras internas com easing luxuoso */
    Array.prototype.forEach.call(document.querySelectorAll('a[href^="#"]'), function (link) {
      link.addEventListener("click", function (event) {
        var href = link.getAttribute("href");
        if (href.length < 2) return;
        var target = document.querySelector(href);
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, {
          duration: 1.35,
          easing: function (x) { return 1 - Math.pow(1 - x, 4); }
        });
        try { history.replaceState(null, "", href); } catch (e) {}
      });
    });

    /* Revelacoes com stagger (estado inicial vem do CSS, sem flash) */
    var revealDefs = [
      { sel: ".hero-eyebrow", d: 420 },
      { sel: ".hero h1", d: 620 },
      { sel: ".hero-lede", d: 820 },
      { sel: ".hero-actions", d: 980 },
      { sel: ".hero-badges", d: 1120 },
      { sel: ".pillars", d: 1300 },
      { sel: ".intro-line", d: 0 },
      { sel: ".intro-sub", d: 130 },
      { sel: ".hiw-head", d: 0 },
      { sel: ".hiw-card", d: 0, st: 90 },
      { sel: ".hiw-stage", d: 0 },
      { sel: ".membership-intro", d: 0 },
      { sel: ".membership-line", d: 100 },
      { sel: ".membership-row", d: 0, st: 45 },
      { sel: ".principles h2", d: 0 },
      { sel: ".principle", d: 0, st: 80 },
      { sel: ".mani-line", d: 0 },
      { sel: ".mani-sub", d: 170 },
      { sel: ".faq h2", d: 0 },
      { sel: ".faq details", d: 0, st: 70 },
      { sel: ".closing-line", d: 0 },
      { sel: ".invite-card", d: 150 },
      { sel: ".footer-lead", d: 0 },
      { sel: ".footer-cols", d: 120 },
      { sel: ".footer-legal", d: 220 }
    ];

    var revealQueue = [];

    var slowScale = document.documentElement.classList.contains("net-slow") ? 0.45 : 1;

    revealDefs.forEach(function (def) {
      var nodes = document.querySelectorAll(def.sel);
      Array.prototype.forEach.call(nodes, function (el, i) {
        var delay = Math.round(((def.d || 0) + (def.st ? def.st * i : 0)) * slowScale);
        el.style.setProperty("--rv-delay", delay + "ms");
        revealQueue.push(el);
      });
    });

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -28% 0px", threshold: 0.08 });

    revealQueue.forEach(function (el) { revealObserver.observe(el); });

    /* Hero: coreografia de abertura por tempo, independente do observer
       (garante a cascata mesmo com badges/pilares na borda do viewport) */
    setTimeout(function () {
      [".hero-eyebrow", ".hero h1", ".hero-lede", ".hero-actions", ".hero-badges", ".pillars"].forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (el) {
          el.classList.add("is-in");
          revealObserver.unobserve(el);
        });
      });
    }, 150);

    /* Rede de seguranca: revela apenas o que ja esta no viewport
       (conteudo abaixo da dobra permanece oculto ate o scroll chegar).
       Roda no load e a cada scroll, como garantia contra falha do observer. */
    var safetyPending = false;
    var safetyCheck = function () {
      if (safetyPending) return;
      safetyPending = true;
      window.requestAnimationFrame(function () {
        safetyPending = false;
        var viewportBottom = window.innerHeight * 1.1;
        revealQueue.forEach(function (el) {
          if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < viewportBottom) {
            el.classList.add("is-in");
          }
        });
      });
    };
    window.addEventListener("scroll", safetyCheck, { passive: true });
    setTimeout(safetyCheck, 2500);
  }
})();
