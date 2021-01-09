// const apm = require('elastic-apm-node').start({
//   // Override service name from package.json
//   // Allowed characters: a-z, A-Z, 0-9, -, _, and space
//   serviceName: 'RedLakeAPMService',
//   // Set custom APM Server URL (default: http://localhost:8200)
//   serverUrl: 'http://localhost:8200',
// });

// libs
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const passport = require("passport");
const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { Snake } = require("./snake");

const { GAME_STATE } = require("./constants");
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

//db
// const mongoose = require('mongoose');
// const connectionString = 'mongodb://localhost:27017/TenantsDB';
// mongoose.connect(connectionString);
// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));

// Middleware
app.use(bodyParser.json());
const whitelist = ["http://localhost:3000"];
const corsOptions = {
  origin(origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

// app.use(cors(corsOptions));

app.use(cors());
app.use(morgan("combined"));
app.use(
  morgan("common", {
    stream: fs.createWriteStream("./access.log", { flags: "a" }),
  })
);
app.use(helmet());
app.use(express.json());

// distributing frontend
// app.use('/admin', express.static('build'));
// app.use('/news', express.static('News'));
// app.use('/projects', express.static('Projects'));
// app.use('/assets', express.static('assets'));
app.use(express.static(path.join(__dirname, "/build")));
app.use("/static", express.static(__dirname + "/build"));
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname + '/build/index.html'));
// });

// Routes
// app.use(passport.initialize());
// app.use(passport.session());
// require('./config/passport');

// require('./Schemas/User');
// app.use(require("./Routes"));

// Don't stop server in production
process.on("uncaughtException", (err) => {
  console.log(err);
});

const game = new Snake();
let gameTimer;
let countDownTimer;
let countDownValue = 60;

// function A*(start, goal, f)
//      % множество уже пройденных вершин
//      var closed := the empty set
//      % множество частных решений
//      var open := make_queue(f)
//      enqueue(open, path(start))
//      while open is not empty
//          var p := remove_first(open)
//          var x := the last node of p
//          if x in closed
//              continue
//          if x = goal
//              return p
//          add(closed, x)
//          % добавляем смежные вершины
//          foreach y in successors(x)
//              enqueue(open, add_to_path(p, y))
//      return failure

// let graph = new Graph([
//   [1, 1, 1, 1],
//   [0, 1, 1, 0],
//   [0, 0, 1, 1],
// ]);
// let start = graph.grid[0][0];
// let end = graph.grid[1][2];

// result is an array containing the shortest path
// var graphDiagonal = new Graph([
//   [1,1,1,1],
//   [0,1,1,0],
//   [0,0,1,1]
// ], { diagonal: true });

// var start = graphDiagonal.grid[0][0];
// var end = graphDiagonal.grid[1][2];
// var resultWithDiagonals = astar.search(graphDiagonal, start, end, { heuristic: astar.heuristics.diagonal });
// // Weight can easily be added by increasing the values within the graph, and where 0 is infinite (a wall)
// var graphWithWeight = new Graph([
//   [1,1,2,30],
//   [0,4,1.3,0],
//   [0,0,5,1]
// ]);
// var startWithWeight = graphWithWeight.grid[0][0];
// var endWithWeight = graphWithWeight.grid[1][2];
// var resultWithWeight = astar.search(graphWithWeight, startWithWeight, endWithWeight);

const UpdateAndSendGameState = () => {
  if (countDownValue === 0) {
    game.stopGame();
    clearInterval(gameTimer);
    clearInterval(countDownTimer);
  } else {
    let currentStatus = game.update();
    if (currentStatus !== GAME_STATE.PLAY) {
      clearInterval(gameTimer);
      clearInterval(countDownTimer);
    }
  }
  io.sockets.emit("gameState", { ...game.state, time: countDownValue });
};

io.on("connection", (socket) => {
  socket.on("action", ({ player, direction }) => {
    game.addAction(player, direction);
  });

  socket.on("start", (data) => {
    game.startGame();
    clearInterval(countDownTimer);
    clearInterval(gameTimer);
    countDownTimer = setInterval(() => (countDownValue -= 1), 1000);
    gameTimer = setInterval(UpdateAndSendGameState, 200);
  });

  socket.on("pause", (message) => {
    clearInterval(gameTimer);
    game.pauseGame();
    io.sockets.emit("gameState", { ...game.state, time: countDownValue });
  });

  socket.on("reset", (message) => {
    game.resetGame();
    countDownValue = 60;
    clearInterval(gameTimer);
    clearInterval(countDownTimer);
    io.sockets.emit("gameState", { ...game.state, time: countDownValue });
  });

  socket.on("continue", (message) => {
    game.continueGame();
    clearInterval(gameTimer);
    gameTimer = setInterval(UpdateAndSendGameState, 200);
  });

  socket.on("disconnect", () => {
    clearInterval(gameTimer);
    clearInterval(countDownTimer);
  });
});

const serverWithSocket = server.listen(process.env.RUNNING_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on port ${serverWithSocket.address().port}`);
});
