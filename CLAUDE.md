# Hand Tracking Web Application

## Project Overview
This is a real-time hand tracking web application using MediaPipe that captures 3D coordinates of hand landmarks through webcam input. The app features a retro terminal/Matrix-style green-on-black aesthetic.

## Key Features
- Real-time hand skeleton tracking (21 landmarks per hand)
- 3D coordinate capture and recording
- JSON export of tracked data
- Support for tracking both hands simultaneously
- Green dots and lines visualization overlay on webcam feed
- FPS counter and status monitoring
- Terminal-style log output

## Technical Stack
- **MediaPipe Hands**: For hand detection and tracking
- **JavaScript**: Core application logic
- **HTML5 Canvas**: For rendering skeleton overlay
- **Camera Utils**: For webcam access and frame processing

## File Structure
```
/project/
├── index.html          # Original hand tracking interface
├── app.js             # Original hand tracking logic
├── body.html          # Extended tracking interface
├── body-tracker.js    # Extended tracking implementation
└── CLAUDE.md          # This file
```

## Important Implementation Details

### Working Configuration
The application works reliably with:
- MediaPipe Hands model complexity: 1
- Min detection confidence: 0.5
- Min tracking confidence: 0.5
- Max hands: 2
- Canvas size: 640x480

### Visual Style
- Background: Black with subtle green scanlines
- Primary color: #00ff00 (green)
- Font: Courier New monospace
- Terminal-style interface with timestamps
- Retro Web 1.0 aesthetic

### Core Functions
- `onResults()`: Processes MediaPipe detection results
- `drawHandSkeleton()`: Renders green skeleton overlay
- `startTracking()`: Initializes camera and tracking
- `toggleRecording()`: Manages 3D coordinate recording
- `downloadData()`: Exports JSON with all captured frames

## Known Issues & Preferences

### User Preferences
- **Simplicity First**: User prefers single-purpose implementations over complex multi-mode systems
- **Visual Feedback**: Must show green skeleton dots and lines on detected hands
- **No Frills**: Avoid unnecessary features or UI elements
- **Working Code**: Prioritize functional code over feature additions

### Common Problems
1. Mode switching often breaks tracking - keep it simple
2. Pose tracking requires full body visibility to work
3. Multiple trackers running simultaneously can cause conflicts
4. User strongly prefers hand-only tracking that works reliably

## Development Notes

### What Works
- Hand tracking with MediaPipe Hands standalone
- Green skeleton visualization
- 3D coordinate recording and JSON export
- Simple start/stop controls

### What to Avoid
- Complex mode switching between different trackers
- Running multiple MediaPipe models simultaneously without careful management
- Over-engineering simple requirements
- Adding features that weren't explicitly requested

## Future Modifications
When modifying this project:
1. Always test hand tracking works before adding features
2. Keep the green skeleton visualization intact
3. Maintain the retro terminal aesthetic
4. Preserve 3D coordinate capture functionality
5. Test thoroughly before claiming something works

## Repository
GitHub: https://github.com/Joswinfich/hand-tracking-test.git

## Running the Application
1. Start a local server: `python3 -m http.server 8000`
2. Open browser to: `http://localhost:8000/body.html`
3. Click [START_TRACKING] to begin
4. Show hands to camera for detection

## Data Format
Exported JSON structure:
```json
{
  "version": "1.0",
  "captureDate": "ISO timestamp",
  "totalFrames": number,
  "fps": number,
  "frames": [
    {
      "timestamp": milliseconds,
      "hands": [
        {
          "label": "Left/Right",
          "confidence": 0-1,
          "landmarks3D": [{id, x, y, z}],
          "landmarks2D": [{id, x, y}]
        }
      ]
    }
  ]
}
```