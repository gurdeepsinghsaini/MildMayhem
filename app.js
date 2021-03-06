const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const port = process.env.PORT || 80;
const app = express();
const server = require('http').Server(app);
const io = require("socket.io")(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



app.use(express.static(path.join(__dirname, 'build')));


app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});



var gameRooms = {};
var roomCount = 0;
var players = {};
let availableRooms = {};
server.listen(port, () => console.log(`Outer Server.js Listening on port ${port}`));
function sortAvailable(gameRooms) {
  availableRooms = {};
  Object.keys(gameRooms).forEach(gameRoom => {
    
    console.log('gameRooms[gameRoom] is' + gameRooms[gameRoom]);
    //If the room has no opponent then it is available...
    if (typeof gameRooms[gameRoom].opponent === 'undefined'){
      console.log('Room is available, the opponent is ' + typeof gameRoom.opponent);
      availableRooms[gameRooms[gameRoom].id] = gameRooms[gameRoom];
    }
  });
  return availableRooms;
}

function destroyRoom(socket){
  //Loop through all saved gameRooms
  for (let i = 0; i < Object.keys(gameRooms).length; i++) {
    //Check to see if the client was the host of a gameroom
    //(checking for undefined error)
    let gameRoomDataTest = typeof gameRooms[socket.id];
    if (gameRoomDataTest !== 'undefined'){
      //If the player is a host of the gameroom
      if (gameRooms[socket.id].id === socket.id){
        //roomCount --;
        //Disconnect every client from the socketIO Room
        socket.leave(gameRooms[socket.id].name);
        console.log('opponent Socket is: ' + gameRooms[socket.id].opponent);
        //let opponentSocket = io.sockets.connected[gameRooms[socket.id].opponent]
        //opponentSocket.leave(gameRooms[socket.id].name);
        
        console.log('left room');
        //Delete this gameRoom
        delete gameRooms[socket.id];
      }
    }
  }
};

io.on("connection", (socket) => {
  console.log("New client connected");

  let io = socket;
  //identify which player connected
  players[socket.id] = {
    playerId: socket.id
  }
  //console.log("players length is: "+ Object.keys(players).length);
 
  socket.on('createOnlineRoom', () => {
    roomCount++;
    gameRooms[socket.id] = {name: 'room'+roomCount,
      id: socket.id
    }
    socket.join(gameRooms[socket.id].name);

    availableRooms = sortAvailable(gameRooms);
    //Shows all rooms to players
    io.broadcast.emit('showRooms', availableRooms);
  
  });

  socket.on('getRoomName', () => {
    console.log('getRoomName was called here');
    console.log('socket Id is: ' + socket.id);
    console.log('roomname is: ' + gameRooms[socket.id].name);
    socket.emit('yourRoomName', gameRooms[socket.id].name);
  });
  socket.on('getRooms', function() {
    availableRooms = sortAvailable(gameRooms);
    io.emit('showRooms',availableRooms);
  })
  socket.on('joinRoom', function(playerId) {
    
    //If a gameRoom exists on Join
    if (typeof gameRooms[playerId] !== 'undefined'){
      //if there is not currently an opponent in the room
      if (typeof gameRooms[playerId].opponent === 'undefined'){
      //Joins the the room of the opposing player
      socket.join(gameRooms[playerId].name);

      //Save and link opponent id to gameRoom
      gameRooms[playerId].opponent = socket.id;
      
      availableRooms = sortAvailable(gameRooms);

      io.to(playerId).emit('opponentJoined', socket.id);
      io.broadcast.emit('showRooms', availableRooms);
      }
    
    }
    
  });
 
  socket.on('destroyOnlineRoom', () => {
    if (gameRooms[socket.id] !== 'undefined'){
      destroyRoom(socket);
    }
    availableRooms = sortAvailable(gameRooms);
    //Update all user of new rooms
    io.broadcast.emit('showRooms', availableRooms);
  });

  socket.on("playerMovement", function(movementData) {
    
    io.to(movementData.roomName).emit('playerMoved', movementData);
  });
  socket.on("createShield", function(roomName){
    console.log("shield created on server");
    io.to(roomName).emit('shieldCreated');
  })
  socket.on("swingSword", function(roomName) {
    console.log('swordswing on server');
    io.to(roomName).emit('swordSwung');
  });
  socket.on("createMagicBlast", function(roomName) {
    console.log('magicBlast on server');
    io.to(roomName).emit('magicBlastCreated');
  });
  socket.on("destroyMagicBlast", function(roomName){
    console.log('blow up magicBlast on server');
    io.to(roomName).emit('magicBlastDestroyed');
  });
  socket.on("createLightningBolt", function(roomName){
    console.log('lightningBolt Created');
    io.to(roomName).emit('lightningBoltCreated');
  });
  socket.on("destroyLightningBolt", function(roomName){
    console.log('lightningBolt destroyed');
    io.to(roomName).emit('lightningBoltDestroyed');
  });
  socket.on("damagePlayer", function(roomName){
    console.log("player damaged");
    io.to(roomName).emit('playerDamaged');
  });
  socket.on("startDodgeCoolDown", function(roomName){
    console.log('dodge activated');
    io.to(roomName).emit('dodgeCoolDownStarted');
  });
  socket.on('destroyOnlineRoom', () => {
    destroyRoom(socket);
    availableRooms = sortAvailable(gameRooms);
    //Update all user of new rooms
    io.broadcast.emit('showRooms', availableRooms);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    //delete any gameRoom that may have been open
    destroyRoom(socket);
    availableRooms = sortAvailable(gameRooms);
    //Update all users of room changes
    io.broadcast.emit('showRooms', availableRooms);
    delete players[socket.id];
  });
});

module.exports = app;