function handleSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id} (Reason: ${reason})`);
    });

    // Optionally handle manual sync requests from client
    socket.on('requestSync', () => {
      console.log(`Client ${socket.id} requested manual sync. Emitting update.`);
      socket.emit('queueUpdated');
    });
  });
}

module.exports = handleSocket;
