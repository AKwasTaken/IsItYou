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
        this.isBlinking = false;
        this.blinkAlpha = 0;
        this.blinkDirection = 1;
        this.blinkCount = 0;
        this.fadeProgress = 1;
        this.isFading = false;
        
        // Colors
        this.colors = {
            background: '#1a1a2e',  // Deep navy
            circle: '#4a90e2',      // Bright blue
            glow: '#ffd700',        // Gold
            accent: '#e74c3c'       // Coral red
        };
        
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
        document.body.style.backgroundColor = this.colors.background;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
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
        refreshBtn.addEventListener('click', () => {
            this.touches.clear();
            this.reset();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        });
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
            this.startBlinking();
        }, 2000);
    }

    startBlinking() {
        if (this.touches.size === 0) return;
        
        this.isBlinking = true;
        this.blinkCount = 0;
        this.blinkAlpha = 0;
        this.blinkDirection = 1;
        this.animateBlink();
    }

    animateBlink() {
        if (!this.isBlinking) return;

        this.blinkAlpha += 0.05 * this.blinkDirection;

        if (this.blinkAlpha >= 1) {
            this.blinkAlpha = 1;
            this.blinkDirection = -1;
        } else if (this.blinkAlpha <= 0) {
            this.blinkAlpha = 0;
            this.blinkDirection = 1;
            this.blinkCount++;

            if (this.blinkCount >= 3) {
                this.isBlinking = false;
                this.selectRandomTouch();
                return;
            }
        }

        requestAnimationFrame(() => this.animateBlink());
    }

    selectRandomTouch() {
        if (this.touches.size === 0) return;

        const touchIds = Array.from(this.touches.keys());
        this.selectedTouch = touchIds[Math.floor(Math.random() * touchIds.length)];
        this.isFading = false;
        this.fadeProgress = 0; // Start from 0 for fade in

        // Fade in
        const fadeIn = () => {
            if (this.fadeProgress < 1) {
                this.fadeProgress += 0.02;
                requestAnimationFrame(fadeIn);
            } else {
                this.fadeProgress = 1;
                // Start fade out after 3 seconds
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
        };
        
        requestAnimationFrame(fadeIn);
    }

    clearTimers() {
        if (this.initialTimer) clearTimeout(this.initialTimer);
        if (this.selectionTimer) clearTimeout(this.selectionTimer);
        if (this.fadeTimer) clearTimeout(this.fadeTimer);
    }

    reset() {
        this.clearTimers();
        this.isBlinking = false;
        this.blinkAlpha = 0;
        this.blinkCount = 0;
        this.selectedTouch = null;
        this.isFading = false;
        this.fadeProgress = 1;
    }

    drawCircle(x, y, isSelected) {
        this.ctx.save();
        
        if (isSelected) {
            const glowIntensity = this.fadeProgress;
            
            // Draw glow layers
            this.ctx.beginPath();
            this.ctx.arc(x, y, 90, 0, Math.PI * 2);
            this.ctx.fillStyle = `${this.colors.glow}${Math.floor(0.2 * glowIntensity * 255).toString(16).padStart(2, '0')}`;
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(x, y, 70, 0, Math.PI * 2);
            this.ctx.fillStyle = `${this.colors.glow}${Math.floor(0.4 * glowIntensity * 255).toString(16).padStart(2, '0')}`;
            this.ctx.fill();

            // Main circle
            this.ctx.beginPath();
            this.ctx.arc(x, y, 50, 0, Math.PI * 2);
            this.ctx.fillStyle = `${this.colors.glow}${Math.floor(0.9 * glowIntensity * 255).toString(16).padStart(2, '0')}`;
            this.ctx.fill();
        } else {
            // Regular circle with blink effect
            const alpha = this.isBlinking ? this.blinkAlpha : 1;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 50, 0, Math.PI * 2);
            this.ctx.strokeStyle = `${this.colors.circle}${Math.floor(0.8 * alpha * 255).toString(16).padStart(2, '0')}`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Add subtle glow to regular circles
            this.ctx.beginPath();
            this.ctx.arc(x, y, 55, 0, Math.PI * 2);
            this.ctx.strokeStyle = `${this.colors.circle}${Math.floor(0.2 * alpha * 255).toString(16).padStart(2, '0')}`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
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