import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VenueGeometry } from './VenueGeometry.js';
import { CameraController } from './CameraController.js';
import { RaycasterManager } from './RaycasterManager.js';
import { generateVenueSeats } from '../data/venueData.js';

export class ArenaScene {
  constructor(containerElement) {
    this.container = containerElement;
    this.seatsData = generateVenueSeats();

    this.initScene();
    this.initLights();
    this.initGeometry();
    this.initControls();
    this.initRaycaster();

    this.animate = this.animate.bind(this);
    this.handleResize = this.handleResize.bind(this);

    window.addEventListener('resize', this.handleResize);
    this.clock = new THREE.Clock();
    this.isRunning = true;
    requestAnimationFrame(this.animate);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06080d);
    this.scene.fog = new THREE.FogExp2(0x06080d, 0.007);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(54, aspect, 0.1, 400);
    this.camera.position.set(0, 38, 62);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  initLights() {
    // Ambient soft stadium illumination
    const ambientLight = new THREE.AmbientLight(0x162238, 1.8);
    this.scene.add(ambientLight);

    // Directional main arena key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(30, 50, 40);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.camera.near = 10;
    keyLight.shadow.camera.far = 150;
    const d = 50;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    this.scene.add(keyLight);

    // Subtle blue stadium rim light
    const rimLight = new THREE.DirectionalLight(0x00f2fe, 0.9);
    rimLight.position.set(-40, 30, -30);
    this.scene.add(rimLight);
  }

  initGeometry() {
    this.venue = new VenueGeometry(this.scene);
    this.venue.buildStadium(this.seatsData);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 3.5, 0);
    this.controls.minDistance = 6;
    this.controls.maxDistance = 120;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't allow camera under floor

    this.cameraController = new CameraController(this.camera, this.controls);
  }

  initRaycaster() {
    this.raycasterManager = new RaycasterManager(this.camera, this.renderer.domElement, this.venue);
  }

  handleResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate(currentTime) {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    this.controls.update();
    this.venue.update(currentTime);
    this.renderer.render(this.scene, this.camera);
  }

  getScreenPosition(worldPosition) {
    const vector = new THREE.Vector3(worldPosition.x, worldPosition.y, worldPosition.z);
    vector.project(this.camera);

    // Check if behind camera
    if (vector.z > 1) return null;

    const widthHalf = this.container.clientWidth / 2;
    const heightHalf = this.container.clientHeight / 2;

    return {
      x: (vector.x * widthHalf) + widthHalf,
      y: -(vector.y * heightHalf) + heightHalf
    };
  }

  destroy() {
    this.isRunning = false;
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
