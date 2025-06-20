# Call History Feature Implementation

This document explains the call history feature that has been added to the ChatFlow chat application.

## Overview

The call history feature allows users to:
- Record all video and audio calls (incoming, outgoing, missed, rejected, answered)
- View call history in a beautiful interface
- See call statistics and duration
- Filter calls by type (video, audio, missed calls)
- View call history between specific users

## Backend Implementation

### Models

#### CallHistoryModel (`/server/models/callHistoryModel.js`)
- Tracks call participants (caller and receiver)
- Records call type (video/audio)
- Stores call status (missed, rejected, answered, ended, failed)
- Tracks call duration in seconds
- Stores timestamps for start and end times
- Includes technical metadata (quality, network info)

### API Endpoints

#### Base URL: `/api/calls`

1. **POST `/save`** - Save a new call record
   ```json
   {
     "callerId": "user_id",
     "receiverId": "user_id", 
     "callType": "video|audio",
     "status": "missed|rejected|answered|ended|failed",
     "duration": 120,
     "startedAt": "2025-06-16T10:30:00Z",
     "endedAt": "2025-06-16T10:32:00Z"
   }
   ```

2. **GET `/user/:userId`** - Get call history for a user
   - Query parameters: `page`, `limit`, `callType`, `status`
   - Returns paginated call history

3. **GET `/between/:userId1/:userId2`** - Get call history between two users
   - Query parameters: `page`, `limit`
   - Returns calls between specific users

4. **PUT `/update/:callId`** - Update call status/duration
   ```json
   {
     "status": "ended",
     "duration": 180,
     "endedAt": "2025-06-16T10:33:00Z"
   }
   ```

5. **GET `/stats/:userId`** - Get call statistics for a user
   - Query parameters: `period` (week|month|year)
   - Returns aggregated call statistics

## Frontend Implementation

### Components

#### CallHistory (`/public/src/components/CallHistory.jsx`)
- Beautiful modal interface for viewing call history
- Supports filtering by call type and status
- Shows call statistics (total calls, duration, missed calls)
- Infinite scroll for large call histories
- Real-time refresh capability

#### VideoCallModal (Enhanced)
- Automatically records call events to history
- Tracks call duration with timer
- Updates call status when call ends/is rejected
- Saves call metadata for quality tracking

### Integration

#### ChatContainer
- Added call history button in chat header
- Added call history option in dropdown menu
- Integrated CallHistory component

#### API Routes (`/public/src/utils/APIRoutes.js`)
- Added all call history API endpoints
- Configured for both development and production

## Usage

### Viewing Call History

1. **From Chat Interface:**
   - Click the clock icon in the chat header
   - Or use the "Call History" option in the dropdown menu

2. **Filtering Calls:**
   - Use filter buttons: All, Video, Audio, Missed
   - View calls between specific users when opened from a chat

3. **Call Statistics:**
   - View total calls, total duration, missed calls
   - Average call duration
   - Statistics for current month by default

### Call Recording

Calls are automatically recorded when:
- A call is initiated (status: 'outgoing')
- A call is received and answered (status: 'answered') 
- A call is missed or rejected (status: 'missed'/'rejected')
- A call ends (status: 'ended' with duration)

## Features

### Call Status Types
- **missed** - Incoming call not answered
- **rejected** - Call declined by receiver
- **answered** - Call was answered and connected
- **ended** - Call completed normally
- **failed** - Call failed due to technical issues

### Call Types
- **video** - Video call with camera
- **audio** - Voice-only call

### Statistics Tracking
- Total number of calls
- Total call duration (formatted as hours:minutes:seconds)
- Number of missed calls
- Average call duration
- Breakdown by call type (video vs audio)

### UI Features
- Responsive design for mobile and desktop
- Dark/light theme support
- Real-time updates
- Infinite scroll for large histories
- Search and filter capabilities
- Beautiful animations and transitions

## Database Schema

```javascript
{
  participants: {
    caller: ObjectId (ref: Users),
    receiver: ObjectId (ref: Users)
  },
  callType: String (video|audio),
  status: String (missed|rejected|answered|ended|failed),
  duration: Number (seconds),
  startedAt: Date,
  endedAt: Date,
  quality: String (poor|fair|good|excellent),
  conversationId: String (generated from user IDs),
  technicalInfo: {
    networkType: String,
    averageBitrate: Number,
    packetsLost: Number,
    connectionType: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Performance Optimizations

### Database Indexes
- Indexed on participants (caller/receiver) for fast lookups
- Indexed on conversationId for calls between users
- Indexed on createdAt for chronological sorting
- Compound indexes for filtered queries

### Frontend Optimizations
- Pagination for large call histories
- Lazy loading with infinite scroll
- Memoized components to prevent unnecessary re-renders
- Optimized API calls with debouncing

## Error Handling

- Graceful handling of API failures
- Fallback UI states for loading and errors
- Automatic retry mechanisms for failed calls
- User-friendly error messages

## Security Considerations

- User authentication required for all endpoints
- Users can only access their own call history
- No sensitive call content is stored
- Privacy-focused design with minimal data retention

## Future Enhancements

1. **Call Recording Playback** - Store and playback actual call recordings
2. **Group Call History** - Support for conference calls
3. **Call Quality Analytics** - Detailed network and quality metrics
4. **Export Functionality** - Export call history as CSV/PDF
5. **Call Scheduling** - Schedule future calls with reminders
6. **Backup and Sync** - Cloud backup of call history
7. **Advanced Analytics** - Usage patterns and insights

## Testing

To test the call history feature:

1. Start a video or audio call
2. Accept/reject/end calls to see different statuses
3. Check call history in the chat interface
4. Verify call durations are tracked correctly
5. Test filtering and pagination
6. Check statistics accuracy

## Installation and Setup

1. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Install frontend dependencies:
   ```bash
   cd public
   npm install
   ```

4. Start the frontend:
   ```bash
   npm start
   ```

The call history feature will be automatically available in the chat interface.

## API Testing

You can test the API endpoints using tools like Postman or curl:

```bash
# Get call history for a user
curl -X GET "http://localhost:5001/api/calls/user/USER_ID?page=1&limit=10"

# Save a call record
curl -X POST "http://localhost:5001/api/calls/save" \
  -H "Content-Type: application/json" \
  -d '{
    "callerId": "USER_ID_1",
    "receiverId": "USER_ID_2", 
    "callType": "video",
    "status": "answered",
    "duration": 120
  }'

# Get call statistics
curl -X GET "http://localhost:5001/api/calls/stats/USER_ID?period=month"
```

## Troubleshooting

### Common Issues

1. **Calls not being recorded**
   - Check if backend server is running
   - Verify API endpoints are accessible
   - Check browser console for errors

2. **Call history not loading**
   - Verify user authentication
   - Check network connectivity
   - Ensure proper API route configuration

3. **Timer not working**
   - Check if component is properly mounted
   - Verify call accepted state
   - Check for JavaScript errors

### Debug Tips

- Enable console logging in VideoCallModal
- Check Network tab in browser dev tools
- Verify database connectivity
- Test API endpoints independently

For additional support, check the application logs and ensure all dependencies are properly installed.
