/**
 * Twenty Minutes Outside — Interactive Behavior
 * Vanilla JS, no dependencies, respects reduced-motion, keyboard accessible.
 */

(function () {
  'use strict';

  // ────────────────────────────────────────────────────────────────────────
  // Configuration & Constants
  // ────────────────────────────────────────────────────────────────────────

  const SELECTORS = {
    filters: '[data-filter]',
    cards: '[data-activity]',
    pickBtn: '[data-pick]',
    liveRegion: '[data-result]',
    filterButtons: '.filter-btn'
  };

  const FILTER_TYPES = ['quiet', 'move', 'notice'];
  const ACTIVITY_TITLES = {
    quiet: 'Bench without a view',
    move: 'Two-turn walk',
    notice: 'One-color field note'
  };

  const ACTIVITY_DESCRIPTIONS = {
    quiet: 'Walk until you find a bench facing something ordinary. Sit for five minutes. Write down three things that change while you wait.',
    move: 'Leave your door, take the second left, then the second right. Keep moving until ten minutes have passed. Reverse the route home.',
    notice: 'Choose one color. Follow it for ten minutes through signs, plants, clothing, and light. Photograph or name your best find.'
  };

  // ────────────────────────────────────────────────────────────────────────
  // State
  // ────────────────────────────────────────────────────────────────────────

  let state = {
    activeFilter: null,        // 'quiet' | 'move' | 'notice' | null
    selectedActivity: null,    // 'quiet' | 'move' | 'notice' | null
    reducedMotion: false,
    cards: [],
    filters: [],
    pickBtn: null,
    liveRegion: null
  };

  // ────────────────────────────────────────────────────────────────────────
  // Reduced Motion Detection
  // ────────────────────────────────────────────────────────────────────────

  function initReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    state.reducedMotion = mediaQuery.matches;

    mediaQuery.addEventListener('change', (e) => {
      state.reducedMotion = e.matches;
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // DOM Queries & Initialization
  // ────────────────────────────────────────────────────────────────────────

  function cacheElements() {
    state.cards = Array.from(document.querySelectorAll(SELECTORS.cards));
    state.filters = Array.from(document.querySelectorAll(SELECTORS.filterButtons));
    state.pickBtn = document.querySelector(SELECTORS.pickBtn);
    state.liveRegion = document.querySelector(SELECTORS.liveRegion);

    // Validate required elements exist
    if (!state.cards.length || !state.filters.length || !state.pickBtn || !state.liveRegion) {
      console.error('[Twenty Minutes Outside] Required elements missing');
      return false;
    }
    return true;
  }

  // ────────────────────────────────────────────────────────────────────────
  // Filter Logic
  // ────────────────────────────────────────────────────────────────────────

  function applyFilter(filterType) {
    const isSameFilter = state.activeFilter === filterType;

    // Toggle off if same filter clicked again
    if (isSameFilter) {
      state.activeFilter = null;
    } else {
      state.activeFilter = filterType;
    }

    // Update filter button aria-pressed
    state.filters.forEach(btn => {
      const btnFilter = btn.getAttribute('data-filter');
      const isActive = btnFilter === state.activeFilter;
      btn.setAttribute('aria-pressed', isActive.toString());
    });

    // Show/hide activity cards
    state.cards.forEach(card => {
      const cardType = card.getAttribute('data-type');
      const shouldShow = state.activeFilter === null || cardType === state.activeFilter;
      card.hidden = !shouldShow;
    });

    // If a card was selected but is now filtered out, clear selection
    if (state.selectedActivity && state.activeFilter && state.selectedActivity !== state.activeFilter) {
      clearSelection();
    }
  }

  function clearSelection() {
    const previouslySelected = state.cards.find(c => c.getAttribute('data-selected') === 'true');
    if (previouslySelected) {
      previouslySelected.setAttribute('data-selected', 'false');
    }
    state.selectedActivity = null;
  }

  function announce(message) {
    // Clear and set live region for screen reader announcement
    state.liveRegion.textContent = '';
    // Force reflow for screen readers
    void state.liveRegion.offsetWidth;
    state.liveRegion.textContent = message;
    // Also set data-result for visual toast
    state.liveRegion.setAttribute('data-result', message);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Pick Random Activity
  // ────────────────────────────────────────────────────────────────────────

  function pickRandomActivity() {
    // Get currently visible (non-hidden) cards
    const visibleCards = state.cards.filter(card => !card.hidden);

    if (visibleCards.length === 0) {
      // No visible cards - shouldn't happen but fallback
      return;
    }

    // Pick random from visible cards
    const randomIndex = Math.floor(Math.random() * visibleCards.length);
    const selectedCard = visibleCards[randomIndex];
    const activityType = selectedCard.getAttribute('data-type');

    // Clear previous selection
    clearSelection();

    // Mark new selection
    selectedCard.setAttribute('data-selected', 'true');
    state.selectedActivity = activityType;

    // Announce to screen readers and show toast
    const title = ACTIVITY_TITLES[activityType];
    announce(`Today's pick: ${title}`);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Event Listeners
  // ────────────────────────────────────────────────────────────────────────

  function bindEvents() {
    // Filter buttons
    state.filters.forEach(btn => {
      btn.addEventListener('click', () => {
        const filterType = btn.getAttribute('data-filter');
        applyFilter(filterType);
      });

      // Keyboard support for filter buttons (Enter/Space)
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const filterType = btn.getAttribute('data-filter');
          applyFilter(filterType);
        }
      });
    });

    // Pick button
    state.pickBtn.addEventListener('click', pickRandomActivity);

    state.pickBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pickRandomActivity();
      }
    });

    // Keyboard navigation between filter buttons (arrow keys)
    state.filters.forEach((btn, index) => {
      btn.addEventListener('keydown', (e) => {
        let newIndex = index;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          newIndex = (index + 1) % state.filters.length;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          newIndex = (index - 1 + state.filters.length) % state.filters.length;
        } else if (e.key === 'Home') {
          e.preventDefault();
          newIndex = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          newIndex = state.filters.length - 1;
        }

        if (newIndex !== index) {
          state.filters[newIndex].focus();
        }
      });
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // Initialization
  // ────────────────────────────────────────────────────────────────────────

  function init() {
    initReducedMotion();

    if (!cacheElements()) {
      return;
    }

    bindEvents();

    // Initialize all cards as visible and unselected
    state.cards.forEach(card => {
      card.hidden = false;
      card.setAttribute('data-selected', 'false');
    });

    // Initialize filter buttons as unpressed
    state.filters.forEach(btn => {
      btn.setAttribute('aria-pressed', 'false');
    });

    // Initial announcement for screen readers (silent)
    state.liveRegion.textContent = '';

    console.log('[Twenty Minutes Outside] Initialized');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();