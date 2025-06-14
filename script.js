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
        this.edgeTexts = document.querySelectorAll('.edge-text');
        this.glowCount = 0;
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
            this.startScreenGlow();
        }, 2000);
    }

    startScreenGlow() {
        this.isScreenGlowing = true;
        this.glowCount = 0;
        this.edgeTexts.forEach(text => {
            text.classList.add('active');
            text.style.animation = 'none';
            text.offsetHeight; // Trigger reflow
            text.style.animation = null;
        });
        this.animateGlow();
    }

    animateGlow() {
        if (!this.isScreenGlowing) return;

        this.glowCount++;
        
        if (this.glowCount >= 3) {
            this.isScreenGlowing = false;
            this.edgeTexts.forEach(text => text.classList.remove('active'));
            this.selectRandomTouch();
            return;
        }

        setTimeout(() => this.animateGlow(), 1000);
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
        this.edgeTexts.forEach(text => text.classList.remove('active'));
        this.glowCount = 0;
        this.selectedTouch = null;
        this.isFading = false;
        this.fadeProgress = 1;
    }

    drawCircle(x, y, isSelected) {
        this.ctx.save();
        
        if (isSelected) {
            const glowIntensity = this.isFading ? this.fadeProgress : 1;
            
            // Draw glow layers
            this.ctx.beginPath();
            this.ctx.arc(x, y, 90, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.2 * glowIntensity})`;
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(x, y, 70, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.4 * glowIntensity})`;
            this.ctx.fill();

            // Main circle
            this.ctx.beginPath();
            this.ctx.arc(x, y, 50, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.9 * glowIntensity})`;
            this.ctx.fill();
        } else {
            // Regular circle
            this.ctx.beginPath();
            this.ctx.arc(x, y, 50, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.8)';
            this.ctx.lineWidth = 2;
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