// backend/socket.js
let io;
function initSocket(serverIo) {
  io = serverIo;
}
function emitToToken(tokenOrLinkId, foto) {
  io.to(tokenOrLinkId).emit('nueva-foto', foto);

  // También buscar el usuario por token y emitir por linkId
  const { User } = require('./models');

  User.findOne({ where: { token: tokenOrLinkId } }).then((user) => {
    if (user?.linkId) {
      io.to(user.linkId).emit('nueva-foto', foto);
    }
  });
}
function joinRoom(socket, token) {
  socket.join(token);
}
module.exports = { initSocket, emitToToken, joinRoom };