class TouchRandomizer {
    constructor() {
        this.canvas = document.getElementById('touchCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.touches = new Map();
        this.selectedTouch = null;
        this.isSelecting = false;
        this.selectionTimeout = null;
        this.animationFrame = null;
        this.ringColor = 'rgba(76, 175, 80, 0.8)'; // Semi-transparent green
        this.selectedColor = 'rgba(255, 215, 0, 0.9)'; // Semi-transparent yellow
        this.radius = 50;
        this.pulseScale = 1;
        this.pulseDirection = 0.005; // Slower pulse
        this.selectionHighlightTimeout = null;
        this.selectionFadeTimeout = null;
        this.restartTimeout = null;
        this.initialTouchCount = 0;
        this.isFading = false;
        this.fadeProgress = 1;
        this.cyclingIndex = 0;
        this.cyclingIterations = 0;
        this.maxCyclingIterations = 10;
        this.cyclingDelay = 200;

        this.resizeCanvas();
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
        
        // Check if fullscreen is supported
        const isFullscreenSupported = document.fullscreenEnabled || 
                                    document.webkitFullscreenEnabled || 
                                    document.mozFullScreenEnabled ||
                                    document.msFullscreenEnabled;

        if (isFullscreenSupported) {
            fullscreenBtn.style.display = 'flex';
            
            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement && 
                    !document.webkitFullscreenElement && 
                    !document.mozFullScreenElement &&
                    !document.msFullscreenElement) {
                    
                    const element = document.documentElement;
                    if (element.requestFullscreen) {
                        element.requestFullscreen();
                    } else if (element.webkitRequestFullscreen) {
                        element.webkitRequestFullscreen();
                    } else if (element.mozRequestFullScreen) {
                        element.mozRequestFullScreen();
                    } else if (element.msRequestFullscreen) {
                        element.msRequestFullscreen();
                    }
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                }
            });
        } else {
            fullscreenBtn.style.display = 'none';
        }
    }

    setupRefresh() {
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.addEventListener('click', () => {
            this.clearAllCircles();
        });
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
        this.initialTouchCount = this.touches.size;
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
        const previousTouchCount = this.touches.size;
        
        Array.from(e.changedTouches).forEach(touch => {
            this.touches.delete(touch.identifier);
        });

        // If a finger is removed during or after selection, restart the process
        if (this.selectedTouch !== null && this.touches.size < previousTouchCount) {
            this.clearAllTimers();
            if (this.touches.size > 0) {
                this.startSelectionTimer();
            }
        }

        if (this.touches.size === 0) {
            this.clearAllTimers();
        }
    }

    clearAllTimers() {
        if (this.selectionTimeout) {
            clearTimeout(this.selectionTimeout);
            this.selectionTimeout = null;
        }
        if (this.selectionHighlightTimeout) {
            clearTimeout(this.selectionHighlightTimeout);
            this.selectionHighlightTimeout = null;
        }
        if (this.selectionFadeTimeout) {
            clearTimeout(this.selectionFadeTimeout);
            this.selectionFadeTimeout = null;
        }
        if (this.restartTimeout) {
            clearTimeout(this.restartTimeout);
            this.restartTimeout = null;
        }
        this.selectedTouch = null;
        this.isFading = false;
        this.fadeProgress = 1;
    }

    startSelectionTimer() {
        this.clearAllTimers();
        this.selectionTimeout = setTimeout(() => {
            this.selectRandomTouch();
        }, 3000);
    }

    selectRandomTouch() {
        if (this.touches.size === 0) return;
        
        const touchIds = Array.from(this.touches.keys());
        this.selectedTouch = touchIds[Math.floor(Math.random() * touchIds.length)];
        this.isFading = false;
        this.fadeProgress = 1;
        
        // Keep selection highlighted for exactly 3 seconds
        this.selectionHighlightTimeout = setTimeout(() => {
            // Start fade out
            this.isFading = true;
            this.fadeProgress = 1;
            
            const fadeOut = () => {
                if (this.fadeProgress > 0) {
                    this.fadeProgress -= 0.02;
                    requestAnimationFrame(fadeOut);
                } else {
                    this.selectedTouch = null;
                    this.isFading = false;
                    
                    // Wait 6 seconds before next selection
                    if (this.touches.size > 0) {
                        this.restartTimeout = setTimeout(() => {
                            this.startSelectionTimer();
                        }, 6000);
                    }
                }
            };
            
            requestAnimationFrame(fadeOut);
        }, 3000);
    }

    drawCircle(x, y, color, isSelected = false, touchData) {
        this.ctx.save();
        
        // Enhanced glow effect
        if (isSelected) {
            const glowIntensity = this.isFading ? this.fadeProgress : 1;
            this.ctx.shadowColor = this.selectedColor;
            this.ctx.shadowBlur = 40 * glowIntensity;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        } else {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        }

        // Draw multiple glow layers for selected touch
        if (isSelected) {
            const glowIntensity = this.isFading ? this.fadeProgress : 1;
            // Outer glow
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.radius * 1.5, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.1 * glowIntensity})`;
            this.ctx.fill();
            
            // Middle glow
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.radius * 1.2, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.2 * glowIntensity})`;
            this.ctx.fill();
        }

        // Draw the main circle
        this.ctx.beginPath();
        const scale = touchData ? touchData.scale : 1;
        this.ctx.arc(x, y, this.radius * scale, 0, Math.PI * 2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        if (isSelected) {
            const fillColor = this.isFading ? 
                `rgba(255, 215, 0, ${0.9 * this.fadeProgress})` : 
                this.selectedColor;
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
        }

        // Draw multiple subtle pulse effects
        if (touchData) {
            for (let i = 1; i <= 3; i++) {
                this.ctx.beginPath();
                this.ctx.arc(x, y, this.radius * (scale + 0.1 * i), 0, Math.PI * 2);
                this.ctx.strokeStyle = color;
                this.ctx.globalAlpha = 0.15 / i;
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update touch animations
        this.touches.forEach((touchData, id) => {
            // Smoother scale and opacity animations
            if (touchData.scale < 1) {
                touchData.scale += 0.05;
            }
            if (touchData.alpha < 1) {
                touchData.alpha += 0.05;
            }
            
            const isSelected = this.isSelecting && this.selectedTouch === id;
            this.drawCircle(touchData.x, touchData.y, this.ringColor, isSelected, touchData);
        });

        // Smoother pulse animation
        this.pulseScale += this.pulseDirection;
        if (this.pulseScale > 1.05 || this.pulseScale < 0.95) {
            this.pulseDirection *= -1;
        }

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    clearAllCircles() {
        // Clear all timers
        this.clearAllTimers();
        
        // Clear all touches
        this.touches.clear();
        
        // Reset all states
        this.selectedTouch = null;
        this.isSelecting = false;
        this.isFading = false;
        this.fadeProgress = 1;
        this.cyclingIndex = 0;
        this.cyclingIterations = 0;
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Initialize the app
window.addEventListener('load', () => {
    new TouchRandomizer();
}); 