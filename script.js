// ===================
// Constants and Initial Setup
// ===================
const gameboard = document.querySelector("#gameboard");
const ctx = gameboard.getContext("2d");
const scoreText = document.querySelector("#scoreText");
const aiScoreText = document.querySelector("#aiScoreText");
const startBtn = document.getElementById("startBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");
const aiMode = document.getElementById("aiMode");
const playerVsAiMode = document.getElementById("playerVsAiMode");

// audio elements
const menuMusic = document.getElementById("menuMusic");
const gameMusic = document.getElementById("gameMusic");
const gameOverMusic = document.getElementById("gameOver");

// ===================
// Game Configuration
// ===================
const gameWidth = gameboard.width;
const gameHeight = gameboard.height;
const unitSize = 25;

// ===================
// Game Configuration
// ===================
const boardBackground = "green";
const snakeBorder = "black";
const foodColor = "orange";
const obstacleColor = "red";

// ===================
// Game State Variables
// ===================
let running = false;
let isAiMode = false;
let isPlayerVsAiMode = false;
let gameSpeed = 200;
let foodx, foody, score, aiScore;

// Arrays to hold the positions of the snakes and obstacles
let playerSnake = [];
let aiSnake = [];
let obstacles = [];

// Velocity variables for snake movement
let playerXVelocity = unitSize;
let playerYVelocity = 0;
let aiXVelocity = unitSize;
let aiYVelocity = 0;

// Snake Color
let playerSnakeColor = 'red';
let aiSnakeColor = 'blue';

// ===================
// Update Score Display Colors
// ===================

function updateScoreDisplayColors() {
    scoreText.style.color = playerSnakeColor;
    aiScoreText.style.color = aiSnakeColor;
}

updateScoreDisplayColors();
// Event Listeners sa music intro
document.addEventListener("DOMContentLoaded", () => {
    menuMusic.volume = 0.4;
    menuMusic.play(); // Start playing menu music
});

// ===================
// Game Control Functions
// ===================
function startGame() {
    if (!running) {
        // Stop menu music and reset
        menuMusic.pause();
        menuMusic.currentTime = 0;

        // Stop game over music if it's playing
        gameOverMusic.pause();
        gameOverMusic.currentTime = 0;
        gameOverMusic.volume = 0.3;
        // Start game music
        gameMusic.volume = 0.4; // Set volume for game music
        gameMusic.play(); // Start playing game music

        // Hide start menu and show game container
        document.getElementById("startMenu").style.display = "none";
        document.getElementById("gameContainer").style.display = "block";

        // Initialize the game
        initializeGame();
    }
}

function initializeGame() {
    running = true;
    score = 0;
    aiScore = 0;

    // Always start the player snake in player vs AI mode
    playerXVelocity = unitSize; // Default movement to the right
    playerYVelocity = 0;

    // Initialize the player snake
    playerSnake = [
        { x: unitSize * 5, y: 0 },
        { x: unitSize * 4, y: 0 },
        { x: unitSize * 3, y: 0 }
    ];

    // Initialize the AI snake
    aiSnake = [
        { x: unitSize * 10, y: unitSize * 10 },
        { x: unitSize * 9, y: unitSize * 10 },
        { x: unitSize * 8, y: unitSize * 10 }
    ];

    // Generate obstacles and create food
    obstacles = generateObstacles(10);
    createFood();

    // Update score displays
    scoreText.textContent = `Player Score: ${score}`;
    aiScoreText.textContent = `AI Score: ${aiScore}`;

    // Start the game loop
    nextTick();
}

// ===================
// Game Loop
// ===================
let lastUpdateTime = 0; // Tracks the last update time
const speed = 5; // Snake moves 5 cells per second

function nextTick() {
    if (running) {       
        const f = async () => {
            clearBoard();
            drawObstacles();
            drawFood();

            if (mode === 'player-vs-ai' && playerSnake.length > 0) {
                movePlayerSnake();
                drawSnake(playerSnake, playerSnakeColor);

                moveAiSnake();
                drawSnake(aiSnake, aiSnakeColor);
            }

            if (mode === 'ai-only') {
                moveAiSnake();
                drawSnake(aiSnake, aiSnakeColor);
            }

            // Check for game over condition
            checkGameOver();

            // If the game is still running, continue the game loop
            if (running) {
                await new Promise(res => setTimeout(res, 
                    mode === 'ai-only' ? 50 : 200
                ));
                requestAnimationFrame(f);
            } else {
                displayGameOver(); // Display game over screen
            }
        }

        requestAnimationFrame(f);
    }
}

// ===================
// Movement Functions
// ===================

function movePlayerSnake() {
    if (playerSnake.length === 0) return; // Skip if no player snake
    const head = { x: playerSnake[0].x + playerXVelocity, y: playerSnake[0].y + playerYVelocity };
    playerSnake.unshift(head);

    if (head.x === foodx && head.y === foody) {
        score++;
        scoreText.textContent = `Player Score: ${score}`;
        createFood();
    } else {
        playerSnake.pop();
    }
}
// Moves the AI snake based on its logic
function moveAiSnake() {
    const head = { x: aiSnake[0].x, y: aiSnake[0].y };
    const path = findPathToTarget(head, { x: foodx, y: foody });

    if (path.length > 0) {
        const delta = getDelta(path[0]);
        aiXVelocity = delta.dx;
        aiYVelocity = delta.dy;
    } else {
        const safeDirection = safeMove(aiSnake);
        const delta = getDelta(safeDirection);
        aiXVelocity = delta.dx;
        aiYVelocity = delta.dy;
    }

    const newHead = { x: head.x + aiXVelocity, y: head.y + aiYVelocity };

    if (isOutOfBounds(newHead) || isCollision(newHead, aiSnake)) {
        displayGameOver();
        return;
    }

    aiSnake.unshift(newHead);

    if (newHead.x === foodx && newHead.y === foody) {
        aiScore++;
        aiScoreText.textContent = `AI Score: ${aiScore}`;
        createFood();
    } else {
        aiSnake.pop();
    }
}
// drawing the snake
function drawSnake(snake, color) {
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Draw the head of the snake with eyes
            ctx.fillStyle = "darkgreen"; // Head color
            ctx.strokeStyle = "black"; // Head border
            ctx.fillRect(segment.x, segment.y, unitSize, unitSize);
            ctx.strokeRect(segment.x, segment.y, unitSize, unitSize);

            // Draw eyes on the head
            const eyeSize = unitSize / 5; // Size of the eyes
            const eyeOffsetX = unitSize / 4; // Offset for eye placement
            const eyeOffsetY = unitSize / 8; // Offset for eye placement

            ctx.fillStyle = "white"; // Eye color
            ctx.beginPath();
            // Left eye
            ctx.arc(
                segment.x + eyeOffsetX,
                segment.y + eyeOffsetY,
                eyeSize,
                0,
                2 * Math.PI
            );
            ctx.fill();

            // Right eye
            ctx.arc(
                segment.x + unitSize - eyeOffsetX,
                segment.y + eyeOffsetY,
                eyeSize,
                0,
                2 * Math.PI
            );
            ctx.fill();

            ctx.fillStyle = "black"; // Pupil color
            ctx.beginPath();
            // Left pupil
            ctx.arc(
                segment.x + eyeOffsetX,
                segment.y + eyeOffsetY,
                eyeSize / 2,
                0,
                2 * Math.PI
            );
            ctx.fill();

            // Right pupil
            ctx.arc(
                segment.x + unitSize - eyeOffsetX,
                segment.y + eyeOffsetY,
                eyeSize / 2,
                0,
                2 * Math.PI
            );
            ctx.fill();
        } else {
            // Draw the body segments
            ctx.fillStyle = color; // Body color
            ctx.strokeStyle = "black"; // Body border
            ctx.fillRect(segment.x, segment.y, unitSize, unitSize);
            ctx.strokeRect(segment.x, segment.y, unitSize, unitSize);
        }
    });
}

// ===================
// Game Over Logic
// ===================
function checkGameOver() {
    const playerHead = playerSnake[0];
    const aiHead = aiSnake[0];

    if (
        isCollision(playerHead, playerSnake.slice(1)) ||
        isCollision(playerHead, obstacles) ||
        isOutOfBounds(playerHead) ||
        (mode === 'player-vs-ai' && isCollision(playerHead, aiSnake)) ||
        isCollision(aiHead, aiSnake.slice(1)) ||
        isCollision(aiHead, obstacles) ||
        isOutOfBounds(aiHead) ||
        (mode === 'ai-only' && isCollision(aiHead, playerSnake))
    ) {
        running = false;
    }
}

function displayGameOver() {
    gameMusic.pause(); // Stop the game music
    gameMusic.currentTime = 0; // Reset to the start
    // Play game over music
    gameOverMusic.currentTime = 0; // Reset game over music
    gameOverMusic.play(); // Start playing game over music

    const ctx = document.getElementById("gameboard").getContext("2d");
    ctx.fillStyle = "black";
    ctx.font = "50px Arial";
    const gameOverText = "Game Over!";
    const gameOverTextWidth = ctx.measureText(gameOverText).width;
    ctx.fillText(gameOverText, (gameWidth - gameOverTextWidth) / 2, gameHeight / 2 - 30);

    ctx.font = "30px Arial";
    const playerScoreText = `Player Score: ${score}`;
    const aiScoreText = `AI Score: ${aiScore}`;

    const playerScoreTextWidth = ctx.measureText(playerScoreText).width;
    const aiScoreTextWidth = ctx.measureText(aiScoreText).width;

    ctx.fillText(playerScoreText, (gameWidth - playerScoreTextWidth) / 2, gameHeight / 2 + 20);
    ctx.fillText(aiScoreText, (gameWidth - aiScoreTextWidth) / 2, gameHeight / 2 + 60);

    const winnerText = score > aiScore ? "You Win!" : aiScore > score ? "AI Wins!" : "It's a Tie!";
    const winnerTextWidth = ctx.measureText(winnerText).width;
    ctx.fillText(winnerText, (gameWidth - winnerTextWidth) / 2, gameHeight / 2 + 100);
}

let mode = 'ai-only'

document.getElementById("playerVsAi").addEventListener("click", () => {
    mode = 'ai-only'
    startGame()
})


// Event listener for the start button
document.getElementById("playerVsAiMode").addEventListener("click", () => {
    mode = 'player-vs-ai'
    startGame()
})

document.getElementById("backToMenuBtn").addEventListener("click", () => {
    // Stop the game and return to the menu
    gameMusic.pause(); // Stop game music
    gameMusic.currentTime = 0; // Reset to the start
    menuMusic.currentTime = 0; // Reset menu music
    menuMusic.play(); // Play menu music again

    // Show the start menu and hide the game container
    document.getElementById("gameContainer").style.display = "none";
    document.getElementById("startMenu").style.display = "block";
});
// ===================
// Utility Functions
// ===================
function isOutOfBounds(head) {
    return head.x < 0 || head.y < 0 || head.x >= gameWidth || head.y >= gameHeight;
}

function isCollision(head, array) {
    return array.some(segment => segment.x === head.x && segment.y === head.y);
}

function clearBoard() {
    ctx.fillStyle = boardBackground;
    ctx.fillRect(0, 0, gameWidth, gameHeight);
}

// ===================
// Food creation
// ===================
function createFood() {
    do {
        foodx = Math.floor(Math.random() * (gameWidth / unitSize)) * unitSize;
        foody = Math.floor(Math.random() * (gameHeight / unitSize)) * unitSize;
    } while (
        playerSnake.some(segment => segment.x === foodx && segment.y === foody) ||
        aiSnake.some(segment => segment.x === foodx && segment.y === foody) ||
        obstacles.some(block => block.x === foodx && block.y === foody)
    );
}

function drawFood() {
    ctx.fillStyle = foodColor;
    ctx.beginPath();
    ctx.arc(foodx + unitSize / 2, foody + unitSize / 2, unitSize / 2, 0, Math.PI * 2);
    ctx.fill();
}

// ===================
// For obstacle
// ===================
function generateObstacles(count) {
    const blocks = [];
    while (blocks.length < count) {
        const x = Math.floor(Math.random() * (gameWidth / unitSize)) * unitSize;
        const y = Math.floor(Math.random() * (gameHeight / unitSize)) * unitSize;

        if (
            !playerSnake.some(segment => segment.x === x && segment.y === y) &&
            !aiSnake.some(segment => segment.x === x && segment.y === y) &&
            !blocks.some(block => block.x === x && block.y === y)
        ) {
            blocks.push({ x, y });
        }
    }
    return blocks;
}

function drawObstacles() {
    ctx.fillStyle = obstacleColor;
    obstacles.forEach(block => ctx.fillRect(block.x, block.y, unitSize, unitSize));
}

// ===================
// Pathfinding Function (BFS)
// ===================
function findPathToTarget(start, target) {
    const queue = [{ x: start.x, y: start.y, path: [] }];
    const visited = new Set();
    visited.add(`${start.x},${start.y}`);

    while (queue.length > 0) {
        const { x, y, path } = queue.shift();

        if (x === target.x && y === target.y) {
            return path;
        }

        for (const [dx, dy, direction] of [
            [unitSize, 0, 39],
            [-unitSize, 0, 37],
            [0, -unitSize, 38],
            [0, unitSize, 40],
        ]) {
            const nx = x + dx;
            const ny = y + dy;

            if (isValidCell(nx, ny, visited)) {
                visited.add(`${nx},${ny}`);
                queue.push({
                    x: nx,
                    y: ny,
                    path: [...path, direction],
                });
            }
        }
    }

    return [];
}

// ===================
// Safe Move Function (Decision Making)
// ===================
function safeMove(snake) {
    const head = snake[0];
    let bestMove = null;
    let maxOpenSpace = -1;

    for (const [dx, dy, direction] of [
        [unitSize, 0, 39],
        [-unitSize, 0, 37],
        [0, -unitSize, 38],
        [0, unitSize, 40],
    ]) {
        const nx = head.x + dx;
        const ny = head.y + dy;

        if (isValidCell(nx, ny, new Set())) {
            const openSpace = calculateOpenSpace({ x: nx, y: ny });

            if (openSpace > maxOpenSpace) {
                maxOpenSpace = openSpace;
                bestMove = direction;
            }
        }
    }

    return bestMove || 39; // Default to right if no move found
}

// ===================
// Open Space Calculation (BFS-like traversal)
// ===================
function calculateOpenSpace(start) {
    const queue = [start];
    const visited = new Set();
    visited.add(`${start.x},${start.y}`);
    let space = 0;

    while (queue.length > 0) {
        const { x, y } = queue.shift();
        space++;

        for (const [dx, dy] of [
            [unitSize, 0],
            [-unitSize, 0],
            [0, -unitSize],
            [0, unitSize],
        ]) {
            const nx = x + dx;
            const ny = y + dy;

            if (isValidCell(nx, ny, visited)) {
                visited.add(`${nx},${ny}`);
                queue.push({ x: nx, y: ny });
            }
        }
    }

    return space;
}

// ===================
// Valid Cell Check (Utility Function)
// ===================
function isValidCell(x, y, visited) {
    return (
        x >= 0 &&
        y >= 0 &&
        x < gameWidth &&
        y < gameHeight &&
        !visited.has(`${x},${y}`) &&
        !playerSnake.some(segment => segment.x === x && segment.y === y) &&
        !aiSnake.some(segment => segment.x === x && segment.y === y) &&
        !obstacles.some(block => block.x === x && block.y === y)
    );
}

// ===================
// Direction Delta Getter (Utility Function)
// ===================
function getDelta(direction) {
    switch (direction) {
        case 37: return { dx: -unitSize, dy: 0 }; // Left
        case 38: return { dx: 0, dy: -unitSize }; // Up
        case 39: return { dx: unitSize, dy: 0 };  // Right
        case 40: return { dx: 0, dy: unitSize };  // Down
        default: return { dx: 0, dy: 0 };
    }
}

// ===================
// Keyboard Event Listener 
// ===================
document.addEventListener("keydown", changeDirection);
function changeDirection(event) {
    const keyPressed = event.keyCode;

    const LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40;
    const A = 65, W = 87, D = 68, S = 83;

    if (keyPressed === LEFT && playerXVelocity === 0) {
        playerXVelocity = -unitSize; playerYVelocity = 0;
    } else if (keyPressed === UP && playerYVelocity === 0) {
        playerXVelocity = 0; playerYVelocity = -unitSize;
    } else if (keyPressed === RIGHT && playerXVelocity === 0) {
        playerXVelocity = unitSize; playerYVelocity = 0;
    } else if (keyPressed === DOWN && playerYVelocity === 0) {
        playerXVelocity = 0; playerYVelocity = unitSize;
    }

    // Allow alternate controls for a second player
    if (keyPressed === A && playerXVelocity === 0) {
        playerXVelocity = -unitSize; playerYVelocity = 0;
    } else if (keyPressed === W && playerYVelocity === 0) {
        playerXVelocity = 0; playerYVelocity = -unitSize;
    } else if (keyPressed === D && playerXVelocity === 0) {
        playerXVelocity = unitSize; playerYVelocity = 0;
    } else if (keyPressed === S && playerYVelocity === 0) {
        playerXVelocity = 0; playerYVelocity = unitSize;
    }
}

// ===================
// Game Mode Event Listeners 
// ===================
playerVsAiMode.addEventListener("click", () => {
    isPlayerVsAiMode = true;
    isAiMode = false;
    startGame();
});

backToMenuBtn.addEventListener("click", () => {
    running = false; // Stop the game
    gameMusic.pause(); // Stop game music
    gameMusic.currentTime = 0; // Reset to the start

    // Stop and reset game over music
    gameOverMusic.pause(); 
    gameOverMusic.currentTime = 0;

    // Show the start menu and hide the game container
    document.getElementById("gameContainer").style.display = "none";
    document.getElementById("startMenu").style.display = "block";

    // Reset and play menu music
    menuMusic.currentTime = 0; // Reset menu music to start
    menuMusic.play();
});

startBtn.addEventListener("click", () => {
    startGame();
});