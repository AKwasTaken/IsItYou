class TouchRandomizer {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('touchCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // Touch tracking
        this.touches = new Map();
        this.selectedTouch = null;
        
        // Animation states
        this.isScreenGlowing = false;
        this.screenGlowAlpha = 0;
        this.glowDirection = 1;
        this.glowCount = 0;
        
        // Fade states
        this.fadeProgress = 1;
        this.isFading = false;
        
        // Timers
        this.initialTimer = null;
        this.selectionTimer = null;
        this.fadeTimer = null;

        // Setup
        this.setupEventListeners();
        this.setupFullscreen();
        this.setupRefresh();
        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }

    setupFullscreen() {
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
            fullscreenBtn.style.display = 'flex';
            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            });
        } else {
            fullscreenBtn.style.display = 'none';
        }
    }

    setupRefresh() {
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.addEventListener('click', () => this.reset());
    }

    handleTouchStart(e) {
        e.preventDefault();
        Array.from(e.changedTouches).forEach(touch => {
            this.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY
            });
        });

        // Start the initial timer if this is the first touch
        if (this.touches.size === e.changedTouches.length) {
            this.startInitialTimer();
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        Array.from(e.changedTouches).forEach(touch => {
            if (this.touches.has(touch.identifier)) {
                const touchData = this.touches.get(touch.identifier);
                touchData.x = touch.clientX;
                touchData.y = touch.clientY;
            }
        });
    }

    handleTouchEnd(e) {
        e.preventDefault();
        Array.from(e.changedTouches).forEach(touch => {
            this.touches.delete(touch.identifier);
        });

        // Reset everything if a finger is lifted
        this.reset();
        
        // Restart if there are still fingers
        if (this.touches.size > 0) {
            this.startInitialTimer();
        }
    }

    startInitialTimer() {
        this.clearTimers();
        this.initialTimer = setTimeout(() => {
            this.startScreenGlow();
        }, 2000);
    }

    startScreenGlow() {
        this.isScreenGlowing = true;
        this.glowCount = 0;
        this.screenGlowAlpha = 0;
        this.glowDirection = 1;
        this.animateGlow();
    }

    animateGlow() {
        if (!this.isScreenGlowing) return;

        this.screenGlowAlpha += 0.05 * this.glowDirection;

        if (this.screenGlowAlpha >= 1) {
            this.screenGlowAlpha = 1;
            this.glowDirection = -1;
        } else if (this.screenGlowAlpha <= 0) {
            this.screenGlowAlpha = 0;
            this.glowDirection = 1;
            this.glowCount++;

            if (this.glowCount >= 3) {
                this.isScreenGlowing = false;
                this.selectRandomTouch();
                return;
            }
        }

        requestAnimationFrame(() => this.animateGlow());
    }

    selectRandomTouch() {
        if (this.touches.size === 0) return;

        const touchIds = Array.from(this.touches.keys());
        this.selectedTouch = touchIds[Math.floor(Math.random() * touchIds.length)];
        this.isFading = false;
        this.fadeProgress = 1;

        // Keep selection for 3 seconds
        this.selectionTimer = setTimeout(() => {
            this.isFading = true;
            this.fadeProgress = 1;
            
            const fadeOut = () => {
                if (this.fadeProgress > 0) {
                    this.fadeProgress -= 0.02;
                    requestAnimationFrame(fadeOut);
                } else {
                    this.selectedTouch = null;
                    this.isFading = false;
                    this.fadeProgress = 1;
                    
                    if (this.touches.size > 0) {
                        this.startInitialTimer();
                    }
                }
            };
            
            requestAnimationFrame(fadeOut);
        }, 3000);
    }

    clearTimers() {
        if (this.initialTimer) clearTimeout(this.initialTimer);
        if (this.selectionTimer) clearTimeout(this.selectionTimer);
        if (this.fadeTimer) clearTimeout(this.fadeTimer);
    }

    reset() {
        this.clearTimers();
        this.isScreenGlowing = false;
        this.screenGlowAlpha = 0;
        this.glowCount = 0;
        this.selectedTouch = null;
    }

    drawCircle(x, y, isSelected) {
        this.ctx.save();
        
        if (isSelected) {
            const fadeIntensity = this.isFading ? this.fadeProgress : 1;
            
            // Create gradient for the glow
            const gradient = this.ctx.createRadialGradient(
                x, y, 30,  // Inner circle
                x, y, 90   // Outer circle
            );
            
            // Add gradient stops with fade
            gradient.addColorStop(0, `rgba(255, 215, 0, ${0.9 * fadeIntensity})`);
            gradient.addColorStop(0.4, `rgba(255, 215, 0, ${0.6 * fadeIntensity})`);
            gradient.addColorStop(0.7, `rgba(255, 215, 0, ${0.3 * fadeIntensity})`);
            gradient.addColorStop(1, `rgba(255, 215, 0, ${0.1 * fadeIntensity})`);

            // Draw the gradient glow
            this.ctx.beginPath();
            this.ctx.arc(x, y, 90, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Add a subtle inner glow
            const innerGradient = this.ctx.createRadialGradient(
                x, y, 0,    // Inner circle
                x, y, 50    // Outer circle
            );
            innerGradient.addColorStop(0, `rgba(255, 255, 255, ${0.3 * fadeIntensity})`);
            innerGradient.addColorStop(1, `rgba(255, 215, 0, ${0.1 * fadeIntensity})`);

            this.ctx.beginPath();
            this.ctx.arc(x, y, 50, 0, Math.PI * 2);
            this.ctx.fillStyle = innerGradient;
            this.ctx.fill();

            // Add a subtle outer ring
            this.ctx.beginPath();
            this.ctx.arc(x, y, 50, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 * fadeIntensity})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        } else {
            // Regular circle with subtle glow
            const regularGradient = this.ctx.createRadialGradient(
                x, y, 40,   // Inner circle
                x, y, 50    // Outer circle
            );
            regularGradient.addColorStop(0, 'rgba(76, 175, 80, 0.8)');
            regularGradient.addColorStop(1, 'rgba(76, 175, 80, 0)');

            this.ctx.beginPath();
            this.ctx.arc(x, y, 50, 0, Math.PI * 2);
            this.ctx.strokeStyle = regularGradient;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw screen glow
        if (this.isScreenGlowing) {
            this.ctx.save();
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.2 * this.screenGlowAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }

        // Draw touches
        this.touches.forEach((touchData, id) => {
            this.drawCircle(touchData.x, touchData.y, id === this.selectedTouch);
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize the app
window.addEventListener('load', () => {
    new TouchRandomizer();
}); 