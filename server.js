const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);
const PORT = 3000;

// Serve static files from 'public' folder
app.use(express.static('public'));

// Groups and message history
let groups = ["General"]; // default group
let messagesHistory = { "General": [] }; // store messages per group

io.on('connection', (socket) => {
  console.log('A user connected');

  // Send current groups to the connected client
  socket.emit('update-groups', groups);

  // Join a group
  socket.on('join-group', (group) => {
    socket.join(group);
    socket.currentGroup = group;
    console.log(`${socket.id} joined ${group}`);

    // Send existing messages to the newly joined user
    if (!messagesHistory[group]) messagesHistory[group] = [];
    socket.emit('chat message history', messagesHistory[group]);
  });

  // Create a new group
  socket.on('create-group', (groupName) => {
    if (!groups.includes(groupName)) {
      groups.push(groupName);
      messagesHistory[groupName] = [];
      io.emit('update-groups', groups);
    }
  });

  // Chat message
  socket.on('chat message', (data) => {
    const group = socket.currentGroup || "General";

    if (!messagesHistory[group]) messagesHistory[group] = [];
    messagesHistory[group].push(data);

    io.to(group).emit('chat message', data);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// 🟢 IMPORTANT CHANGE HERE
http.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
