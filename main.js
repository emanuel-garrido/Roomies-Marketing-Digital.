document.addEventListener("DOMContentLoaded", () => {

  /* ══════════════════════════════════════════
     1. CURSOR CUSTOM
  ══════════════════════════════════════════ */
  const cursor   = document.getElementById("cursor");
  const follower = document.getElementById("cursorFollower");
  const isTouch  = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  if (!isTouch && cursor && follower) {
    document.body.classList.add("custom-cursor-active");

    let mx = -200, my = -200;
    let fx = -200, fy = -200;
    let firstMove = true;

    document.addEventListener("mousemove", e => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.left = mx + "px";
      cursor.style.top  = my + "px";

      if (firstMove) {
        fx = mx; fy = my;
        firstMove = false;
        cursor.style.opacity  = "1";
        follower.style.opacity = "1";
      }
    });

    (function animFollower() {
      fx += (mx - fx) * 0.13;
      fy += (my - fy) * 0.13;
      follower.style.left = Math.round(fx) + "px";
      follower.style.top  = Math.round(fy) + "px";
      requestAnimationFrame(animFollower);
    })();

    document.querySelectorAll("a, button, .gallery-item, .method-card, .pricing-card").forEach(el => {
      el.addEventListener("mouseenter", () => follower.classList.add("is-hovering"));
      el.addEventListener("mouseleave", () => follower.classList.remove("is-hovering"));
    });

    document.addEventListener("mouseleave", () => { cursor.style.opacity = "0"; follower.style.opacity = "0"; });
    document.addEventListener("mouseenter", () => { if (!firstMove) { cursor.style.opacity = "1"; follower.style.opacity = "1"; } });
  } else {
    cursor?.remove();
    follower?.remove();
  }


  /* ══════════════════════════════════════════
     2. NAVBAR — transparente → sólido al scroll
  ══════════════════════════════════════════ */
  const navbar = document.getElementById("navbar");
  if (navbar) {
    const checkScroll = () => {
      navbar.classList.toggle("scrolled", window.scrollY > 50);
    };
    window.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
  }


  /* ══════════════════════════════════════════
     3. MOBILE MENU
  ══════════════════════════════════════════ */
  const mobileBtn  = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener("click", () => {
      const open = mobileMenu.classList.toggle("active");
      mobileBtn.setAttribute("aria-expanded", String(open));
    });
    mobileMenu.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        mobileMenu.classList.remove("active");
        mobileBtn.setAttribute("aria-expanded", "false");
      });
    });
  }


  /* ══════════════════════════════════════════
     4. FADE-UP — visible por defecto en CSS,
        JS aplica will-animate solo si está
        fuera del viewport al cargar.
  ══════════════════════════════════════════ */
  const fadeEls = document.querySelectorAll(".fade-up");
  if (fadeEls.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          e.target.classList.remove("will-animate");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });

    fadeEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        el.classList.add("will-animate");
        setTimeout(() => { el.classList.add("visible"); el.classList.remove("will-animate"); }, 100);
      } else {
        el.classList.add("will-animate");
        io.observe(el);
      }
    });
  }


  /* ══════════════════════════════════════════
     5. COUNTERS — anima números del hero
  ══════════════════════════════════════════ */
  const counters = document.querySelectorAll(".hero-stat__number[data-count]");
  if (counters.length) {
    const ease = t => 1 - Math.pow(1 - t, 4);

    function animCount(el, target) {
      if (el.dataset.animated) return;
      el.dataset.animated = "1";
      const t0 = performance.now();
      const dur = 1800;
      (function step(now) {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(ease(p) * target).toLocaleString("es-AR");
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }

    // Animar los que ya están visibles al cargar
    setTimeout(() => {
      counters.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) animCount(el, +el.dataset.count);
      });
    }, 400);

    // Animar los que aparecen al scroll
    const cio = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { animCount(e.target, +e.target.dataset.count); cio.unobserve(e.target); } });
    }, { threshold: 0.1 });
    counters.forEach(el => { if (!el.dataset.animated) cio.observe(el); });
  }


  /* ══════════════════════════════════════════
     6. TILT 3D EN CARDS
     
     CÓMO FUNCIONA:
     - perspective:1000px está en el GRID PADRE (CSS)
     - Las cards usan solo rotateX/Y (sin perspective())
     - Sin overflow:hidden, sin will-change, sin transform-style
       en el CSS de la card — nada que cree stacking context
     - El transform se aplica directo via JS con RAF + lerp
  ══════════════════════════════════════════ */
  document.querySelectorAll(".method-card, .pricing-card").forEach(card => {
    const featured = card.classList.contains("pricing-card--featured");
    const glow     = card.querySelector(".card-glow-follow");

    let raf  = null;
    let tx = 0, ty = 0;   // target rotation
    let cx = 0, cy = 0;   // current rotation (lerped)
    let on = false;        // hover state

    const lerp = (a, b, f) => a + (b - a) * f;

    function tick() {
      cx = lerp(cx, tx, 0.14);
      cy = lerp(cy, ty, 0.14);

      if (!featured) {
        const sc = on ? 1.03 : 1;
        const ly = on ? -5   : 0;
        card.style.transform =
          `rotateX(${cx.toFixed(3)}deg) rotateY(${cy.toFixed(3)}deg) scale(${sc}) translateY(${ly}px)`;
      }

      const done = !on && Math.abs(cx) < 0.02 && Math.abs(cy) < 0.02;
      if (done) {
        raf = null;
        if (!featured) card.style.transform = "";
      } else {
        raf = requestAnimationFrame(tick);
      }
    }

    card.addEventListener("mouseenter", () => {
      on = true;
      card.style.boxShadow   = "0 16px 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.12)";
      card.style.borderColor = "rgba(255,255,255,0.18)";
      card.style.background  = "rgba(255,255,255,0.055)";
      if (!raf) raf = requestAnimationFrame(tick);
    });

    card.addEventListener("mousemove", e => {
      if (featured) return;
      const r  = card.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width)  * 2 - 1;
      const ny = ((e.clientY - r.top)  / r.height) * 2 - 1;
      tx = -ny * 12;
      ty =  nx * 12;
      if (glow) {
        glow.style.left    = (e.clientX - r.left) + "px";
        glow.style.top     = (e.clientY - r.top)  + "px";
        glow.style.opacity = "1";
      }
      if (!raf) raf = requestAnimationFrame(tick);
    });

    card.addEventListener("mouseleave", () => {
      on = false;
      tx = 0; ty = 0;
      card.style.boxShadow   = "";
      card.style.borderColor = "";
      card.style.background  = "";
      if (glow) glow.style.opacity = "0";
      if (!raf) raf = requestAnimationFrame(tick);
    });
  });


  /* ══════════════════════════════════════════
     7. LIGHTBOX
  ══════════════════════════════════════════ */
  const lb       = document.getElementById("lightbox");
  const lbImg    = document.getElementById("lightbox-img");
  const lbClose  = document.querySelector(".lightbox-close");
  const lbPrev   = document.querySelector(".lightbox-nav.prev");
  const lbNext   = document.querySelector(".lightbox-nav.next");
  const gItems   = document.querySelectorAll(".gallery-item");
  const gImgs    = document.querySelectorAll(".gallery-item img");
  let   lbIdx    = 0;

  function openLb(i) {
    if (!lb || !gImgs.length) return;
    lbIdx = i;
    setLbImg(i);
    lb.classList.add("active");
    void lb.offsetWidth;
    lb.classList.add("visible");
    lbClose?.focus();
    document.body.style.overflow = "hidden";
  }
  function closeLb() {
    if (!lb) return;
    lb.classList.remove("visible");
    lb.addEventListener("transitionend", () => lb.classList.remove("active"), { once: true });
    document.body.style.overflow = "";
  }
  function setLbImg(i) {
    if (!gImgs[i] || !lbImg) return;
    lbImg.style.opacity = "0.2"; lbImg.style.transform = "scale(0.94)";
    lbImg.src = gImgs[i].src; lbImg.alt = gImgs[i].alt || `Evento ${i+1}`;
    requestAnimationFrame(() => { lbImg.style.opacity = "1"; lbImg.style.transform = "scale(1)"; });
  }

  gItems.forEach((item, i) => {
    item.setAttribute("tabindex", "0"); item.setAttribute("role", "button");
    item.addEventListener("click",   () => openLb(i));
    item.addEventListener("keydown",  e => { if (e.key==="Enter"||e.key===" ") { e.preventDefault(); openLb(i); } });
  });
  lbClose?.addEventListener("click", closeLb);
  lbNext?.addEventListener("click",  e => { e.stopPropagation(); lbIdx=(lbIdx+1)%gImgs.length; setLbImg(lbIdx); });
  lbPrev?.addEventListener("click",  e => { e.stopPropagation(); lbIdx=(lbIdx-1+gImgs.length)%gImgs.length; setLbImg(lbIdx); });
  lb?.addEventListener("click", e => { if (e.target===lb) closeLb(); });
  document.addEventListener("keydown", e => {
    if (!lb?.classList.contains("active")) return;
    if (e.key==="Escape")     closeLb();
    if (e.key==="ArrowRight") { lbIdx=(lbIdx+1)%gImgs.length; setLbImg(lbIdx); }
    if (e.key==="ArrowLeft")  { lbIdx=(lbIdx-1+gImgs.length)%gImgs.length; setLbImg(lbIdx); }
  });

});