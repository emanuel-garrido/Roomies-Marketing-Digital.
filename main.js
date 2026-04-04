/**
 * main.js — ROOMIES Landing Page
 * FIX: fade-up ahora usa .will-animate aplicado por JS DESPUÉS de cargar.
 * Esto garantiza que si el JS falla o tarda, el contenido igual es visible.
 */

document.addEventListener("DOMContentLoaded", () => {

  /* ============================================================
     1. CUSTOM CURSOR
  ============================================================ */
  const cursor         = document.getElementById("cursor");
  const cursorFollower = document.getElementById("cursorFollower");

  if (cursor && cursorFollower && window.matchMedia("(pointer: fine)").matches) {
    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = mouseX + "px";
      cursor.style.top  = mouseY + "px";
    }, { passive: true });

    function animateFollower() {
      followerX += (mouseX - followerX) * 0.1;
      followerY += (mouseY - followerY) * 0.1;
      cursorFollower.style.left = followerX + "px";
      cursorFollower.style.top  = followerY + "px";
      requestAnimationFrame(animateFollower);
    }
    animateFollower();

    const hoverTargets = document.querySelectorAll("a, button, .gallery-item, .method-card, .pricing-card");
    hoverTargets.forEach(el => {
      el.addEventListener("mouseenter", () => cursorFollower.classList.add("is-hovering"));
      el.addEventListener("mouseleave", () => cursorFollower.classList.remove("is-hovering"));
    });

    document.addEventListener("mouseleave", () => {
      cursor.style.opacity = "0";
      cursorFollower.style.opacity = "0";
    });
    document.addEventListener("mouseenter", () => {
      cursor.style.opacity = "1";
      cursorFollower.style.opacity = "1";
    });
  } else {
    cursor?.remove();
    cursorFollower?.remove();
  }

  /* ============================================================
     2. NAVBAR SCROLL
  ============================================================ */
  const navbar = document.getElementById("navbar");

  if (navbar) {
    const handleScroll = () => {
      navbar.classList.toggle("scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
  }

  /* ============================================================
     3. MOBILE MENU
  ============================================================ */
  const mobileBtn  = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("active");
      mobileBtn.setAttribute("aria-expanded", String(isOpen));
    });

    mobileMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("active");
        mobileBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ============================================================
     4. FADE-UP — FIX CRÍTICO
     
     El problema anterior: .fade-up empezaba con opacity:0 en CSS.
     Si IntersectionObserver tardaba o fallaba, el contenido quedaba
     invisible para siempre.
     
     Solución: el CSS tiene .fade-up con opacity:1 por defecto.
     El JS agrega .will-animate (que pone opacity:0) SOLO a los
     elementos que NO están en el viewport al cargar.
     Luego el observer agrega .visible cuando entran en viewport.
     
     El hero (que siempre está visible al cargar) recibe .visible
     inmediatamente sin necesitar scroll.
  ============================================================ */
  const fadeEls = document.querySelectorAll(".fade-up");

  if (fadeEls.length > 0 && "IntersectionObserver" in window) {

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            entry.target.classList.remove("will-animate");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );

    fadeEls.forEach(el => {
      // Verificar si el elemento ya está visible en el viewport
      const rect = el.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;

      if (isInViewport) {
        // Ya visible: animar con un pequeño delay para el efecto de entrada
        el.classList.add("will-animate");
        setTimeout(() => {
          el.classList.add("visible");
          el.classList.remove("will-animate");
        }, 80);
      } else {
        // Fuera del viewport: preparar para animar al hacer scroll
        el.classList.add("will-animate");
        observer.observe(el);
      }
    });
  }
  // Si IntersectionObserver no está disponible: los elementos quedan
  // visibles (opacity:1) gracias al CSS base. No pasa nada.

  /* ============================================================
     5. COUNTER ANIMATION
  ============================================================ */
  const counters = document.querySelectorAll(".hero-stat__number[data-count]");

  if (counters.length > 0) {
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    function animateCounter(el, target, duration = 1600) {
      const start = performance.now();
      const step = (now) => {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const current  = Math.round(easeOutQuart(progress) * target);
        el.textContent = current.toLocaleString("es-AR");
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            animateCounter(el, parseInt(el.dataset.count, 10));
            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(el => counterObserver.observe(el));
  }

  /* ============================================================
     6. 3D TILT + GLOW EN CARDS
  ============================================================ */
  const SELECTORS = ".method-card, .pricing-card, .result-card, .service-row, .comparison-card";
  const tiltCards = document.querySelectorAll(SELECTORS);

  const TILT_MAX   = 8;
  const TILT_SCALE = 1.018;
  const TILT_LIFT  = -5;

  tiltCards.forEach(card => {
    const glowEl = card.querySelector(".card-glow-follow");

    card.addEventListener("mouseenter", () => {
      card.style.transition = "background var(--t-base), border-color var(--t-base), box-shadow var(--t-base)";
    });

    card.addEventListener("mousemove", (e) => {
      const rect  = card.getBoundingClientRect();
      const x     = e.clientX - rect.left;
      const y     = e.clientY - rect.top;
      const normX = (x / rect.width)  * 2 - 1;
      const normY = (y / rect.height) * 2 - 1;

      card.style.transform = `
        perspective(900px)
        rotateX(${-normY * TILT_MAX}deg)
        rotateY(${normX  * TILT_MAX}deg)
        translateY(${TILT_LIFT}px)
        scale(${TILT_SCALE})
      `.trim();

      if (glowEl) {
        glowEl.style.left = x + "px";
        glowEl.style.top  = y + "px";
      }
    });

    card.addEventListener("mouseleave", () => {
      card.style.transition = "transform 0.55s var(--ease-out-expo), background var(--t-base), border-color var(--t-base), box-shadow var(--t-base)";
      card.style.transform  = "perspective(900px) rotateX(0) rotateY(0) translateY(0) scale(1)";
    });
  });

  // Card featured: solo glow, sin tilt
  const featuredCard = document.querySelector(".pricing-card--featured");
  if (featuredCard) {
    featuredCard.addEventListener("mouseenter", () => {
      featuredCard.style.transition = "background var(--t-base), border-color var(--t-base), box-shadow var(--t-base)";
    });
    featuredCard.addEventListener("mousemove", (e) => {
      const rect   = featuredCard.getBoundingClientRect();
      const glowEl = featuredCard.querySelector(".card-glow-follow");
      if (glowEl) {
        glowEl.style.left = (e.clientX - rect.left) + "px";
        glowEl.style.top  = (e.clientY - rect.top)  + "px";
      }
      featuredCard.style.transform = "translateY(-12px) scale(1.02)";
    });
    featuredCard.addEventListener("mouseleave", () => {
      featuredCard.style.transition = "transform 0.55s var(--ease-out-expo), background var(--t-base), border-color var(--t-base), box-shadow var(--t-base)";
      featuredCard.style.transform  = "translateY(-12px) scale(1.02)";
    });
  }

  /* ============================================================
     7. LIGHTBOX
  ============================================================ */
  const lightbox    = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const closeBtn    = document.querySelector(".lightbox-close");
  const prevBtn     = document.querySelector(".lightbox-nav.prev");
  const nextBtn     = document.querySelector(".lightbox-nav.next");

  const galleryItems  = document.querySelectorAll(".gallery-item");
  const galleryImages = document.querySelectorAll(".gallery-item img");

  let currentIndex = 0;

  function openLightbox(index) {
    if (!lightbox || galleryImages.length === 0) return;
    currentIndex = index;
    setLightboxImage(currentIndex);
    lightbox.classList.add("active");
    void lightbox.offsetWidth;
    lightbox.classList.add("visible");
    closeBtn?.focus();
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("visible");
    lightbox.addEventListener("transitionend", () => {
      lightbox.classList.remove("active");
    }, { once: true });
    document.body.style.overflow = "";
  }

  function setLightboxImage(index) {
    if (!galleryImages[index] || !lightboxImg) return;
    const src = galleryImages[index].src;
    if (!src) return;
    lightboxImg.style.opacity   = "0.2";
    lightboxImg.style.transform = "scale(0.94)";
    lightboxImg.src = src;
    lightboxImg.alt = galleryImages[index].alt || `Evento ${index + 1}`;
    requestAnimationFrame(() => {
      lightboxImg.style.opacity   = "1";
      lightboxImg.style.transform = "scale(1)";
    });
  }

  galleryItems.forEach((item, index) => {
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "button");
    item.addEventListener("click", () => openLightbox(index));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(index);
      }
    });
  });

  closeBtn?.addEventListener("click", closeLightbox);
  nextBtn?.addEventListener("click", (e) => { e.stopPropagation(); currentIndex = (currentIndex + 1) % galleryImages.length; setLightboxImage(currentIndex); });
  prevBtn?.addEventListener("click", (e) => { e.stopPropagation(); currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length; setLightboxImage(currentIndex); });

  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox?.classList.contains("active")) return;
    if (e.key === "Escape")     closeLightbox();
    if (e.key === "ArrowRight") { currentIndex = (currentIndex + 1) % galleryImages.length; setLightboxImage(currentIndex); }
    if (e.key === "ArrowLeft")  { currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length; setLightboxImage(currentIndex); }
  });

});
