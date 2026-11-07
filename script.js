
// 1. เชื่อมต่อกับ Canvas
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");

// 2. กำหนดขนาดกระดาน
const SIZE = 30;
const COLS = 10;
const ROWS = 20;

// 3. กำหนดรูปแบบบล็อกทั้ง 7 แบบ
const SHAPES = [
    [[1, 1, 1, 1]],

    [[1, 1],
     [1, 1]],

    [[0, 1, 0],
     [1, 1, 1]],

    [[1, 0, 0],
     [1, 1, 1]],

    [[0, 0, 1],
     [1, 1, 1]],

    [[0, 1, 1],
     [1, 1, 0]],

    [[1, 1, 0],
     [0, 1, 1]]
];

// 4. กำหนดสีของบล็อก
const COLORS = [
    "#38bdf8",
    "#facc15",
    "#c084fc",
    "#fb923c",
    "#60a5fa",
    "#4ade80",
    "#f87171"
];
// สุ่มสร้างบล็อกใหม่
function createRandomBlock() {
    let index = Math.floor(Math.random() * SHAPES.length);

    return {
        shape: SHAPES[index],
        color: COLORS[index],
        x: 3,
        y: 0
    };
}

// 5. สร้างตัวแปรสำหรับเกม
let board = [];
let currentBlock;
let nextBlock = null;
let timer = null;
let isRunning = false;
let isPaused = false;
let score = 0;
let level = 1;
let dropSpeed = 500;

// ระบบคะแนนสูงสุด
let highScore = Number(localStorage.getItem("tetrisHighScore")) || 0;

// ระบบจดจำชื่อผู้เล่น
const playerNameInput = document.getElementById("player-name");

// ดึงชื่อเดิมจากเครื่อง
let savedPlayerName = localStorage.getItem("tetrisPlayerName") || "";

// แสดงชื่อเดิมในช่องกรอก
playerNameInput.value = savedPlayerName;

// บันทึกชื่อทุกครั้งที่ผู้เล่นพิมพ์
playerNameInput.addEventListener("input", function() {
    savedPlayerName = playerNameInput.value.trim();
    localStorage.setItem("tetrisPlayerName", savedPlayerName);
});

// แสดงคะแนนสูงสุดเมื่อเปิดเกม
document.getElementById("high-score").textContent = highScore;

// ระบบเสียงเกม
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = "square") {

        if (audioContext.state === "suspended") {
        audioContext.resume();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

// 6. สร้างกระดานเกมเปล่า
function createBoard() {
    board = [];

    for (let y = 0; y < ROWS; y++) {
        board.push(Array(COLS).fill(0));
    }
}



// 7. สร้างบล็อกใหม่แบบสุ่ม
function newBlock() {

    currentBlock = nextBlock || createRandomBlock();

    nextBlock = createRandomBlock();

    currentBlock.x = 3;
    currentBlock.y = 0;

    if (!canMove(0, 0)) {
        gameOver();
        return false;
    }

    return true;
}


// 8. วาดกระดานและบล็อกทั้งหมด
function drawBoard() {
    ctx.fillStyle = "#252039";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // วาดช่องตาราง
    ctx.strokeStyle = "#514568";

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            ctx.strokeRect(
                x * SIZE,
                y * SIZE,
                SIZE,
                SIZE
            );

            // วาดบล็อกที่ตกลงมาสะสมบนกระดาน
            if (board[y][x] !== 0) {
                drawCell(x, y, board[y][x]);
            }
        }
    }

    // วาดบล็อกที่กำลังตก
    drawCurrentBlock();
}

// 9. วาดบล็อกหนึ่งช่อง
function drawCell(x, y, color) {
    ctx.fillStyle = color;

    ctx.fillRect(
        x * SIZE + 1,
        y * SIZE + 1,
        SIZE - 2,
        SIZE - 2
    );
}
function drawNextBlock() {

    // ล้างพื้นที่แสดงบล็อก
    nextCtx.clearRect(
        0,
        0,
        nextCanvas.width,
        nextCanvas.height
    );

    // ถ้ายังไม่มีบล็อกถัดไป ให้หยุดทำงาน
    if (!nextBlock) return;

    // ขนาดของแต่ละช่อง
    const blockSize = 25;

    // หาความกว้างและความสูงของบล็อก
    const width = nextBlock.shape[0].length * blockSize;
    const height = nextBlock.shape.length * blockSize;

    // จัดบล็อกให้อยู่ตรงกลาง
    const offsetX = (nextCanvas.width - width) / 2;
    const offsetY = (nextCanvas.height - height) / 2;

    // วาดบล็อกทีละช่อง
    for (let y = 0; y < nextBlock.shape.length; y++) {
        for (let x = 0; x < nextBlock.shape[y].length; x++) {

            if (nextBlock.shape[y][x] === 1) {

                nextCtx.fillStyle = nextBlock.color;

                nextCtx.fillRect(
                    offsetX + x * blockSize + 1,
                    offsetY + y * blockSize + 1,
                    blockSize - 2,
                    blockSize - 2
                );
            }
        }
    }
}

// 10. วาดบล็อกที่กำลังเคลื่อนที่
function drawCurrentBlock() {
    if (!currentBlock) return;

    for (let y = 0; y < currentBlock.shape.length; y++) {
        for (let x = 0; x < currentBlock.shape[y].length; x++) {

            if (currentBlock.shape[y][x] === 1) {
                drawCell(
                    currentBlock.x + x,
                    currentBlock.y + y,
                    currentBlock.color
                );
            }
        }
    }
}

// 11. ตรวจสอบว่าบล็อกสามารถเคลื่อนที่ได้หรือไม่
function canMove(dx, dy, newShape = currentBlock.shape) {
    for (let y = 0; y < newShape.length; y++) {
        for (let x = 0; x < newShape[y].length; x++) {

            if (newShape[y][x] === 1) {
                let newX = currentBlock.x + x + dx;
                let newY = currentBlock.y + y + dy;

                if (
                    newX < 0 ||
                    newX >= COLS ||
                    newY >= ROWS
                ) {
                    return false;
                }

                if (
                    newY >= 0 &&
                    board[newY][newX] !== 0
                ) {
                    return false;
                }
            }
        }
    }

    return true;
}

// 12. สะสมบล็อกลงบนกระดาน
function lockBlock() {
    for (let y = 0; y < currentBlock.shape.length; y++) {
        for (let x = 0; x < currentBlock.shape[y].length; x++) {

            if (currentBlock.shape[y][x] === 1) {
                let boardY = currentBlock.y + y;
                let boardX = currentBlock.x + x;

                if (boardY >= 0) {
                    board[boardY][boardX] = currentBlock.color;
                }
            }
        }
    }
}

// 13. ตรวจสอบและลบแถวที่เต็ม
function clearLines() {
    let linesCleared = 0;

    // ตรวจสอบจากแถวล่างขึ้นไป
    for (let y = ROWS - 1; y >= 0; y--) {

        // ตรวจสอบว่าทุกช่องในแถวมีบล็อกหรือไม่
        if (board[y].every(cell => cell !== 0)) {

            // ลบแถวที่เต็มออก
            board.splice(y, 1);

            // เพิ่มแถวว่างไว้ด้านบน
            board.unshift(Array(COLS).fill(0));

            linesCleared++;

            // ตรวจแถวเดิมอีกครั้ง เพราะแถวด้านบนเลื่อนลงมาแทน
            y++;
        }
    }

    // ถ้าลบแถวได้ ให้เพิ่มคะแนน
    if (linesCleared > 0) {
        addScore(linesCleared);
    }
}

// 14. เพิ่มคะแนนตามจำนวนแถวที่ลบได้
function addScore(lines) {
    const points = [0, 100, 300, 500, 800];

    // เพิ่มคะแนน
    score += points[lines];

    // แสดงคะแนนบนหน้าเกม
    document.getElementById("score").textContent = score;

    // ตรวจสอบระดับ Level
    updateLevel();
}

function updateLevel() {

    // คำนวณระดับจากคะแนน
    let newLevel = Math.floor(score / 500) + 1;

    // คำนวณความเร็วของบล็อก
    let newSpeed = Math.max(
        100,
        500 - (newLevel - 1) * 50
    );

    // ตรวจสอบว่าระดับเปลี่ยนหรือไม่
    if (newLevel !== level) {

        level = newLevel;

        // แสดงระดับบนหน้าจอ
        document.getElementById("level").textContent = level;

        // เปลี่ยนความเร็วของเกม
        dropSpeed = newSpeed;

        // เริ่มจับเวลาใหม่ด้วยความเร็วล่าสุด
        if (isRunning) {
            clearInterval(timer);
            timer = setInterval(moveDown, dropSpeed);
        }
    }
}

// 15. ให้บล็อกตกลงมา
function moveDown() {
    if (canMove(0, 1)) {
        currentBlock.y++;
    } else {
        lockBlock();

        // ตรวจสอบและลบแถวที่เต็ม
        clearLines();

        // สร้างบล็อกใหม่
        if (!newBlock()) {
            drawBoard();
            return;
        }
    }

    drawBoard();
    drawNextBlock();
}

// 16. เลื่อนบล็อกไปทางซ้าย
function moveLeft() {
    if (canMove(-1, 0)) {
        currentBlock.x--;
        drawBoard();
    }
}

// 17. เลื่อนบล็อกไปทางขวา
function moveRight() {
    if (canMove(1, 0)) {
        currentBlock.x++;
        drawBoard();
    }
}

// 18. หมุนบล็อก
function rotateBlock() {
    let rotated = [];

    for (let x = 0; x < currentBlock.shape[0].length; x++) {
        let row = [];

        for (let y = currentBlock.shape.length - 1; y >= 0; y--) {
            row.push(currentBlock.shape[y][x]);
        }

        rotated.push(row);
    }

    if (canMove(0, 0, rotated)) {
        currentBlock.shape = rotated;
        drawBoard();
    }
}

// 19. ควบคุมบล็อกด้วยแป้นพิมพ์
document.addEventListener("keydown", function(event) {
    if (!isRunning) return;

    if ([
        "ArrowLeft",
        "ArrowRight",
        "ArrowDown",
        "ArrowUp"
    ].includes(event.key)) {
        event.preventDefault();
    }

    if (event.key === "ArrowLeft") {
        moveLeft();
    } else if (event.key === "ArrowRight") {
        moveRight();
    } else if (event.key === "ArrowDown") {
        moveDown();
        playSound(220, 0.05);
    } else if (event.key === "ArrowUp") {
        rotateBlock();
        playSound(600, 0.1);
    }
});

// 20. หยุดเกม
function stopGame() {
    clearInterval(timer);
    timer = null;
    isRunning = false;
}
function gameOver() {
    // หยุดเกม
    stopGame();

    // แสดงคะแนนสุดท้าย
    document.getElementById("final-score").textContent = score;

    // อัปเดตคะแนนสูงสุด
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("tetrisHighScore", highScore);
    }

    // แสดงคะแนนสูงสุด
    document.getElementById("high-score").textContent = highScore;

    // อ่านชื่อผู้เล่น
    const playerName = playerNameInput.value.trim();

    // บันทึกคะแนนเมื่อมีชื่อผู้เล่น
    if (playerName !== "") {
        let players = {};

        try {
            players = JSON.parse(
                localStorage.getItem("tetrisPlayers")
            ) || {};
        } catch (error) {
            players = {};
        }

        // เก็บเฉพาะคะแนนที่ดีที่สุดของแต่ละคน
        const oldScore = Number(players[playerName]);

        if (
            !Object.prototype.hasOwnProperty.call(players, playerName) ||
            score > oldScore
        ) {
            players[playerName] = score;
        }

        // บันทึกข้อมูล
        localStorage.setItem(
            "tetrisPlayers",
            JSON.stringify(players)
        );
    }

    // อัปเดตตารางอันดับ
    showLeaderboard();

    // แสดงหน้าจอ GAME OVER
    document.getElementById("game-over").classList.add("show");

    // แสดงแบบประเมิน
document.getElementById("evaluation-form").style.display = "block";
}

function togglePause() {
    if (!isRunning) {
        return;
    }

    if (isPaused) {
        isPaused = false;

        timer = setInterval(moveDown, dropSpeed);

        document.getElementById("pause").textContent = "พักเกม";

    } else {
        isPaused = true;

        clearInterval(timer);

        document.getElementById("pause").textContent = "เล่นต่อ";
    }
}

// 21. เริ่มเกม

function startGame() {
    clearInterval(timer);

    // รีเซ็ตดาวประเมิน
document.querySelectorAll('input[name="rating"]').forEach(input => {
    input.checked = false;
});

document.querySelectorAll('.rating label').forEach(label => {
    label.classList.remove('selected');
});

document.getElementById("rating-text").textContent = "กรุณาเลือกคะแนน";

    // ซ่อนหน้า GAME OVER
    document.getElementById("game-over").classList.remove("show");

    // ซ่อนแบบประเมิน
    document.getElementById("evaluation-form").style.display = "none";

    createBoard();

    // รีเซ็ตคะแนนและระดับ
    score = 0;
    level = 1;
    dropSpeed = 500;

    document.getElementById("score").textContent = score;
    document.getElementById("level").textContent = level;

    isRunning = true;
    isPaused = false;

    document.getElementById("pause").textContent = "พักเกม";

    // สุ่มบล็อกตัวถัดไป
    nextBlock = createRandomBlock();

    // สร้างบล็อกปัจจุบัน
    if (newBlock()) {
        drawBoard();

        // เริ่มจับเวลา
        timer = setInterval(moveDown, dropSpeed);
    }
}


// 22. เริ่มเกมใหม่
function restartGame() {
    stopGame();
    startGame();

    ratingInputs.forEach(input => {
    input.checked = false;
});

ratingLabels.forEach(label => {
    label.classList.remove('selected');
});

ratingText.textContent = "กรุณาเลือกคะแนน";

}

// 23. เชื่อมต่อปุ่มบนหน้าเว็บ

// ปุ่มเริ่มเกมจะถูกเชื่อมกับหน้าเริ่มต้นในส่วนระบบเปลี่ยนหน้า

document.getElementById("restart").addEventListener("click", restartGame);

document.getElementById("play-again").addEventListener("click", function() {

    // ซ่อนหน้าเริ่มต้น
    startScreen.style.display = "none";

    // แสดงหน้าเกม
    gameScreen.style.display = "block";

    // เริ่มเกมใหม่
    startGame();

});

document.getElementById("pause").addEventListener("click", togglePause);

// 24. วาดกระดานเมื่อเปิดเกม
createBoard();
drawBoard();
// ระบบแสดงตารางอันดับ Top 10
// ระบบแสดงตารางอันดับ Top 10
function showLeaderboard() {

    // อ่านข้อมูลคะแนนจากเครื่อง
    let players = {};

    try {
        players = JSON.parse(
            localStorage.getItem("tetrisPlayers")
        ) || {};
    } catch (error) {
        players = {};
    }

    // แปลงข้อมูลเป็นรายการ
    let playerList = Object.entries(players);

    // เรียงคะแนนจากมากไปน้อย
    playerList.sort((a, b) => Number(b[1]) - Number(a[1]));

    // เลือก 20 อันดับแรก
    let topPlayers = playerList.slice(0, 20);

    // เลือกพื้นที่แสดงตาราง
    const leaderboardList = document.getElementById("leaderboard-list");

    // ล้างข้อมูลเก่า
    leaderboardList.innerHTML = "";

    // ถ้ายังไม่มีคะแนน
    if (topPlayers.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 3;
        cell.textContent = "ยังไม่มีคะแนน";

        row.appendChild(cell);
        leaderboardList.appendChild(row);

        return;
    }

    // แสดงข้อมูลผู้เล่น
    topPlayers.forEach((player, index) => {

        const row = document.createElement("tr");

        const rankCell = document.createElement("td");
        const nameCell = document.createElement("td");
        const scoreCell = document.createElement("td");

        rankCell.textContent = index + 1;
        nameCell.textContent = player[0];
        scoreCell.textContent = Number(player[1]);

        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(scoreCell);

        leaderboardList.appendChild(row);
    });
}
// แสดงตารางอันดับเมื่อเปิดเกม
showLeaderboard();
// =================================
// ระบบเปลี่ยนหน้าเริ่มต้นและหน้าเกม
// =================================

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");

// เมื่อกดปุ่ม START GAME
document.getElementById("start").addEventListener("click", function() {

    // อ่านชื่อผู้เล่น
    const playerName = playerNameInput.value.trim();

    // ตรวจสอบว่ากรอกชื่อหรือยัง
    if (playerName === "") {
        alert("กรุณากรอกชื่อผู้เล่นก่อนเริ่มเกม");
        return;
    }

    // บันทึกชื่อผู้เล่น
    localStorage.setItem("tetrisPlayerName", playerName);


    // ซ่อนหน้าเริ่มต้น
    startScreen.style.display = "none";

    // แสดงหน้าเล่นเกม
    gameScreen.style.display = "block";

    // เริ่มเกม
    startGame();

});
// =================================
// ระบบกลับหน้าหลัก
// =================================

document.getElementById("back-to-menu").addEventListener("click", function() {

    // ซ่อนหน้าเล่นเกม
    gameScreen.style.display = "none";

    // แสดงหน้าเริ่มต้น
    startScreen.style.display = "block";

    // อัปเดตตารางอันดับ
    showLeaderboard();

});


// ===== ระบบบันทึกแบบประเมินความพึงพอใจ =====

document.getElementById("submit-evaluation").addEventListener("click", function () {

    // อ่านชื่อผู้เล่น
    const playerName = playerNameInput.value.trim();

    // อ่านคะแนนเกม
    const playerScore = score;

    // อ่านระดับความพึงพอใจ
    const selectedRating = document.querySelector(
        'input[name="rating"]:checked'
    );

    // อ่านความคิดเห็น
    const liked = document.getElementById("liked").value.trim();
    const disliked = document.getElementById("disliked").value.trim();

    // ตรวจสอบข้อมูล
    if (playerName === "") {
        alert("ไม่พบชื่อผู้เล่น");
        return;
    }

    if (!selectedRating) {
        alert("กรุณาเลือกระดับความพึงพอใจก่อนส่ง");
        return;
    }

    // สร้างข้อมูลแบบประเมิน
    const evaluation = {
        name: playerName,
        score: playerScore,
        rating: Number(selectedRating.value),
        liked: liked,
        disliked: disliked,
        date: new Date().toLocaleString("th-TH")
    };

    // อ่านข้อมูลเดิม
    let evaluations = [];

    try {
        evaluations = JSON.parse(
            localStorage.getItem("tetrisEvaluations")
        ) || [];
    } catch (error) {
        evaluations = [];
    }

    // เพิ่มข้อมูลครั้งใหม่
    evaluations.push(evaluation);

    // บันทึกข้อมูลลงเครื่อง
    localStorage.setItem(
        "tetrisEvaluations",
        JSON.stringify(evaluations)
    );

    // ส่งข้อมูลไปยัง Google Sheets
    fetch("https://script.google.com/macros/s/AKfycbzAsMdgrCNXDEqn4xzzX_38Z9WqcmhSkKnzGgpHJQM11rCbtjtpdNyqBi63mQKsNSLcLQ/exec", {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
            name: evaluation.name,
            score: evaluation.score,
            rating: evaluation.rating,
            liked: evaluation.liked,
            disliked: evaluation.disliked
        })
    });

    // แจ้งผู้เล่น
    alert("ส่งแบบประเมินเรียบร้อยแล้ว ขอบคุณที่ร่วมเล่นเกม!");

    // ซ่อนแบบประเมิน
    document.getElementById("evaluation-form").style.display = "none";

});



document.querySelectorAll('input[name="rating"]').forEach(input => {
    input.addEventListener("change", function () {
        const selectedRating = Number(this.value);

        const messages = {
            1: "ควรปรับปรุงมาก",
            2: "ควรปรับปรุง",
            3: "ปานกลาง",
            4: "ดี",
            5: "ดีมาก"
        };

        document.getElementById("rating-text").textContent =
            messages[selectedRating];

        document.querySelectorAll(".rating label").forEach(label => {
            const starValue = Number(label.htmlFor.replace("star", ""));

            label.classList.toggle(
                "selected",
                starValue <= selectedRating
            );
        });
    });
});

// เปลี่ยนสีดาวเมื่อผู้เล่นเลือกคะแนน
const ratingInputs = document.querySelectorAll(
    '.rating input[name="rating"]'
);

const ratingLabels = document.querySelectorAll('.rating label');
const ratingText = document.getElementById('rating-text');

ratingInputs.forEach(input => {
    input.addEventListener('change', function () {

        const selectedRating = Number(this.value);

        ratingLabels.forEach(label => {
            const starValue = Number(label.htmlFor.replace('star', ''));

            if (starValue <= selectedRating) {
                label.classList.add('selected');
            } else {
                label.classList.remove('selected');
            }
        });

    });
});