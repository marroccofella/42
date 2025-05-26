// Ateroids v4.0 - Complete Game Logic

// Game Constants & Settings
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const FPS = 60;
const FRAME_DURATION = 1000 / FPS;

const SHIP_SIZE = 20;
const SHIP_THRUST = 0.1;
const SHIP_ROTATION_SPEED = 0.08; // Radians per frame
const SHIP_FRICTION = 0.99;
const SHIP_INVINCIBILITY_DURATION = 3000; // ms
const SHIP_BLINK_INTERVAL = 200; // ms

const BULLET_SPEED = 7;
const BULLET_LIFETIME = 60; // frames
const BULLET_COOLDOWN = 200; // ms for single shot

const ASTEROID_NUM_START = 3;
const ASTEROID_SPEED_MIN = 0.5;
const ASTEROID_SPEED_MAX = 1.5;
const ASTEROID_SIZE_LARGE = 40;
const ASTEROID_SIZE_MEDIUM = 20;
const ASTEROID_SIZE_SMALL = 10;
const ASTEROID_POINTS_LARGE = 20;
const ASTEROID_POINTS_MEDIUM = 50;
const ASTEROID_POINTS_SMALL = 100;
const ASTEROID_VERTICES_MIN = 8;
const ASTEROID_VERTICES_MAX = 12;
const ASTEROID_JAGGEDNESS = 0.4; // 0 = smooth, 1 = very jagged

const POWERUP_DURATION = 7000; // ms
const POWERUP_SPAWN_CHANCE = 0.15; // 15% chance on asteroid break
const POWERUP_TYPES = {
    SHIELD: { color: 'cyan', symbol: 'S' },
    RAPID_FIRE: { color: 'orange', symbol: 'R' },
    MULTI_SHOT: { color: 'yellow', symbol: 'M' }
};

const SMART_BOMBS_START = 2;
const POWERUP_FALL_SPEED = 30;
const PARTICLE_FADE_RATE = 2;
const POWERUP_COLLISION_RADIUS = 15;

const SHIP_WING_ANGLE_OFFSET = Math.PI * 0.8; // Angle for ship wings
const SHIP_THRUSTER_REAR_OFFSET = 0.6;    // Multiplier for thruster rear point
const SHIP_THRUSTER_FLAME_LENGTH = 1.2;   // Multiplier for thruster flame length
const SHIP_THRUSTER_FLAME_ANGLE = 0.1;    // Angle for thruster flame points
const BULLET_SPREAD_ANGLE = Math.PI / 12; // 15 degrees for multi-shot spread

const PARTICLE_SPEED_MULTIPLIER = 5; // Factor for dx/dy calculation from baseRadius
const PARTICLE_BASE_SPEED_ADDON = 3; // Added to speed calculation
// const PARTICLE_RADIUS_MULTIPLIER = 10; // Factor for radius calculation from baseRadius - Replaced by more specific constants
// const PARTICLE_BASE_RADIUS_ADDON = 1; // Added to radius calculation - Replaced by more specific constants
const PARTICLE_RANDOM_RADIUS_FACTOR_FROM_BASE = 10; // e.g. baseRadius / 10
const PARTICLE_RANDOM_RADIUS_ADDON = 1;         // e.g. + 1 to the random part
const PARTICLE_MINIMUM_FIXED_RADIUS = 1;        // e.g. the final + 1
const PARTICLE_COLOR_VARIANCE = 50; // Max random change to particle color components
const PARTICLE_COLOR_OFFSET = 25;   // Offset for color variance calculation


// Game State Variables
let ship;
let bullets = [];
let asteroids = [];
let particles = [];
let powerups = [];

let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    highScore: 0, // Will be loaded from localStorage
    gameOver: true,
    isPaused: false
};

// let keys = {}; // moved to above for clarity
let lastShotTime = 0;
let smartBombs = SMART_BOMBS_START;

let activePowerUps = {
    SHIELD: { active: false, endTime: 0 },
    RAPID_FIRE: { active: false, endTime: 0 },
    MULTI_SHOT: { active: false, endTime: 0 }
};

// DOM Elements
let domElements = {
    canvas: null,
    ctx: null,
    startScreen: null,
    gameOverScreen: null,
    scoreDisplay: null,
    livesDisplay: null,
    bombsDisplay: null,
    powerupActiveDisplay: null,
    highScoreDisplay: null,
    finalScoreElement: null,
    startButton: null,
    restartButton: null
};

// Audio
let sounds = {};

// Game Loop Timing
let lastTime = 0;
let gameTime = 0;

// Input State
let keys = {};
let shootPressed = false;

// Accessibility & ARIA
function setAriaLabels() {
    if (domElements.canvas) domElements.canvas.setAttribute('aria-label', 'Asteroids Game Canvas');
    if (domElements.startButton) domElements.startButton.setAttribute('aria-label', 'Start Game');
    if (domElements.restartButton) domElements.restartButton.setAttribute('aria-label', 'Restart Game');
    if (domElements.scoreDisplay) domElements.scoreDisplay.setAttribute('aria-label', 'Current Score');
    if (domElements.livesDisplay) domElements.livesDisplay.setAttribute('aria-label', 'Lives Remaining');
    if (domElements.bombsDisplay) domElements.bombsDisplay.setAttribute('aria-label', 'Smart Bombs');
    if (domElements.powerupActiveDisplay) domElements.powerupActiveDisplay.setAttribute('aria-label', 'Active Powerup');
    if (domElements.highScoreDisplay) domElements.highScoreDisplay.setAttribute('aria-label', 'High Score');
}

// Colorblind mode toggle (stub for future expansion)
let colorblindMode = false;
function toggleColorblindMode() {
    colorblindMode = !colorblindMode;
    // Example: Change asteroid and powerup colors for better contrast
    // (Future: apply CSS or variable color sets here)
}

// Touch/mobile controls (basic)
function setupTouchControls() {
    if (!('ontouchstart' in window)) return;
    // Simple on-screen buttons for movement and shooting
    let touchControls = document.createElement('div');
    touchControls.id = 'touch-controls';
    touchControls.style.position = 'fixed';
    touchControls.style.bottom = '10px';
    touchControls.style.left = '50%';
    touchControls.style.transform = 'translateX(-50%)';
    touchControls.style.zIndex = '9999';
    touchControls.innerHTML = `
        <button id='btn-left' aria-label='Left'>⟵</button>
        <button id='btn-thrust' aria-label='Thrust'>▲</button>
        <button id='btn-right' aria-label='Right'>⟶</button>
        <button id='btn-shoot' aria-label='Shoot'>●</button>
        <button id='btn-bomb' aria-label='Bomb'>💣</button>
    `;
    document.body.appendChild(touchControls);
    document.getElementById('btn-left').ontouchstart = () => keys['arrowleft'] = true;
    document.getElementById('btn-left').ontouchend = () => keys['arrowleft'] = false;
    document.getElementById('btn-right').ontouchstart = () => keys['arrowright'] = true;
    document.getElementById('btn-right').ontouchend = () => keys['arrowright'] = false;
    document.getElementById('btn-thrust').ontouchstart = () => keys['arrowup'] = true;
    document.getElementById('btn-thrust').ontouchend = () => keys['arrowup'] = false;
    document.getElementById('btn-shoot').ontouchstart = () => { keys[' '] = true; shootBullet(); };
    document.getElementById('btn-shoot').ontouchend = () => keys[' '] = false;
    document.getElementById('btn-bomb').ontouchstart = () => { keys['b'] = true; activateSmartBomb(); };
    document.getElementById('btn-bomb').ontouchend = () => keys['b'] = false;
}

// Settings menu (stub)
function showSettingsMenu() {
    alert('Settings menu coming soon!');
}

// Multiplayer/leaderboard scaffolding (stub)
function connectMultiplayer() {
    // Placeholder for future multiplayer logic
}
function showLeaderboard() {
    // Placeholder for future leaderboard logic
}

// Initialization
window.onerror = function(message, source, lineno, colno, error) {
    createOverlayDiv(
        'Ateroids v4.0 JS ERROR: ' + message + ' at ' + source + ':' + lineno + ':' + colno,
        { top: '0', left: '0', width: '100vw' } // background, color etc. use defaults
    );
    return false;
};

function debugOverlay(msg) {
    const div = createOverlayDiv('[DEBUG] ' + msg, {
        position: 'fixed', // already default but explicit
        bottom: '0',
        left: '0',
        background: 'rgba(0,0,0,0.8)',
        color: 'lime',
        fontSize: '1em',
        zIndex: '9998', // lower z-index for debug
        padding: '4px 10px',
        margin: '2px',
        pointerEvents: 'none',
        textAlign: 'left' // debug often better left-aligned
    });
    setTimeout(() => div.remove(), 8000);
}

// Helper function to get DOM elements and log errors
function checkElem(id, errorMsgRef) {
    const elem = document.getElementById(id);
    if (!elem) {
        errorMsgRef.value += `Missing element: #${id}\n`; // Use a mutable ref for errorMsg
        console.error(`Ateroids v4.0 ERROR: Missing element #${id}`);
    }
    return elem;
}

function initializePrimaryDOMElements() {
    let errorMsg = { value: '' }; // Use an object to pass errorMsg by reference

    domElements.canvas = checkElem('gameCanvas', errorMsg);
    domElements.ctx = domElements.canvas ? domElements.canvas.getContext('2d') : null;
    if (domElements.canvas) {
        domElements.canvas.width = CANVAS_WIDTH;
        domElements.canvas.height = CANVAS_HEIGHT;
    }
    domElements.startScreen = checkElem('start-screen');
    domElements.gameOverScreen = checkElem('game-over');
    domElements.scoreDisplay = checkElem('score-display');
    domElements.livesDisplay = checkElem('lives-display');
    domElements.bombsDisplay = checkElem('bombs-display');
    domElements.powerupActiveDisplay = checkElem('powerup-active-display');
    domElements.highScoreDisplay = checkElem('high-score-display');
    domElements.finalScoreElement = checkElem('final-score');
    domElements.startScreen = checkElem('start-screen', errorMsg);
    domElements.gameOverScreen = checkElem('game-over', errorMsg);
    domElements.scoreDisplay = checkElem('score-display', errorMsg);
    domElements.livesDisplay = checkElem('lives-display', errorMsg);
    domElements.bombsDisplay = checkElem('bombs-display', errorMsg);
    domElements.powerupActiveDisplay = checkElem('powerup-active-display', errorMsg);
    domElements.highScoreDisplay = checkElem('high-score-display', errorMsg);
    domElements.finalScoreElement = checkElem('final-score', errorMsg);
    domElements.startButton = checkElem('start-button', errorMsg);
    domElements.restartButton = checkElem('restart-button', errorMsg);
    
    gameState.highScore = parseInt(localStorage.getItem('asteroidsHighScoreV4')) || 0;

    if (errorMsg.value) {
        createOverlayDiv('Ateroids v4.0 ERROR: ' + errorMsg.value, {
            top: '0', left: '0', width: '100vw', fontSize: '2em', padding: '30px 10px'
        });
        return false; // Error occurred
    }
    return true; // Success
}

function setupInitialEventListeners() {
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    domElements.startButton.addEventListener('click', function(e) {
        debugOverlay('Start button clicked');
        startGame();
    });
    domElements.restartButton.addEventListener('click', function(e) {
        debugOverlay('Restart button clicked');
        startGame();
    });
}

debugOverlay('window.onload fired');
window.onload = () => {
    debugOverlay('window.onload fired'); // Keep for sequence debugging
    if (!initializePrimaryDOMElements()) return; // Stop if essential DOM elements are missing

    setupInitialEventListeners();

    debugOverlay('Sounds loading...');
    loadSounds();
    debugOverlay('HUD updating...');
    updateHUD();
    setAriaLabels();
    setupTouchControls();
    debugOverlay('Showing start screen...');
    showStartScreen();
    debugOverlay('Requesting animation frame for gameLoop...');
    // gameState.lastTime should be set here before starting the loop if not set in startGame by default
    lastTime = performance.now(); 
    requestAnimationFrame(gameLoop); // Assumes gameLoop is defined
};

function loadSounds() {
    sounds.shoot = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_122b17305b.mp3?filename=laser-gun-shot-sound-effect-178559.mp3'); // Replace with actual URLs
    sounds.explosionSmall = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_1c0b92a6a7.mp3?filename=explosion-small-39969.mp3');
    sounds.explosionLarge = new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_3bd23d090a.mp3?filename=large-explosion-80002.mp3');
    sounds.thrust = new Audio('https://cdn.pixabay.com/download/audio/2022/07/31/audio_168867391f.mp3?filename=rocket-thrusters-fixed-39098.mp3');
    sounds.powerup = new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c92c29a3.mp3?filename=power-up-sparkle-1-177983.mp3');
    sounds.shieldHit = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_c0277c0a0b.mp3?filename=shield-hit-178560.mp3');
    sounds.smartBomb = new Audio('https://cdn.pixabay.com/download/audio/2022/10/10/audio_001bf0d080.mp3?filename=sci-fi-bomb-explosion-120050.mp3');
    Object.values(sounds).forEach(sound => sound.volume = 0.3);
}

function playSound(soundName, volume = 0.3) {
    if (sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].volume = volume;
        sounds[soundName].play().catch(e => console.warn('Sound play error:', e));
    }
}

// Game Flow
function startGame() {
    gameState.gameOver = false;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.level = 1;
    smartBombs = SMART_BOMBS_START;
    ship = newShip();
    asteroids = [];
    bullets = [];
    particles = [];
    powerups = [];
    resetActivePowerUps();
    spawnAsteroidsForLevel();
    hideScreens();
    updateHUD();
    lastTime = performance.now(); // Reset timer for gameLoop
    requestAnimationFrame(gameLoop);
}

function showStartScreen() {
    domElements.startScreen.classList.remove('hidden');
    domElements.gameOverScreen.classList.add('hidden');
    updateHUD(); // Update high score on start screen
}

function showGameOverScreen() {
    gameState.gameOver = true;
    // Stop the loop logic by not requesting new frames if gameOver is true (handled in gameLoop)
    domElements.gameOverScreen.classList.remove('hidden');
    domElements.startScreen.classList.add('hidden');
    domElements.finalScoreElement.textContent = gameState.score;
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        try {
            localStorage.setItem('asteroidsHighScoreV4', gameState.highScore);
        } catch (e) {
            console.warn('Failed to save high score:', e);
        }
    }
    updateHUD();
}

function hideScreens() {
    domElements.startScreen.classList.add('hidden');
    domElements.gameOverScreen.classList.add('hidden');
}

// Game Loop
function gameLoop(currentTime) {
    if (!domElements.canvas || !domElements.ctx) return; // Defensive: abort if canvas/context missing
    if (gameState.gameOver && !domElements.startScreen.classList.contains('hidden')) {
        // If game is over and start screen is shown, don't run game logic, but keep rendering HUD for high score
        updateHUD();
        requestAnimationFrame(gameLoop);
        return;
    }
    if (gameState.gameOver) {
        return; // Stop loop if game over and not on start screen
    }
    // No need to re-engage gameLoopRunning, if gameOver is false, it will proceed.

    const deltaTime = (currentTime - lastTime) / 1000; // seconds
    lastTime = currentTime;
    gameTime += deltaTime;

    if (!gameState.isPaused) {
        handleInput();
        update(deltaTime, currentTime);
    }
    render();

    requestAnimationFrame(gameLoop);
}

// Update Functions
function update(dt, currentTime) {
    // Ship
    moveShip(dt);
    wrapScreen(ship);

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].dx * dt;
        bullets[i].y += bullets[i].dy * dt;
        bullets[i].life -= dt * FPS; // Decrement based on frames
        if (bullets[i].life <= 0) {
            bullets.splice(i, 1);
        }
    }

    // Asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].x += asteroids[i].dx * dt;
        asteroids[i].y += asteroids[i].dy * dt;
        asteroids[i].angle += asteroids[i].rotationSpeed * dt;
        wrapScreen(asteroids[i]);
    }

    // Powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        powerups[i].y += POWERUP_FALL_SPEED * dt; // Move downwards
        if (powerups[i].y > CANVAS_HEIGHT + 20) {
            powerups.splice(i, 1);
        }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.dx * dt;
        p.y += p.dy * dt;
        p.alpha -= PARTICLE_FADE_RATE * dt; // Fade out
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    checkCollisions();
    updateActivePowerUpsState(currentTime);
    checkLevelCompletion();
    updateHUD();
}

function updateActivePowerUpsState(currentTime) {
    for (const type in activePowerUps) {
        if (activePowerUps[type].active && currentTime >= activePowerUps[type].endTime) {
            activePowerUps[type].active = false;
        }
    }
}

// Render Functions
function render() {
    // Clear canvas
    domElements.ctx.fillStyle = 'black';
    domElements.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars (simple parallax)
    drawStars(domElements.ctx, gameTime);

    // Draw particles
    particles.forEach(p => {
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw powerups
    powerups.forEach(p => {
        domElements.ctx.fillStyle = p.details.color;
        domElements.ctx.font = '20px Arial';
        domElements.ctx.textAlign = 'center';
        domElements.ctx.textBaseline = 'middle';
        domElements.ctx.fillText(p.details.symbol, p.x, p.y);
        domElements.ctx.strokeStyle = 'white';
        domElements.ctx.lineWidth = 1;
        domElements.ctx.beginPath();
        domElements.ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        domElements.ctx.stroke();
    });

    // Draw asteroids
    asteroids.forEach(drawAsteroid);

    // Draw bullets
    domElements.ctx.fillStyle = 'yellow';
    bullets.forEach(b => {
        domElements.ctx.beginPath();
        domElements.ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
        domElements.ctx.fill();
    });

    // Draw ship
    if (!ship.isInvincible || Math.floor(performance.now() / SHIP_BLINK_INTERVAL) % 2 === 0) {
        drawShip();
    }

    // Draw Shield
    if (activePowerUps.SHIELD.active) {
        domElements.ctx.strokeStyle = 'cyan';
        domElements.ctx.lineWidth = 2;
        domElements.ctx.beginPath();
        domElements.ctx.arc(ship.x, ship.y, ship.radius + 5, 0, Math.PI * 2);
        domElements.ctx.stroke();
    }

    // Draw Pause Text if paused
    if (gameState.isPaused) {
        domElements.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        domElements.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        domElements.ctx.fillStyle = 'white';
        domElements.ctx.font = '40px Arial';
        domElements.ctx.textAlign = 'center';
        domElements.ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
}

function drawStars(ctx, gameTime) {
    ctx.fillStyle = 'white';
    const starCount = 100;
    for (let i = 0; i < starCount; i++) {
        // Generate pseudo-random positions based on index to keep them static
        let x = (Math.sin(i * 0.3) * CANVAS_WIDTH / 2 + CANVAS_WIDTH / 2 + gameTime * (i % 5 + 1) * 2) % CANVAS_WIDTH;
        let y = (Math.cos(i * 0.5) * CANVAS_HEIGHT / 2 + CANVAS_HEIGHT / 2 + gameTime * (i % 3 + 1) * 2) % CANVAS_HEIGHT;
        let r = Math.random() * 1.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Ship
function newShip() {
    return {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        radius: SHIP_SIZE / 2,
        angle: Math.PI * 1.5, // Pointing up
        dx: 0,
        dy: 0,
        rotation: 0,
        isThrusting: false,
        isInvincible: true,
        invincibleEndTime: performance.now() + SHIP_INVINCIBILITY_DURATION
    };
}

function drawShip() {
    domElements.ctx.strokeStyle = 'white';
    domElements.ctx.lineWidth = SHIP_SIZE / 15;
    domElements.ctx.beginPath();
    // Nose
    domElements.ctx.moveTo(
        ship.x + ship.radius * Math.cos(ship.angle),
        ship.y + ship.radius * Math.sin(ship.angle)
    );
    // Left wing
    ctx.lineTo(
        ship.x + ship.radius * Math.cos(ship.angle + SHIP_WING_ANGLE_OFFSET),
        ship.y + ship.radius * Math.sin(ship.angle + SHIP_WING_ANGLE_OFFSET)
    );
    // Right wing
    ctx.lineTo(
        ship.x + ship.radius * Math.cos(ship.angle - SHIP_WING_ANGLE_OFFSET),
        ship.y + ship.radius * Math.sin(ship.angle - SHIP_WING_ANGLE_OFFSET)
    );
    domElements.ctx.closePath();
    domElements.ctx.stroke();

    if (ship.isThrusting) {
        domElements.ctx.fillStyle = 'orange';
        domElements.ctx.beginPath();
        domElements.ctx.moveTo( // Rear center
            ship.x - ship.radius * SHIP_THRUSTER_REAR_OFFSET * Math.cos(ship.angle),
            ship.y - ship.radius * SHIP_THRUSTER_REAR_OFFSET * Math.sin(ship.angle)
        );
        domElements.ctx.lineTo( // Flame point 1
            ship.x - ship.radius * SHIP_THRUSTER_FLAME_LENGTH * Math.cos(ship.angle + SHIP_THRUSTER_FLAME_ANGLE),
            ship.y - ship.radius * SHIP_THRUSTER_FLAME_LENGTH * Math.sin(ship.angle + SHIP_THRUSTER_FLAME_ANGLE)
        );
        domElements.ctx.lineTo( // Flame point 2
            ship.x - ship.radius * SHIP_THRUSTER_FLAME_LENGTH * Math.cos(ship.angle - SHIP_THRUSTER_FLAME_ANGLE),
            ship.y - ship.radius * SHIP_THRUSTER_FLAME_LENGTH * Math.sin(ship.angle - SHIP_THRUSTER_FLAME_ANGLE)
        );
        domElements.ctx.closePath();
        domElements.ctx.fill();
    }
}

function moveShip(dt) {
    if (ship.isInvincible && performance.now() > ship.invincibleEndTime) {
        ship.isInvincible = false;
    }

    ship.angle += ship.rotation;

    if (ship.isThrusting) {
        ship.dx += SHIP_THRUST * Math.cos(ship.angle) * dt * FPS;
        ship.dy += SHIP_THRUST * Math.sin(ship.angle) * dt * FPS;
        if (sounds.thrust && sounds.thrust.paused) playSound('thrust', 0.1);
    } else {
        if (sounds.thrust && !sounds.thrust.paused) sounds.thrust.pause();
    }

    ship.dx *= SHIP_FRICTION;
    ship.dy *= SHIP_FRICTION;

    ship.x += ship.dx;
    ship.y += ship.dy;
}

function createBullet(currentShip, isMultiShotActive) {
    const baseBullet = {
        x: currentShip.x + currentShip.radius * Math.cos(currentShip.angle),
        y: currentShip.y + currentShip.radius * Math.sin(currentShip.angle),
        dx: BULLET_SPEED * Math.cos(currentShip.angle) + currentShip.dx * 0.5,
        dy: BULLET_SPEED * Math.sin(currentShip.angle) + currentShip.dy * 0.5,
        life: BULLET_LIFETIME
    };
    
    let newBullets = [baseBullet];

    if (isMultiShotActive) {
        const angleOffset = BULLET_SPREAD_ANGLE;
        newBullets.push({
            ...baseBullet, // Spread the original calculated x,y,life
            dx: BULLET_SPEED * Math.cos(currentShip.angle - angleOffset) + currentShip.dx * 0.5,
            dy: BULLET_SPEED * Math.sin(currentShip.angle - angleOffset) + currentShip.dy * 0.5,
        });
        newBullets.push({
            ...baseBullet, // Spread the original calculated x,y,life
            dx: BULLET_SPEED * Math.cos(currentShip.angle + angleOffset) + currentShip.dx * 0.5,
            dy: BULLET_SPEED * Math.sin(currentShip.angle + angleOffset) + currentShip.dy * 0.5,
        });
    }
    return newBullets;
}

function shootBullet() {
    const currentTime = performance.now();
    let cooldown = BULLET_COOLDOWN;
    if (activePowerUps.RAPID_FIRE.active) cooldown /= 3;

    if (currentTime - lastShotTime < cooldown) return;
    lastShotTime = currentTime;

    const newShotBullets = createBullet(ship, activePowerUps.MULTI_SHOT.active);
    bullets.push(...newShotBullets); // Use spread operator to add all new bullets
    playSound('shoot');
}

function activateSmartBomb() {
    if (smartBombs > 0 && !gameState.gameOver) {
        smartBombs--;
        playSound('smartBomb', 0.5);
        // Destroy all asteroids on screen
        asteroids.forEach(a => {
            createExplosion(a.x, a.y, a.radius, 'white');
            addScore(getAsteroidPoints(a.radius) / 2); // Half points for bomb
        });
        asteroids = [];
        // Could add a screen flash effect here
        updateHUD();
    }
}

// Asteroids
function createAsteroidVertices(radius) {
    // v3.3.7+ fix: always generate new vertices array, never copy/mutate old
    const vertices = [];
    const numVertices = Math.floor(Math.random() * (ASTEROID_VERTICES_MAX - ASTEROID_VERTICES_MIN + 1)) + ASTEROID_VERTICES_MIN;
    for (let i = 0; i < numVertices; i++) {
        const angle = (i / numVertices) * Math.PI * 2;
        const r = radius * (1 - ASTEROID_JAGGEDNESS + Math.random() * ASTEROID_JAGGEDNESS * 2);
        vertices.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
    }
    return vertices;
}

function drawAsteroid(asteroid) {
    // Defensive rendering: validate all properties
    if (!asteroid || typeof asteroid.x !== 'number' || typeof asteroid.y !== 'number' || !Array.isArray(asteroid.vertices) || asteroid.vertices.length === 0) return;
    domElements.ctx.strokeStyle = 'grey';
    domElements.ctx.lineWidth = 1.5;
    domElements.ctx.beginPath();
    domElements.ctx.moveTo(asteroid.x + asteroid.vertices[0].x, asteroid.y + asteroid.vertices[0].y);
    for (let i = 1; i < asteroid.vertices.length; i++) {
        domElements.ctx.lineTo(asteroid.x + asteroid.vertices[i].x, asteroid.y + asteroid.vertices[i].y);
    }
    domElements.ctx.closePath();
    domElements.ctx.stroke();
    // Draw '@' symbol at center for accessibility/clarity
    domElements.ctx.save();
    domElements.ctx.font = 'bold 18px monospace';
    domElements.ctx.fillStyle = 'white';
    domElements.ctx.textAlign = 'center';
    domElements.ctx.textBaseline = 'middle';
    domElements.ctx.fillText(asteroid.symbol || '@', asteroid.x, asteroid.y);
    domElements.ctx.restore();
}

function spawnAsteroidsForLevel() {
    const numAsteroids = ASTEROID_NUM_START + gameState.level -1;
    for (let i = 0; i < numAsteroids; i++) {
        let x, y;
        do { // Ensure asteroids don't spawn on top of the ship
            x = Math.random() * CANVAS_WIDTH;
            y = Math.random() * CANVAS_HEIGHT;
        } while (distBetweenPointsSquared(ship.x, ship.y, x, y) < Math.pow(ASTEROID_SIZE_LARGE * 2 + ship.radius, 2));

        const angle = Math.random() * Math.PI * 2;
        const speed = ASTEROID_SPEED_MIN + Math.random() * (ASTEROID_SPEED_MAX - ASTEROID_SPEED_MIN);
        asteroids.push({
            x: x, y: y,
            dx: speed * Math.cos(angle),
            dy: speed * Math.sin(angle),
            radius: ASTEROID_SIZE_LARGE,
            angle: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02, // Radians per frame
            vertices: createAsteroidVertices(ASTEROID_SIZE_LARGE),
            symbol: '@' // Always '@' for asteroids as requested
        });
    }
}

function breakAsteroid(index) {
    const asteroid = asteroids[index];
    let newSize, points;
    // Defensive: validate asteroid
    if (!asteroid || typeof asteroid.radius !== 'number') return;

    if (asteroid.radius === ASTEROID_SIZE_LARGE) {
        newSize = ASTEROID_SIZE_MEDIUM;
        points = ASTEROID_POINTS_LARGE;
    } else if (asteroid.radius === ASTEROID_SIZE_MEDIUM) {
        newSize = ASTEROID_SIZE_SMALL;
        points = ASTEROID_POINTS_MEDIUM;
    } else {
        points = ASTEROID_POINTS_SMALL;
        // Smallest asteroid, just remove it
        createExplosion(asteroid.x, asteroid.y, asteroid.radius, 'lightgrey');
        playSound('explosionSmall');
        asteroids.splice(index, 1);
        addScore(points);
        trySpawnPowerup(asteroid.x, asteroid.y);
        return;
    }

    // Create two smaller asteroids
    for (let i = 0; i < 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (ASTEROID_SPEED_MIN + Math.random() * (ASTEROID_SPEED_MAX - ASTEROID_SPEED_MIN)) * 1.2; // Slightly faster
        asteroids.push({
            x: asteroid.x, y: asteroid.y,
            dx: speed * Math.cos(angle),
            dy: speed * Math.sin(angle),
            radius: newSize,
            angle: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.03,
            vertices: createAsteroidVertices(newSize)
        });
    }
    createExplosion(asteroid.x, asteroid.y, asteroid.radius, 'grey');
    playSound(asteroid.radius === ASTEROID_SIZE_LARGE ? 'explosionLarge' : 'explosionSmall');
    asteroids.splice(index, 1);
    addScore(points);
    trySpawnPowerup(asteroid.x, asteroid.y);
}

function getAsteroidPoints(radius) {
    if (radius === ASTEROID_SIZE_LARGE) return ASTEROID_POINTS_LARGE;
    if (radius === ASTEROID_SIZE_MEDIUM) return ASTEROID_POINTS_MEDIUM;
    if (radius === ASTEROID_SIZE_SMALL) return ASTEROID_POINTS_SMALL;
    return 0;
}

// Powerups
function createPowerupObject(x, y, typeKey, typeDetails) {
    return {
        x: x, y: y,
        type: typeKey,
        details: typeDetails
    };
}

function trySpawnPowerup(x, y) {
    if (Math.random() < POWERUP_SPAWN_CHANCE) {
        const typeKeys = Object.keys(POWERUP_TYPES);
        const randomTypeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        powerups.push(createPowerupObject(x, y, randomTypeKey, POWERUP_TYPES[randomTypeKey]));
    }
}

function activatePowerUp(type) {
    const currentTime = performance.now();
    activePowerUps[type] = {
        active: true,
        endTime: currentTime + POWERUP_DURATION
    };
    playSound('powerup');
    updateHUD(); // Show active powerup
}

function resetActivePowerUps() {
    for (const type in activePowerUps) {
        activePowerUps[type] = { active: false, endTime: 0 };
    }
}

// Collisions
function checkBulletAsteroidCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
            if (distBetweenPointsSquared(bullets[i].x, bullets[i].y, asteroids[j].x, asteroids[j].y) < Math.pow(asteroids[j].radius, 2)) {
                bullets.splice(i, 1);
                breakAsteroid(j);
                break; // Bullet can only hit one asteroid
            }
        }
    }
}

function checkShipAsteroidCollisions() {
    if (!ship.isInvincible) {
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const tolerance = 5;
            const effectiveRadius = ship.radius + asteroids[i].radius - tolerance;
            // Ensure effectiveRadius is not negative before squaring
            const safeEffectiveRadius = Math.max(0, effectiveRadius); 
            if (distBetweenPointsSquared(ship.x, ship.y, asteroids[i].x, asteroids[i].y) < Math.pow(safeEffectiveRadius, 2)) {
                if (activePowerUps.SHIELD.active) {
                    activePowerUps.SHIELD.active = false; // Shield absorbs hit
                    playSound('shieldHit');
                    createExplosion(asteroids[i].x, asteroids[i].y, asteroids[i].radius, 'cyan');
                    asteroids.splice(i, 1); // Destroy asteroid
                    // Potentially spawn smaller ones or powerup if shield breaks it
                } else {
                    shipHit();
                }
                break;
            }
        }
    }
}

function checkShipPowerupCollisions() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        if (distBetweenPointsSquared(ship.x, ship.y, powerups[i].x, powerups[i].y) < Math.pow(ship.radius + POWERUP_COLLISION_RADIUS, 2) /* powerup radius */) {
            activatePowerUp(powerups[i].type);
            powerups.splice(i, 1);
            break;
        }
    }
}

function checkCollisions() {
    checkBulletAsteroidCollisions();
    checkShipAsteroidCollisions();
    checkShipPowerupCollisions();
}

function shipHit() {
    createExplosion(ship.x, ship.y, ship.radius * 2, 'red');
    playSound('explosionLarge');
    gameState.lives--;
    if (gameState.lives <= 0) {
        showGameOverScreen();
    } else {
        ship = newShip(); // Reset ship with invincibility
    }
    updateHUD();
}

// Particles
function createParticle(x, y, baseRadius, colorString) {
    const baseColor = hexToRgb(colorString) || {r:255, g:255, b:255};
    return {
        x: x, y: y,
        dx: (Math.random() - 0.5) * (baseRadius / PARTICLE_SPEED_MULTIPLIER + PARTICLE_BASE_SPEED_ADDON),
        dy: (Math.random() - 0.5) * (baseRadius / PARTICLE_SPEED_MULTIPLIER + PARTICLE_BASE_SPEED_ADDON),
        radius: Math.random() * (baseRadius / PARTICLE_RANDOM_RADIUS_FACTOR_FROM_BASE + PARTICLE_RANDOM_RADIUS_ADDON) + PARTICLE_MINIMUM_FIXED_RADIUS,
        alpha: 1,
        color: {
            r: Math.min(255, baseColor.r + Math.floor(Math.random() * PARTICLE_COLOR_VARIANCE - PARTICLE_COLOR_OFFSET)),
            g: Math.min(255, baseColor.g + Math.floor(Math.random() * PARTICLE_COLOR_VARIANCE - PARTICLE_COLOR_OFFSET)),
            b: Math.min(255, baseColor.b + Math.floor(Math.random() * PARTICLE_COLOR_VARIANCE - PARTICLE_COLOR_OFFSET))
        }
    };
}

function createExplosion(x, y, baseRadius, colorString) {
    const numParticles = Math.floor(baseRadius / 2) + 10;
    for (let i = 0; i < numParticles; i++) {
        particles.push(createParticle(x, y, baseRadius, colorString));
    }
}

// Game Logic
function checkLevelCompletion() {
    if (asteroids.length === 0 && !gameState.gameOver) {
        gameState.level++;
        spawnAsteroidsForLevel();
        // Maybe give bonus points or a smart bomb for clearing level
    }
}

function addScore(points) {
    gameState.score += points;
    updateHUD();
}

// HUD
function updateHUD() {
    domElements.scoreDisplay.textContent = `Score: ${gameState.score}`;
    domElements.livesDisplay.textContent = `Lives: ${'❤️'.repeat(gameState.lives)}`;
    domElements.bombsDisplay.textContent = `Bombs: ${'💣'.repeat(smartBombs)}`;
    domElements.highScoreDisplay.textContent = `High Score: ${gameState.highScore}`;

    let activePUText = "PowerUps: ";
    let hasActive = false;
    for (const type in activePowerUps) {
        if (activePowerUps[type].active) {
            const timeLeft = Math.max(0, Math.ceil((activePowerUps[type].endTime - performance.now()) / 1000));
            activePUText += `${POWERUP_TYPES[type].symbol}(${timeLeft}s) `;
            hasActive = true;
        }
    }
    powerupActiveDisplay.textContent = hasActive ? activePUText : "PowerUps: None";
}

// Input Handling
function keyDownHandler(e) {
    if (gameState.gameOver && e.key !== 'Enter' && e.key !== ' ') return; // Only allow restart on game over
    if (gameState.gameOver && (e.key === 'Enter' || e.key === ' ')) {
        if (!domElements.startScreen.classList.contains('hidden')) startGame(); // From start screen
        else if (!domElements.gameOverScreen.classList.contains('hidden')) startGame(); // From game over screen
        return;
    }

    keys[e.key.toLowerCase()] = true;

    if (e.key.toLowerCase() === 'p') {
        gameState.isPaused = !gameState.isPaused;
    }
    if (e.key.toLowerCase() === 'b') {
        activateSmartBomb();
    }
}

function keyUpHandler(e) {
    keys[e.key.toLowerCase()] = false;
}

function handleInput() {
    ship.rotation = 0;
    ship.isThrusting = false;

    if (keys['arrowleft'] || keys['a']) {
        ship.rotation = -SHIP_ROTATION_SPEED;
    }
    if (keys['arrowright'] || keys['d']) {
        ship.rotation = SHIP_ROTATION_SPEED;
    }
    if (keys['arrowup'] || keys['w']) {
        ship.isThrusting = true;
    }
    if (keys[' '] || keys['control']) { // Space or Control to shoot
        shootBullet();
    }
}

// Utility Functions
function wrapScreen(obj) {
    if (obj.x < -obj.radius) obj.x = CANVAS_WIDTH + obj.radius;
    if (obj.x > CANVAS_WIDTH + obj.radius) obj.x = -obj.radius;
    if (obj.y < -obj.radius) obj.y = CANVAS_HEIGHT + obj.radius;
    if (obj.y > CANVAS_HEIGHT + obj.radius) obj.y = -obj.radius;
}

function distBetweenPointsSquared(x1, y1, x2, y2) {
    return Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
}

function createOverlayDiv(text, options = {}) {
    let div = document.createElement('div');
    div.style.position = options.position || 'fixed';
    div.style.background = options.background || 'red';
    div.style.color = options.color || 'white';
    div.style.fontSize = options.fontSize || '1.2em';
    div.style.zIndex = options.zIndex || '9999';
    div.style.padding = options.padding || '10px';
    div.style.textAlign = options.textAlign || 'center';
    if (options.top) div.style.top = options.top;
    if (options.left) div.style.left = options.left;
    if (options.bottom) div.style.bottom = options.bottom;
    if (options.width) div.style.width = options.width;
    if (options.margin) div.style.margin = options.margin;
    if (options.pointerEvents) div.style.pointerEvents = options.pointerEvents;
    div.textContent = text;
    document.body.appendChild(div);
    return div;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
