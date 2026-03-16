document.addEventListener("DOMContentLoaded", () => {
    /* =========================================
       1. NAVBAR SCROLL EFFECT
       ========================================= */
    const navbar = document.getElementById("navbar");
    
    window.addEventListener("scroll", () => {
        if (window.scrollY > 40) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    });

    /* =========================================
       2. MOBILE MENU TOGGLE
       ========================================= */
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mobileMenu = document.getElementById("mobileMenu");
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener("click", () => {
            mobileMenu.classList.toggle("active");
            const icon = mobileMenuBtn.querySelector("i");
            
            if (mobileMenu.classList.contains("active")) {
                icon.classList.replace("ph-list", "ph-x");
            } else {
                icon.classList.replace("ph-x", "ph-list");
            }
        });

        // Close menu when a link is clicked
        document.querySelectorAll(".mobile-menu a").forEach(link => {
            link.addEventListener("click", () => {
                mobileMenu.classList.remove("active");
                mobileMenuBtn.querySelector("i").classList.replace("ph-x", "ph-list");
            });
        });
    }

    /* =========================================
       3. INTERSECTION OBSERVER (SCROLL ANIMATIONS)
       ========================================= */
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    let staggeredDelayQueue = [];
    let processingQueue = false;

    function processStaggerQueue() {
        if (!staggeredDelayQueue.length) {
            processingQueue = false;
            return;
        }

        // Apply delay dynamically to nodes coming into view at the same time
        staggeredDelayQueue.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add("visible");
            }, index * 100); // 100ms stagger offset
        });

        staggeredDelayQueue = [];
        setTimeout(() => { processingQueue = false; }, 100);
    }

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        let hasNewIntersections = false;

        entries.forEach(entry => {
            if (entry.isIntersecting) {
                staggeredDelayQueue.push(entry.target);
                observer.unobserve(entry.target); 
                hasNewIntersections = true;
            }
        });

        if (hasNewIntersections && !processingQueue) {
            processingQueue = true;
            // Debounce processing to group elements intersecting in the same frame
            setTimeout(processStaggerQueue, 10);
        }
    }, observerOptions);

    document.querySelectorAll(".fade-up").forEach((el) => {
        // Reset delay logic from CSS to let JS handle dynamic staggering
        el.style.transitionDelay = '0s';
        scrollObserver.observe(el);
    });

    /* =========================================
       4. CURSOR GLOW EFFECT (Vercel/Linear style)
       ========================================= */
    const glow = document.createElement("div");
    glow.classList.add("cursor-glow");
    document.body.appendChild(glow);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let glowX = mouseX;
    let glowY = mouseY;
    
    // Smooth trailing effect
    function animateGlow() {
        // Easing interpolation
        glowX += (mouseX - glowX) * 0.1;
        glowY += (mouseY - glowY) * 0.1;
        
        glow.style.left = `${glowX}px`;
        glow.style.top = `${glowY}px`;
        
        requestAnimationFrame(animateGlow);
    }
    
    document.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Start animation loop
    animateGlow();

    /* =========================================
       5. 3D CARD TILT MICROINTERACTION
       ========================================= */
    // Apply to methods, pricing, results, services, and comparison cards
    const tiltCards = document.querySelectorAll(`
        .method-card, 
        .pricing-card, 
        .result-card, 
        .service-row,
        .comparison-card
    `);

    tiltCards.forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            
            // Mouse position relative to the card
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Center of the card
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate rotation amount (divisor controls intensity - higher means less tilt)
            const rotateX = (y - centerY) / -25;
            const rotateY = (x - centerX) / 25;
            
            // Create a premium smooth feel with CSS variables (if preferred) or inline strings
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
            card.style.transition = `all 0.4s cubic-bezier(0.16, 1, 0.3, 1)`;
        });
        
        card.addEventListener("mouseenter", () => {
            // Remove transition when moving to make it instantly responsive to mouse
            card.style.transition = `none`;
        });
    });
});