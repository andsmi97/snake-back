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
app.use("/", express.static("public"));
// app.use('/news', express.static('News'));
// app.use('/projects', express.static('Projects'));
// app.use('/assets', express.static('assets'));
// app.use(express.static(path.join(__dirname, '/build')));
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

io.on("connection", (socket) => {
  // const actionsEmitter = setInterval(async () => {
  socket.on("action", (data) => {
    console.log(data);
    io.sockets.emit("action", data);
  });
  socket.on("start", (data) => {
    io.sockets.emit("start", data);
  });
  socket.on("pause", (message) => {
    io.sockets.emit("pause", message);
  });
  socket.on("reset", (message) => {
    io.sockets.emit("reset", message);
  });
  socket.on("continue", (message) => {
    io.sockets.emit("continue", message);
  });
  // }, 3000);

  socket.on("disconnect", () => {
    // clearInterval(actionsEmitter);
  });
  socket.on("connect", () => {});
});

const serverWithSocket = server.listen(process.env.RUNNING_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on port ${serverWithSocket.address().port}`);
});
