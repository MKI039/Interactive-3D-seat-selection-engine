import anime from 'animejs';
import * as THREE from 'three';
import { STAGE_CONFIG } from '../data/venueData.js';

export class CameraController {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.currentViewMode = 'overview'; // 'overview' | 'section' | 'stage' | 'seat-pov'
    this.activeTween = null;
    this.defaultFov = camera.fov;
    this.lastOverviewPos = { x: 0, y: 38, z: 62 };
    this.lastOverviewTarget = { x: 0, y: 3.5, z: 0 };
    this.currentPovSeat = null;

    // POV look-around state
    this.povEyePos = null;
    this.currentYaw = 0;
    this.currentPitch = 0;
    this.isDraggingPov = false;
    this.lastPointerPos = { x: 0, y: 0 };
    this.onPovPointerDown = null;
    this.onPovPointerMove = null;
    this.onPovPointerUp = null;
  }

  transitionTo({ pos, target, fov = this.defaultFov, duration = 1400, easing = 'easeInOutCubic', onComplete = null }) {
    if (this.activeTween) {
      this.activeTween.pause();
    }

    // Disable OrbitControls during camera transitions so it doesn't fight position updates
    this.controls.enabled = false;

    const state = {
      camX: this.camera.position.x,
      camY: this.camera.position.y,
      camZ: this.camera.position.z,
      tarX: this.controls.target.x,
      tarY: this.controls.target.y,
      tarZ: this.controls.target.z,
      fov: this.camera.fov
    };

    this.activeTween = anime({
      targets: state,
      camX: pos.x,
      camY: pos.y,
      camZ: pos.z,
      tarX: target.x,
      tarY: target.y,
      tarZ: target.z,
      fov: fov,
      duration: duration,
      easing: easing,
      update: () => {
        this.camera.position.set(state.camX, state.camY, state.camZ);
        this.controls.target.set(state.tarX, state.tarY, state.tarZ);
        this.camera.lookAt(state.tarX, state.tarY, state.tarZ);
        this.camera.fov = state.fov;
        this.camera.updateProjectionMatrix();
      },
      complete: () => {
        this.activeTween = null;
        if (this.currentViewMode !== 'seat-pov') {
          this.controls.enabled = true;
          this.controls.update();
        }
        if (onComplete) onComplete();
      }
    });
  }

  moveToOverview(onComplete) {
    this.moveToTier('all', onComplete);
  }

  moveToTier(tier, onComplete) {
    this.destroyPovControls();
    this.currentViewMode = tier === 'all' ? 'overview' : 'section';
    this.currentPovSeat = null;

    const tierVantages = {
      all: {
        pos: this.lastOverviewPos,
        target: this.lastOverviewTarget,
        fov: this.defaultFov,
        minDist: 8,
        maxDist: 140
      },
      vip: {
        pos: { x: 0, y: 15, z: 25 },
        target: { x: 0, y: 2.7, z: 6 },
        fov: 50,
        minDist: 6,
        maxDist: 70
      },
      premium: {
        pos: { x: 0, y: 22, z: 34 },
        target: { x: 0, y: 4.5, z: 4 },
        fov: 54,
        minDist: 8,
        maxDist: 90
      },
      pit: {
        pos: { x: 0, y: 12, z: -3 },
        target: { x: 0, y: 0.6, z: -18.7 },
        fov: 52,
        minDist: 4,
        maxDist: 60
      },
      standard: {
        pos: { x: 0, y: 29, z: 66 },
        target: { x: 0, y: 17, z: 46 },
        fov: 52,
        minDist: 8,
        maxDist: 90
      }
    };

    const vantage = tierVantages[tier] || tierVantages.all;

    this.controls.minDistance = vantage.minDist;
    this.controls.maxDistance = vantage.maxDist;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;

    this.transitionTo({
      pos: vantage.pos,
      target: vantage.target,
      fov: vantage.fov,
      duration: 1350,
      easing: 'easeInOutCubic',
      onComplete
    });
  }

  moveToSection(secConfig, onComplete) {
    this.destroyPovControls();
    this.currentViewMode = 'section';
    this.currentPovSeat = null;

    this.controls.minDistance = 6;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;

    this.transitionTo({
      pos: secConfig.cameraPos,
      target: secConfig.cameraTarget,
      fov: this.defaultFov - 4,
      duration: 1300,
      easing: 'easeInOutCubic',
      onComplete
    });
  }

  moveToStage(onComplete) {
    this.destroyPovControls();
    this.currentViewMode = 'stage';
    this.currentPovSeat = null;

    this.controls.minDistance = 4;
    this.controls.maxDistance = 80;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;

    this.transitionTo({
      pos: { x: 0, y: 5, z: -18 },
      target: { x: 0, y: 3.5, z: -35 },
      fov: 62,
      duration: 1500,
      easing: 'easeInOutCubic',
      onComplete
    });
  }

  moveToVip(onComplete) {
    this.destroyPovControls();
    this.currentViewMode = 'section';
    this.currentPovSeat = null;

    this.controls.minDistance = 6;
    this.controls.maxDistance = 90;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;

    this.transitionTo({
      pos: { x: 0, y: 16, z: 38 },
      target: { x: 0, y: 8, z: 24 },
      fov: 55,
      duration: 1400,
      easing: 'easeInOutCubic',
      onComplete
    });
  }

  moveToSeatPOV(seatData, onComplete) {
    this.destroyPovControls();
    this.currentViewMode = 'seat-pov';
    this.currentPovSeat = seatData;

    // Eyeline coordinate directly in the seat (eye level + comfortable clearance)
    const eyeHeight = 1.15;
    const seatEyePos = {
      x: seatData.position.x,
      y: seatData.position.y + eyeHeight,
      z: seatData.position.z + 0.15
    };

    // Looking directly at center stage
    const stageFocus = {
      x: STAGE_CONFIG.position.x,
      y: STAGE_CONFIG.position.y + 2.0,
      z: STAGE_CONFIG.position.z
    };

    this.transitionTo({
      pos: seatEyePos,
      target: stageFocus,
      fov: 56, // Natural human eye field of view
      duration: 1500,
      easing: 'cubicBezier(0.25, 1, 0.5, 1)',
      onComplete: () => {
        this.setupPovControls(seatEyePos, stageFocus);
        if (onComplete) onComplete();
      }
    });
  }

  setupPovControls(seatEyePos, stageFocus) {
    this.controls.enabled = false;
    this.povEyePos = new THREE.Vector3(seatEyePos.x, seatEyePos.y, seatEyePos.z);

    // Calculate initial yaw and pitch facing the stage from this specific seat
    const dx = stageFocus.x - seatEyePos.x;
    const dy = stageFocus.y - seatEyePos.y;
    const dz = stageFocus.z - seatEyePos.z;
    const distXZ = Math.sqrt(dx * dx + dz * dz);

    this.currentYaw = Math.atan2(dx, -dz);
    this.currentPitch = Math.atan2(dy, distXZ);

    this.updatePovCamera();

    // Bind smooth drag-to-look-around from the seat
    this.isDraggingPov = false;
    this.lastPointerPos = { x: 0, y: 0 };

    this.onPovPointerDown = (e) => {
      // Only react to primary mouse button
      if (e.button !== 0) return;
      this.isDraggingPov = true;
      this.lastPointerPos.x = e.clientX;
      this.lastPointerPos.y = e.clientY;
    };

    this.onPovPointerMove = (e) => {
      if (!this.isDraggingPov || !this.povEyePos) return;

      const deltaX = e.clientX - this.lastPointerPos.x;
      const deltaY = e.clientY - this.lastPointerPos.y;
      this.lastPointerPos.x = e.clientX;
      this.lastPointerPos.y = e.clientY;

      const sens = 0.0035;
      this.currentYaw -= deltaX * sens;
      this.currentPitch += deltaY * sens;

      // Restrict vertical pitch to realistic head tilt range (-55° to +55°)
      const maxPitch = Math.PI * 0.32;
      this.currentPitch = Math.max(-maxPitch, Math.min(maxPitch, this.currentPitch));

      this.updatePovCamera();
    };

    this.onPovPointerUp = () => {
      this.isDraggingPov = false;
    };

    const dom = this.controls.domElement;
    dom.addEventListener('pointerdown', this.onPovPointerDown);
    window.addEventListener('pointermove', this.onPovPointerMove);
    window.addEventListener('pointerup', this.onPovPointerUp);
  }

  updatePovCamera() {
    if (!this.povEyePos) return;
    this.camera.position.copy(this.povEyePos);

    // Compute forward sightline direction vector from yaw and pitch
    const cosPitch = Math.cos(this.currentPitch);
    const lookDir = new THREE.Vector3(
      Math.sin(this.currentYaw) * cosPitch,
      Math.sin(this.currentPitch),
      -Math.cos(this.currentYaw) * cosPitch
    );

    const lookTarget = this.povEyePos.clone().add(lookDir);
    this.camera.lookAt(lookTarget);
  }

  destroyPovControls() {
    this.isDraggingPov = false;
    if (this.onPovPointerDown) {
      const dom = this.controls.domElement;
      dom.removeEventListener('pointerdown', this.onPovPointerDown);
      window.removeEventListener('pointermove', this.onPovPointerMove);
      window.removeEventListener('pointerup', this.onPovPointerUp);
      this.onPovPointerDown = null;
      this.onPovPointerMove = null;
      this.onPovPointerUp = null;
    }
    this.povEyePos = null;
  }
}
