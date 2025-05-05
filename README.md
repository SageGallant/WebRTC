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

### GitHub Pages (Frontend)

This project includes deployment scripts for GitHub Pages. You can deploy in one of the following ways:

#### Automated Deployment (GitHub Actions)

1. Push your code to GitHub
2. Ensure GitHub Pages is enabled for your repository:
   - Go to your repository settings
   - Navigate to "Pages"
   - Select "GitHub Actions" as the source
3. The workflow in `.github/workflows/deploy.yml` will automatically deploy your frontend when you push to the main branch

#### Manual Deployment

For Windows:

```
.\deploy.bat
```

For Linux/Mac:

```
bash deploy.sh
```

### Backend Deployment

Since GitHub Pages only hosts static content, you'll need to deploy the backend separately:

1. Update `client/js/config.js`:

   ```javascript
   CONFIG.SERVER.PRODUCTION_URL = "https://your-backend-url.com";
   CONFIG.SERVER.USE_PRODUCTION = true;
   ```

2. Deploy the backend to a service that supports Node.js:

   - Heroku: [Deployment Guide](https://devcenter.heroku.com/articles/deploying-nodejs)
   - Render: [Node.js Service](https://render.com/docs/deploy-node-express-app)
   - Railway: [Deployment Guide](https://docs.railway.app/deploy/nodejs)
   - Any VPS provider (DigitalOcean, AWS, etc.)

3. After deploying the backend, update your frontend configuration to point to your new backend URL

## Important Notes About GitHub Pages Deployment

- The backend server cannot be hosted on GitHub Pages since it only supports static content
- WebRTC connections require HTTPS in production, so ensure your backend server has SSL enabled
- If using a custom domain with GitHub Pages, update your CNAME file in the deployment scripts
