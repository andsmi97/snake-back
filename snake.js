const {
  BOTTOM_BORDER,
  DIRECTIONS,
  PLAYER_SIZE,
  RIGHT_BORDER,
  LEFT_BORDER,
  TOP_BORDER,
  GAME_STATE,
} = require("./constants.js");

class Snake {
  players = ["player", "player2"];
  initialState = {
    gameStatus: GAME_STATE.STOP,
    winner: "none", // one of "none", "player", "player2"
    player: {
      currentPoints: 0,
      color: "#2196f3",
      direction: DIRECTIONS.RIGHT,
      speed: 10,
      positions: [
        {
          x: 0,
          y: 0,
        },
      ],
    },
    player2: {
      currentPoints: 0,
      color: "#00b248",
      direction: DIRECTIONS.LEFT,
      speed: 10,
      positions: [
        {
          x: 250 - PLAYER_SIZE,
          y: 250 - PLAYER_SIZE,
        },
      ],
    },
    food: {
      x: 0,
      y: 0,
    },
  };
  state = JSON.parse(JSON.stringify(this.initialState));
  initialized = false;
  constructor() {}

  isInverseDirection = (player, direction) => {
    switch (direction) {
      case DIRECTIONS.RIGHT:
        if (this.state[player].direction === DIRECTIONS.LEFT) {
          return true;
        }
        break;
      case DIRECTIONS.LEFT:
        if (this.state[player].direction === DIRECTIONS.RIGHT) {
          return true;
        }
        break;
      case DIRECTIONS.UP:
        if (this.state[player].direction === DIRECTIONS.DOWN) {
          return true;
        }
        break;
      case DIRECTIONS.DOWN:
        if (this.state[player].direction === DIRECTIONS.UP) {
          return true;
        }
        break;
      default:
        return false;
    }
    return false;
  };
  initialize = () => {
    this.initialized = true;
  };

  distanceBetweenHeads = () => {
    let x =
      this.state.player.positions[0].x - this.state.player2.positions[0].x;
    let y =
      this.state.player.positions[0].y - this.state.player2.positions[0].y;
    return Math.sqrt(x ** 2 + y ** 2);
  };

  headCollision = () => {
    if (
      (this.state.player.positions[0].x === this.state.player2.positions[0].x &&
        this.state.player.positions[0].y ===
          this.state.player2.positions[0].y) ||
      (this.isInverseDirection("player", this.state.player2.direction) &&
        this.distanceBetweenHeads() === PLAYER_SIZE)
    ) {
      console.log("draw");
      return true;
    }
    return false;
  };

  getOtherPlayer = (player) => {
    if (player === "player") {
      return "player2";
    }
    return "player";
  };

  /**
   * Checks if there is collision with itself
   * @returns {"player"|"player2"|"none"|"draw"} isCollision
   */
  hasCollisions = () => {
    //head collisions
    if (this.headCollision()) {
      return this.getCurrentLooser();
    }

    for (let p = 0; p < this.players.length; p++) {
      let player = this.players[p];
      let otherPlayer = this.getOtherPlayer(player);
      for (let i = 1; i < this.state[player].positions.length; i++) {
        //collision with self
        if (
          this.state[player].positions[i].x ===
            this.state[player].positions[0].x &&
          this.state[player].positions[i].y ===
            this.state[player].positions[0].y
        ) {
          return player;
        }

        //collision with other
        if (
          this.state[otherPlayer].positions[0].x ===
            this.state[player].positions[i].x &&
          this.state[otherPlayer].positions[0].y ===
            this.state[player].positions[i].y
        ) {
          return otherPlayer;
        }
      }
    }

    return "none";
  };

  /**
   * Updates tail position
   * @private
   */
  updateTail = (player) => {
    this.state[player].positions = this.state[player].positions.map(
      (position, index) => {
        //skipping head in update
        if (index === 0) {
          return position;
        }
        return { ...this.state[player].positions[index - 1] };
      }
    );
  };

  moveUp = (player) => {
    this.updateTail(player);
    if (
      this.state[player].positions[0].y - this.state[player].speed >=
      TOP_BORDER
    ) {
      this.state[player].positions[0].y -= this.state[player].speed;
    } else {
      this.state[player].positions[0].y = BOTTOM_BORDER - PLAYER_SIZE;
    }
  };

  moveDown = (player) => {
    this.updateTail(player);
    if (
      this.state[player].positions[0].y + this.state[player].speed <=
      BOTTOM_BORDER - this.state[player].speed
    ) {
      this.state[player].positions[0].y += this.state[player].speed;
    } else {
      this.state[player].positions[0].y = TOP_BORDER;
    }
  };

  moveLeft = (player) => {
    this.updateTail(player);
    if (
      this.state[player].positions[0].x - this.state[player].speed >=
      LEFT_BORDER
    ) {
      this.state[player].positions[0].x -= this.state[player].speed;
    } else {
      this.state[player].positions[0].x = RIGHT_BORDER - PLAYER_SIZE;
    }
  };

  moveRight = (player) => {
    this.updateTail(player);
    if (
      this.state[player].positions[0].x + this.state[player].speed <=
      RIGHT_BORDER - this.state[player].speed
    ) {
      this.state[player].positions[0].x += this.state[player].speed;
    } else {
      this.state[player].positions[0].x = LEFT_BORDER;
    }
  };

  autoMove = () => {
    this.players.forEach((player) => {
      switch (this.state[player].direction) {
        case DIRECTIONS.RIGHT:
          this.moveRight(player);
          break;
        case DIRECTIONS.LEFT:
          this.moveLeft(player);
          break;
        case DIRECTIONS.UP:
          this.moveUp(player);
          break;
        case DIRECTIONS.DOWN:
          this.moveDown(player);
          break;
        default:
          break;
      }
    });
  };

  pauseGame = () => {
    this.state.gameStatus = GAME_STATE.PAUSE;
  };

  startGame = () => {
    this.state.gameStatus = GAME_STATE.PLAY;
    this.generateFoodPosition();
  };

  continueGame = () => {
    this.state.gameStatus = GAME_STATE.PLAY;
  };

  getCurrentLooser = () => {
    if (
      this.state.player.positions.length > this.state.player2.positions.length
    ) {
      return "player2";
    } else if (
      this.state.player.positions.length < this.state.player2.positions.length
    ) {
      return "player";
    } else {
      return "draw";
    }
  };

  stopGame = () => {
    this.state.gameStatus = GAME_STATE.STOP;
    const result = this.getCurrentLooser();
    this.state.winner =
      result === "draw" ? result : this.getOtherPlayer(result);
  };

  getPlayersLength = () => {
    return {
      p1: this.state.player.positions.length - 1,
      p2: this.state.player2.positions.length - 1,
    };
  };

  resetGame = () => {
    this.state = { ...JSON.parse(JSON.stringify(this.initialState)) };
  };

  /**
   * Simple funciton to update game state
   */
  update = () => {
    if (this.state.gameStatus === GAME_STATE.PLAY) {
      let result = this.hasCollisions();
      if (result !== "none") {
        this.state.gameStatus = GAME_STATE.STOP;
        if (result === "draw") {
          this.state.winner = "draw";
        } else {
          this.state.winner = this.getOtherPlayer(result);
        }
        return;
      }
      this.autoMove();
      this.eatFood();
    }
    return this.state.gameStatus;
  };

  /**
   * @returns {GameStatus} gamestatus
   */
  getStatus = () => this.state.gameStatus;

  getRandomCirclePosition(max) {
    let rand = 0;
    do {
      rand = Math.floor(Math.floor(Math.random() * Math.floor(max)));
    } while (rand % 10 !== 5);
    return rand;
  }

  eatFood = () => {
    this.players.forEach((player) => {
      if (
        this.state[player].positions[0].x ===
          this.state.food.x - PLAYER_SIZE / 2 &&
        this.state[player].positions[0].y ===
          this.state.food.y - PLAYER_SIZE / 2
      ) {
        this.generateFoodPosition();
        this.state[player].positions = [
          ...this.state[player].positions,
          { x: RIGHT_BORDER, y: BOTTOM_BORDER },
        ];
        this.state[player].currentPoints++;
      }
    });
  };

  foodInSnake = () => {
    for (let p = 0; p < this.players.length; p++) {
      let player = this.players[p];
      for (let i = 0; i < this.state[player].positions.length; i++) {
        if (
          this.state[player].positions[i].x === this.state.food.x &&
          this.state[player].positions[i].y === this.state.food.y
        ) {
          return true;
        }
      }
    }

    return false;
  };

  getWinner = () => {
    return this.state.winner;
  };

  generateFoodPosition = () => {
    do {
      this.state.food.x = this.getRandomCirclePosition(RIGHT_BORDER);
      this.state.food.y = this.getRandomCirclePosition(BOTTOM_BORDER);
    } while (this.foodInSnake());
  };

  //eat food

  changeDirection = (player, direction) => {
    switch (direction) {
      case DIRECTIONS.UP:
        if (this.state[player].direction !== DIRECTIONS.DOWN) {
          this.state[player].direction = direction;
        }
        break;
      case DIRECTIONS.DOWN:
        if (this.state[player].direction !== DIRECTIONS.UP) {
          this.state[player].direction = direction;
        }
        break;
      case DIRECTIONS.LEFT:
        if (this.state[player].direction !== DIRECTIONS.RIGHT) {
          this.state[player].direction = direction;
        }
        break;
      case DIRECTIONS.RIGHT:
        if (this.state[player].direction !== DIRECTIONS.LEFT) {
          this.state[player].direction = direction;
        }
        break;
      default:
        this.state[player].direction = direction;
    }
  };
}

module.exports = {
  Snake,
};
