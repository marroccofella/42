// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const FPS = 60;
const SHIP_SIZE = 20;
const SHIP_THRUST = 0.1;
const ROTATION_SPEED = 5;
const FRICTION = 0.99;
const BULLET_SPEED = 7;
const BULLET_LIFETIME = 60;
const ASTEROID_SPEED = 1.5;
const ASTEROID_SIZE = 40;
const ASTEROID_VERTICES = 12;

// Game state
let canvas, ctx;
let ship = {};
let bullets = [];
let asteroids = [];
let score = 0;
let lives = 3;
let level = 1;
let gameOver = false;
let keys = {};
let lastAsteroidTime = 0;
let gameLoop;
let isInvincible = false;
let invincibleTimer = 0;
const INVINCIBILITY_DURATION = 180; // 3 seconds at 60 FPS

// DOM elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const finalScoreElement = document.getElementById('final-score');
const scoreDisplay = document.createElement('div');
const livesDisplay = document.createElement('div');

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // Add score and lives displays
    scoreDisplay.id = 'score-display';
    livesDisplay.id = 'lives-display';
    document.getElementById('game-container').appendChild(scoreDisplay);
    document.getElementById('game-container').appendChild(livesDisplay);
    
    // Initialize ship
    resetShip();
    
    // Create initial asteroids
    createAsteroids(level + 2);
    
    // Event listeners
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    
    // Initial render
    updateDisplays();
}

// Reset ship to center of screen
function resetShip() {
    ship = {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        dx: 0,
        dy: 0,
        rotation: 0,
        radius: SHIP_SIZE / 2,
        isThrusting: false
    };
    isInvincible = true;
    invincibleTimer = INVINCIBILITY_DURATION;
}

// Create asteroids
function createAsteroids(count) {
    for (let i = 0; i < count; i++) {
        let x, y;
        // Position asteroids outside the safe zone around the ship
        do {
            x = Math.random() * CANVAS_WIDTH;
            y = Math.random() * CANVAS_HEIGHT;
        } while (Math.hypot(x - ship.x, y - ship.y) < 150);
        
        const angle = Math.random() * Math.PI * 2;
        const size = ASTEROID_SIZE + Math.random() * 10;
        
        // Create irregular shape
        const vertices = [];
        for (let i = 0; i < ASTEROID_VERTICES; i++) {
            vertices.push(Math.random() * 0.4 + 0.8); // Random value between 0.8 and 1.2
        }
        
        asteroids.push({
            x: x,
            y: y,
            dx: Math.cos(angle) * ASTEROID_SPEED * (0.5 + Math.random()),
            dy: Math.sin(angle) * ASTEROID_SPEED * (0.5 + Math.random()),
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            radius: size,
            vertices: vertices
        });
    }
}

// Split asteroid into smaller ones
function splitAsteroid(asteroid, index) {
    const size = asteroid.radius / 2;
    if (size < 10) return; // Too small to split further
    
    // Create two smaller asteroids
    for (let i = 0; i < 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        asteroids.push({
            x: asteroid.x,
            y: asteroid.y,
            dx: Math.cos(angle) * ASTEROID_SPEED * 1.5,
            dy: Math.sin(angle) * ASTEROID_SPEED * 1.5,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.03,
            radius: size,
            vertices: asteroid.vertices.map(() => Math.random() * 0.4 + 0.8)
        });
    }
    
    // Remove the original asteroid
    asteroids.splice(index, 1);
}

// Handle key down events
function keyDownHandler(e) {
    keys[e.key] = true;
    
    // Prevent default for space and arrow keys to avoid page scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
}

// Handle key up events
function keyUpHandler(e) {
    keys[e.key] = false;
}

// Update game state
function update() {
    // Update ship
    if (keys['ArrowLeft']) {
        ship.rotation -= ROTATION_SPEED * Math.PI / 180;
    }
    if (keys['ArrowRight']) {
        ship.rotation += ROTATION_SPEED * Math.PI / 180;
    }
    
    // Apply thrust
    if (keys['ArrowUp']) {
        ship.dx += Math.cos(ship.rotation) * SHIP_THRUST;
        ship.dy += Math.sin(ship.rotation) * SHIP_THRUST;
        ship.isThrusting = true;
    } else {
        ship.isThrusting = false;
    }
    
    // Apply friction
    ship.dx *= FRICTION;
    ship.dy *= FRICTION;
    
    // Update ship position
    ship.x += ship.dx;
    ship.y += ship.dy;
    
    // Wrap around screen edges
    if (ship.x < -ship.radius) ship.x = CANVAS_WIDTH + ship.radius;
    if (ship.x > CANVAS_WIDTH + ship.radius) ship.x = -ship.radius;
    if (ship.y < -ship.radius) ship.y = CANVAS_HEIGHT + ship.radius;
    if (ship.y > CANVAS_HEIGHT + ship.radius) ship.y = -ship.radius;
    
    // Shoot bullets
    if (keys[' '] && !gameOver) {
        const now = Date.now();
        if (now - lastAsteroidTime > 200) { // Rate limit shooting
            shoot();
            lastAsteroidTime = now;
        }
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
        bullet.lifetime--;
        
        // Remove bullets that are off screen or expired
        if (bullet.lifetime <= 0 || 
            bullet.x < 0 || bullet.x > CANVAS_WIDTH || 
            bullet.y < 0 || bullet.y > CANVAS_HEIGHT) {
            bullets.splice(i, 1);
            continue;
        }
        
        // Check for bullet-asteroid collisions
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const asteroid = asteroids[j];
            const dx = bullet.x - asteroid.x;
            const dy = bullet.y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < asteroid.radius) {
                // Bullet hit asteroid
                score += Math.floor(100 / (asteroid.radius / 20));
                updateDisplays();
                
                // Split or remove asteroid
                splitAsteroid(asteroid, j);
                
                // Remove bullet
                bullets.splice(i, 1);
                break;
            }
        }
    }
    
    // Update asteroids
    asteroids.forEach(asteroid => {
        asteroid.x += asteroid.dx;
        asteroid.y += asteroid.dy;
        asteroid.rotation += asteroid.rotationSpeed;
        
        // Wrap around screen edges
        if (asteroid.x < -asteroid.radius) asteroid.x = CANVAS_WIDTH + asteroid.radius;
        if (asteroid.x > CANVAS_WIDTH + asteroid.radius) asteroid.x = -asteroid.radius;
        if (asteroid.y < -asteroid.radius) asteroid.y = CANVAS_HEIGHT + asteroid.radius;
        if (asteroid.y > CANVAS_HEIGHT + asteroid.radius) asteroid.y = -asteroid.radius;
    });
    
    // Check for ship-asteroid collisions (if not invincible)
    if (!isInvincible) {
        for (let i = 0; i < asteroids.length; i++) {
            const asteroid = asteroids[i];
            const dx = ship.x - asteroid.x;
            const dy = ship.y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < ship.radius + asteroid.radius) {
                // Ship hit asteroid
                lives--;
                updateDisplays();
                
                if (lives <= 0) {
                    gameOver = true;
                    gameOverScreen.classList.remove('hidden');
                    finalScoreElement.textContent = score;
                    cancelAnimationFrame(gameLoop);
                } else {
                    resetShip();
                }
                break;
            }
        }
    } else {
        invincibleTimer--;
        if (invincibleTimer <= 0) {
            isInvincible = false;
        }
    }
    
    // Check for level completion
    if (asteroids.length === 0 && !gameOver) {
        level++;
        createAsteroids(level + 2);
    }
}

// Shoot a bullet
function shoot() {
    const bullet = {
        x: ship.x + Math.cos(ship.rotation) * SHIP_SIZE,
        y: ship.y + Math.sin(ship.rotation) * SHIP_SIZE,
        dx: Math.cos(ship.rotation) * BULLET_SPEED,
        dy: Math.sin(ship.rotation) * BULLET_SPEED,
        lifetime: BULLET_LIFETIME
    };
    
    // Add initial velocity from the ship
    bullet.dx += ship.dx * 0.5;
    bullet.dy += ship.dy * 0.5;
    
    bullets.push(bullet);
}

// Draw game objects
function draw() {
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw stars (background)
    ctx.fillStyle = 'white';
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * CANVAS_WIDTH;
        const y = Math.random() * CANVAS_HEIGHT;
        const size = Math.random() * 1.5;
        ctx.fillRect(x, y, size, size);
    }
    
    // Draw ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.rotation);
    
    // Draw ship body
    ctx.strokeStyle = isInvincible && Math.floor(Date.now() / 100) % 2 === 0 ? 'red' : 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SHIP_SIZE, 0);
    ctx.lineTo(-SHIP_SIZE / 1.5, -SHIP_SIZE / 1.5);
    ctx.lineTo(-SHIP_SIZE / 4, 0);
    ctx.lineTo(-SHIP_SIZE / 1.5, SHIP_SIZE / 1.5);
    ctx.closePath();
    ctx.stroke();
    
    // Draw thruster
    if (ship.isThrusting) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(-SHIP_SIZE / 1.5, -SHIP_SIZE / 3);
        ctx.lineTo(-SHIP_SIZE, 0);
        ctx.lineTo(-SHIP_SIZE / 1.5, SHIP_SIZE / 3);
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.restore();
    
    // Draw bullets
    ctx.fillStyle = 'yellow';
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw asteroids
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    asteroids.forEach(asteroid => {
        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        ctx.rotate(asteroid.rotation);
        
        // Draw irregular polygon
        ctx.beginPath();
        for (let i = 0; i < asteroid.vertices.length; i++) {
            const angle = (i / asteroid.vertices.length) * Math.PI * 2;
            const radius = asteroid.radius * asteroid.vertices[i];
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    });
    
    // Draw HUD
    updateDisplays();
}

// Update score and lives displays
function updateDisplays() {
    scoreDisplay.textContent = `Score: ${score} | Level: ${level}`;
    livesDisplay.textContent = `Lives: ${'❤'.repeat(lives)}`;
}

// Game loop
function gameUpdate() {
    if (!gameOver) {
        update();
        draw();
        gameLoop = requestAnimationFrame(gameUpdate);
    }
}

// Start a new game
function startGame() {
    // Reset game state
    bullets = [];
    asteroids = [];
    score = 0;
    lives = 3;
    level = 1;
    gameOver = false;
    
    // Hide screens
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Reset ship and create initial asteroids
    resetShip();
    createAsteroids(level + 2);
    
    // Start game loop
    gameUpdate();
}

// Initialize the game when the page loads
window.onload = init;
