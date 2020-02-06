import anime from './lib/anime.es.js';
import Bot from './minesweeperBot.js';

const ms_row_size = 11;
const ms_col_size = 17;
const ms_mine_num = Math.floor(ms_row_size*ms_col_size*0.12);
const ms_grid_box_tags = [];
const ms_grid_box_elems = [];
const ms_grid_attributes = [];

const ms_grid_flags = [];
let ms_grid_flag_count = 0;

const ms_grid_revealed = [];
//let ms_grid_revealed_count = 0;

const faces = new Map([['standard', '😀'], ['mousedown', '😮'], ['lose', '😣'], ['win', '😎'], ['reset', '😉']]);

const ms_timer = document.getElementById('ms_timer');
let current_time = 0;
let gameTimerHandle = null;
let gameStarted = false;
let gamePaused = false;
let gameOver = false;
let gameWon = false;

let bot;
let botTimerHandle = null;

//==================================== MINESWEEPER BOT ====================================//

function initMinesweeperBot(){
    bot = new Bot(ms_row_size, ms_col_size, ms_grid_revealed, ms_mine_num);
}

function startBot(){
    if(gamePaused){
        gameTimerHandle = setInterval(gameTimer, 1000);
        botTimerHandle = setInterval(runBot, 250);
        gamePaused = false;
    }else if(!gameStarted){
        botTimerHandle = setInterval(runBot, 250);
    }else if(gameOver){
        resetMinesweeper();
        startBot();
    }
}

function pauseBot(){
    gamePaused = true;
    clearInterval(botTimerHandle);
    clearInterval(gameTimerHandle)
}

function runBot(){
    if(!gameOver){
        let box = bot.performMove(ms_grid_revealed);
        botMove(box.row, box.col);
    }else{
        clearInterval(botTimerHandle);
    }
}

function botMove(row, col){
    if(!gameStarted){
        gameStarted = true;
        initGridAttributes(row, col);
        gameTimerHandle = setInterval(gameTimer, 1000);
    }
    if (ms_grid_revealed[row][col] === null) {
        swapFace('standard');
        let grid_box = document.getElementById(`ms_grid_box_${row}_${col}`);
        anime({
            targets: grid_box,
            update: () =>{
                grid_box.style.border = '2px outset #8c8c8c';
            }
        });
        checkGridBox(row, col);
    }
}

//==================================== MINESWEEPER GRID ====================================//


function initMinesweeper(){
    initTopBar();
    //initGridAttributes();
    initGridFlags();
    initGrid();
    initMinesweeperBot();
}

function initTopBar(){
    swapFace('standard');

    let face_button = document.getElementById('ms_face');
    face_button.addEventListener('mouseenter', (e) => topBarMouseenter(e, face_button), false);
    face_button.addEventListener('mouseleave', (e) => topBarMouseleave(e, face_button), false);
    face_button.addEventListener('mousedown', (e) => topBarMousedown(e, face_button), false);
    face_button.addEventListener('click', (e) => topBarClick(e, face_button, resetMinesweeper), false);

    let start_button = document.getElementById('start_button');

    start_button.addEventListener('mouseenter', (e) => topBarMouseenter(e, start_button), false);
    start_button.addEventListener('mouseleave', (e) => topBarMouseleave(e, start_button), false);
    start_button.addEventListener('mousedown', (e) => topBarMousedown(e, start_button), false);
    start_button.addEventListener('click', (e) => topBarClick(e, start_button, startBot), false);

    let pause_button = document.getElementById('pause_button');

    pause_button.addEventListener('mouseenter', (e) => topBarMouseenter(e, pause_button), false);
    pause_button.addEventListener('mouseleave', (e) => topBarMouseleave(e, pause_button), false);
    pause_button.addEventListener('mousedown', (e) => topBarMousedown(e, pause_button), false);
    pause_button.addEventListener('click', (e) => topBarClick(e, pause_button, pauseBot), false);


    updateDisplayMines(0);
}

function initGrid() {
    let ms_grid = document.getElementById('ms_grid');

    for (let i = 0; i < ms_row_size; ++i) {

        let ms_grid_row = document.createElement('div');
        ms_grid_row.id = `ms_grid_row_${i}`;
        ms_grid_row.classList.add('ms_grid_row');

        ms_grid.appendChild(ms_grid_row);

        let ms_grid_row_tags = [];
        let ms_grid_row_elems = [];
        let ms_grid_row_revealed = [];
        for (let j = 0; j < ms_col_size; ++j) {

            let ms_box_elem = document.createElement('div');
            ms_box_elem.id = `ms_grid_box_${i}_${j}`;

            ms_box_elem.classList.add('ms_grid_box');
            ms_box_elem.classList.add('covered');

            ms_box_elem.addEventListener('mouseenter', (e) => gridMouseEnter(e, i, j), false);
            ms_box_elem.addEventListener('mouseleave', (e) => gridMouseLeave(e, i, j), false);
            ms_box_elem.addEventListener('click', (e) => gridMouseClick(e, i, j), false);
            ms_box_elem.addEventListener('mousedown', (e) => gridMouseDown(e, i, j), false);
            ms_box_elem.addEventListener('contextmenu', (e) => gridRightClick(e, i, j), false);

            ms_grid_row.appendChild(ms_box_elem);
            ms_grid_row_tags.push(`ms_grid_box_${i}_${j}`);

            

            ms_grid_row_elems.push(ms_box_elem);
            ms_grid_row_revealed.push(null);
        }
        ms_grid_box_tags.push(ms_grid_row_tags);
        ms_grid_box_elems.push(ms_grid_row_elems);
        ms_grid_revealed.push(ms_grid_row_revealed);
    }
    //animateInitGrid();
}

function initGridAttributes(row, col) {
    for (let i = 0; i < ms_row_size; ++i) {
        let ms_grid_row_attributes = [];
        for (let j = 0; j < ms_col_size; ++j) {
            ms_grid_row_attributes.push(0);
        }
        ms_grid_attributes.push(ms_grid_row_attributes);
    }
    placeMines(row, col);
    calculateNumbers();
}

function initGridFlags(){
    for(let i = 0; i < ms_row_size; ++i){
        let ms_grid_flag_row = [];
        for(let j = 0; j < ms_col_size; ++j){
            ms_grid_flag_row.push(false);
        }
        ms_grid_flags.push(ms_grid_flag_row);
    }

    ms_grid_flag_count = 0;
}

function placeMines(row, col) {
    for (let i = 0; i < ms_mine_num; ++i) {
        let x = Math.floor(Math.random() * ms_col_size);
        let y = Math.floor(Math.random() * ms_row_size);
        if (ms_grid_attributes[y][x] === -1 || (y === row && x === col)) {
            --i;
        } else {
            ms_grid_attributes[y][x] = -1;
            ms_grid_revealed[y][x] = null;
        }
    }
}

function calculateNumbers() {
    const incrementGridBox = (grid, i, j) => {
        for (let k = i - 1; k <= i + 1; ++k) {
            for (let l = j - 1; l <= j + 1; ++l) {
                if (k !== i || l !== j) {
                    if (k >= 0 && k < ms_row_size && l >= 0 && l < ms_col_size) {
                        if (grid[k][l] !== -1) {
                            grid[k][l]++;
                        }
                    }
                }
            }
        }
    }
    for (let i = 0; i < ms_row_size; ++i) {
        for (let j = 0; j < ms_col_size; ++j) {
            if (ms_grid_attributes[i][j] === -1) {
                incrementGridBox(ms_grid_attributes, i, j);
            }
        }
    }
    for(let i = 0; i < ms_row_size; ++i){
        for(let j = 0; j < ms_col_size; ++j){
            assignValue(`ms_grid_box_${i}_${j}`, ms_grid_attributes[i][j]);
        }
    }
}

function assignValue(id, value) {
    let elem = document.getElementById(id);
    if (value === -1) {
        let box_attr = document.createElement('img');
        box_attr.src = './mines.webp';

        box_attr.classList.add('mine');
        box_attr.classList.add('hidden');
        box_attr.classList.add('unselectable');

        elem.appendChild(box_attr);
    } else {
        let box_attr = document.createElement('span');

        box_attr.classList.add(`box_attr_${value}`);
        box_attr.classList.add('hidden');
        box_attr.classList.add('unselectable');

        if (value > 0) box_attr.textContent = `${value}`;
        elem.appendChild(box_attr);
    }
}

function revealGridBoxes(row, col) {
    let targets = [];
    let stack = [[row, col]];
    let visited_set = new Set();
    while (stack.length > 0) {
        let indices = stack.pop();
        let _row = indices[0];
        let _col = indices[1];
        if(ms_grid_attributes[_row][_col] === 0){
            if (_row - 1 >= 0) {
                if (!visited_set.has([_row - 1, _col].toString()) && ms_grid_attributes[_row - 1][_col] >= 0) {
                    stack.push([_row - 1, _col]);
                }
            }
            if (_row + 1 < ms_row_size) {
                if (!visited_set.has([_row + 1, _col].toString()) && ms_grid_attributes[_row + 1][_col] >= 0) {
                    stack.push([_row + 1, _col]);
                }
            }
            if (_col - 1 >= 0) {
                if (!visited_set.has([_row, _col - 1].toString()) && ms_grid_attributes[_row][_col - 1] >= 0) {
                    stack.push([_row, _col - 1]);
                }
            }
            if (_col + 1 < ms_col_size) {
                if (!visited_set.has([_row, _col + 1].toString()) && ms_grid_attributes[_row][_col + 1] >= 0) {
                    stack.push([_row, _col + 1]);
                }
            }
        }
        visited_set.add(indices.toString());
        ms_grid_revealed[_row][_col] = ms_grid_attributes[_row][_col];
        targets.push([_row, _col]);
    }

    animateRevealBoxes(targets);
}

function revealGridBox(row, col){
    ms_grid_revealed[row][col] = 0;
    animateRevealBoxes([[row, col]]);
}

function checkGridBox(row, col){
    let attributeValue = ms_grid_attributes[row][col];

    if (attributeValue === -1) {
        youLose([row, col]);
        return;
    }
    if(attributeValue === null){
        revealGridBox(row, col);
    }else{
        revealGridBoxes(row, col);
    }

    if(checkWinCondition()){
        youWin();
    }
}

function checkWinCondition(){
    let ms_grid_revealed_count = 0;
    for(let row = 0; row < ms_row_size; ++row){
        for(let col = 0; col < ms_col_size; ++col){
            if(ms_grid_revealed[row][col] !== null){
                ms_grid_revealed_count++;
            }
        }
    }
    return ms_grid_revealed_count === ms_row_size * ms_col_size - ms_mine_num;
}

function youLose(trippedMineIndices){
    // Stopping the time execution
    clearInterval(gameTimerHandle);

    // Changing the face emoji to lose face
    swapFace('lose');

    // Set gameOver state to true
    gameOver = true;

    // Set gameWon state to false
    gameWon = false;

    // Itterating through the revealed array and setting all grid boxed as revealed and removing all flags
    // in order to prevent the user from being able to select boxes after the game is lost. 
    for(let i = 0; i < ms_row_size; ++i){
        for(let j = 0; j < ms_col_size; ++j){
            ms_grid_revealed[i][j] = 1;
            if(ms_grid_flags[i][j]){
                removeFlag(i, j);
            }
        }
    }
    // Grabbing all mine elements and animating their reveal
    let mines = document.querySelectorAll('.mine');
    let trippedMine = document.getElementById(`ms_grid_box_${trippedMineIndices[0]}_${trippedMineIndices[1]}`);
    animateRevealMines(trippedMine, mines);

    
    animateYouLose();
}
function youWin(){
    // Stopping the time execution
    clearInterval(gameTimerHandle);

    // Changing the face emoji to win face
    swapFace('win');

    // Set gameOver state to true
    gameOver = true;

    // Set gameWon state to false
    gameWon = true;

    animateYouWin();
}

function gameTimer(){
    current_time++;
    setGameTime(current_time);
}
function setGameTime(time){
    let str = '00000' + time.toString();
    ms_timer.innerText = str.substring(time.toString().length, str.length);
}

function updateDisplayMines(mines_covered){
    let ms_display_mine_num = document.getElementById('ms_mine_num');
    let displayed_mines = ms_mine_num - mines_covered;
    let str = '00000' + displayed_mines.toString();
    ms_display_mine_num.innerText = str.substring(displayed_mines.toString().length, str.length);
}

function resetMinesweeper(){
    gameStarted = false;
    current_time = 0;
    clearInterval(gameTimerHandle);
    gameTimerHandle = null;
    gameOver = false;
    gameWon = false;

    ms_grid_box_tags.length = 0;
    ms_grid_box_elems.length = 0;
    ms_grid_attributes.length = 0;
    ms_grid_revealed.length = 0;
    ms_grid_flags.length = 0;

    bot = null;
    botTimerHandle = null;

    let ms_grid = document.getElementById('ms_grid');
    for(let i = 0; i < ms_row_size; ++i){
        let row = document.getElementById(`ms_grid_row_${i}`);
        ms_grid.removeChild(row);
    }

    initGridFlags();
    initGrid();
    initMinesweeperBot();

    swapFace('standard');
    updateDisplayMines(0);
    setGameTime(0);
}

// ===================== ANIMATIONS ===================== //

function animateInitGrid() {
    for (let i = 0; i < ms_row_size; ++i) {
        for (let j = 0; j < ms_col_size; ++j) {
            anime({
                targets: `#${ms_grid_box_tags[i][j]}`,
                translateX: j * 52,
                easing: 'easeOutExpo'
            });
        }
    }
}

function animateRevealMines(trippedMine, mines){
    mines.forEach(mine => {
        let mineBox = mine.parentNode;
        anime({
            targets: mineBox,
            backgroundColor: '#FFF',
            borderRadius: ['50%', '0%'],
            easing: 'easeOutExpo',
            update: () => {
                mineBox.classList.remove('covered');
                mine.classList.remove('hidden');
            },
            delay: 100
        });
    });
    anime({
        targets: trippedMine,
        backgroundColor: '#FF0000',
        easing: 'easeOutExpo',
        delay: 200
    });
}

function animateRevealBoxes(targets){    
    targets.forEach(indices => {
        let elem = ms_grid_box_elems[indices[0]][indices[1]];
        if(ms_grid_flags[indices[0]][indices[1]]){
            removeFlag(indices[0], indices[1]);
        }
        anime({
            targets: elem,
            backgroundColor: '#FFF',
            borderRadius: ['50%', '0%'],
            easing: 'easeOutExpo',
            update: () => {
                elem.classList.remove('covered');
                elem.firstChild.classList.remove('hidden');
            },
            delay: 100
        });
    });
}
function animateYouLose(){
    anime({
        targets: '#ms_grid',
        backgroundColor: ['#efefef','#FF1c1c'],
        easing: 'easeInOutExpo',
        direction: 'alternate',
        loop: 2,
        duration: 1500
    });

    anime({
        targets: ms_grid_box_elems,
        translateX: {
            value: '+=10',
            easing: 'easeOutExpo'
        },
        loop: 10,
        direction: 'alternate',
        duration: 100
    });
}

function animateYouWin(){
    anime({
        targets: '#ms_grid',
        backgroundColor: ['#efefef','#1cFF1c'],
        easing: 'easeInOutExpo',
        direction: 'alternate',
        loop: 2,
        duration: 1500
    });

    anime({
        targets: ms_grid_box_elems,
        rotateZ: {
            value: 360,
            duration: 3000,
            easing: 'easeInOutExpo'
        }
    });
}

function gridMouseEnter(e, row, col) {
    e.preventDefault();
    if (ms_grid_revealed[row][col] === null) {
        anime({
            targets: `#ms_grid_box_${row}_${col}`,
            backgroundColor: '#FFF',
            borderRadius: '50%',
            easing: 'easeOutExpo'
        });
    }
}

function gridMouseLeave(e, row, col) {
    e.preventDefault();
    if (ms_grid_revealed[row][col] === null) {
        swapFace('standard');
        let grid_box = document.getElementById(`ms_grid_box_${row}_${col}`);
        anime({
            targets: grid_box,
            backgroundColor: '#bcbcbc',
            borderRadius: '0%',
            easing: 'easeOutExpo',
            update: () =>{
                grid_box.style.border = '2px outset #8c8c8c';
            }
        });
    }
}

function gridMouseClick(e, row, col) {
    e.preventDefault();
    if(!gameStarted){
        gameStarted = true;
        initGridAttributes(row, col);
        gameTimerHandle = setInterval(gameTimer, 1000);
    }
    if (ms_grid_revealed[row][col] === null) {
        swapFace('standard');

        let grid_box = document.getElementById(`ms_grid_box_${row}_${col}`);
        anime({
            targets: grid_box,
            update: () =>{
                grid_box.style.border = '2px outset #8c8c8c';
            }
        });
        checkGridBox(row, col);
    }
}

function gridMouseDown(e, row, col) {
    e.preventDefault();
    if (ms_grid_revealed[row][col] === null) {
        swapFace('mousedown');

        let grid_box = document.getElementById(`ms_grid_box_${row}_${col}`);
        anime({
            targets: grid_box,
            update: () =>{
                grid_box.style.border = '2px inset #8c8c8c';
            }
        });
    }
}

function gridRightClick(e, row, col){
    e.preventDefault();

    if(ms_grid_flags[row][col]){
        removeFlag(row, col);
    }else{
        addFlag(row, col);
    }

}

function topBarMouseenter(e, elem){
    e.preventDefault();
    anime({
        targets: elem,
        backgroundColor: ['#e0e0e0', '#FFF'],
        easing: 'easeOutExpo'
    });
}

function topBarMouseleave(e, elem){
    e.preventDefault();
    anime({
        targets: elem,
        backgroundColor: [ '#FFF', '#e0e0e0'],
        easing: 'easeOutExpo',
        update: () =>{
            elem.style.border = '4px outset #efefef'
        }
    });
    swapFace('standard');
}

function topBarMousedown(e, elem){
    e.preventDefault();
    anime({
        update: () => {
            elem.style.border = '4px inset #efefef';
        }
    });
    swapFace('reset');
}

function topBarClick(e, elem, action){
    e.preventDefault();
    anime({
        update: () =>{
            elem.style.border = '4px outset #efefef'
        }
    });
    swapFace('standard');
    action();
}

function addFlag(row, col){
    if(ms_grid_revealed[row][col] === null && !ms_grid_flags[row][col] && ms_grid_flag_count < ms_mine_num){
        let grid_box = ms_grid_box_elems[row][col];
        let flag = document.createElement('span');
        flag.id = `ms_grid_flag_${row}_${col}`;
        flag.classList.add('ms_grid_flag');
        flag.classList.add('unselectable');
        flag.innerText = '🚩';
        grid_box.appendChild(flag);
    
        ms_grid_flags[row][col] = true;
        ms_grid_flag_count++;
        updateDisplayMines(ms_grid_flag_count);
    }
}

function removeFlag(row, col){
    if(ms_grid_flags[row][col]){
        let grid_box = ms_grid_box_elems[row][col];
        let flag = document.getElementById(`ms_grid_flag_${row}_${col}`);
        grid_box.removeChild(flag);

        ms_grid_flags[row][col] = false;
        ms_grid_flag_count--;
        updateDisplayMines(ms_grid_flag_count);
    }
}

function swapFace(val){
    let ms_face = document.getElementById('ms_face');
    ms_face.innerText = faces.get(val);
}

initMinesweeper();