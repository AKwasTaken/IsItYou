class TouchRandomizer {
    constructor() {
        this.canvas = document.getElementById('touchCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.touches = new Map();
        this.selectedTouch = null;
        this.isSelecting = false;
        this.selectionTimeout = null;
        this.animationFrame = null;
        this.ringColor = '#4CAF50'; // Green ring for touches
        this.selectedColor = '#FFD700'; // Yellow for selected touch
        this.radius = 50;
        this.pulseScale = 1;
        this.pulseDirection = 0.01;
        this.selectionHighlightTimeout = null;

        this.resizeCanvas();
        this.setupEventListeners();
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

    handleTouchStart(e) {
        e.preventDefault();
        Array.from(e.changedTouches).forEach(touch => {
            this.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
                isSelected: false,
                scale: 0.8, // Start with a smaller scale for animation
                alpha: 0.5  // Start with lower opacity for animation
            });
        });
        this.startSelectionTimer();
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
        if (this.touches.size === 0) {
            this.clearSelectionTimer();
            this.clearSelectionHighlight();
        }
    }

    startSelectionTimer() {
        if (this.selectionTimeout) {
            clearTimeout(this.selectionTimeout);
        }
        this.selectionTimeout = setTimeout(() => {
            this.startSelectionAnimation();
        }, 3000);
    }

    clearSelectionTimer() {
        if (this.selectionTimeout) {
            clearTimeout(this.selectionTimeout);
            this.selectionTimeout = null;
        }
        this.isSelecting = false;
        this.selectedTouch = null;
    }

    clearSelectionHighlight() {
        if (this.selectionHighlightTimeout) {
            clearTimeout(this.selectionHighlightTimeout);
            this.selectionHighlightTimeout = null;
        }
        this.selectedTouch = null;
    }

    startSelectionAnimation() {
        if (this.touches.size === 0) return;
        
        this.isSelecting = true;
        const touchIds = Array.from(this.touches.keys());
        let currentIndex = 0;
        let iterations = 0;
        const maxIterations = 10;
        const delay = 200;

        const animate = () => {
            if (iterations >= maxIterations) {
                this.isSelecting = false;
                this.selectedTouch = touchIds[Math.floor(Math.random() * touchIds.length)];
                // Keep the selection highlighted for 2 seconds
                this.selectionHighlightTimeout = setTimeout(() => {
                    this.clearSelectionHighlight();
                }, 2000);
                return;
            }

            this.selectedTouch = touchIds[currentIndex];
            currentIndex = (currentIndex + 1) % touchIds.length;
            iterations++;

            setTimeout(animate, delay);
        };

        animate();
    }

    drawCircle(x, y, color, isSelected = false, touchData) {
        this.ctx.save();
        
        // Add glow effect for selected touch
        if (isSelected) {
            this.ctx.shadowColor = this.selectedColor;
            this.ctx.shadowBlur = 20;
        }

        // Draw the main circle
        this.ctx.beginPath();
        const scale = touchData ? touchData.scale : 1;
        this.ctx.arc(x, y, this.radius * scale, 0, Math.PI * 2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        if (isSelected) {
            this.ctx.fillStyle = this.selectedColor;
            this.ctx.fill();
        }

        // Draw a subtle pulse effect
        if (touchData) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.radius * (scale + 0.2), 0, Math.PI * 2);
            this.ctx.strokeStyle = color;
            this.ctx.globalAlpha = 0.3;
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update touch animations
        this.touches.forEach((touchData, id) => {
            // Animate scale and opacity
            if (touchData.scale < 1) {
                touchData.scale += 0.1;
            }
            if (touchData.alpha < 1) {
                touchData.alpha += 0.1;
            }
            
            const isSelected = this.isSelecting && this.selectedTouch === id;
            this.drawCircle(touchData.x, touchData.y, this.ringColor, isSelected, touchData);
        });

        // Update pulse animation
        this.pulseScale += this.pulseDirection;
        if (this.pulseScale > 1.1 || this.pulseScale < 0.9) {
            this.pulseDirection *= -1;
        }

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
}

// Initialize the app
window.addEventListener('load', () => {
    new TouchRandomizer();
}); 