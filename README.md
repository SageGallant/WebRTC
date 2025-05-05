# EchoRoom - Temporary WebRTC Chat Rooms

A static single-page web application that allows friends to create and join temporary chat rooms.
No data is persisted on the server, and when the last participant leaves, the room and its chat history vanish.

## Features

- Create temporary chat rooms with shareable links
- Real-time chat messaging
- Screen sharing using WebRTC
- User avatars (via DiceBear)
- Dark/light mode toggle
- No data persistence - everything disappears when the last person leaves

## Technology Stack

- **Frontend**: Pure HTML, CSS, and JavaScript
- **Real-time Communication**: Socket.IO
- **Screen Sharing**: WebRTC (navigator.mediaDevices.getDisplayMedia)
- **Styling**: Tailwind CSS
- **Avatars**: DiceBear
- **Room IDs**: UUID v4

## Project Structure

- `/client` - Frontend static files
- `/server` - Node.js WebSocket server

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the server: `npm start`
4. Open `http://localhost:3000` in your browser

## Deployment

- Frontend: Deploy `/client` folder to GitHub Pages
- Backend: Deploy `/server` folder to Heroku Free tier or any free VPS
