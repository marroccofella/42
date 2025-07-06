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

// Game State Variables
let canvas, ctx;
let ship;
let bullets = [];
let asteroids = [];
let particles = [];
let powerups = [];

let score = 0;
let lives = 3;
let level = 1;
let highScore = localStorage.getItem('asteroidsHighScoreV4') || 0;
let gameOver = true;
let isPaused = false;

// let keys = {}; // moved to above for clarity
let lastShotTime = 0;
let smartBombs = SMART_BOMBS_START;

let activePowerUps = {
    SHIELD: { active: false, endTime: 0 },
    RAPID_FIRE: { active: false, endTime: 0 },
    MULTI_SHOT: { active: false, endTime: 0 }
};

// DOM Elements
let startScreen, gameOverScreen, scoreDisplay, livesDisplay, highScoreDisplay, finalScoreElement, startButton, restartButton, bombsDisplay, powerupActiveDisplay;

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
    if (canvas) canvas.setAttribute('aria-label', 'Asteroids Game Canvas');
    if (startButton) startButton.setAttribute('aria-label', 'Start Game');
    if (restartButton) restartButton.setAttribute('aria-label', 'Restart Game');
    if (scoreDisplay) scoreDisplay.setAttribute('aria-label', 'Current Score');
    if (livesDisplay) livesDisplay.setAttribute('aria-label', 'Lives Remaining');
    if (bombsDisplay) bombsDisplay.setAttribute('aria-label', 'Smart Bombs');
    if (powerupActiveDisplay) powerupActiveDisplay.setAttribute('aria-label', 'Active Powerup');
    if (highScoreDisplay) highScoreDisplay.setAttribute('aria-label', 'High Score');
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
    let div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '100vw';
    div.style.background = 'red';
    div.style.color = 'white';
    div.style.fontSize = '1.2em';
    div.style.zIndex = '9999';
    div.style.padding = '10px 10px';
    div.style.textAlign = 'center';
    div.textContent = 'Ateroids v4.0 JS ERROR: ' + message + ' at ' + source + ':' + lineno + ':' + colno;
    document.body.appendChild(div);
    return false;
};

function debugOverlay(msg) {
    let div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.bottom = '0';
    div.style.left = '0';
    div.style.background = 'rgba(0,0,0,0.8)';
    div.style.color = 'lime';
    div.style.fontSize = '1em';
    div.style.zIndex = '9998';
    div.style.padding = '4px 10px';
    div.style.margin = '2px';
    div.style.pointerEvents = 'none';
    div.textContent = '[DEBUG] ' + msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 8000);
}

debugOverlay('window.onload fired');
window.onload = () => {
    let errorMsg = '';
    function checkElem(id) {
        const elem = document.getElementById(id);
        if (!elem) {
            errorMsg += `Missing element: #${id}\n`;
            console.error(`Ateroids v4.0 ERROR: Missing element #${id}`);
        }
        return elem;
    }
    canvas = checkElem('gameCanvas');
    ctx = canvas ? canvas.getContext('2d') : null;
    if (canvas) {
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
    }
    startScreen = checkElem('start-screen');
    gameOverScreen = checkElem('game-over');
    scoreDisplay = checkElem('score-display');
    livesDisplay = checkElem('lives-display');
    bombsDisplay = checkElem('bombs-display');
    powerupActiveDisplay = checkElem('powerup-active-display');
    highScoreDisplay = checkElem('high-score-display');
    finalScoreElement = checkElem('final-score');
    startButton = checkElem('start-button');
    restartButton = checkElem('restart-button');

    debugOverlay('All DOM elements checked');
    if (errorMsg) {
        // Show a visible error on the page
        let div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '0';
        div.style.left = '0';
        div.style.width = '100vw';
        div.style.background = 'red';
        div.style.color = 'white';
        div.style.fontSize = '2em';
        div.style.zIndex = '9999';
        div.style.padding = '30px 10px';
        div.style.textAlign = 'center';
        div.textContent = 'Ateroids v4.0 ERROR: ' + errorMsg;
        document.body.appendChild(div);
        return;
    }

    // Event Listeners
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    startButton.addEventListener('click', function(e) {
        debugOverlay('Start button clicked');
        startGame();
    });
    restartButton.addEventListener('click', function(e) {
        debugOverlay('Restart button clicked');
        startGame();
    });

    debugOverlay('Sounds loading...');
    loadSounds();
    debugOverlay('HUD updating...');
    updateHUD();
    setAriaLabels();
    setupTouchControls();
    debugOverlay('Showing start screen...');
    showStartScreen();
    debugOverlay('Requesting animation frame for gameLoop...');
    requestAnimationFrame(gameLoop);
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
    gameOver = false;
    isPaused = false;
    score = 0;
    lives = 3;
    level = 1;
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
    if (!gameLoopRunning) { // Ensure gameLoop isn't started multiple times if already running
        gameLoopRunning = true;
        requestAnimationFrame(gameLoop);
    }
}

let gameLoopRunning = false; // To prevent multiple loops from starting

function showStartScreen() {
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    updateHUD(); // Update high score on start screen
}

function showGameOverScreen() {
    gameOver = true;
    gameLoopRunning = false; // Stop the loop logic
    gameOverScreen.classList.remove('hidden');
    startScreen.classList.add('hidden');
    finalScoreElement.textContent = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('asteroidsHighScoreV4', highScore);
    }
    updateHUD();
}

function hideScreens() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
}

// Game Loop
function gameLoop(currentTime) {
    if (!canvas || !ctx) return; // Defensive: abort if canvas/context missing
    if (gameOver && !startScreen.classList.contains('hidden')) {
        // If game is over and start screen is shown, don't run game logic, but keep rendering HUD for high score
        updateHUD();
        requestAnimationFrame(gameLoop);
        return;
    }
    if (gameOver) {
        gameLoopRunning = false;
        return; // Stop loop if game over and not on start screen
    }
    if (!gameLoopRunning && !gameOver) gameLoopRunning = true; // Re-engage if game restarted

    const deltaTime = (currentTime - lastTime) / 1000; // seconds
    lastTime = currentTime;
    gameTime += deltaTime;

    if (!isPaused) {
        handleInput(deltaTime);
        update(deltaTime, currentTime);
    }
    render();

    if (gameLoopRunning) requestAnimationFrame(gameLoop);
}

// Input Handling
function handleInput(dt) {
    // Reset rotation/thrust
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
    // Shooting (only on keydown, not held)
    if ((keys[' '] || keys['control']) && !shootPressed) {
        shootBullet();
        shootPressed = true;
    }
    if (!(keys[' '] || keys['control'])) {
        shootPressed = false;
    }
    // Smart bomb (key: b)
    if (keys['b']) {
        activateSmartBomb();
        keys['b'] = false; // Prevent repeat
    }
}

function keyDownHandler(e) {
    keys[e.key.toLowerCase()] = true;
}

function keyUpHandler(e) {
    keys[e.key.toLowerCase()] = false;
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
        powerups[i].y += 30 * dt; // Move downwards
        if (powerups[i].y > CANVAS_HEIGHT + 20) {
            powerups.splice(i, 1);
        }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.dx * dt;
        p.y += p.dy * dt;
        p.alpha -= dt * 2; // Fade out
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
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars (simple parallax)
    drawStars(ctx, gameTime);

    // Draw particles
    particles.forEach(p => {
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw powerups
    powerups.forEach(p => {
        ctx.fillStyle = p.details.color;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.details.symbol, p.x, p.y);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.stroke();
    });

    // Draw asteroids
    asteroids.forEach(drawAsteroid);

    // Draw bullets
    ctx.fillStyle = 'yellow';
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw ship
    if (!ship.isInvincible || Math.floor(performance.now() / SHIP_BLINK_INTERVAL) % 2 === 0) {
        drawShip();
    }

    // Draw Shield
    if (activePowerUps.SHIELD.active) {
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw Pause Text if paused
    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
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
    ctx.strokeStyle = 'white';
    ctx.lineWidth = SHIP_SIZE / 15;
    ctx.beginPath();
    // Nose
    ctx.moveTo(
        ship.x + ship.radius * Math.cos(ship.angle),
        ship.y + ship.radius * Math.sin(ship.angle)
    );
    // Left wing
    ctx.lineTo(
        ship.x + ship.radius * Math.cos(ship.angle + Math.PI * 0.8),
        ship.y + ship.radius * Math.sin(ship.angle + Math.PI * 0.8)
    );
    // Right wing
    ctx.lineTo(
        ship.x + ship.radius * Math.cos(ship.angle - Math.PI * 0.8),
        ship.y + ship.radius * Math.sin(ship.angle - Math.PI * 0.8)
    );
    ctx.closePath();
    ctx.stroke();

    if (ship.isThrusting) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo( // Rear center
            ship.x - ship.radius * 0.6 * Math.cos(ship.angle),
            ship.y - ship.radius * 0.6 * Math.sin(ship.angle)
        );
        ctx.lineTo( // Flame point 1
            ship.x - ship.radius * 1.2 * Math.cos(ship.angle + 0.1),
            ship.y - ship.radius * 1.2 * Math.sin(ship.angle + 0.1)
        );
        ctx.lineTo( // Flame point 2
            ship.x - ship.radius * 1.2 * Math.cos(ship.angle - 0.1),
            ship.y - ship.radius * 1.2 * Math.sin(ship.angle - 0.1)
        );
        ctx.closePath();
        ctx.fill();
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

function shootBullet() {
    const currentTime = performance.now();
    let cooldown = BULLET_COOLDOWN;
    if (activePowerUps.RAPID_FIRE.active) cooldown /= 3;

    if (currentTime - lastShotTime < cooldown) return;
    lastShotTime = currentTime;

    const baseBullet = {
        x: ship.x + ship.radius * Math.cos(ship.angle),
        y: ship.y + ship.radius * Math.sin(ship.angle),
        dx: BULLET_SPEED * Math.cos(ship.angle) + ship.dx * 0.5, // Add some ship velocity
        dy: BULLET_SPEED * Math.sin(ship.angle) + ship.dy * 0.5,
        life: BULLET_LIFETIME
    };
    bullets.push(baseBullet);
    playSound('shoot');

    if (activePowerUps.MULTI_SHOT.active) {
        const angleOffset = Math.PI / 12; // 15 degrees
        bullets.push({
            ...baseBullet,
            dx: BULLET_SPEED * Math.cos(ship.angle - angleOffset) + ship.dx * 0.5,
            dy: BULLET_SPEED * Math.sin(ship.angle - angleOffset) + ship.dy * 0.5,
        });
        bullets.push({
            ...baseBullet,
            dx: BULLET_SPEED * Math.cos(ship.angle + angleOffset) + ship.dx * 0.5,
            dy: BULLET_SPEED * Math.sin(ship.angle + angleOffset) + ship.dy * 0.5,
        });
    }
}

function activateSmartBomb() {
    if (smartBombs > 0 && !gameOver) {
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
    ctx.strokeStyle = 'grey';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(asteroid.x + asteroid.vertices[0].x, asteroid.y + asteroid.vertices[0].y);
    for (let i = 1; i < asteroid.vertices.length; i++) {
        ctx.lineTo(asteroid.x + asteroid.vertices[i].x, asteroid.y + asteroid.vertices[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    // Draw '@' symbol at center for accessibility/clarity
    ctx.save();
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(asteroid.symbol || '@', asteroid.x, asteroid.y);
    ctx.restore();
}

function spawnAsteroidsForLevel() {
    const numAsteroids = ASTEROID_NUM_START + level -1;
    for (let i = 0; i < numAsteroids; i++) {
        let x, y;
        do { // Ensure asteroids don't spawn on top of the ship
            x = Math.random() * CANVAS_WIDTH;
            y = Math.random() * CANVAS_HEIGHT;
        } while (distBetweenPoints(ship.x, ship.y, x, y) < ASTEROID_SIZE_LARGE * 2 + ship.radius);

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
function trySpawnPowerup(x, y) {
    if (Math.random() < POWERUP_SPAWN_CHANCE) {
        const typeKeys = Object.keys(POWERUP_TYPES);
        const randomTypeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        powerups.push({
            x: x, y: y,
            type: randomTypeKey,
            details: POWERUP_TYPES[randomTypeKey]
        });
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
function checkCollisions() {
    // Bullet-Asteroid
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
            if (distBetweenPoints(bullets[i].x, bullets[i].y, asteroids[j].x, asteroids[j].y) < asteroids[j].radius) {
                bullets.splice(i, 1);
                breakAsteroid(j);
                break; // Bullet can only hit one asteroid
            }
        }
    }

    // Ship-Asteroid
    if (!ship.isInvincible) {
        for (let i = asteroids.length - 1; i >= 0; i--) {
            if (distBetweenPoints(ship.x, ship.y, asteroids[i].x, asteroids[i].y) < ship.radius + asteroids[i].radius - 5 /* slight tolerance */) {
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

    // Ship-Powerup
    for (let i = powerups.length - 1; i >= 0; i--) {
        if (distBetweenPoints(ship.x, ship.y, powerups[i].x, powerups[i].y) < ship.radius + 15 /* powerup radius */) {
            activatePowerUp(powerups[i].type);
            powerups.splice(i, 1);
            break;
        }
    }
}

function shipHit() {
    createExplosion(ship.x, ship.y, ship.radius * 2, 'red');
    playSound('explosionLarge');
    lives--;
    if (lives <= 0) {
        showGameOverScreen();
    } else {
        ship = newShip(); // Reset ship with invincibility
    }
    updateHUD();
}

// Particles
function createExplosion(x, y, baseRadius, colorString) {
    const numParticles = Math.floor(baseRadius / 2) + 10;
    const baseColor = hexToRgb(colorString) || {r:255, g:255, b:255}; // Default white
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: x, y: y,
            dx: (Math.random() - 0.5) * (baseRadius / 5 + 3),
            dy: (Math.random() - 0.5) * (baseRadius / 5 + 3),
            radius: Math.random() * (baseRadius / 10 + 1) + 1,
            alpha: 1,
            color: {
                r: Math.min(255, baseColor.r + Math.floor(Math.random() * 50 - 25)),
                g: Math.min(255, baseColor.g + Math.floor(Math.random() * 50 - 25)),
                b: Math.min(255, baseColor.b + Math.floor(Math.random() * 50 - 25))
            }
        });
    }
}

// Game Logic
function checkLevelCompletion() {
    if (asteroids.length === 0 && !gameOver) {
        level++;
        spawnAsteroidsForLevel();
        // Maybe give bonus points or a smart bomb for clearing level
    }
}

function addScore(points) {
    score += points;
    updateHUD();
}

// HUD
function updateHUD() {
    scoreDisplay.textContent = `Score: ${score}`;
    livesDisplay.textContent = `Lives: ${'❤️'.repeat(lives)}`;
    bombsDisplay.textContent = `Bombs: ${'💣'.repeat(smartBombs)}`;
    highScoreDisplay.textContent = `High Score: ${highScore}`;

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
    if (gameOver && e.key !== 'Enter' && e.key !== ' ') return; // Only allow restart on game over
    if (gameOver && (e.key === 'Enter' || e.key === ' ')) {
        if (!startScreen.classList.contains('hidden')) startGame(); // From start screen
        else if (!gameOverScreen.classList.contains('hidden')) startGame(); // From game over screen
        return;
    }

    keys[e.key.toLowerCase()] = true;

    if (e.key.toLowerCase() === 'p') {
        isPaused = !isPaused;
    }
    if (e.key.toLowerCase() === 'b') {
        activateSmartBomb();
    }
}

function keyUpHandler(e) {
    keys[e.key.toLowerCase()] = false;
}

function handleInput(dt) {
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

function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
