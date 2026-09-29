import anime from 'animejs';

export class BookingDrawer {
  constructor({ onRemoveSeat, onCheckout, onExitPov }) {
    this.selectedSeats = new Map(); // id -> seatData
    this.previousTotal = 0;

    this.cartCountEl = document.getElementById('cart-count');
    this.selectedPillsEl = document.getElementById('selected-seats-pills');
    this.totalPriceEl = document.getElementById('total-price');
    this.checkoutBtn = document.getElementById('btn-checkout');

    // Tooltip elements
    this.tooltipEl = document.getElementById('seat-tooltip');
    this.ttTier = document.getElementById('tt-tier');
    this.ttStatus = document.getElementById('tt-status');
    this.ttTitle = document.getElementById('tt-title');
    this.ttSightline = document.getElementById('tt-sightline');
    this.ttDistance = document.getElementById('tt-distance');
    this.ttPrice = document.getElementById('tt-price');

    // POV card elements
    this.povOverlay = document.getElementById('pov-overlay');
    this.povSeatLabel = document.getElementById('pov-seat-label');
    this.povDistance = document.getElementById('pov-distance');
    this.povSightline = document.getElementById('pov-sightline');
    this.povElevation = document.getElementById('pov-elevation');
    this.btnExitPov = document.getElementById('btn-exit-pov');

    // Checkout modal elements
    this.checkoutModal = document.getElementById('checkout-modal');
    this.ticketList = document.getElementById('ticket-list');
    this.modalSubtotal = document.getElementById('modal-subtotal');
    this.modalGrandTotal = document.getElementById('modal-grand-total');
    this.btnCloseModal = document.getElementById('btn-close-modal');
    this.btnConfirmOrder = document.getElementById('btn-confirm-order');

    this.onRemoveSeat = onRemoveSeat;
    this.onCheckout = onCheckout;
    this.onExitPov = onExitPov;

    this.bindEvents();
  }

  bindEvents() {
    this.checkoutBtn.addEventListener('click', () => this.openCheckout());
    this.btnCloseModal.addEventListener('click', () => this.closeCheckout());
    this.btnExitPov.addEventListener('click', () => {
      if (this.onExitPov) this.onExitPov();
    });

    this.btnConfirmOrder.addEventListener('click', () => {
      this.btnConfirmOrder.innerHTML = '<span>Processing VIP Passes...</span>';
      setTimeout(() => {
        this.btnConfirmOrder.innerHTML = '<span>✓ Tickets Confirmed & Sent to Wallet!</span>';
        this.btnConfirmOrder.style.background = '#38ef7d';
        setTimeout(() => {
          this.closeCheckout();
          this.clearSelection();
          this.btnConfirmOrder.innerHTML = '<span>Confirm & Issue Digital Passes</span>';
          this.btnConfirmOrder.style.background = '';
        }, 2200);
      }, 1000);
    });
  }

  toggleSeat(seatData, meshGroup) {
    if (this.selectedSeats.has(seatData.id)) {
      this.selectedSeats.delete(seatData.id);
    } else {
      this.selectedSeats.set(seatData.id, { data: seatData, mesh: meshGroup });
    }
    this.updateUI();
  }

  isSeatSelected(seatId) {
    return this.selectedSeats.has(seatId);
  }

  updateUI() {
    const count = this.selectedSeats.size;
    this.cartCountEl.textContent = count;

    // Calculate total price
    let total = 0;
    this.selectedSeats.forEach(({ data }) => {
      total += data.price;
    });

    // Animate price counter with Anime.js
    const counterObj = { val: this.previousTotal };
    anime({
      targets: counterObj,
      val: total,
      round: 1,
      duration: 650,
      easing: 'easeOutCubic',
      update: () => {
        this.totalPriceEl.textContent = `$${counterObj.val.toLocaleString()}`;
      }
    });
    this.previousTotal = total;

    // Enable/disable checkout button
    this.checkoutBtn.disabled = count === 0;

    // Render pills
    this.selectedPillsEl.innerHTML = '';
    if (count === 0) {
      this.selectedPillsEl.innerHTML = '<span class="no-selection-hint">Click any available 3D seat to add to your order</span>';
      return;
    }

    this.selectedSeats.forEach(({ data, mesh }) => {
      const pill = document.createElement('div');
      pill.className = 'seat-pill';
      pill.innerHTML = `
        <span>${data.sectionName} • ${data.row}-${data.number}</span>
        <button class="remove-seat-btn" title="Remove seat">✕</button>
      `;

      pill.querySelector('.remove-seat-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onRemoveSeat) {
          this.onRemoveSeat(data, mesh);
        }
      });

      this.selectedPillsEl.appendChild(pill);
    });

    // Animate pills container with Anime.js stagger
    anime({
      targets: '.seat-pill',
      scale: [0.85, 1],
      opacity: [0, 1],
      delay: anime.stagger(60),
      duration: 350,
      easing: 'easeOutBack'
    });
  }

  clearSelection() {
    this.selectedSeats.clear();
    this.updateUI();
  }

  showTooltip(seatData, screenPos) {
    const isBooked = seatData.status === 'booked';
    this.ttTier.textContent = seatData.tier.toUpperCase();
    this.ttStatus.textContent = isBooked ? 'BOOKED' : 'AVAILABLE';
    this.ttStatus.style.color = isBooked ? '#ef4444' : '#38ef7d';
    this.ttTitle.textContent = `${seatData.sectionName} • Row ${seatData.row} • Seat ${seatData.number}`;
    this.ttSightline.textContent = `${seatData.sightlineScore}%`;
    this.ttDistance.textContent = `${seatData.distance}m`;
    this.ttPrice.textContent = `$${seatData.price}`;

    const hintEl = this.tooltipEl.querySelector('.tooltip-hint');
    if (hintEl) {
      hintEl.textContent = isBooked ? 'Seat is already booked by another guest' : 'Click to select & experience POV';
      hintEl.style.color = isBooked ? '#f87171' : 'var(--text-secondary)';
    }

    this.tooltipEl.style.left = `${screenPos.x}px`;
    this.tooltipEl.style.top = `${screenPos.y}px`;
    this.tooltipEl.classList.remove('hidden');
  }

  hideTooltip() {
    this.tooltipEl.classList.add('hidden');
  }

  showPovCard(seatData) {
    this.povSeatLabel.textContent = `${seatData.sectionName} • Row ${seatData.row} • Seat ${seatData.number}`;
    this.povDistance.textContent = `${seatData.distance} m`;
    this.povSightline.textContent = `${seatData.sightlineScore}% Direct`;
    
    // Calculate vertical sightline elevation
    const elevation = Math.round(Math.atan2(seatData.position.y - 1.2, seatData.distance) * (180 / Math.PI));
    this.povElevation.textContent = `${elevation >= 0 ? '+' : ''}${elevation}°`;

    this.povOverlay.classList.remove('hidden');
    anime({
      targets: this.povOverlay,
      opacity: [0, 1],
      translateY: [-15, 0],
      duration: 400,
      easing: 'easeOutCubic'
    });
  }

  hidePovCard() {
    anime({
      targets: this.povOverlay,
      opacity: [1, 0],
      translateY: [0, -15],
      duration: 300,
      easing: 'easeInCubic',
      complete: () => {
        this.povOverlay.classList.add('hidden');
      }
    });
  }

  openCheckout() {
    if (this.selectedSeats.size === 0) return;

    this.ticketList.innerHTML = '';
    let subtotal = 0;

    this.selectedSeats.forEach(({ data }) => {
      subtotal += data.price;
      const card = document.createElement('div');
      card.className = 'ticket-card';
      card.innerHTML = `
        <div class="ticket-card-left">
          <span class="ticket-tier">${data.tier.toUpperCase()} TIER PASS</span>
          <span class="ticket-seat-label">${data.sectionName} • Row ${data.row}, Seat ${data.number}</span>
          <span class="ticket-sub">Sightline Score: ${data.sightlineScore}% • Gate 4 Entry</span>
        </div>
        <div class="ticket-price-tag">$${data.price}</div>
      `;
      this.ticketList.appendChild(card);
    });

    const fee = 12.50;
    const grandTotal = subtotal + fee;

    this.modalSubtotal.textContent = `$${subtotal.toLocaleString()}`;
    this.modalGrandTotal.textContent = `$${grandTotal.toLocaleString()}`;

    this.checkoutModal.classList.remove('hidden');
    anime({
      targets: '.checkout-modal-card',
      scale: [0.92, 1],
      opacity: [0, 1],
      duration: 350,
      easing: 'easeOutBack'
    });
  }

  closeCheckout() {
    anime({
      targets: '.checkout-modal-card',
      scale: [1, 0.95],
      opacity: [1, 0],
      duration: 250,
      easing: 'easeInQuad',
      complete: () => {
        this.checkoutModal.classList.add('hidden');
      }
    });
  }
}
