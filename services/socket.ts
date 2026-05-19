import { io, Socket } from 'socket.io-client';
import { useDataStore } from '../store/useDataStore';

let socket: Socket | null = null;

export function initializeSocket() {
  if (socket) return;
  
  socket = io(); // Connects to the same host natively

  socket.on('connect', () => {
    console.log('Connected to WebSocket');
  });

  socket.on('state:updated', () => {
    // Anytime the backend tells us something changed, refresh data.
    useDataStore.getState().fetchInitialData();
  });

  socket.on('task:checkpoint', (data) => {
    // Custom event to prompt user for "Did you finish?"
    // Handled in a global UI component
    const event = new CustomEvent('task-checkpoint', { detail: data });
    window.dispatchEvent(event);
  });

  socket.on('task:completed', (data) => {
    // Notification for async tasks
    const event = new CustomEvent('task-completed', { detail: data });
    window.dispatchEvent(event);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket');
  });
}

export function cleanupSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
