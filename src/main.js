import { ArenaScene } from './engine/ArenaScene.js';
import { HudOverlay } from './ui/HudOverlay.js';
import { FilterBar } from './ui/FilterBar.js';
import { BookingDrawer } from './ui/BookingDrawer.js';

class SeatVenueApp {
  constructor() {
    this.canvasContainer = document.getElementById('canvas-container');
    this.hudContainer = document.getElementById('hud-layer');
    this.currentFilterTier = 'all';

    this.initScene();
    this.initUI();
    this.bindInteractions();
    this.updateAvailabilityMetrics();
  }

  initScene() {
    this.arena = new ArenaScene(this.canvasContainer);
  }

  initUI() {
    // 1. Booking Drawer & Seat Cart
    this.drawer = new BookingDrawer({
      onRemoveSeat: (seatData, meshGroup) => {
        this.drawer.toggleSeat(seatData, meshGroup);
        this.arena.venue.highlightSeat(meshGroup, 'default');
      },
      onExitPov: () => {
        this.exitPovMode();
      }
    });

    // 2. HUD Overlay (3D pins tracking sections)
    this.hud = new HudOverlay(this.arena, this.hudContainer, (secConfig) => {
      this.arena.cameraController.moveToSection(secConfig, () => {
        this.filterBar.setActiveView('overview');
      });
    });

    // 3. Filter Bar & View Controls
    this.filterBar = new FilterBar({
      onTierFilter: (tier) => {
        this.handleTierSelection(tier);
      },
      onViewChange: (view) => {
        this.handleViewChange(view);
      },
      onToggleAtmosphere: (isConcert) => {
        this.arena.venue.setAtmosphereMode(isConcert);
      },
      onResetCam: () => {
        this.exitPovMode();
      }
    });
  }

  bindInteractions() {
    const { raycasterManager, venue, cameraController } = this.arena;

    // Hover on 3D seat
    raycasterManager.onSeatHover = (seatData, meshGroup, screenPos) => {
      if (this.drawer.isSeatSelected(seatData.id)) return;
      if (this.currentFilterTier !== 'all' && seatData.tier !== this.currentFilterTier) return;

      venue.highlightSeat(meshGroup, 'hover');
      this.drawer.showTooltip(seatData, screenPos);
    };

    // Leave 3D seat hover
    raycasterManager.onSeatLeave = (meshGroup) => {
      const seatData = meshGroup.userData?.seatData;
      if (!seatData) return;

      if (this.drawer.isSeatSelected(seatData.id)) {
        venue.highlightSeat(meshGroup, 'selected');
      } else if (this.currentFilterTier !== 'all' && seatData.tier !== this.currentFilterTier) {
        venue.highlightSeat(meshGroup, 'filtered-out');
      } else {
        venue.highlightSeat(meshGroup, 'default');
      }

      this.drawer.hideTooltip();
    };

    // Click 3D seat: Select & Fly into POV
    raycasterManager.onSeatClick = (seatData, meshGroup) => {
      if (seatData.status === 'booked' || seatData.status === 'reserved') return;

      // Toggle in cart
      this.drawer.toggleSeat(seatData, meshGroup);

      const isNowSelected = this.drawer.isSeatSelected(seatData.id);
      venue.highlightSeat(meshGroup, isNowSelected ? 'selected' : 'default');

      // Fly camera into first-person POV
      this.hud.setVisible(false);
      this.arena.raycasterManager.enabled = false;
      cameraController.moveToSeatPOV(seatData, () => {
        this.drawer.showPovCard(seatData);
      });
    };
  }

  exitPovMode() {
    this.drawer.hidePovCard();
    this.hud.setVisible(true);
    this.arena.raycasterManager.enabled = true;
    this.arena.cameraController.moveToOverview(() => {
      this.filterBar.setActiveView('overview');
    });
  }

  handleViewChange(view) {
    this.drawer.hidePovCard();
    this.hud.setVisible(true);
    this.arena.raycasterManager.enabled = true;

    if (view === 'overview') {
      this.arena.cameraController.moveToOverview();
    } else if (view === 'stage') {
      this.arena.cameraController.moveToStage();
    } else if (view === 'vip') {
      this.arena.cameraController.moveToVip();
    }
  }

  handleTierSelection(tier) {
    // If user was in POV mode, exit cleanly
    this.drawer.hidePovCard();
    this.hud.setVisible(true);
    this.arena.raycasterManager.enabled = true;

    // Apply color/opacity filtering
    this.applyTierFilter(tier);

    // Smoothly fly camera to center that specific division
    this.arena.cameraController.moveToTier(tier, () => {
      if (tier === 'all') {
        this.filterBar.setActiveView('overview');
      }
    });
  }

  applyTierFilter(tier) {
    this.currentFilterTier = tier;
    let availableCount = 0;
    let totalInTier = 0;

    this.arena.venue.seatMeshes.forEach(meshGroup => {
      const { seatData } = meshGroup.userData;
      const matches = (tier === 'all' || seatData.tier === tier);

      if (matches) {
        totalInTier++;
        if (seatData.status === 'available') availableCount++;
      }

      if (this.drawer.isSeatSelected(seatData.id)) {
        this.arena.venue.highlightSeat(meshGroup, 'selected');
      } else if (!matches) {
        this.arena.venue.highlightSeat(meshGroup, 'filtered-out');
      } else {
        this.arena.venue.highlightSeat(meshGroup, 'default');
      }
    });

    this.filterBar.updateAvailableCount(availableCount, totalInTier);
  }

  updateAvailabilityMetrics() {
    const total = this.arena.seatsData.length;
    const available = this.arena.seatsData.filter(s => s.status === 'available').length;
    this.filterBar.updateAvailableCount(available, total);
  }
}

// Bootstrap application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new SeatVenueApp();
});
