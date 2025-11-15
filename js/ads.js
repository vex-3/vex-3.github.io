/**
 * Ads Management Script
 * This file handles loading and displaying ads on the Vex 3 website
 */

(function () {
  "use strict";

  // Ad configuration
  const adConfig = {
    sidebarAd: {
      containerId: "sidebar-ad",
      width: 336,
      height: 280,
      enabled: true,
    },
  };

  /**
   * Initialize ads
   */
  function initAds() {
    if (!adConfig.sidebarAd.enabled) {
      return;
    }

    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", loadSidebarAd);
    } else {
      loadSidebarAd();
    }
  }

  /**
   * Load sidebar ad
   * Replace this function with your AdSense code when approved
   */
  function loadSidebarAd() {
    const adContainer = document.getElementById(adConfig.sidebarAd.containerId);

    if (!adContainer) {
      console.warn("Sidebar ad container not found");
      return;
    }

    // TODO: Replace this section with your AdSense code when approved
    // Example structure:
    /*
    const adScript = document.createElement('script');
    adScript.async = true;
    adScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXX';
    adScript.crossOrigin = 'anonymous';
    document.head.appendChild(adScript);

    const adIns = document.createElement('ins');
    adIns.className = 'adsbygoogle';
    adIns.style.display = 'block';
    adIns.setAttribute('data-ad-client', 'ca-pub-XXXXXXXXXXXXXXX');
    adIns.setAttribute('data-ad-slot', 'XXXXXXXXXX');
    adIns.setAttribute('data-ad-format', 'auto');
    adIns.setAttribute('data-full-width-responsive', 'true');
    
    adContainer.appendChild(adIns);
    
    try {
      (adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('Error loading AdSense:', e);
    }
    */

    // Placeholder: Show loading state
    showAdPlaceholder(adContainer);
  }

  /**
   * Show ad placeholder (temporary until AdSense is approved)
   */
  function showAdPlaceholder(container) {
    // Remove the label if ad is loaded
    const label = container.querySelector(".ad-label");
    if (label) {
      label.style.display = "none";
    }

    // You can add a loading indicator here if needed
    // For now, the container will remain empty until AdSense code is added
  }

  /**
   * Check if ad container is in viewport
   */
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Lazy load ad when it comes into viewport
   */
  function lazyLoadAd() {
    const adContainer = document.getElementById(adConfig.sidebarAd.containerId);

    if (!adContainer) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadSidebarAd();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "100px",
      }
    );

    observer.observe(adContainer);
  }

  // Initialize ads when script loads
  initAds();

  // Export functions for manual control if needed
  window.Vex3Ads = {
    loadSidebarAd: loadSidebarAd,
    initAds: initAds,
  };
})();
