# OneDrive POC Backend (TypeScript)

A TypeScript-based backend service for OneDrive integration using Microsoft Graph API with proper architecture and separation of concerns.

## 🏗️ Architecture

The application follows a clean architecture pattern with the following structure:

```
src/
├── config/          # Configuration management
├── controllers/     # Request/response handlers
├── middleware/      # Express middleware
├── routes/          # Route definitions
├── services/        # Business logic
├── types/           # TypeScript interfaces and types
├── utils/           # Utility functions
├── app.ts           # Application setup
└── index.ts         # Entry point
```

## 🚀 Features

- **TypeScript**: Full type safety and modern JavaScript features
- **OAuth 2.0**: Microsoft authentication with automatic token refresh
- **OneDrive Integration**: Complete file and folder operations
- **Session Management**: In-memory session storage with automatic cleanup
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Validation**: Request validation with detailed error messages
- **CORS**: Cross-origin resource sharing support
- **File Upload**: Support for file uploads with multer

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```env
CLIENT_ID=your_microsoft_client_id
CLIENT_SECRET=your_microsoft_client_secret
REDIRECT_URI=http://localhost:5001/auth/callback
AUTH_TENANT=common
PORT=5001
CORS_ORIGIN=http://localhost:5173
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run watch` - Watch mode for development

### Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5001`

## 📚 API Documentation

### Authentication Endpoints

#### GET `/auth/login`
Redirects user to Microsoft OAuth authorization page.

#### GET `/auth/callback`
OAuth callback endpoint that exchanges authorization code for tokens.

**Query Parameters:**
- `code` - Authorization code from Microsoft
- `error` - OAuth error (if any)
- `error_description` - Error description (if any)

#### GET `/auth/session`
Get current session status (requires authentication).

#### POST `/auth/logout`
Logout and remove session (requires authentication).

### OneDrive API Endpoints

All OneDrive endpoints require authentication via Bearer token.

#### GET `/api/files`
Get files and folders from OneDrive.

**Query Parameters:**
- `id` - Folder ID to browse
- `path` - Path to browse
- `remoteDriveId` - Remote drive ID (for shared items)
- `remoteItemId` - Remote item ID (for shared items)

#### GET `/api/shared`
Get files shared with the current user.

#### GET `/api/shared/:itemId/parent`
Get parent folder of a shared item.

**Query Parameters:**
- `remoteDriveId` - Remote drive ID
- `remoteItemId` - Remote item ID

#### POST `/api/create-folder`
Create a new folder.

**Request Body:**
```json
{
  "name": "Folder Name",
  "parentId": "optional_parent_id"
}
```

#### PUT `/api/upload`
Upload a file.

**Form Data:**
- `file` - File to upload
- `parentId` - Parent folder ID (optional)
- `path` - Upload path (optional)

#### PATCH `/api/items/:id`
Rename a file or folder.

**Request Body:**
```json
{
  "name": "New Name"
}
```

#### DELETE `/api/items/:id`
Delete a file or folder.

#### POST `/api/share`
Share a file or folder with users.

**Request Body:**
```json
{
  "itemId": "item_id",
  "emails": ["user@example.com"],
  "role": "view",
  "message": "Optional message"
}
```

#### POST `/api/invite`
Alternative share endpoint.

**Request Body:**
```json
{
  "itemId": "item_id",
  "emails": ["user@example.com"],
  "role": "view",
  "message": "Optional message"
}
```

### Health Check

#### GET `/health`
Health check endpoint.

## 🔧 Configuration

The application uses a centralized configuration system in `src/config/index.ts`:

- **OAuth Settings**: Client ID, secret, redirect URI, tenant, scopes
- **Server Settings**: Port, CORS origin
- **Environment Variables**: All configurable via environment variables

## 🛡️ Security

- **Authentication**: Bearer token-based authentication
- **Session Management**: Secure session handling with automatic cleanup
- **Token Refresh**: Automatic access token refresh
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Comprehensive request validation

## 🐛 Error Handling

The application includes centralized error handling:

- **Custom Error Classes**: `CustomError` and `ValidationError`
- **HTTP Status Codes**: Proper status codes for different error types
- **Error Logging**: Detailed error logging with stack traces
- **Client-Friendly Messages**: User-friendly error messages

## 📝 Types and Interfaces

The application uses TypeScript interfaces for type safety:

- **Session Management**: `Session`, `Sessions`
- **OneDrive Items**: `OneDriveItem`, `OneDriveItemsResponse`
- **Request/Response DTOs**: `CreateFolderRequest`, `ShareItemRequest`, etc.
- **API Responses**: `ApiResponse`, `ErrorResponse`
- **Configuration**: `AppConfig`, `OAuthConfig`

## 🔄 Migration from JavaScript

The original JavaScript code has been refactored into:

1. **Services**: Business logic extracted from the main file
2. **Controllers**: Request/response handling separated
3. **Routes**: Route definitions organized by feature
4. **Middleware**: Authentication and validation middleware
5. **Types**: TypeScript interfaces for type safety
6. **Configuration**: Centralized configuration management

## 🚀 Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

The built files will be in the `dist/` directory.

## 📄 License

MIT License 