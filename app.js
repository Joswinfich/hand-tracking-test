const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const recordBtn = document.getElementById('recordBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const terminal = document.getElementById('terminal');
const statusEl = document.getElementById('status');
const handsCountEl = document.getElementById('handsCount');
const fpsEl = document.getElementById('fps');
const framesRecordedEl = document.getElementById('framesRecorded');

let camera = null;
let isTracking = false;
let isRecording = false;
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;
let recordedFrames = [];
let terminalLines = [];
const MAX_TERMINAL_LINES = 100;

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

function addTerminalLine(text) {
    const timestamp = new Date().toTimeString().split(' ')[0];
    const line = `[${timestamp}] ${text}`;
    terminalLines.push(line);
    if (terminalLines.length > MAX_TERMINAL_LINES) {
        terminalLines.shift();
    }
    terminal.textContent = terminalLines.join('\n');
    terminal.scrollTop = terminal.scrollHeight;
}

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    if (results.multiHandLandmarks && results.multiHandWorldLandmarks) {
        const numHands = results.multiHandLandmarks.length;
        handsCountEl.textContent = numHands;
        
        const frameData = {
            timestamp: Date.now(),
            hands: []
        };
        
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const worldLandmarks = results.multiHandWorldLandmarks[i];
            const handedness = results.multiHandedness[i];
            
            drawHandSkeleton(canvasCtx, landmarks);
            
            const handData = {
                label: handedness.label,
                confidence: handedness.score,
                landmarks3D: worldLandmarks.map((lm, idx) => ({
                    id: idx,
                    x: lm.x,
                    y: lm.y,
                    z: lm.z
                })),
                landmarks2D: landmarks.map((lm, idx) => ({
                    id: idx,
                    x: lm.x * canvasElement.width,
                    y: lm.y * canvasElement.height
                }))
            };
            
            frameData.hands.push(handData);
            
            if (frameCount % 30 === 0) {
                const wrist = worldLandmarks[0];
                addTerminalLine(`${handedness.label}_HAND: WRIST[${wrist.x.toFixed(3)}, ${wrist.y.toFixed(3)}, ${wrist.z.toFixed(3)}]`);
            }
        }
        
        if (isRecording && numHands > 0) {
            recordedFrames.push(frameData);
            framesRecordedEl.textContent = recordedFrames.length;
            
            if (recordedFrames.length % 10 === 0) {
                addTerminalLine(`> RECORDING... ${recordedFrames.length} frames captured`);
            }
        }
        
        if (numHands === 0) {
            if (frameCount % 60 === 0) {
                addTerminalLine('> No hands detected...');
            }
        }
    } else {
        handsCountEl.textContent = '0';
    }
    
    canvasCtx.restore();
    updateFPS();
}

function drawHandSkeleton(ctx, landmarks) {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 5;
    
    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [5, 9], [9, 10], [10, 11], [11, 12],
        [9, 13], [13, 14], [14, 15], [15, 16],
        [13, 17], [17, 18], [18, 19], [19, 20],
        [0, 17]
    ];
    
    connections.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];
        
        ctx.beginPath();
        ctx.moveTo(startPoint.x * canvasElement.width, startPoint.y * canvasElement.height);
        ctx.lineTo(endPoint.x * canvasElement.width, endPoint.y * canvasElement.height);
        ctx.stroke();
    });
    
    landmarks.forEach((landmark, idx) => {
        const x = landmark.x * canvasElement.width;
        const y = landmark.y * canvasElement.height;
        
        ctx.beginPath();
        ctx.arc(x, y, idx === 0 ? 6 : 4, 0, 2 * Math.PI);
        ctx.fill();
        
        if (idx === 0 || idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '8px monospace';
            ctx.fillText(idx.toString(), x + 8, y - 8);
            ctx.fillStyle = '#00ff00';
        }
    });
    
    ctx.shadowBlur = 0;
}

function updateFPS() {
    frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - lastFrameTime;
    
    if (elapsed >= 1000) {
        fps = Math.round(frameCount * 1000 / elapsed);
        fpsEl.textContent = fps;
        frameCount = 0;
        lastFrameTime = currentTime;
    }
}

async function startTracking() {
    addTerminalLine('> INITIALIZING CAMERA...');
    statusEl.textContent = 'INITIALIZING';
    
    try {
        camera = new Camera(videoElement, {
            onFrame: async () => {
                if (isTracking) {
                    await hands.send({image: videoElement});
                }
            },
            width: 640,
            height: 480
        });
        
        await camera.start();
        isTracking = true;
        
        startBtn.disabled = true;
        stopBtn.disabled = false;
        statusEl.textContent = 'ONLINE';
        statusEl.style.color = '#00ff00';
        addTerminalLine('> TRACKING SYSTEM ONLINE');
        addTerminalLine('> Ready for hand detection...');
    } catch (error) {
        console.error('Error starting camera:', error);
        addTerminalLine('> ERROR: Camera initialization failed');
        addTerminalLine('> Check camera permissions');
        statusEl.textContent = 'ERROR';
        statusEl.style.color = '#ff0000';
    }
}

function stopTracking() {
    if (camera) {
        camera.stop();
        camera = null;
    }
    isTracking = false;
    isRecording = false;
    
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    handsCountEl.textContent = '0';
    fpsEl.textContent = '0';
    statusEl.textContent = 'OFFLINE';
    statusEl.style.color = '#00ff00';
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    recordBtn.textContent = '[RECORD_COORDS]';
    recordBtn.style.color = '#00ff00';
    
    addTerminalLine('> TRACKING SYSTEM OFFLINE');
}

function toggleRecording() {
    if (!isTracking) {
        addTerminalLine('> ERROR: Start tracking first');
        return;
    }
    
    isRecording = !isRecording;
    if (isRecording) {
        recordBtn.textContent = '[STOP_RECORDING]';
        recordBtn.style.color = '#ff0000';
        addTerminalLine('> RECORDING STARTED');
        addTerminalLine('> Capturing 3D coordinates...');
    } else {
        recordBtn.textContent = '[RECORD_COORDS]';
        recordBtn.style.color = '#00ff00';
        addTerminalLine(`> RECORDING STOPPED`);
        addTerminalLine(`> Total frames captured: ${recordedFrames.length}`);
    }
}

function clearData() {
    recordedFrames = [];
    framesRecordedEl.textContent = '0';
    addTerminalLine('> DATA CLEARED');
    addTerminalLine('> Memory buffer reset');
}

function downloadData() {
    if (recordedFrames.length === 0) {
        addTerminalLine('> ERROR: No data to download');
        return;
    }
    
    const data = {
        version: '1.0',
        captureDate: new Date().toISOString(),
        totalFrames: recordedFrames.length,
        fps: fps,
        frames: recordedFrames
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hand_tracking_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addTerminalLine(`> DATA EXPORTED: ${recordedFrames.length} frames`);
    addTerminalLine(`> File: hand_tracking_${Date.now()}.json`);
}

startBtn.addEventListener('click', startTracking);
stopBtn.addEventListener('click', stopTracking);
recordBtn.addEventListener('click', toggleRecording);
clearBtn.addEventListener('click', clearData);
downloadBtn.addEventListener('click', downloadData);

window.addEventListener('beforeunload', () => {
    if (camera) {
        camera.stop();
    }
});

addTerminalLine('> SYSTEM READY');
addTerminalLine('> Click [START_TRACKING] to begin');
addTerminalLine('> MediaPipe Hand Tracking v1.0 loaded');