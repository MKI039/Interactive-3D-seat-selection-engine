/**
 * Venue Configuration and Procedural Seat Generation Data
 */

export const STAGE_CONFIG = {
  position: { x: 0, y: 1.2, z: -35 },
  size: { width: 32, depth: 18, height: 2.4 },
  ledScreen: { width: 28, height: 12, z: -43.8 }
};

export const TIERS = {
  vip: {
    id: 'vip',
    name: 'VIP Diamond',
    color: '#ffd700',
    threeColor: 0xffd700,
    basePrice: 350,
    perks: 'Complimentary Champagne, Front-Stage Vantage, Dedicated Lounge'
  },
  premium: {
    id: 'premium',
    name: 'Premium Lower',
    color: '#a855f7',
    threeColor: 0xa855f7,
    basePrice: 195,
    perks: 'Direct Center Sightlines, Padded Club Seats'
  },
  pit: {
    id: 'pit',
    name: 'Floor GA Pit',
    color: '#38ef7d',
    threeColor: 0x38ef7d,
    basePrice: 145,
    perks: 'Standing Pit Directly Adjacent to Performer Stage'
  },
  standard: {
    id: 'standard',
    name: 'Upper Balcony',
    color: '#38bdf8',
    threeColor: 0x38bdf8,
    basePrice: 85,
    perks: 'Panoramic Arena Vantage with Acoustic Balancing'
  }
};

export const SECTIONS_CONFIG = [
  {
    id: 'SEC-PIT',
    name: 'Floor Pit (GA)',
    tier: 'pit',
    hudPosition: { x: 0, y: 2, z: -18 },
    cameraTarget: { x: 0, y: 0.5, z: -18 },
    cameraPos: { x: 0, y: 12, z: -2 }
  },
  {
    id: 'SEC-102',
    name: 'Sec 102 - Lower Center (VIP)',
    tier: 'vip',
    hudPosition: { x: 0, y: 5.5, z: 10 },
    cameraTarget: { x: 0, y: 3, z: 8 },
    cameraPos: { x: 0, y: 16, z: 28 }
  },
  {
    id: 'SEC-101',
    name: 'Sec 101 - Lower West Wing',
    tier: 'premium',
    hudPosition: { x: -26, y: 6.5, z: -6 },
    cameraTarget: { x: -22, y: 4, z: -8 },
    cameraPos: { x: -40, y: 18, z: 12 }
  },
  {
    id: 'SEC-103',
    name: 'Sec 103 - Lower East Wing',
    tier: 'premium',
    hudPosition: { x: 26, y: 6.5, z: -6 },
    cameraTarget: { x: 22, y: 4, z: -8 },
    cameraPos: { x: 40, y: 18, z: 12 }
  },
  {
    id: 'SEC-VIP-CLUB',
    name: 'Club Mezzanine & Suites',
    tier: 'vip',
    hudPosition: { x: 0, y: 11, z: 28 },
    cameraTarget: { x: 0, y: 9, z: 26 },
    cameraPos: { x: 0, y: 20, z: 46 }
  },
  {
    id: 'SEC-202',
    name: 'Sec 202 - Upper Skyline',
    tier: 'standard',
    hudPosition: { x: 0, y: 18, z: 48 },
    cameraTarget: { x: 0, y: 16, z: 46 },
    cameraPos: { x: 0, y: 32, z: 68 }
  },
  {
    id: 'SEC-201',
    name: 'Sec 201 - Upper West Terrace',
    tier: 'standard',
    hudPosition: { x: -38, y: 18, z: 18 },
    cameraTarget: { x: -34, y: 16, z: 16 },
    cameraPos: { x: -55, y: 30, z: 36 }
  },
  {
    id: 'SEC-203',
    name: 'Sec 203 - Upper East Terrace',
    tier: 'standard',
    hudPosition: { x: 38, y: 18, z: 18 },
    cameraTarget: { x: 34, y: 16, z: 16 },
    cameraPos: { x: 55, y: 30, z: 36 }
  }
];

/**
 * Procedurally generates realistic individual seat coordinates, rows, and sightline statistics.
 */
export function generateVenueSeats() {
  const seats = [];
  let seatIdCounter = 1;

  // 1. Floor Pit (Standing / High-top pods)
  const pitRows = ['P1', 'P2', 'P3', 'P4'];
  pitRows.forEach((row, rIdx) => {
    const seatCount = 10;
    const zOffset = -24 + rIdx * 3.5;
    for (let i = 0; i < seatCount; i++) {
      const xOffset = (i - (seatCount - 1) / 2) * 2.2;
      const pos = { x: xOffset, y: 0.6, z: zOffset };
      const dist = calculateDistance(pos, STAGE_CONFIG.position);
      const isBooked = (rIdx === 0 && (i === 0 || i === 9)) || (rIdx === 2 && i === 4);
      seats.push({
        id: `seat-${seatIdCounter++}`,
        sectionId: 'SEC-PIT',
        sectionName: 'Floor Pit (GA)',
        tier: 'pit',
        row: row,
        number: i + 1,
        position: pos,
        price: 145,
        status: isBooked ? 'booked' : 'available',
        sightlineScore: 99,
        distance: Math.round(dist * 10) / 10
      });
    }
  });

  // 2. Section 102 (Lower Bowl Center - VIP / Premium)
  const sec102Rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  sec102Rows.forEach((row, rIdx) => {
    const seatCount = 12;
    const yOffset = 1.8 + rIdx * 0.9;
    const zOffset = 3 + rIdx * 2.4;
    const isVip = rIdx < 3;
    const tier = isVip ? 'vip' : 'premium';
    const price = isVip ? 350 : 250;

    for (let i = 0; i < seatCount; i++) {
      const angle = ((i - (seatCount - 1) / 2) / (seatCount - 1)) * 0.5;
      const xOffset = Math.sin(angle) * 16;
      const actualZ = zOffset + Math.cos(angle) * 2;
      const pos = { x: xOffset, y: yOffset, z: actualZ };
      const dist = calculateDistance(pos, STAGE_CONFIG.position);

      const isBooked = (rIdx === 0 && (i === 0 || i === 11)) || 
                       (rIdx === 1 && (i === 1 || i === 10)) || 
                       (rIdx === 3 && (i === 5 || i === 6));

      seats.push({
        id: `seat-${seatIdCounter++}`,
        sectionId: 'SEC-102',
        sectionName: 'Sec 102 - Lower Center',
        tier: tier,
        row: row,
        number: i + 1,
        position: pos,
        price: price,
        status: isBooked ? 'booked' : 'available',
        sightlineScore: Math.round(98 - rIdx * 1.5),
        distance: Math.round(dist * 10) / 10
      });
    }
  });

  // 3. Section 101 & 103 (Lower Bowl Wings - angled toward stage)
  ['SEC-101', 'SEC-103'].forEach(secId => {
    const isWest = secId === 'SEC-101';
    const rows = ['A', 'B', 'C', 'D', 'E'];
    rows.forEach((row, rIdx) => {
      const seatCount = 8;
      const yOffset = 2.0 + rIdx * 0.9;
      for (let i = 0; i < seatCount; i++) {
        const sideSign = isWest ? -1 : 1;
        const radialDist = 18 + rIdx * 2.2;
        const angle = (isWest ? Math.PI * 0.65 : Math.PI * 0.35) + (i - (seatCount - 1) / 2) * 0.08;
        const pos = {
          x: Math.cos(angle) * radialDist * 1.3,
          y: yOffset,
          z: Math.sin(angle) * radialDist - 12
        };
        const dist = calculateDistance(pos, STAGE_CONFIG.position);

        const isBooked = (rIdx === 1 && (i === 0 || i === 7)) || (rIdx === 3 && i === 4);
        seats.push({
          id: `seat-${seatIdCounter++}`,
          sectionId: secId,
          sectionName: isWest ? 'Sec 101 - Lower West' : 'Sec 103 - Lower East',
          tier: 'premium',
          row: row,
          number: i + 1,
          position: pos,
          price: 195,
          status: isBooked ? 'booked' : 'available',
          sightlineScore: Math.round(91 - rIdx * 2),
          distance: Math.round(dist * 10) / 10
        });
      }
    });
  });

  // 4. Club Mezzanine Suites (VIP Elevated)
  const clubRows = ['Suite 1', 'Suite 2'];
  clubRows.forEach((row, rIdx) => {
    const seatCount = 10;
    const yOffset = 8.5 + rIdx * 1.2;
    const zOffset = 25 + rIdx * 3.5;
    for (let i = 0; i < seatCount; i++) {
      const xOffset = (i - (seatCount - 1) / 2) * 3.2;
      const pos = { x: xOffset, y: yOffset, z: zOffset };
      const dist = calculateDistance(pos, STAGE_CONFIG.position);
      const isBooked = (rIdx === 0 && (i === 0 || i === 9));

      seats.push({
        id: `seat-${seatIdCounter++}`,
        sectionId: 'SEC-VIP-CLUB',
        sectionName: 'Club Mezzanine Suite',
        tier: 'vip',
        row: row,
        number: i + 1,
        position: pos,
        price: 350,
        status: isBooked ? 'booked' : 'available',
        sightlineScore: 95,
        distance: Math.round(dist * 10) / 10
      });
    }
  });

  // 5. Upper Balcony (Sec 202 Center Skyline)
  const balconyRows = ['AA', 'BB', 'CC', 'DD'];
  balconyRows.forEach((row, rIdx) => {
    const seatCount = 14;
    const yOffset = 15.0 + rIdx * 1.2;
    const zOffset = 42 + rIdx * 2.8;
    for (let i = 0; i < seatCount; i++) {
      const angle = ((i - (seatCount - 1) / 2) / (seatCount - 1)) * 0.6;
      const xOffset = Math.sin(angle) * 35;
      const actualZ = zOffset + Math.cos(angle) * 4;
      const pos = { x: xOffset, y: yOffset, z: actualZ };
      const dist = calculateDistance(pos, STAGE_CONFIG.position);
      const isBooked = (rIdx === 0 && (i === 1 || i === 12)) || (rIdx === 2 && (i === 6 || i === 7));

      seats.push({
        id: `seat-${seatIdCounter++}`,
        sectionId: 'SEC-202',
        sectionName: 'Sec 202 - Upper Skyline',
        tier: 'standard',
        row: row,
        number: i + 1,
        position: pos,
        price: 85,
        status: isBooked ? 'booked' : 'available',
        sightlineScore: Math.round(86 - rIdx * 2),
        distance: Math.round(dist * 10) / 10
      });
    }
  });

  return seats;
}

function calculateDistance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
