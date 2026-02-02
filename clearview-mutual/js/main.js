/**
 * Clearview Mutual - Main JavaScript
 * Handles mobile navigation, smooth scrolling, and interactive elements
 */

(function() {
  'use strict';

  // ==========================================================================
  // DOM Elements
  // ==========================================================================
  const header = document.getElementById('header');
  const navToggle = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  // ==========================================================================
  // Mobile Navigation Toggle
  // ==========================================================================
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function() {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';

      // Toggle aria-expanded
      navToggle.setAttribute('aria-expanded', !isExpanded);

      // Toggle mobile nav visibility
      mobileNav.classList.toggle('is-active');

      // Prevent body scroll when nav is open
      document.body.style.overflow = isExpanded ? '' : 'hidden';
    });

    // Close mobile nav when clicking a link
    const mobileNavLinks = mobileNav.querySelectorAll('.nav__link');
    mobileNavLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        navToggle.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-active');
        document.body.style.overflow = '';
      });
    });

    // Close mobile nav when clicking outside
    document.addEventListener('click', function(event) {
      const isClickInsideNav = mobileNav.contains(event.target);
      const isClickOnToggle = navToggle.contains(event.target);

      if (!isClickInsideNav && !isClickOnToggle && mobileNav.classList.contains('is-active')) {
        navToggle.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-active');
        document.body.style.overflow = '';
      }
    });

    // Close mobile nav on escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && mobileNav.classList.contains('is-active')) {
        navToggle.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-active');
        document.body.style.overflow = '';
        navToggle.focus();
      }
    });
  }

  // ==========================================================================
  // Header Shadow on Scroll
  // ==========================================================================
  if (header) {
    let lastScrollY = 0;
    let ticking = false;

    function updateHeader() {
      const scrollY = window.scrollY;

      if (scrollY > 10) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }

      lastScrollY = scrollY;
      ticking = false;
    }

    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });

    // Initial check
    updateHeader();
  }

  // ==========================================================================
  // Smooth Scroll for Anchor Links
  // ==========================================================================
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(event) {
      const targetId = this.getAttribute('href');

      // Skip if it's just "#" or empty
      if (targetId === '#' || targetId === '') {
        return;
      }

      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        event.preventDefault();

        // Account for fixed header height
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Update URL hash without jumping
        history.pushState(null, null, targetId);

        // Set focus to target for accessibility
        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus({ preventScroll: true });
      }
    });
  });

  // ==========================================================================
  // FAQ Accordion Toggle
  // ==========================================================================
  window.toggleFaq = function(button) {
    const faqItem = button.closest('.faq-item');
    const isExpanded = button.getAttribute('aria-expanded') === 'true';

    // Close all other FAQ items (optional - remove for multi-open)
    document.querySelectorAll('.faq-item').forEach(function(item) {
      if (item !== faqItem) {
        item.classList.remove('faq-item--open');
        item.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false');
      }
    });

    // Toggle current item
    button.setAttribute('aria-expanded', !isExpanded);
    faqItem.classList.toggle('faq-item--open');
  };

  // ==========================================================================
  // Form Enhancement (placeholder for GHL integration)
  // ==========================================================================
  const contactForm = document.querySelector('[data-form-id="ghl-contact"]');

  if (contactForm) {
    contactForm.addEventListener('submit', function(event) {
      // Prevent default form submission
      // This will be replaced by GHL form integration
      event.preventDefault();

      // Basic form validation feedback
      const requiredFields = contactForm.querySelectorAll('[required]');
      let isValid = true;

      requiredFields.forEach(function(field) {
        if (!field.value.trim()) {
          isValid = false;
          field.style.borderColor = '#ef4444';
        } else {
          field.style.borderColor = '';
        }
      });

      if (isValid) {
        // Placeholder success message
        // This will be replaced by actual GHL form submission
        alert('Thank you for your message! This form will be connected to GoHighLevel for processing. In the meantime, please call us at (229) 834-0303.');
      }
    });

    // Clear error styling on input
    contactForm.querySelectorAll('input, textarea, select').forEach(function(field) {
      field.addEventListener('input', function() {
        this.style.borderColor = '';
      });
    });
  }

  // ==========================================================================
  // Phone Number Formatting
  // ==========================================================================
  const phoneInput = document.getElementById('phone');

  if (phoneInput) {
    phoneInput.addEventListener('input', function(event) {
      // Remove all non-digits
      let value = this.value.replace(/\D/g, '');

      // Format as (XXX) XXX-XXXX
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

  // ==========================================================================
  // Intersection Observer for Scroll Animations (optional enhancement)
  // ==========================================================================
  if ('IntersectionObserver' in window) {
    const animateOnScroll = document.querySelectorAll('.card, .step, .testimonial, .feature');

    if (animateOnScroll.length > 0) {
      const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      animateOnScroll.forEach(function(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
      });
    }
  }

  // ==========================================================================
  // Handle hash in URL on page load (for anchor navigation from other pages)
  // ==========================================================================
  if (window.location.hash) {
    // Delay to ensure proper scroll position after page load
    setTimeout(function() {
      const targetElement = document.querySelector(window.location.hash);
      if (targetElement) {
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  }

})();
