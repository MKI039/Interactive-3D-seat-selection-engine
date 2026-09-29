import { SECTIONS_CONFIG } from '../data/venueData.js';

export class HudOverlay {
  constructor(arenaScene, hudContainer, onSectionSelect) {
    this.arena = arenaScene;
    this.container = hudContainer;
    this.onSectionSelect = onSectionSelect;
    this.pins = [];
    this.visible = true;

    this.createPins();
    this.update = this.update.bind(this);
    this.startTracking();
  }

  createPins() {
    this.container.innerHTML = '';
    this.pins = [];

    SECTIONS_CONFIG.forEach(sec => {
      const pinEl = document.createElement('div');
      pinEl.className = 'hud-pin';
      pinEl.innerHTML = `
        <div class="hud-pin-pill">
          <span class="dot"></span>
          <span>${sec.name}</span>
        </div>
        <div class="hud-pin-arrow"></div>
      `;

      pinEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onSectionSelect) {
          this.onSectionSelect(sec);
        }
      });

      this.container.appendChild(pinEl);
      this.pins.push({
        element: pinEl,
        worldPos: sec.hudPosition,
        config: sec
      });
    });
  }

  startTracking() {
    const loop = () => {
      this.update();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update() {
    if (!this.visible) {
      this.container.style.display = 'none';
      return;
    }
    this.container.style.display = 'block';

    const camDistance = this.arena.camera.position.distanceTo(this.arena.controls.target);
    const isCloseUp = camDistance < 14;

    this.pins.forEach(pin => {
      if (isCloseUp) {
        pin.element.style.opacity = '0';
        pin.element.style.pointerEvents = 'none';
        return;
      }

      const screenPos = this.arena.getScreenPosition(pin.worldPos);
      if (!screenPos) {
        pin.element.style.display = 'none';
        return;
      }

      pin.element.style.display = 'flex';
      pin.element.style.opacity = '1';
      pin.element.style.pointerEvents = 'auto';
      pin.element.style.left = `${screenPos.x}px`;
      pin.element.style.top = `${screenPos.y}px`;
    });
  }

  setVisible(visible) {
    this.visible = visible;
  }
}
