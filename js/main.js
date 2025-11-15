// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});

// Animation on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("fade-in");
    }
  });
});

document.querySelectorAll(".game-card").forEach((card) => {
  observer.observe(card);
});

// Lazy load YouTube iframe when user scrolls near it
const youtubeEmbed = document.getElementById('youtube-embed');
if (youtubeEmbed) {
  const lazyLoadObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const iframe = entry.target;
        if (iframe.dataset.src) {
          iframe.src = iframe.dataset.src;
          iframe.removeAttribute('data-src');
        }
        lazyLoadObserver.unobserve(iframe);
      }
    });
  }, {
    rootMargin: '100px'
  });
  
  lazyLoadObserver.observe(youtubeEmbed);
}

// Game Modal Functions - Make them globally accessible
window.openGameModal = function(gameUrl, gameTitle) {
  const modal = document.getElementById('gameModal');
  const modalTitle = document.getElementById('gameModalTitle');
  const modalIframe = document.getElementById('gameModalIframe');
  
  if (!modal || !modalTitle || !modalIframe) {
    console.error('Modal elements not found');
    return;
  }
  
  modalTitle.textContent = gameTitle || 'Game';
  modalIframe.src = gameUrl;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeGameModal = function(event) {
  if (event) {
    event.stopPropagation();
  }
  
  const modal = document.getElementById('gameModal');
  const modalIframe = document.getElementById('gameModalIframe');
  
  if (!modal) return;
  
  // First exit fullscreen if active
  if (modal.classList.contains('fullscreen')) {
    modal.classList.remove('fullscreen');
    // Try to exit browser fullscreen if available
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.log(err));
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
  
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
  
  // Clear iframe src to stop the game from running
  if (modalIframe) {
    setTimeout(() => {
      modalIframe.src = '';
    }, 300);
  }
};

// Function to initialize Play Now buttons
function initializePlayButtons() {
  document.querySelectorAll('.play-btn').forEach((button) => {
    // Skip if already initialized
    if (button.dataset.initialized === 'true') return;
    
    const originalLink = button.getAttribute('href');
    if (originalLink && originalLink.startsWith('/')) {
      const gameTitle = button.closest('.game-card')?.querySelector('.game-title')?.textContent || 'Game';
      
      // Remove href to prevent navigation
      button.addEventListener('click', function(e) {
        e.preventDefault();
        openGameModal(originalLink, gameTitle);
      });
      
      button.style.cursor = 'pointer';
      button.dataset.initialized = 'true';
    }
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePlayButtons);
} else {
  initializePlayButtons();
}

// Also initialize after a short delay to catch any dynamically added buttons
setTimeout(initializePlayButtons, 100);

// Toggle Fullscreen Function - Make it globally accessible
window.toggleFullscreen = function() {
  const modal = document.getElementById('gameModal');
  if (!modal) return;
  
  const modalContent = modal.querySelector('.game-modal-content');
  if (!modalContent) return;
  
  if (modal.classList.contains('fullscreen')) {
    // Exit fullscreen
    modal.classList.remove('fullscreen');
    // Try to exit browser fullscreen if available
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.log(err));
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  } else {
    // Enter fullscreen
    modal.classList.add('fullscreen');
    // Try to enter browser fullscreen
    if (modalContent.requestFullscreen) {
      modalContent.requestFullscreen().catch(err => console.log(err));
    } else if (modalContent.webkitRequestFullscreen) {
      modalContent.webkitRequestFullscreen();
    } else if (modalContent.mozRequestFullScreen) {
      modalContent.mozRequestFullScreen();
    } else if (modalContent.msRequestFullscreen) {
      modalContent.msRequestFullscreen();
    }
  }
};

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', function() {
  const modal = document.getElementById('gameModal');
  if (!document.fullscreenElement) {
    modal.classList.remove('fullscreen');
  }
});

document.addEventListener('webkitfullscreenchange', function() {
  const modal = document.getElementById('gameModal');
  if (!document.webkitFullscreenElement) {
    modal.classList.remove('fullscreen');
  }
});

document.addEventListener('mozfullscreenchange', function() {
  const modal = document.getElementById('gameModal');
  if (!document.mozFullScreenElement) {
    modal.classList.remove('fullscreen');
  }
});

document.addEventListener('MSFullscreenChange', function() {
  const modal = document.getElementById('gameModal');
  if (!document.msFullscreenElement) {
    modal.classList.remove('fullscreen');
  }
});

// Close modal on ESC key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modal = document.getElementById('gameModal');
    if (modal.classList.contains('active')) {
      // Exit fullscreen first if active
      if (modal.classList.contains('fullscreen')) {
        toggleFullscreen();
      } else {
        closeGameModal({ stopPropagation: () => {} });
      }
    }
  }
});

