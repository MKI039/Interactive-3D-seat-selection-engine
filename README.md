# Interactive 3D Seat & Venue Selection Engine

An interactive, high-performance web application designed for concert venues, sports stadiums, and entertainment arenas. Built with **Three.js (WebGL)** for real-time 3D arena modeling and **Anime.js** for camera choreography and UI micro-interactions.

---

## Key Features

- **Procedural 3D Arena Architecture:**
  - Multi-tier seating bowl: Floor Pit (GA), Lower Bowl (Sec 101, 102, 103), Club Mezzanine Suites, and Upper Skyline Balcony.
  - Stage catwalk runway extending into the Floor Pit with illuminated edge strips.
  - Dynamic concert lighting rig with moving spotlights and suspended overhead truss arches.
  - Front-Of-House (FOH) sound & visual engineering console.
  - Tempered glass railings with glowing handrails.

- **Anime.js Camera Choreography:**
  - **Seat POV Mode:** First-person seat simulation placing the camera at the exact eye-level of any selected seat, looking directly at center stage with real-time distance, elevation angle, and sightline scoring.
  - **360° Look-Around:** Smooth pitch and yaw head rotation allowing users to inspect the venue atmosphere directly from their seat.
  - **Division Centering:** Clicking any seat tier in the control panel swoops the camera to center that specific section.

- **Interactive Seat Map & Cart:**
  - **Red Booked Seats:** Booked seats are styled in crimson red (`#ef4444`) with tooltip warnings.
  - **Tier Color Coding:** Available seats reflect their tier colors (Gold for VIP Diamond, Purple for Premium Lower, Green for Floor Pit, Cyan for Upper Balcony).
  - **Animated Price Counter:** Anime.js number interpolation animating the cart total in real time.
  - **Digital Ticket Pass:** Reservation checkout modal previewing issued passes.

- **Graphics & Performance Optimizations:**
  - Solid 60+ FPS performance via shared instanced geometries and materials.
  - Throttled raycasting with `requestAnimationFrame`.
  - Throttled LED video screen re-uploads (~24 FPS).
  - High-efficiency shadow map configuration.

---

## Tech Stack

- **3D Engine:** [Three.js](https://threejs.org/)
- **Motion & Easing:** [Anime.js](https://animejs.com/)
- **Tooling & Bundler:** [Vite](https://vitejs.dev/)
- **Styling:** Modern Vanilla CSS (Glassmorphic design system)

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Installation
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Navigate to directory
cd "Project alpha"

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be running at `http://localhost:3000/`.

### Production Build
```bash
npm run build
```
The optimized bundle will be created inside the `dist/` directory.

---

## License
MIT
