const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const path = require("path");
const { Server } = require("socket.io");
const io = new Server(server);
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { saveMessages, loadMessages } = require("./utils/message-storage");
const crypto = require("crypto");
const { authenticateToken } = require("./middleware/auth");
const { authenticateSocketToken } = require("./middleware/socket-auth");

dotenv.config();

app.use(bodyParser.json());

let messageArchive = [];

const users = [
  {
    id: 1,
    username: "John",
    password: "JohnsPassword1!",
  },
  {
    id: 2,
    username: "Jane",
    password: "JanesPassword1!",
  },
];

async function initializeMessages() {
  messageArchive = await loadMessages();
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    (user) => user.username === username && user.password === password
  );

  if (!user) {
    res.sendStatus(401);
    return;
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET
  );

  res.status(200).json({ token });
});

app.get("/messages", authenticateToken, (req, res) => {
  res.status(200).json(messageArchive);
});

app.post("/messages", authenticateToken, async (req, res) => {
  try {
    const message = {
      id: crypto.randomUUID(),
      content: req.body.message,
      timestamp: Date.now(),
      userId: String(req.user.userId),
      username: req.user.username,
    };

    messageArchive.push(message);
    await saveMessages(messageArchive);

    io.emit("message", message);

    res.json({ success: true, message });
  } catch (error) {
    console.error("Error processing message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add Socket.IO middleware before connection handling
io.use(authenticateSocketToken);

io.on("connection", (socket) => {
  console.log(`User ${socket.user.username} connected`);

  socket.on("message", async (message) => {
    const msg = {
      id: crypto.randomUUID(),
      content: message,
      userId: String(socket.user.userId),
      username: socket.user.username,
      timestamp: Date.now(),
    };

    messageArchive.push(msg);
    await saveMessages(messageArchive);
    io.emit("message", msg);
  });

  socket.on("disconnect", () => {
    console.log(`User ${socket.user.username} disconnected`);
  });
});

initializeMessages().then(() => {
  server.listen(3000, () => {
    console.log("listening on *:3000");
  });
});
