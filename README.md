# Ateroids v4.0

A classic arcade-style asteroids shooter game implemented in HTML, CSS, and pure JavaScript. Navigate your ship, destroy asteroids, and collect power-ups to achieve the highest score!

## How to Play / Run

1.  Clone or download the repository.
2.  Open the `index.html` file in a modern web browser.

## Controls

*   **Arrow Left / 'A' Key:** Rotate ship left
*   **Arrow Right / 'D' Key:** Rotate ship right
*   **Arrow Up / 'W' Key:** Thrust ship forward
*   **Spacebar / Control Key:** Shoot bullet
*   **'B' Key:** Activate Smart Bomb (destroys all visible asteroids)
*   **'P' Key:** Pause / Unpause game

On-screen touch controls will also appear on touch-enabled devices.

## Key Features

*   **Ship Navigation:** Control your spaceship with rotation and thrust.
*   **Asteroid Destruction:** Shoot and destroy asteroids of varying sizes (Large, Medium, Small).
*   **Scoring System:** Earn points for destroying asteroids.
*   **Lives System:** Start with a set number of lives; lose a life upon collision.
*   **Level Progression:** Advance to new levels by clearing all asteroids.
*   **High Score:** Your highest score is saved locally in your browser.
*   **Power-ups:**
    *   **Shield:** Provides temporary protection from one collision.
    *   **Rapid Fire:** Increases bullet firing rate.
    *   **Multi-Shot:** Fires three bullets simultaneously in a spread.
*   **Smart Bombs:** Limited-use weapon that destroys all asteroids on screen for half points.
*   **Particle Effects:** Visual explosions for ship and asteroid destruction.
*   **Sound Effects:** Audio feedback for key game events.
*   **Responsive Design:** Adapts to different screen sizes.

## Codebase Overview

The project is structured with three main files:

*   **`index.html`:** Provides the main HTML structure, game canvas, HUD elements, and overlay screens.
*   **`style.css`:** Contains all CSS rules for styling the game, including layout, colors, and responsiveness. It uses CSS variables for easy theming.
*   **`game.js`:** The core of the project, this single JavaScript file manages:
    *   Game state (score, lives, levels, game over, pause)
    *   Game loop and timing
    *   Rendering of all game elements on the HTML5 Canvas
    *   Input handling (keyboard and touch)
    *   Collision detection
    *   Physics and movement for ship, bullets, and asteroids
    *   Power-up logic
    *   HUD updates
    *   Sound effect playback
    *   Error handling and debug overlays

## Recent Refactoring

This codebase recently underwent significant refactoring (as of this version) to improve its structure, maintainability, readability, and performance. Key improvements include:

*   Grouping global state variables into `gameState` and `domElements` objects.
*   Modularizing functions (e.g., for initialization, collision checking, entity creation).
*   Replacing "magic numbers" with named constants.
*   Optimizing collision detection (using squared distances).
*   Removing redundant code and improving overall code clarity.
*   Semantic improvements to HTML and cleanup of CSS.
