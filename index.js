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
// import { Snake } from "./snake";
const { Snake } = require("./snake");
const { clear } = require("console");
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

// TIMER LOGIC
// //ending game by timer
// useEffect(() => {
//   if (winner !== "none") {
//     setTimerStatus(false);
//   }
// }, [winner]);

// //countdown
// useEffect(() => {
//   let timer1 = setInterval(() => {
//     if (timerStatus && time > 0) {
//       setTime(time - 1);
//     }
//     if (time === 0) {
//       game.stopGame();
//       setTimerStatus(false);
//     }
//   }, 1000);

//   return () => {
//     clearInterval(timer1);
//   };
// }, [timerStatus, time]);

const game = new Snake();
let gameTimer;
let countDownTimer;
let countDownValue = 60;

const UpdateAndSendGameState = () => {
  if (countDownValue === 0) {
    game.stopGame();
    clearInterval(gameTimer);
    clearInterval(countDownTimer);
  } else {
    let currentStatus = game.update();
    if (currentStatus !== GAME_STATE.PLAY) {
      game.stopGame();
      clearInterval(gameTimer);
      clearInterval(countDownTimer);
    }
  }
  io.sockets.emit("gameState", { ...game.state, time: countDownValue });
};

io.on("connection", (socket) => {
  socket.on("action", ({ player, direction }) => {
    game.changeDirection(player, direction);
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
