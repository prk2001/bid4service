/**
 * Clearview Mutual - World-Class JavaScript
 * Enhanced interactive features and animations
 */

(function() {
  'use strict';

  // ==========================================================================
  // Configuration
  // ==========================================================================
  const CONFIG = {
    scrollOffset: 80,
    animationDuration: 600,
    counterDuration: 2000,
    debounceDelay: 10
  };

  // ==========================================================================
  // DOM Elements
  // ==========================================================================
  const header = document.getElementById('header');
  const navToggle = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const readingProgress = document.querySelector('.reading-progress');

  // ==========================================================================
  // Utility Functions
  // ==========================================================================
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  // ==========================================================================
  // Mobile Navigation Toggle
  // ==========================================================================
  function initMobileNav() {
    if (!navToggle || !mobileNav) return;

    navToggle.addEventListener('click', function() {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
      mobileNav.classList.toggle('is-active');
      document.body.style.overflow = isExpanded ? '' : 'hidden';
    });

    // Close on link click
    mobileNav.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-active');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!mobileNav.contains(e.target) && !navToggle.contains(e.target) && mobileNav.classList.contains('is-active')) {
        navToggle.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-active');
        document.body.style.overflow = '';
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-active')) {
        navToggle.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-active');
        document.body.style.overflow = '';
        navToggle.focus();
      }
    });
  }

  // ==========================================================================
  // Header Scroll Effects
  // ==========================================================================
  function initHeaderScroll() {
    if (!header) return;

    let lastScroll = 0;
    let ticking = false;

    function updateHeader() {
      const scrollY = window.scrollY;

      // Add shadow on scroll
      if (scrollY > 10) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }

      lastScroll = scrollY;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });

    updateHeader();
  }

  // ==========================================================================
  // Reading Progress Bar
  // ==========================================================================
  function initReadingProgress() {
    if (!readingProgress) return;

    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      readingProgress.style.width = `${Math.min(progress, 100)}%`;
    }

    window.addEventListener('scroll', debounce(updateProgress, CONFIG.debounceDelay), { passive: true });
    updateProgress();
  }

  // ==========================================================================
  // Smooth Scroll for Anchor Links
  // ==========================================================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || targetId === '') return;

        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;

        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        history.pushState(null, null, targetId);
        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus({ preventScroll: true });
      });
    });

    // Handle hash on page load
    if (window.location.hash) {
      setTimeout(() => {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
          const headerHeight = header ? header.offsetHeight : 0;
          const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
          window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
      }, 100);
    }
  }

  // ==========================================================================
  // Animated Counters
  // ==========================================================================
  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const observerOptions = {
      threshold: 0.5,
      rootMargin: '0px'
    };

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
          animateCounter(entry.target);
          entry.target.classList.add('counted');
        }
      });
    }, observerOptions);

    counters.forEach(counter => counterObserver.observe(counter));
  }

  function animateCounter(element) {
    const target = parseInt(element.dataset.counter, 10);
    const suffix = element.dataset.suffix || '';
    const prefix = element.dataset.prefix || '';
    const duration = CONFIG.counterDuration;
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(easeOutQuart * target);

      element.textContent = prefix + current.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = prefix + target.toLocaleString() + suffix;
      }
    }

    requestAnimationFrame(updateCounter);
  }

  // ==========================================================================
  // Scroll Reveal Animations
  // ==========================================================================
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger-children');
    if (!revealElements.length) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // ==========================================================================
  // FAQ Accordion
  // ==========================================================================
  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    faqItems.forEach(item => {
      const question = item.querySelector('.faq-item__question');
      if (!question) return;

      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('faq-item--open');

        // Close all other items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('faq-item--open');
            otherItem.querySelector('.faq-item__question')?.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current item
        item.classList.toggle('faq-item--open');
        question.setAttribute('aria-expanded', !isOpen);
      });
    });
  }

  // Global toggle function for inline handlers
  window.toggleFaq = function(button) {
    const faqItem = button.closest('.faq-item');
    if (!faqItem) return;

    const isOpen = faqItem.classList.contains('faq-item--open');

    // Close all other items
    document.querySelectorAll('.faq-item').forEach(item => {
      if (item !== faqItem) {
        item.classList.remove('faq-item--open');
        item.querySelector('.faq-item__question')?.setAttribute('aria-expanded', 'false');
      }
    });

    // Toggle current item
    faqItem.classList.toggle('faq-item--open');
    button.setAttribute('aria-expanded', !isOpen);
  };

  // ==========================================================================
  // Quote Widget (Interactive Calculator)
  // ==========================================================================
  function initQuoteWidget() {
    const widget = document.querySelector('.quote-widget');
    if (!widget) return;

    const options = widget.querySelectorAll('.quote-widget__option');
    const steps = widget.querySelectorAll('.quote-widget__step');

    options.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selected from siblings
        option.parentElement.querySelectorAll('.quote-widget__option').forEach(opt => {
          opt.classList.remove('selected');
        });
        // Add selected to clicked
        option.classList.add('selected');
      });
    });
  }

  // ==========================================================================
  // Form Enhancement
  // ==========================================================================
  function initForms() {
    const forms = document.querySelectorAll('[data-form-id]');

    forms.forEach(form => {
      // Phone formatting
      const phoneInput = form.querySelector('input[type="tel"]');
      if (phoneInput) {
        phoneInput.addEventListener('input', function() {
          let value = this.value.replace(/\D/g, '');
          if (value.length > 0) {
            if (value.length <= 3) {
              value = '(' + value;
            } else if (value.length <= 6) {
              value = '(' + value.substring(0, 3) + ') ' + value.substring(3);
            } else {
              value = '(' + value.substring(0, 3) + ') ' + value.substring(3, 6) + '-' + value.substring(6, 10);
            }
          }
          this.value = value;
        });
      }

      // Form submission
      form.addEventListener('submit', function(e) {
        e.preventDefault();

        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
          if (!field.value.trim()) {
            isValid = false;
            field.style.borderColor = '#ef4444';
            field.classList.add('error');
          } else {
            field.style.borderColor = '';
            field.classList.remove('error');
          }
        });

        if (isValid) {
          // Show success message (placeholder for GHL integration)
          const submitBtn = form.querySelector('button[type="submit"]');
          const originalText = submitBtn.innerHTML;
          submitBtn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
          submitBtn.disabled = true;
          submitBtn.style.background = '#10b981';

          setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
            form.reset();
          }, 3000);
        }
      });

      // Clear error on input
      form.querySelectorAll('input, textarea, select').forEach(field => {
        field.addEventListener('input', function() {
          this.style.borderColor = '';
          this.classList.remove('error');
        });
      });
    });
  }

  // ==========================================================================
  // Card Hover Effects (Touch Support)
  // ==========================================================================
  function initCardEffects() {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
      // 3D tilt effect on mouse move (desktop only)
      if (window.matchMedia('(hover: hover)').matches) {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = (y - centerY) / 20;
          const rotateY = (centerX - x) / 20;

          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
        });
      }
    });
  }

  // ==========================================================================
  // Lazy Loading Images
  // ==========================================================================
  function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    if (!lazyImages.length) return;

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
            imageObserver.unobserve(img);
          }
        });
      }, { rootMargin: '50px 0px' });

      lazyImages.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      lazyImages.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  }

  // ==========================================================================
  // Testimonial Slider
  // ==========================================================================
  function initTestimonialSlider() {
    const slider = document.querySelector('.testimonial-slider');
    if (!slider) return;

    const track = slider.querySelector('.testimonial-slider__track');
    const slides = track?.children;
    const prevBtn = slider.querySelector('[data-slide="prev"]');
    const nextBtn = slider.querySelector('[data-slide="next"]');

    if (!track || !slides?.length) return;

    let currentSlide = 0;
    const totalSlides = slides.length;

    function updateSlider() {
      const offset = currentSlide * -100;
      track.style.transform = `translateX(${offset}%)`;
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateSlider();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateSlider();
      });
    }

    // Auto-advance
    setInterval(() => {
      currentSlide = (currentSlide + 1) % totalSlides;
      updateSlider();
    }, 5000);
  }

  // ==========================================================================
  // Parallax Effects
  // ==========================================================================
  function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    if (!parallaxElements.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;

    function updateParallax() {
      const scrollY = window.scrollY;

      parallaxElements.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.5;
        const rect = el.getBoundingClientRect();
        const visible = rect.top < window.innerHeight && rect.bottom > 0;

        if (visible) {
          const yPos = (scrollY - el.offsetTop) * speed;
          el.style.transform = `translateY(${yPos}px)`;
        }
      });

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  // ==========================================================================
  // Chat Widget
  // ==========================================================================
  function initChatWidget() {
    const chatWidget = document.querySelector('.chat-widget');
    if (!chatWidget) return;

    const chatBtn = chatWidget.querySelector('.chat-widget__button');

    chatBtn?.addEventListener('click', () => {
      // Placeholder for chat integration
      // This would open a chat window or redirect to contact
      window.location.href = 'contact.html#quote';
    });
  }

  // ==========================================================================
  // Dark Mode Toggle
  // ==========================================================================
  function initDarkMode() {
    const toggle = document.getElementById('dark-mode-toggle');
    if (!toggle) return;

    // Check for saved preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark-mode');
    }

    toggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark-mode');
      const isDark = document.documentElement.classList.contains('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        document.documentElement.classList.toggle('dark-mode', e.matches);
      }
    });
  }

  // ==========================================================================
  // Quote Wizard
  // ==========================================================================
  function initQuoteWizard() {
    const wizard = document.getElementById('quoteWizard');
    if (!wizard) return;

    const panels = wizard.querySelectorAll('.quote-wizard__panel');
    const steps = wizard.querySelectorAll('.quote-wizard__step');
    const connectors = wizard.querySelectorAll('.quote-wizard__connector');

    let currentStep = 1;
    const selectedCoverages = new Set();

    // Coverage selection handlers
    const coverageOptions = wizard.querySelectorAll('input[name="coverage"]');
    const bundleSavings = document.getElementById('bundleSavings');
    const nextBtn1 = document.getElementById('wizardNext1');

    coverageOptions.forEach(option => {
      option.addEventListener('change', () => {
        if (option.checked) {
          selectedCoverages.add(option.value);
        } else {
          selectedCoverages.delete(option.value);
        }

        // Show bundle savings if multiple selected
        if (bundleSavings) {
          const multipleSelected = selectedCoverages.size > 1 ||
            selectedCoverages.has('bundle');
          bundleSavings.style.display = multipleSelected ? 'flex' : 'none';
        }

        // Enable/disable next button
        if (nextBtn1) {
          nextBtn1.disabled = selectedCoverages.size === 0;
        }
      });
    });

    // Navigation handlers
    function goToStep(step) {
      // Update panels
      panels.forEach(panel => {
        const panelStep = parseInt(panel.dataset.panel);
        panel.classList.toggle('active', panelStep === step);
      });

      // Update step indicators
      steps.forEach((stepEl, index) => {
        const stepNum = index + 1;
        stepEl.classList.remove('active', 'completed');

        if (stepNum < step) {
          stepEl.classList.add('completed');
        } else if (stepNum === step) {
          stepEl.classList.add('active');
        }
      });

      // Update connectors
      connectors.forEach((conn, index) => {
        if (index < step - 1) {
          conn.classList.add('completed');
        } else {
          conn.classList.remove('completed');
        }
      });

      currentStep = step;

      // Scroll to wizard
      wizard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Step 1 -> Step 2
    nextBtn1?.addEventListener('click', () => {
      if (selectedCoverages.size > 0) {
        goToStep(2);
      }
    });

    // Step 2 -> Step 1
    const backBtn2 = document.getElementById('wizardBack2');
    backBtn2?.addEventListener('click', () => goToStep(1));

    // Step 2 -> Step 3 (Submit)
    const nextBtn2 = document.getElementById('wizardNext2');
    nextBtn2?.addEventListener('click', () => {
      const name = document.getElementById('wizardName')?.value;
      const phone = document.getElementById('wizardPhone')?.value;
      const email = document.getElementById('wizardEmail')?.value;
      const zip = document.getElementById('wizardZip')?.value;

      // Basic validation
      if (!name || !phone || !email || !zip) {
        alert('Please fill in all required fields.');
        return;
      }

      // Simulate form submission
      const formData = {
        coverages: Array.from(selectedCoverages),
        name,
        phone,
        email,
        zip,
        currentInsurance: document.getElementById('wizardCurrentInsurance')?.value
      };

      console.log('Quote request:', formData);

      // Show success
      goToStep(3);
    });

    // Phone formatting for wizard
    const wizardPhone = document.getElementById('wizardPhone');
    if (wizardPhone) {
      wizardPhone.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length > 0) {
          if (value.length <= 3) {
            value = '(' + value;
          } else if (value.length <= 6) {
            value = '(' + value.substring(0, 3) + ') ' + value.substring(3);
          } else {
            value = '(' + value.substring(0, 3) + ') ' + value.substring(3, 6) + '-' + value.substring(6, 10);
          }
        }
        this.value = value;
      });
    }

    // ZIP code formatting
    const wizardZip = document.getElementById('wizardZip');
    if (wizardZip) {
      wizardZip.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').substring(0, 5);
      });
    }
  }

  // ==========================================================================
  // Exit Intent Popup
  // ==========================================================================
  function initExitPopup() {
    const popup = document.getElementById('exitPopup');
    if (!popup) return;

    const overlay = popup.querySelector('.exit-popup__overlay');
    const closeBtn = popup.querySelector('.exit-popup__close');
    const dismissBtn = popup.querySelector('.exit-popup__dismiss');
    const form = popup.querySelector('.exit-popup__form');

    let hasShown = sessionStorage.getItem('exitPopupShown');

    function showPopup() {
      if (hasShown) return;
      popup.classList.add('active');
      document.body.style.overflow = 'hidden';
      sessionStorage.setItem('exitPopupShown', 'true');
      hasShown = true;
    }

    function hidePopup() {
      popup.classList.remove('active');
      document.body.style.overflow = '';
    }

    // Exit intent detection (desktop)
    document.addEventListener('mouseout', (e) => {
      if (e.clientY < 50 && e.relatedTarget === null) {
        showPopup();
      }
    });

    // Scroll-based trigger (mobile) - show after scrolling back up
    let lastScrollY = window.scrollY;
    let scrollUpCount = 0;

    window.addEventListener('scroll', debounce(() => {
      const currentScrollY = window.scrollY;

      // If scrolling up significantly from near the top
      if (currentScrollY < lastScrollY && currentScrollY < 200) {
        scrollUpCount++;
        if (scrollUpCount > 3 && !hasShown) {
          setTimeout(showPopup, 500);
        }
      } else {
        scrollUpCount = 0;
      }

      lastScrollY = currentScrollY;
    }, 100), { passive: true });

    // Close handlers
    closeBtn?.addEventListener('click', hidePopup);
    dismissBtn?.addEventListener('click', hidePopup);
    overlay?.addEventListener('click', hidePopup);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup.classList.contains('active')) {
        hidePopup();
      }
    });

    // Form submission
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]')?.value;

      if (email) {
        console.log('Lead magnet signup:', email);

        // Show success
        form.innerHTML = `
          <div style="text-align: center; padding: 1rem;">
            <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--color-success); margin-bottom: 1rem;"></i>
            <p style="font-weight: 600;">Check your email!</p>
            <p style="color: var(--color-text-light);">Your guide is on its way.</p>
          </div>
        `;

        setTimeout(hidePopup, 3000);
      }
    });
  }

  // ==========================================================================
  // Video Modal
  // ==========================================================================
  function initVideoModal() {
    const modal = document.getElementById('videoModal');
    if (!modal) return;

    const overlay = modal.querySelector('.video-modal__overlay');
    const closeBtn = modal.querySelector('.video-modal__close');
    const playButtons = document.querySelectorAll('.testimonial__video-play');

    function openModal() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    playButtons.forEach(btn => {
      btn.addEventListener('click', openModal);
    });

    closeBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  // ==========================================================================
  // Scheduler Modal
  // ==========================================================================
  function initSchedulerModal() {
    const modal = document.getElementById('schedulerModal');
    if (!modal) return;

    const overlay = modal.querySelector('.scheduler-modal__overlay');
    const closeBtn = modal.querySelector('.scheduler-modal__close');
    const openBtn = document.getElementById('openScheduler');
    const slots = modal.querySelectorAll('.scheduler-modal__slot');

    function openModal() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    openBtn?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    // Slot selection
    slots.forEach(slot => {
      slot.addEventListener('click', () => {
        slots.forEach(s => s.classList.remove('selected'));
        slot.classList.add('selected');

        // Simulate booking
        setTimeout(() => {
          alert(`Great choice! Patrick will call you at ${slot.textContent}. We'll send a confirmation email shortly.`);
          closeModal();
        }, 500);
      });
    });
  }

  // ==========================================================================
  // Comparison Toggle
  // ==========================================================================
  function initComparisonToggle() {
    const toggleBtns = document.querySelectorAll('.comparison-toggle__btn');
    if (!toggleBtns.length) return;

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const compareType = btn.dataset.compare;
        const themLabel = document.querySelector('.comparison-them-label');

        if (themLabel) {
          themLabel.textContent = compareType === 'captive' ?
            'Big Carrier Agent' : 'Direct/Online Quote';
        }

        // Could update comparison data based on type
        console.log('Comparing against:', compareType);
      });
    });
  }

  // ==========================================================================
  // Location Personalization
  // ==========================================================================
  function initLocationPersonalization() {
    const heroLocation = document.getElementById('hero-location');
    const locationName = document.getElementById('location-name');

    // Simple Georgia city detection based on timezone and default to Georgia
    // In production, you'd use a geolocation API

    const georgiaData = {
      default: { city: 'Georgia', savings: '$450' },
      cities: [
        { name: 'Atlanta', savings: '$480' },
        { name: 'Savannah', savings: '$420' },
        { name: 'Augusta', savings: '$410' },
        { name: 'Columbus', savings: '$430' },
        { name: 'Macon', savings: '$400' },
        { name: 'Athens', savings: '$390' },
        { name: 'Valdosta', savings: '$460' }
      ]
    };

    // Randomly select a city for demo (in production, use geolocation)
    const randomCity = georgiaData.cities[Math.floor(Math.random() * georgiaData.cities.length)];

    if (heroLocation) {
      heroLocation.textContent = randomCity.name;
    }

    if (locationName) {
      locationName.textContent = randomCity.name;
    }
  }

  // ==========================================================================
  // Newsletter Form
  // ==========================================================================
  function initNewsletterForms() {
    const forms = document.querySelectorAll('[data-form-id="ghl-newsletter"]');

    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = form.querySelector('input[type="email"]')?.value;
        if (!email) return;

        console.log('Newsletter signup:', email);

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;

        btn.innerHTML = '<i class="fas fa-check"></i> Subscribed!';
        btn.disabled = true;
        btn.style.background = 'var(--color-success)';

        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.disabled = false;
          btn.style.background = '';
          form.reset();
        }, 3000);
      });
    });
  }

  // ==========================================================================
  // Preload Critical Resources
  // ==========================================================================
  function preloadResources() {
    // Preload next pages on hover
    const navLinks = document.querySelectorAll('.nav__link[href]');

    navLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('http')) {
          const preloadLink = document.createElement('link');
          preloadLink.rel = 'prefetch';
          preloadLink.href = href;
          document.head.appendChild(preloadLink);
        }
      }, { once: true });
    });
  }

  // ==========================================================================
  // Accessibility Enhancements
  // ==========================================================================
  function initAccessibility() {
    // Focus trap for mobile nav
    if (mobileNav) {
      const focusableElements = mobileNav.querySelectorAll(
        'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        mobileNav.addEventListener('keydown', (e) => {
          if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        });
      }
    }

    // Reduce motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('reduce-motion');
    }
  }

  // ==========================================================================
  // Performance Monitoring
  // ==========================================================================
  function reportPerformance() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfEntries = performance.getEntriesByType('navigation');
          if (perfEntries.length > 0) {
            const timing = perfEntries[0];
            console.log('Page Load Time:', Math.round(timing.loadEventEnd - timing.startTime), 'ms');
          }
        }, 0);
      });
    }
  }

  // ==========================================================================
  // Initialize All Features
  // ==========================================================================
  function init() {
    // Core features
    initMobileNav();
    initHeaderScroll();
    initReadingProgress();
    initSmoothScroll();

    // Interactive features
    initCounters();
    initScrollReveal();
    initFAQ();
    initQuoteWidget();
    initForms();
    initCardEffects();
    initChatWidget();

    // World-class upgrade features
    initDarkMode();
    initQuoteWizard();
    initExitPopup();
    initVideoModal();
    initSchedulerModal();
    initComparisonToggle();
    initLocationPersonalization();
    initNewsletterForms();

    // Performance
    initLazyLoading();
    preloadResources();

    // Optional enhancements
    initTestimonialSlider();
    initParallax();

    // Accessibility
    initAccessibility();

    // Dev tools
    try {
      if (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production') {
        reportPerformance();
      }
    } catch (e) {
      // Silently ignore - process is not defined in browser
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
