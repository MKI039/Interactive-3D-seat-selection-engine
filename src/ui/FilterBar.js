export class FilterBar {
  constructor({ onTierFilter, onViewChange, onToggleAtmosphere, onResetCam }) {
    this.currentTier = 'all';
    this.isConcertAtmosphere = true;

    this.tierButtons = document.querySelectorAll('.tier-item');
    this.viewButtons = document.querySelectorAll('.view-btn');
    this.btnAtmosphere = document.getElementById('btn-atmosphere');
    this.btnResetCam = document.getElementById('btn-reset-cam');

    this.onTierFilter = onTierFilter;
    this.onViewChange = onViewChange;
    this.onToggleAtmosphere = onToggleAtmosphere;
    this.onResetCam = onResetCam;

    this.bindEvents();
  }

  bindEvents() {
    // Tier buttons
    this.tierButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tier = btn.dataset.tier;
        this.setActiveTier(tier);
        if (this.onTierFilter) this.onTierFilter(tier);
      });
    });

    // View buttons
    this.viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.setActiveView(view);
        if (this.onViewChange) this.onViewChange(view);
      });
    });

    // Atmosphere toggle
    this.btnAtmosphere.addEventListener('click', () => {
      this.isConcertAtmosphere = !this.isConcertAtmosphere;
      this.btnAtmosphere.classList.toggle('active-state', this.isConcertAtmosphere);
      this.btnAtmosphere.querySelector('.btn-text').textContent = this.isConcertAtmosphere ? 'Show Lights' : 'House Lights';
      if (this.onToggleAtmosphere) this.onToggleAtmosphere(this.isConcertAtmosphere);
    });

    // Reset Camera
    this.btnResetCam.addEventListener('click', () => {
      this.setActiveView('overview');
      if (this.onResetCam) this.onResetCam();
    });
  }

  setActiveTier(tier) {
    this.currentTier = tier;
    this.tierButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tier === tier);
    });
  }

  setActiveView(view) {
    this.viewButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
  }

  updateAvailableCount(available, total) {
    const el = document.getElementById('available-seats-count');
    if (el) {
      el.textContent = `${available} / ${total} Available`;
    }
  }
}
