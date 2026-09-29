import * as THREE from 'three';
import { STAGE_CONFIG, TIERS } from '../data/venueData.js';

/**
 * Creates a reusable beveled rounded-box geometry with smooth specular highlights.
 */
function createRoundedBox(width, height, depth, radius = 0.035, smoothness = 2) {
  const shape = new THREE.Shape();
  const w = width / 2 - radius;
  const h = height / 2 - radius;
  shape.moveTo(-w, -h - radius);
  shape.lineTo(w, -h - radius);
  shape.quadraticCurveTo(w + radius, -h - radius, w + radius, -h);
  shape.lineTo(w + radius, h);
  shape.quadraticCurveTo(w + radius, h + radius, w, h + radius);
  shape.lineTo(-w, h + radius);
  shape.quadraticCurveTo(-w - radius, h + radius, -w - radius, h);
  shape.lineTo(-w - radius, -h);
  shape.quadraticCurveTo(-w - radius, -h - radius, -w, -h - radius);

  const extrudeSettings = {
    depth: depth - radius * 2,
    bevelEnabled: true,
    bevelSegments: smoothness,
    steps: 1,
    bevelSize: radius,
    bevelThickness: radius,
    curveSegments: smoothness * 2
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  return geometry;
}

export class VenueGeometry {
  constructor(scene) {
    this.scene = scene;
    this.seatMeshes = []; // Array of seat meshes for raycasting
    this.spotlights = [];
    this.lightBeams = [];
    this.stageMesh = null;
    this.screenMaterial = null;
    this.lastLedTime = 0;
  }

  buildStadium(seatsData) {
    this.buildGroundAndGrid();
    this.buildStage();
    this.buildTiersAndArchitecture();
    this.buildSeats(seatsData);
    this.buildLightingRig();
    this.buildFohConsole();
  }

  buildGroundAndGrid() {
    // Deep dark arena floor with subtle specular sheen
    const floorGeo = new THREE.PlaneGeometry(260, 260);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x070a12,
      roughness: 0.65,
      metalness: 0.35
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.05;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Subtle sci-fi stadium grid
    const grid = new THREE.GridHelper(200, 50, 0x00f2fe, 0x131f36);
    grid.position.y = 0.01;
    grid.material.opacity = 0.28;
    grid.material.transparent = true;
    this.scene.add(grid);
  }

  buildStage() {
    const stageGroup = new THREE.Group();
    const { position, size, ledScreen } = STAGE_CONFIG;

    // 1. Stage Main Platform
    const stageGeo = new THREE.BoxGeometry(size.width, size.height, size.depth);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x0f1422,
      roughness: 0.35,
      metalness: 0.65
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.set(position.x, position.y, position.z);
    stage.castShadow = true;
    stage.receiveShadow = true;
    stageGroup.add(stage);

    // Stage Front Edge Neon Strip
    const edgeGeo = new THREE.BoxGeometry(size.width, 0.16, 0.3);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.set(position.x, position.y + size.height / 2, position.z + size.depth / 2);
    stageGroup.add(edge);

    // 2. Concert Thrust Runway / Catwalk extending into Floor Pit
    const runwayDepth = 9.5;
    const runwayWidth = 5.4;
    const runwayGeo = new THREE.BoxGeometry(runwayWidth, size.height, runwayDepth);
    const runway = new THREE.Mesh(runwayGeo, stageMat);
    const runwayZ = position.z + size.depth / 2 + runwayDepth / 2;
    runway.position.set(0, position.y, runwayZ);
    runway.receiveShadow = true;
    stageGroup.add(runway);

    // Catwalk glowing border strips
    const runwayEdgeGeo = new THREE.BoxGeometry(0.14, 0.14, runwayDepth);
    [-runwayWidth / 2, runwayWidth / 2].forEach(rx => {
      const edgeLine = new THREE.Mesh(runwayEdgeGeo, edgeMat);
      edgeLine.position.set(rx, position.y + size.height / 2, runwayZ);
      stageGroup.add(edgeLine);
    });
    const runwayTipGeo = new THREE.BoxGeometry(runwayWidth, 0.14, 0.14);
    const runwayTip = new THREE.Mesh(runwayTipGeo, edgeMat);
    runwayTip.position.set(0, position.y + size.height / 2, runwayZ + runwayDepth / 2);
    stageGroup.add(runwayTip);

    // Performer Stage Wedge Monitors
    const wedgeGeo = new THREE.BoxGeometry(1.2, 0.4, 0.65);
    const wedgeMat = new THREE.MeshStandardMaterial({ color: 0x0d121f, roughness: 0.8 });
    [-1.6, 1.6].forEach(wx => {
      const wedge = new THREE.Mesh(wedgeGeo, wedgeMat);
      wedge.position.set(wx, position.y + size.height / 2 + 0.2, runwayZ + runwayDepth / 2 - 0.8);
      wedge.rotation.x = -0.3;
      stageGroup.add(wedge);
    });

    // 3. Overhead Concert Lighting Truss Arch
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x2e384d, metalness: 0.85, roughness: 0.25 });
    const trussArchGeo = new THREE.TorusGeometry(18.5, 0.35, 8, 36, Math.PI);
    const trussArch = new THREE.Mesh(trussArchGeo, trussMat);
    trussArch.position.set(0, 16.5, position.z - 1.5);
    trussArch.rotation.z = Math.PI;
    stageGroup.add(trussArch);

    // Horizontal truss cross-beam
    const crossBarGeo = new THREE.BoxGeometry(35, 0.55, 0.55);
    const crossBar = new THREE.Mesh(crossBarGeo, trussMat);
    crossBar.position.set(0, 21.5, position.z - 1.5);
    stageGroup.add(crossBar);

    // 4. LED Backdrop Screen
    const screenGeo = new THREE.PlaneGeometry(ledScreen.width, ledScreen.height);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    this.drawLedCanvas(ctx, 0);
    this.ledCanvas = canvas;
    this.ledCtx = ctx;

    const screenTexture = new THREE.CanvasTexture(canvas);
    this.screenTexture = screenTexture;

    this.screenMaterial = new THREE.MeshBasicMaterial({
      map: screenTexture,
      side: THREE.DoubleSide
    });
    const screen = new THREE.Mesh(screenGeo, this.screenMaterial);
    screen.position.set(0, position.y + ledScreen.height / 2, ledScreen.z);
    stageGroup.add(screen);

    // Screen frame/truss
    const frameGeo = new THREE.BoxGeometry(ledScreen.width + 1.5, ledScreen.height + 1.5, 0.6);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, position.y + ledScreen.height / 2, ledScreen.z - 0.4);
    stageGroup.add(frame);

    // 5. Sound Line Array Speaker Towers (Left and Right)
    [-size.width / 2 - 3.2, size.width / 2 + 3.2].forEach(x => {
      const towerGeo = new THREE.BoxGeometry(2.6, 14, 2.6);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x0b111c, roughness: 0.7 });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(x, 7, position.z);
      stageGroup.add(tower);

      // Acoustic grills with subtle blue edge glow
      for (let y = 3; y <= 12; y += 3) {
        const grillGeo = new THREE.PlaneGeometry(2.3, 2.3);
        const grillMat = new THREE.MeshBasicMaterial({ color: 0x223048 });
        const grill = new THREE.Mesh(grillGeo, grillMat);
        grill.position.set(x, y, position.z + 1.35);
        stageGroup.add(grill);
      }
    });

    this.scene.add(stageGroup);
    this.stageMesh = stageGroup;
  }

  buildFohConsole() {
    // Front-of-House (FOH) Sound & Visual Engineering Desk
    const fohGroup = new THREE.Group();
    const deskGeo = new THREE.BoxGeometry(5.2, 1.1, 2.4);
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x0c1322, roughness: 0.7, metalness: 0.4 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, 0.55, -6.5);
    fohGroup.add(desk);

    // Glowing audio mixing screens
    const monGeo = new THREE.BoxGeometry(1.1, 0.65, 0.06);
    const monMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const monMat2 = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    [-1.4, 0, 1.4].forEach((mx, idx) => {
      const mon = new THREE.Mesh(monGeo, idx === 1 ? monMat : monMat2);
      mon.position.set(mx, 1.35, -6.5);
      mon.rotation.x = -0.2;
      fohGroup.add(mon);
    });

    this.scene.add(fohGroup);
  }

  drawLedCanvas(ctx, time) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#030712');
    grad.addColorStop(0.5, '#081426');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Futuristic audio visualizer bars
    const bars = 28;
    const barWidth = w / bars;
    for (let i = 0; i < bars; i++) {
      const freq = Math.sin(time * 0.005 + i * 0.35) * 0.5 + 0.5;
      const barHeight = freq * (h * 0.62) + 18;
      
      const barGrad = ctx.createLinearGradient(0, h, 0, h - barHeight);
      barGrad.addColorStop(0, '#00f2fe');
      barGrad.addColorStop(0.5, '#a855f7');
      barGrad.addColorStop(1, '#ffd700');

      ctx.fillStyle = barGrad;
      ctx.fillRect(i * barWidth + 2, h - barHeight - 12, barWidth - 4, barHeight);
    }

    // High-density jumbotron scanline effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }

    // Concert Headline typography
    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 10;
    ctx.fillText('METROPOLIS 2026', w / 2, 56);
    
    ctx.font = '12px monospace';
    ctx.fillStyle = '#00f2fe';
    ctx.shadowBlur = 4;
    ctx.fillText('• THE SYNTHESIS WORLD TOUR • SPATIAL AUDIO •', w / 2, 84);
  }

  buildTiersAndArchitecture() {
    const arcGroup = new THREE.Group();

    // 1. Lower Bowl Concrete Tier Wedge
    const lowerTierGeo = new THREE.CylinderGeometry(52, 38, 7, 36, 1, true, -Math.PI * 0.4, Math.PI * 0.8);
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x131926,
      roughness: 0.85,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    const lowerTier = new THREE.Mesh(lowerTierGeo, concreteMat);
    lowerTier.position.set(0, 3.5, 4);
    lowerTier.receiveShadow = true;
    arcGroup.add(lowerTier);

    // Lower Bowl Front Glass Railing with Illuminated Top Rail
    const lowerGlassGeo = new THREE.CylinderGeometry(38.8, 38.8, 1.1, 36, 1, true, -Math.PI * 0.38, Math.PI * 0.76);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x64b5f6,
      transparent: true,
      opacity: 0.28,
      roughness: 0.08,
      transmission: 0.75,
      side: THREE.DoubleSide
    });
    const lowerGlass = new THREE.Mesh(lowerGlassGeo, glassMat);
    lowerGlass.position.set(0, 1.8, 4);
    arcGroup.add(lowerGlass);

    // Neon illuminated handrail
    const lowerHandrailGeo = new THREE.TorusGeometry(38.8, 0.07, 8, 48, Math.PI * 0.76);
    const neonRailMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const lowerHandrail = new THREE.Mesh(lowerHandrailGeo, neonRailMat);
    lowerHandrail.rotation.x = Math.PI / 2;
    lowerHandrail.rotation.z = Math.PI * 0.62;
    lowerHandrail.position.set(0, 2.35, 4);
    arcGroup.add(lowerHandrail);

    // 2. Club Mezzanine Balcony Ring
    const clubBalconyGeo = new THREE.BoxGeometry(46, 1.2, 12);
    const clubMat = new THREE.MeshStandardMaterial({
      color: 0x1c2436,
      roughness: 0.5,
      metalness: 0.4
    });
    const clubBalcony = new THREE.Mesh(clubBalconyGeo, clubMat);
    clubBalcony.position.set(0, 7.8, 27);
    arcGroup.add(clubBalcony);

    // Club VIP Glass Railing
    const railGeo = new THREE.BoxGeometry(46, 1.4, 0.2);
    const clubGlassRail = new THREE.Mesh(railGeo, glassMat);
    clubGlassRail.position.set(0, 9.1, 21);
    arcGroup.add(clubGlassRail);

    // 3. Upper Skyline Balcony Riser
    const upperTierGeo = new THREE.CylinderGeometry(76, 60, 10, 36, 1, true, -Math.PI * 0.4, Math.PI * 0.8);
    const upperTier = new THREE.Mesh(upperTierGeo, concreteMat);
    upperTier.position.set(0, 16, 26);
    upperTier.receiveShadow = true;
    arcGroup.add(upperTier);

    // Upper Balcony Glass Railing
    const upperGlassGeo = new THREE.CylinderGeometry(60.8, 60.8, 1.2, 36, 1, true, -Math.PI * 0.38, Math.PI * 0.76);
    const upperGlass = new THREE.Mesh(upperGlassGeo, glassMat);
    upperGlass.position.set(0, 12.2, 26);
    arcGroup.add(upperGlass);

    // Arena Perimeter Enclosure & Glow Ring
    const perimeterGeo = new THREE.CylinderGeometry(86, 86, 40, 48, 1, true);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e17,
      roughness: 0.9,
      side: THREE.BackSide
    });
    const wall = new THREE.Mesh(perimeterGeo, wallMat);
    wall.position.set(0, 18, 5);
    arcGroup.add(wall);

    // Upper Ring Neon Accent
    const ringGeo = new THREE.TorusGeometry(85, 0.4, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 36, 5);
    arcGroup.add(ring);

    this.scene.add(arcGroup);
  }

  buildSeats(seatsData) {
    const seatWidth = 1.1;

    // Smoother, ergonomically contoured beveled seat geometries (Instantiated once, shared across all seats)
    const cushionGeo = createRoundedBox(1.02, 0.82, 0.22, 0.04, 2);
    cushionGeo.rotateX(-Math.PI / 2); // Orient horizontally

    const backrestGeo = createRoundedBox(1.02, 0.78, 0.16, 0.04, 2);
    const armrestGeo = createRoundedBox(0.1, 0.07, 0.62, 0.02, 1);
    const supportPostGeo = new THREE.CylinderGeometry(0.025, 0.035, 0.22, 6);
    const pedestalGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.32, 8);
    const basePlateGeo = new THREE.BoxGeometry(0.28, 0.04, 0.28);

    // Shared Materials
    this.seatMaterials = {
      vip: new THREE.MeshStandardMaterial({ color: TIERS.vip.threeColor, roughness: 0.35, metalness: 0.25 }),
      premium: new THREE.MeshStandardMaterial({ color: TIERS.premium.threeColor, roughness: 0.38, metalness: 0.2 }),
      pit: new THREE.MeshStandardMaterial({ color: TIERS.pit.threeColor, roughness: 0.38, metalness: 0.2 }),
      standard: new THREE.MeshStandardMaterial({ color: TIERS.standard.threeColor, roughness: 0.42, metalness: 0.15 }),
      booked: new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0x7f1d1d,
        emissiveIntensity: 0.5,
        roughness: 0.4,
        metalness: 0.2
      }),
      bookedHover: new THREE.MeshStandardMaterial({
        color: 0xf87171,
        emissive: 0xef4444,
        emissiveIntensity: 0.7,
        roughness: 0.3
      }),
      reserved: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 }),
      filteredOut: new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        transparent: true,
        opacity: 0.18,
        roughness: 0.9,
        depthWrite: false
      }),
      selected: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x00f2fe,
        emissiveIntensity: 0.85,
        roughness: 0.1
      }),
      hovered: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.55,
        roughness: 0.2
      })
    };

    const armrestMat = new THREE.MeshStandardMaterial({ color: 0x141b29, roughness: 0.65, metalness: 0.3 });
    const metalSupportMat = new THREE.MeshStandardMaterial({ color: 0x222d42, roughness: 0.3, metalness: 0.8 });

    seatsData.forEach(seatData => {
      const seatGroup = new THREE.Group();
      
      const mat = seatData.status === 'booked' 
        ? this.seatMaterials.booked 
        : this.seatMaterials[seatData.tier];

      // 1. Contoured Cushion
      const cushion = new THREE.Mesh(cushionGeo, mat);
      cushion.position.y = 0.35;
      cushion.castShadow = true;
      seatGroup.add(cushion);

      // 2. Contoured Reclined Backrest
      const backrest = new THREE.Mesh(backrestGeo, mat);
      backrest.position.set(0, 0.72, -0.34);
      backrest.rotation.x = -0.14; // Natural ergonomic theater recline
      seatGroup.add(backrest);

      // 3. Ergonomic Armrests (Left and Right)
      [-seatWidth / 2 + 0.05, seatWidth / 2 - 0.05].forEach(ax => {
        const arm = new THREE.Mesh(armrestGeo, armrestMat);
        arm.position.set(ax, 0.48, -0.05);
        seatGroup.add(arm);

        const post = new THREE.Mesh(supportPostGeo, metalSupportMat);
        post.position.set(ax, 0.35, -0.05);
        seatGroup.add(post);
      });

      // 4. Sturdy Center Pedestal & Floor Mounting Plate
      const pedestal = new THREE.Mesh(pedestalGeo, metalSupportMat);
      pedestal.position.set(0, 0.16, -0.05);
      seatGroup.add(pedestal);

      const basePlate = new THREE.Mesh(basePlateGeo, metalSupportMat);
      basePlate.position.set(0, 0.02, -0.05);
      seatGroup.add(basePlate);

      // Position in 3D arena
      seatGroup.position.set(seatData.position.x, seatData.position.y, seatData.position.z);

      // Orient seat naturally toward center stage
      const stagePos = new THREE.Vector3(STAGE_CONFIG.position.x, seatData.position.y, STAGE_CONFIG.position.z);
      seatGroup.lookAt(stagePos);

      // Metadata for raycasting and selection
      seatGroup.userData = {
        isSeat: true,
        seatData: seatData,
        cushionMesh: cushion,
        backrestMesh: backrest,
        defaultMat: mat,
        tier: seatData.tier,
        status: seatData.status
      };

      this.scene.add(seatGroup);
      this.seatMeshes.push(seatGroup);
    });
  }

  buildLightingRig() {
    const spotlightPositions = [
      { x: -16, y: 22, z: -10, color: 0x00f2fe },
      { x: 16, y: 22, z: -10, color: 0xa855f7 },
      { x: -28, y: 26, z: 8, color: 0xffd700 },
      { x: 28, y: 26, z: 8, color: 0x00f2fe },
      { x: 0, y: 30, z: -18, color: 0xff007f }
    ];

    spotlightPositions.forEach((spot, idx) => {
      const light = new THREE.SpotLight(spot.color, 450);
      light.position.set(spot.x, spot.y, spot.z);
      light.target.position.set(STAGE_CONFIG.position.x, STAGE_CONFIG.position.y, STAGE_CONFIG.position.z);
      light.angle = Math.PI / 7;
      light.penumbra = 0.45;
      light.decay = 1.8;
      light.distance = 90;
      light.castShadow = false; // Preserves high FPS
      this.scene.add(light);
      this.scene.add(light.target);
      this.spotlights.push(light);

      // Volumetric light beam cone
      const beamGeo = new THREE.ConeGeometry(8, 38, 16, 1, true);
      beamGeo.translate(0, -19, 0);
      beamGeo.rotateX(Math.PI / 2);

      const beamMat = new THREE.MeshBasicMaterial({
        color: spot.color,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.copy(light.position);
      beam.lookAt(STAGE_CONFIG.position.x, STAGE_CONFIG.position.y, STAGE_CONFIG.position.z);
      this.scene.add(beam);
      this.lightBeams.push({ mesh: beam, light: light, initialTarget: { ...STAGE_CONFIG.position }, seed: idx * 1.5 });
    });
  }

  update(time) {
    // 1. Throttle LED Screen Canvas update to ~24fps (saves GPU texture re-upload overhead)
    if (this.ledCtx && this.screenTexture && (time - this.lastLedTime > 42)) {
      this.drawLedCanvas(this.ledCtx, time);
      this.screenTexture.needsUpdate = true;
      this.lastLedTime = time;
    }

    // 2. Animate Concert Moving Beams
    this.lightBeams.forEach(item => {
      const t = time * 0.0012 + item.seed;
      const sweepX = Math.sin(t) * 12;
      const sweepZ = Math.cos(t * 0.8) * 8;
      
      item.light.target.position.set(
        item.initialTarget.x + sweepX,
        item.initialTarget.y + Math.sin(t * 1.4) * 2,
        item.initialTarget.z + sweepZ
      );
      item.light.target.updateMatrixWorld();
      item.mesh.lookAt(item.light.target.position);
    });
  }

  setAtmosphereMode(isConcertMode) {
    this.lightBeams.forEach(b => {
      b.mesh.visible = isConcertMode;
      b.light.intensity = isConcertMode ? 450 : 80;
    });
  }

  highlightSeat(seatGroup, state) {
    if (!seatGroup || !seatGroup.userData) return;
    const { cushionMesh, backrestMesh, defaultMat, status } = seatGroup.userData;

    let targetMat = defaultMat;
    if (state === 'selected') {
      targetMat = this.seatMaterials.selected;
    } else if (state === 'hover') {
      targetMat = status === 'booked' ? this.seatMaterials.bookedHover : this.seatMaterials.hovered;
    } else if (state === 'filtered-out') {
      targetMat = this.seatMaterials.filteredOut;
    }

    if (cushionMesh) cushionMesh.material = targetMat;
    if (backrestMesh) backrestMesh.material = targetMat;
  }
}
