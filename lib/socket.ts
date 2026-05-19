import type { Server, Socket } from 'socket.io';

let ioInstance: Server | null = null;

export function setupWebSockets(io: Server) {
  ioInstance = io;
  
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);
    
    // Client joins a generic room for updates
    socket.join('tasks');

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized. Ensure server.ts has run setupWebSockets.");
  }
  return ioInstance;
}
