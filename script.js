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
                isSelected: false
            });
        });
        this.startSelectionTimer();
    }

    handleTouchMove(e) {
        e.preventDefault();
        Array.from(e.changedTouches).forEach(touch => {
            if (this.touches.has(touch.identifier)) {
                this.touches.get(touch.identifier).x = touch.clientX;
                this.touches.get(touch.identifier).y = touch.clientY;
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
                return;
            }

            this.selectedTouch = touchIds[currentIndex];
            currentIndex = (currentIndex + 1) % touchIds.length;
            iterations++;

            setTimeout(animate, delay);
        };

        animate();
    }

    drawCircle(x, y, color, isSelected = false) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        if (isSelected) {
            this.ctx.fillStyle = this.selectedColor;
            this.ctx.fill();
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.touches.forEach((touch, id) => {
            const isSelected = this.isSelecting && this.selectedTouch === id;
            this.drawCircle(touch.x, touch.y, this.ringColor, isSelected);
        });

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
}

// Initialize the app
window.addEventListener('load', () => {
    new TouchRandomizer();
}); 