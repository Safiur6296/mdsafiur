/* --------------------------------------------------------------------------
       1. GLOBAL UTILITIES & CLIPBOARD NOTIFICATION
       -------------------------------------------------------------------------- */
    function showToast(message) {
      const toast = document.getElementById('copy-toast');
      const toastText = document.getElementById('copy-toast-text');
      if (!toast) return;
      toastText.textContent = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2600);
    }

    function copyToClipboard(text, customMsg) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
          showToast(customMsg || 'Copied to clipboard!');
        }).catch(() => {
          fallbackCopyText(text, customMsg);
        });
      } else {
        fallbackCopyText(text, customMsg);
      }
    }

    function fallbackCopyText(text, customMsg) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showToast(customMsg || 'Copied to clipboard!');
      } catch (err) {
        showToast('Selection copied!');
      }
      document.body.removeChild(textArea);
    }

    function scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }

    /* --------------------------------------------------------------------------
       2. CUSTOM CURSOR & AMBIENT SPOTLIGHT
       -------------------------------------------------------------------------- */
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');
    const spotlight = document.getElementById('cursor-spotlight');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let isTouch = false;

    // Detect touch
    window.addEventListener('touchstart', () => { isTouch = true; }, { once: true });

    if (!isTouch && window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Instant dot position
        if (cursorDot) {
          cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
        }

        // Ambient spotlight on root
        document.documentElement.style.setProperty('--mouse-x', `${mouseX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${mouseY}px`);
      });

      // Smooth lag for outer ring via lerp
      function renderCursor() {
        const lerpFactor = 0.16;
        ringX += (mouseX - ringX) * lerpFactor;
        ringY += (mouseY - ringY) * lerpFactor;

        if (cursorRing) {
          cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
        }
        requestAnimationFrame(renderCursor);
      }
      requestAnimationFrame(renderCursor);

      // Interactive hover expansions
      const interactiveTargets = 'a, button, input, textarea, .glass-card, .contact-chip, .btn-rerun, .btn-copy-chip, .hamburger-btn';
      document.querySelectorAll(interactiveTargets).forEach(el => {
        el.addEventListener('mouseenter', () => {
          if (cursorRing) cursorRing.classList.add('cursor-hover');
        });
        el.addEventListener('mouseleave', () => {
          if (cursorRing) cursorRing.classList.remove('cursor-hover');
        });
      });

      window.addEventListener('mousedown', () => {
        if (cursorRing) cursorRing.classList.add('cursor-click');
      });
      window.addEventListener('mouseup', () => {
        if (cursorRing) cursorRing.classList.remove('cursor-click');
      });
    }

    /* --------------------------------------------------------------------------
       3. 3D CARD TILT & MOUSE-TRACKING BORDER HIGHLIGHT
       -------------------------------------------------------------------------- */
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.matchMedia('(pointer: fine)').matches) {
      const tiltCards = document.querySelectorAll('.tilt-card');
      
      tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          card.style.setProperty('--card-mouse-x', `${x}px`);
          card.style.setProperty('--card-mouse-y', `${y}px`);

          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = -((y - centerY) / centerY) * 7.5;
          const rotateY = ((x - centerX) / centerX) * 7.5;

          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.012, 1.012, 1.012)`;
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
          card.style.setProperty('--card-mouse-x', `-100px`);
          card.style.setProperty('--card-mouse-y', `-100px`);
        });
      });
    }

    /* --------------------------------------------------------------------------
       4. MAGNETIC BUTTONS
       -------------------------------------------------------------------------- */
    if (window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const magneticBtns = document.querySelectorAll('.magnetic-btn');

      magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
          const rect = btn.getBoundingClientRect();
          const btnCenterX = rect.left + rect.width / 2;
          const btnCenterY = rect.top + rect.height / 2;
          const deltaX = (e.clientX - btnCenterX) * 0.28;
          const deltaY = (e.clientY - btnCenterY) * 0.28;

          btn.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
        });

        btn.addEventListener('mouseleave', () => {
          btn.style.transform = 'translate3d(0, 0, 0)';
        });
      });
    }

    /* --------------------------------------------------------------------------
       5. HERO BACKGROUND PARTICLES / GRID PARALLAX CANVAS
       -------------------------------------------------------------------------- */
    (function initCanvasBackground() {
      const canvas = document.getElementById('bg-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let width = canvas.width = window.innerWidth;
      let height = canvas.height = window.innerHeight;

      window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      });

      // Node count optimized for high performance 60fps
      const nodeCount = Math.min(Math.floor((width * height) / 22000), 55);
      const nodes = [];

      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 1.5 + 1
        });
      }

      function draw() {
        ctx.clearRect(0, 0, width, height);

        // Update & draw nodes
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          n.x += n.vx;
          n.y += n.vy;

          // Wrap edges
          if (n.x < 0) n.x = width;
          if (n.x > width) n.x = 0;
          if (n.y < 0) n.y = height;
          if (n.y > height) n.y = 0;

          // Parallax repulsion from cursor
          const dx = n.x - mouseX;
          const dy = n.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const force = (130 - dist) / 130;
            n.x += (dx / dist) * force * 1.8;
            n.y += (dy / dist) * force * 1.8;
          }

          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 212, 255, 0.45)';
          ctx.fill();

          // Connect adjacent nodes
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const distBetween = Math.hypot(n.x - n2.x, n.y - n2.y);
            if (distBetween < 120) {
              const alpha = (1 - distBetween / 120) * 0.15;
              ctx.beginPath();
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          requestAnimationFrame(draw);
        }
      }

      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        requestAnimationFrame(draw);
      }
    })();

    /* --------------------------------------------------------------------------
       6. HERO TYPING EFFECT SUBTITLE
       -------------------------------------------------------------------------- */
    (function initTypingHeadline() {
      const typingEl = document.getElementById('typing-text');
      if (!typingEl) return;

      const words = [
        "Quality Engineer",
        "Test Automation Engineer",
        "Cypress | Selenium | BDD",
        "Azure DevOps CI/CD Specialist"
      ];

      let wordIndex = 0;
      let charIndex = 0;
      let isDeleting = false;
      const typeSpeed = 70;
      const deleteSpeed = 35;
      const pauseEnd = 1900;
      const pauseStart = 400;

      function type() {
        const currentWord = words[wordIndex];

        if (isDeleting) {
          typingEl.textContent = currentWord.substring(0, charIndex - 1);
          charIndex--;
        } else {
          typingEl.textContent = currentWord.substring(0, charIndex + 1);
          charIndex++;
        }

        let delay = isDeleting ? deleteSpeed : typeSpeed;

        if (!isDeleting && charIndex === currentWord.length) {
          delay = pauseEnd;
          isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
          isDeleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          delay = pauseStart;
        }

        setTimeout(type, delay);
      }

      setTimeout(type, 600);
    })();

    /* --------------------------------------------------------------------------
       7. HERO PORTRAIT MULTI-DEPTH CURSOR PARALLAX
       -------------------------------------------------------------------------- */
    (function initHeroPhotoParallax() {
      const photoWrap = document.getElementById('hero-photo-wrap');
      const photoContainer = document.getElementById('hero-photo-container');
      const glow = document.getElementById('hero-photo-glow');
      const ring = document.getElementById('hero-photo-ring');
      const chipCypress = document.getElementById('chip-cypress');
      const chipAzure = document.getElementById('chip-azure');

      if (!photoWrap) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // Current and target offsets for smooth lerp
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;

      window.addEventListener('mousemove', (e) => {
        if (isTouch) return;
        // Normalize mouse coordinates from center of window (-1 to 1)
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        targetX = (e.clientX - centerX) / centerX;
        targetY = (e.clientY - centerY) / centerY;
      }, { passive: true });

      function animateParallax() {
        if (isTouch || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        // Smooth lerp
        const lerpFactor = 0.08;
        currentX += (targetX - currentX) * lerpFactor;
        currentY += (targetY - currentY) * lerpFactor;

        // Glow moves the most (max ~14px)
        if (glow) {
          glow.style.transform = `translate(calc(-50% + ${currentX * 14}px), calc(-50% + ${currentY * 14}px))`;
        }

        // Ring moves ~10px
        if (ring) {
          ring.style.transform = `translate(calc(-50% + ${currentX * 10}px), calc(-50% + ${currentY * 10}px))`;
        }

        // Floating chips move ~12px
        if (chipCypress) {
          chipCypress.style.transform = `translate3d(${currentX * 12}px, ${currentY * 12}px, 0)`;
        }
        if (chipAzure) {
          chipAzure.style.transform = `translate3d(${currentX * -11}px, ${currentY * -11}px, 0)`;
        }

        // Photo moves the least (max ~5px)
        if (photoContainer) {
          photoContainer.style.transform = `translate3d(${currentX * 5}px, ${currentY * 5}px, 0)`;
        }

        requestAnimationFrame(animateParallax);
      }

      requestAnimationFrame(animateParallax);
    })();

    /* --------------------------------------------------------------------------
       8. SCROLL REVEAL VIA INTERSECTION OBSERVER
       -------------------------------------------------------------------------- */
    (function initScrollObserver() {
      const revealElements = document.querySelectorAll('.reveal');

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      });

      revealElements.forEach(el => observer.observe(el));
    })();

    /* --------------------------------------------------------------------------
       9. NAVBAR SCROLL EFFECT & ACTIVE SECTION HIGHLIGHTING
       -------------------------------------------------------------------------- */
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    window.addEventListener('scroll', () => {
      // Navbar blur background intensifies on scroll
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }

      // Active section highlight
      let currentSectionId = '';
      const scrollPos = window.scrollY + 200;

      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          currentSectionId = section.getAttribute('id');
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSectionId}`) {
          link.classList.add('active');
        }
      });

      mobileNavLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSectionId}`) {
          link.classList.add('active');
        }
      });
    }, { passive: true });

    /* --------------------------------------------------------------------------
       10. MOBILE HAMBURGER DRAWER TOGGLE
       -------------------------------------------------------------------------- */
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileOverlay = document.getElementById('mobile-menu-overlay');

    function toggleMobileMenu() {
      const isOpen = mobileMenu.classList.contains('open');
      if (isOpen) {
        mobileMenu.classList.remove('open');
        mobileOverlay.classList.remove('open');
        hamburgerBtn.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      } else {
        mobileMenu.classList.add('open');
        mobileOverlay.classList.add('open');
        hamburgerBtn.classList.add('active');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }
    }

    if (hamburgerBtn && mobileMenu && mobileOverlay) {
      hamburgerBtn.addEventListener('click', toggleMobileMenu);
      mobileOverlay.addEventListener('click', toggleMobileMenu);
      mobileNavLinks.forEach(link => {
        link.addEventListener('click', toggleMobileMenu);
      });
    }

    /* --------------------------------------------------------------------------
       11. CONTACT FORM WITH MAILTO FALLBACK & TRANSMISSION SIMULATION
       -------------------------------------------------------------------------- */
    function handleFormSubmit(e) {
      e.preventDefault();
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const subject = document.getElementById('contact-subject').value.trim();
      const message = document.getElementById('contact-message').value.trim();
      const submitBtn = document.getElementById('submit-btn');
      const btnText = document.getElementById('btn-text');
      const feedback = document.getElementById('form-feedback');

      if (!name || !email || !message) {
        alert("Please fill in all required fields.");
        return;
      }

      // Visual sending status
      submitBtn.disabled = true;
      btnText.textContent = "Encrypting & Transmitting...";
      feedback.style.display = 'none';

      setTimeout(() => {
        // Construct mailto link as fallback
        const mailtoSubject = encodeURIComponent(`[Portfolio Inquiry] ${subject || 'Quality Engineering Opportunity'}`);
        const mailtoBody = encodeURIComponent(`Hello Safiur,\n\nMy name is ${name} (${email}).\n\n${message}\n\nBest regards,\n${name}`);
        const mailtoUrl = `mailto:rahamansafiur614@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;

        feedback.className = 'form-notification success';
        feedback.innerHTML = `<strong>✔ Transmission Prepared!</strong> Opening your email client to send to <code>rahamansafiur614@gmail.com</code>. If it does not open automatically, <a href="${mailtoUrl}" style="text-decoration: underline; color: #fff;">click here to send</a>.`;
        feedback.style.display = 'block';

        btnText.textContent = "Message Dispatched ✔";
        
        // Trigger mailto client
        window.location.href = mailtoUrl;

        setTimeout(() => {
          submitBtn.disabled = false;
          btnText.textContent = "Transmit Message to Md Safiur Rahaman";
        }, 4000);
      }, 700);
    }
