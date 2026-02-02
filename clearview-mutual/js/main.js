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

    // Performance
    initLazyLoading();
    preloadResources();

    // Optional enhancements
    initTestimonialSlider();
    initParallax();

    // Accessibility
    initAccessibility();

    // Dev tools
    if (process?.env?.NODE_ENV !== 'production') {
      reportPerformance();
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
