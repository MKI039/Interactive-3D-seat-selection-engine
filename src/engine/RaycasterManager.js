import * as THREE from 'three';

export class RaycasterManager {
  constructor(camera, domElement, venueGeometry) {
    this.camera = camera;
    this.domElement = domElement;
    this.venueGeometry = venueGeometry;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredSeatGroup = null;
    this.enabled = true;

    this.onSeatHover = null;
    this.onSeatLeave = null;
    this.onSeatClick = null;

    this.isDragging = false;
    this.pointerDownPos = { x: 0, y: 0 };

    this.bindEvents();
  }

  bindEvents() {
    this.domElement.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.domElement.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.domElement.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.domElement.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }

  handlePointerMove(e) {
    if (!this.enabled) return;

    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.lastClientX = e.clientX;
    this.lastClientY = e.clientY;

    if (!this.rafPending) {
      this.rafPending = true;
      requestAnimationFrame(() => {
        this.rafPending = false;
        if (this.enabled) {
          this.checkIntersection(this.lastClientX, this.lastClientY);
        }
      });
    }
  }

  handlePointerDown(e) {
    this.pointerDownPos.x = e.clientX;
    this.pointerDownPos.y = e.clientY;
    this.isDragging = false;
  }

  handlePointerUp(e) {
    // Only register as a click if the pointer didn't drag noticeably (e.g. orbit rotation)
    const dx = Math.abs(e.clientX - this.pointerDownPos.x);
    const dy = Math.abs(e.clientY - this.pointerDownPos.y);

    if (dx < 5 && dy < 5 && this.hoveredSeatGroup) {
      if (this.onSeatClick) {
        this.onSeatClick(this.hoveredSeatGroup.userData.seatData, this.hoveredSeatGroup);
      }
    }
  }

  handleMouseLeave() {
    if (this.hoveredSeatGroup) {
      if (this.onSeatLeave) this.onSeatLeave(this.hoveredSeatGroup);
      this.hoveredSeatGroup = null;
      this.domElement.style.cursor = 'default';
    }
  }

  checkIntersection(clientX, clientY) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Test all seat meshes
    const intersects = this.raycaster.intersectObjects(this.venueGeometry.seatMeshes, true);

    if (intersects.length > 0) {
      // Find the root seat group
      let current = intersects[0].object;
      while (current && !current.userData?.isSeat && current.parent) {
        current = current.parent;
      }

      if (current && current.userData?.isSeat) {
        if (this.hoveredSeatGroup !== current) {
          if (this.hoveredSeatGroup && this.onSeatLeave) {
            this.onSeatLeave(this.hoveredSeatGroup);
          }
          this.hoveredSeatGroup = current;
          this.domElement.style.cursor = 'pointer';
          if (this.onSeatHover) {
            this.onSeatHover(current.userData.seatData, current, { x: clientX, y: clientY });
          }
        }
        return;
      }
    }

    if (this.hoveredSeatGroup) {
      if (this.onSeatLeave) {
        this.onSeatLeave(this.hoveredSeatGroup);
      }
      this.hoveredSeatGroup = null;
      this.domElement.style.cursor = 'default';
    }
  }
}
