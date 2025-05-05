# Temporary Room-Based Chat

A web-based temporary chat room application that allows users to create or join rooms for real-time communication (chat and screen sharing). The application is built using only HTML, CSS, and JavaScript, with no backend or server-side storage. All communication happens through WebRTC peer-to-peer connections.

## Features

- Create or join temporary chat rooms with unique room IDs
- Real-time messaging with other users in the room
- Screen sharing functionality
- User profile pictures in chat messages
- Dark mode toggle
- Responsive design for mobile and desktop
- No data persistence - rooms automatically delete when all users leave
- Completely client-side, no server required

## Technologies Used

- HTML5, CSS3, and Vanilla JavaScript
- PeerJS (WebRTC wrapper)
- UUID.js for generating unique room and user IDs
- Font Awesome for icons

## How to Use

1. Open the application in your browser
2. Enter your display name and select a profile picture
3. Choose to create a new room or join an existing one with a room ID
4. To invite others, share the room ID displayed at the top of the chat
5. Use the message input at the bottom to chat with others in the room
6. Click the "Share Screen" button to share your screen with others in the room
7. Use the dark mode toggle in the top right to switch between light and dark modes
8. Click "Leave Room" to exit the chat room

## Local Development

To run the application locally, you can use any static file server. For example:

1. Clone the repository
2. Navigate to the project directory
3. If you have Python installed, you can run:
   ```
   # Python 3.x
   python -m http.server
   ```
4. Or if you have Node.js installed, you can use the included server:
   ```
   npm install
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000` (or whichever port your server is using)

## Deployment

This project can be easily deployed to GitHub Pages or any other static site hosting service.

### Automated Deployment Script

The easiest way to deploy is using the included deployment script:

```
npm install
npm run deploy
```

This script will:

1. Validate your project structure
2. Install any required dependencies
3. Deploy your application to GitHub Pages
4. Provide a URL where your application is hosted

### Manual GitHub Pages Deployment

If you prefer to deploy manually:

1. Push your code to a GitHub repository
2. Go to Settings > Pages in your repository
3. Select the branch to deploy (usually `main` or `master`)
4. Select the folder to deploy from (usually `/ (root)`)
5. Click Save, and your site will be deployed to `https://<username>.github.io/<repository>`

Alternatively, you can use the direct gh-pages deployment:

```
npm install
npm run deploy:gh-pages
```

## Known Limitations

- Screen sharing across different browsers may have compatibility issues
- For actual production use, additional features like authentication, moderation, and full WebRTC media support would be needed
- Relies on STUN servers for NAT traversal, which might have limitations in some network environments
