class Bot {
    constructor(rows, cols, grid, mine_num){
        this.rows = rows;
        this.cols = cols;
        this.grid = grid;
        this.partial_grid = [];
        this.mine_num = mine_num;
        this.white_list = [];
        this.black_list = [];
        this.probability_map = [];
        this.base_probability = Number;
        this.move_queue = [];
        this.initial_move_made = false;


        this.initProbabilityMap = this.initProbabilityMap.bind(this);
        this.performMove = this.performMove.bind(this);
        this.thinkOfMove = this.thinkOfMove.bind(this);
        this.returnMove = this.returnMove.bind(this);
        this.calculateProbabilityMap = this.calculateProbabilityMap.bind(this);
        this.checkBlackListCandidates = this.checkBlackListCandidates.bind(this);
        this.checkWhiteListCandidates = this.checkWhiteListCandidates.bind(this);
        this.checkMoveQueueCandidates = this.checkMoveQueueCandidates.bind(this);
        this.updateGrid = this.updateGrid.bind(this);
        this.updatePartialGrid = this.updatePartialGrid.bind(this);
        this.updateBaseProbability = this.updateBaseProbability.bind(this);
        this.getLowestProbability = this.getLowestProbability.bind(this);
        this.isInPartialGrid = this.isInPartialGrid.bind(this);
        this.isInBlackList = this.isInBlackList.bind(this);
        this.isInWhiteList = this.isInWhiteList.bind(this);
        this.isInMoveQueue = this.isInMoveQueue.bind(this);
        this.getSurroundingCoveredBoxes = this.getSurroundingCoveredBoxes.bind(this);
        this.initProbabilityMap();
    }

    initProbabilityMap(){
        this.updateBaseProbability();
        for(let i = 0; i < this.rows; ++i){
            this.probability_map.push([]);
            for(let j = 0; j < this.cols; ++j){
                this.probability_map[i][j] = this.base_probability;
            }
        }
    }

    performMove(grid){
        this.updateGrid(grid);
        if(!this.initial_move_made){
            this.initial_move_made = true;
            let box = {row: Math.floor(Math.random()*this.rows), col: Math.floor(Math.random()*this.cols)}
            return this.returnMove(box);
        }else{
            let box = this.thinkOfMove();
            return this.returnMove(box);
        }
    }

    thinkOfMove(){
        if(this.move_queue.length > 0){
            return this.move_queue.shift();
        }

        this.calculateProbabilityMap();

        if(this.move_queue.length > 0){
            return this.move_queue.shift();
        }else{
            return this.getLowestProbability();
        }
    }

    returnMove(box){
        this.probability_map[box.row][box.col] = Number.MAX_VALUE;
        return box;
    }

    calculateProbabilityMap(){
        this.updateBaseProbability();
        this.updatePartialGrid();
        this.checkBlackListCandidates();
        this.checkWhiteListCandidates();
        this.checkMoveQueueCandidates();
        
        for(let row = 0; row < this.rows; ++row){
            for(let col = 0; col < this.cols; ++col){
                if(this.grid[row][col] === null && !this.isInBlackList({row: row, col: col})){
                    this.probability_map[row][col] = this.base_probability;
                }else{
                    this.probability_map[row][col] = Number.MAX_VALUE;
                }
            }
        }
        
        this.partial_grid.forEach(box => {
            let covered_boxes = this.getSurroundingCoveredBoxes(box);
            let mines = 0;
            covered_boxes.forEach(_box => {
                if(this.isInBlackList(_box)){
                    mines++;
                }
            });
            let probability = 1 / (covered_boxes.length - mines);
            covered_boxes.forEach(_box =>{
                if(this.isInBlackList(_box)){
                    this.probability_map[_box.row][_box.col] = Number.MAX_VALUE;
                }else{
                    this.probability_map[_box.row][_box.col] = probability;
                }
            });
        });
    }

    checkBlackListCandidates(){
        this.partial_grid.forEach(box =>{
            let covered_boxes = this.getSurroundingCoveredBoxes(box);
            if(covered_boxes.length === box.attr){
                covered_boxes.forEach(_box => {
                    if(!this.isInBlackList(_box)){
                        this.black_list.push(_box);
                    }
                });
            }
        });
    }

    checkWhiteListCandidates(){ 
        this.partial_grid.forEach(box => {
            let mines = 0;
            let covered_boxes = this.getSurroundingCoveredBoxes(box);
            let candidates = [];

            covered_boxes.forEach(_box => {
                if(this.isInBlackList(_box)){
                    mines++;
                }else{
                    candidates.push(_box);
                }
            });

            if(mines > 0){
                if(box.attr === mines){
                    candidates.forEach(candidate => {
                        if(!this.isInWhiteList(candidate)){
                            this.white_list.push(candidate);
                        }
                    });
                }
            }
        });
    }

    checkMoveQueueCandidates(){
        if(this.white_list.length > 0){
            this.white_list.forEach( box => {
                if(!this.isInBlackList(box)){
                    this.move_queue.push(box);
                }
            });
        }
        this.white_list.length = 0;
    }

    updateBaseProbability(){
        if(this.probability_map.length === 0){
            this.base_probability = this.mine_num / (this.rows * this.cols);
        }else{
            let unrevealed_count = this.grid
            .reduce((a, b) => a.concat(b))
            .reduce((a, b) =>{
                return b === null ? a + 1 : a;
            });
            this.base_probability = this.mine_num / unrevealed_count;
        }
    }

    updateGrid(updated_grid){
        this.grid = updated_grid;
    }

    updatePartialGrid(){
        this.partial_grid.length = 0;
        for(let row = 0; row < this.rows; ++row){
            for(let col = 0; col < this.cols; ++col){
                if(this.grid[row][col] !== null && this.grid[row][col] > 0){
                    this.partial_grid.push({row: row, col: col, attr: this.grid[row][col]});
                }
            }
        }
    }

    getLowestProbability(){
        let min = Number.MAX_VALUE;
        let min_indexes = [];
        for(let row = 0; row < this.rows; ++row){
            for(let col = 0; col < this.cols; ++col){
                if(this.probability_map[row][col] < min){
                    min = this.probability_map[row][col];
                    min_indexes.length = 0;
                    min_indexes.push({row: row, col: col});
                } else if(this.probability_map[row][col] == min){
                    min_indexes.push({row: row, col: col});
                }
            }
        }

        if(min_indexes.length > 1){
            let index = Math.floor(Math.random()*min_indexes.length);
            return min_indexes[index];
        }else{
            return min_indexes.pop();
        }
    }

    isInPartialGrid(box){
        return this.partial_grid.some(_box => _box.row === box.row && _box.col === box.col);
    }

    isInBlackList(box){
        return this.black_list.some(_box => _box.row === box.row && _box.col === box.col);
    }
    
    isInWhiteList(box){
        return this.white_list.some(_box => _box.row === box.row && _box.col === box.col);
    }

    isInMoveQueue(box){
        return this.move_queue.some(_box => _box.row === box.row && _box.col === box.col);
    }

    getSurroundingCoveredBoxes(box){
        let covered_boxes = [];
        for(let row = box.row - 1; row <= box.row + 1; ++row){
            for(let col = box.col - 1; col <= box.col + 1; ++col){
                if(row >= 0 && row < this.rows && col >= 0 && col < this.cols){
                    if(row !== box.row || col !== box.col){
                        if(this.grid[row][col] === null){
                            covered_boxes.push({row: row, col: col});
                        }
                    }
                }
            }
        }
        return covered_boxes;
    }
}


export default Bot;