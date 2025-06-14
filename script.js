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
        
        // Selection states
        this.isSelecting = false;
        this.selectionAlpha = 1;
        this.isFading = false;
        
        // Timers
        this.initialTimer = null;
        this.selectionTimer = null;

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

        this.reset();
        
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
        this.isSelecting = true;
        this.selectionAlpha = 1;
        this.isFading = false;

        this.selectionTimer = setTimeout(() => {
            this.startFadeOut();
        }, 3000);
    }

    startFadeOut() {
        this.isFading = true;
        this.animateFadeOut();
    }

    animateFadeOut() {
        if (!this.isFading) return;

        this.selectionAlpha -= 0.02;

        if (this.selectionAlpha <= 0) {
            this.selectionAlpha = 0;
            this.isFading = false;
            this.selectedTouch = null;
            this.isSelecting = false;
            
            if (this.touches.size > 0) {
                this.startInitialTimer();
            }
            return;
        }

        requestAnimationFrame(() => this.animateFadeOut());
    }

    clearTimers() {
        if (this.initialTimer) clearTimeout(this.initialTimer);
        if (this.selectionTimer) clearTimeout(this.selectionTimer);
    }

    reset() {
        this.clearTimers();
        this.isScreenGlowing = false;
        this.screenGlowAlpha = 0;
        this.glowCount = 0;
        this.selectedTouch = null;
        this.isSelecting = false;
        this.selectionAlpha = 1;
        this.isFading = false;
    }

    drawCircle(x, y, isSelected) {
        this.ctx.save();
        
        if (isSelected) {
            const alpha = this.isFading ? this.selectionAlpha : 1;
            
            // Create main glow gradient
            const glowGradient = this.ctx.createRadialGradient(
                x, y, 0,
                x, y, 100
            );
            
            glowGradient.addColorStop(0, `rgba(255, 215, 0, ${0.9 * alpha})`);
            glowGradient.addColorStop(0.3, `rgba(255, 215, 0, ${0.7 * alpha})`);
            glowGradient.addColorStop(0.6, `rgba(255, 215, 0, ${0.4 * alpha})`);
            glowGradient.addColorStop(1, `rgba(255, 215, 0, ${0.1 * alpha})`);

            // Draw the glow
            this.ctx.beginPath();
            this.ctx.arc(x, y, 100, 0, Math.PI * 2);
            this.ctx.fillStyle = glowGradient;
            this.ctx.fill();

            // Draw the main circle
            this.ctx.beginPath();
            this.ctx.arc(x, y, 50, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.9 * alpha})`;
            this.ctx.fill();
            
            // Add a bright center
            this.ctx.beginPath();
            this.ctx.arc(x, y, 30, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * alpha})`;
            this.ctx.fill();
        } else {
            // Regular circle with subtle glow
            const regularGradient = this.ctx.createRadialGradient(
                x, y, 40,
                x, y, 60
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