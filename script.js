class TouchRandomizer {
    constructor() {
        // Basic setup
        this.canvas = document.getElementById('touchCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.touches = new Map();
        this.selectedTouch = null;
        this.isSelecting = false;
        this.selectionTimer = null;
        this.fadeTimer = null;
        this.fadeProgress = 1;

        // Initialize
        this.setupCanvas();
        this.setupButtons();
        this.setupTouchEvents();
        this.startAnimation();
    }

    setupCanvas() {
        const updateSize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };
        updateSize();
        window.addEventListener('resize', updateSize);
    }

    setupButtons() {
        // Fullscreen button
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
            fullscreenBtn.style.display = 'flex';
            fullscreenBtn.onclick = () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            };
        } else {
            fullscreenBtn.style.display = 'none';
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.onclick = () => {
            this.clearAll();
        };
    }

    setupTouchEvents() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach(touch => {
                this.touches.set(touch.identifier, {
                    x: touch.clientX,
                    y: touch.clientY
                });
            });
            this.startSelection();
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach(touch => {
                if (this.touches.has(touch.identifier)) {
                    const touchData = this.touches.get(touch.identifier);
                    touchData.x = touch.clientX;
                    touchData.y = touch.clientY;
                }
            });
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach(touch => {
                this.touches.delete(touch.identifier);
            });
            if (this.touches.size === 0) {
                this.clearAll();
            }
        }, { passive: false });
    }

    startSelection() {
        if (this.isSelecting || this.touches.size === 0) return;
        
        this.isSelecting = true;
        this.selectedTouch = null;
        this.fadeProgress = 1;

        // Wait 2 seconds before selecting
        this.selectionTimer = setTimeout(() => {
            if (this.touches.size === 0) {
                this.clearAll();
                return;
            }

            // Select random touch
            const touchIds = Array.from(this.touches.keys());
            this.selectedTouch = touchIds[Math.floor(Math.random() * touchIds.length)];
            this.fadeProgress = 1;

            // Keep selection for 3 seconds
            this.selectionTimer = setTimeout(() => {
                this.fadeOut();
            }, 3000);
        }, 2000);
    }

    fadeOut() {
        const fade = () => {
            this.fadeProgress -= 0.02;
            if (this.fadeProgress <= 0) {
                this.fadeProgress = 0;
                this.clearAll();
                if (this.touches.size > 0) {
                    this.startSelection();
                }
            } else {
                this.fadeTimer = requestAnimationFrame(fade);
            }
        };
        this.fadeTimer = requestAnimationFrame(fade);
    }

    clearAll() {
        // Clear timers
        if (this.selectionTimer) {
            clearTimeout(this.selectionTimer);
            this.selectionTimer = null;
        }
        if (this.fadeTimer) {
            cancelAnimationFrame(this.fadeTimer);
            this.fadeTimer = null;
        }

        // Reset state
        this.isSelecting = false;
        this.selectedTouch = null;
        this.fadeProgress = 1;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawCircle(x, y, isSelected) {
        this.ctx.save();
        
        if (isSelected) {
            // Draw glow layers
            this.ctx.beginPath();
            this.ctx.arc(x, y, 90, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.2 * this.fadeProgress})`;
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(x, y, 70, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.4 * this.fadeProgress})`;
            this.ctx.fill();

            // Main circle
            this.ctx.beginPath();
            this.ctx.arc(x, y, 50, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.9 * this.fadeProgress})`;
            this.ctx.fill();
        } else {
            // Regular circle
            this.ctx.beginPath();
            this.ctx.arc(x, y, 50, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(74, 144, 226, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Subtle glow
            this.ctx.beginPath();
            this.ctx.arc(x, y, 55, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(74, 144, 226, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    startAnimation() {
        const animate = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw all touches
            this.touches.forEach((touchData, id) => {
                this.drawCircle(touchData.x, touchData.y, id === this.selectedTouch);
            });

            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
}

// Initialize when the page loads
window.addEventListener('load', () => {
    new TouchRandomizer();
}); 