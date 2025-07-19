const getGuitar = () => {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false,
    },
  });
};

let audioContext: AudioContext | null = null;
let sourceNode: MediaStreamAudioSourceNode | null = null;

const setupContext = async (
  contextRef: React.RefObject<AudioContext>
): Promise<boolean> => {
  try {
    const guitar = await getGuitar();
    const context = new AudioContext();
    const source = context.createMediaStreamSource(guitar);
    source.connect(context.destination);
    contextRef.current = context;
    audioContext = context;
    sourceNode = source;
    return true;
  } catch (error) {
    console.error('Error setting up audio context:', error);
    return false;
  }
};

const getAudioContext = () => audioContext;
const getSourceNode = () => sourceNode;

// Function to get accurate duration using Web Audio API
const getAccurateDuration = async (blob: Blob): Promise<number> => {
  const arrayBuffer = await blob.arrayBuffer();
  const tempAudioContext = new AudioContext();
  try {
    const audioBuffer = await tempAudioContext.decodeAudioData(arrayBuffer);
    await tempAudioContext.close();
    return audioBuffer.duration;
  } catch (error) {
    await tempAudioContext.close();
    throw error;
  }
};

let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];
let recordedAudio: HTMLAudioElement | null = null;
let recordingStartTime: number | null = null;
let recordedBlob: Blob | null = null;
let cachedDuration: number | null = null;

const startRecording = async () => {
  try {
    const stream = await getGuitar();
    mediaRecorder = new MediaRecorder(stream);
    recordedChunks = [];
    recordingStartTime = Date.now();

    // Clear previous recording data
    cachedDuration = null;
    recordedBlob = null;
    recordedAudio = null;

    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'audio/wav' });
      recordedBlob = blob;
      const audioUrl = URL.createObjectURL(blob);
      recordedAudio = new Audio(audioUrl);

      // Log recording metadata
      console.log('Recording finished!');
      console.log('Blob size:', blob.size, 'bytes');
      console.log('Blob type:', blob.type);
      console.log(
        'Recording duration (estimated):',
        recordingStartTime
          ? (Date.now() - recordingStartTime) / 1000
          : 'unknown',
        'seconds'
      );

      // Try to get accurate duration using Web Audio API
      getAccurateDuration(blob)
        .then((duration: number) => {
          console.log(
            'Accurate duration from Web Audio API:',
            duration,
            'seconds'
          );
          cachedDuration = duration;
        })
        .catch((error: unknown) => {
          console.error('Error getting accurate duration:', error);
        });

      // Wait for audio metadata to load and log it
      recordedAudio.addEventListener('loadedmetadata', () => {
        console.log('Audio duration:', recordedAudio?.duration, 'seconds');
        console.log('Audio readyState:', recordedAudio?.readyState);
        console.log('Audio networkState:', recordedAudio?.networkState);
      });

      recordedAudio.addEventListener('canplay', () => {
        console.log('Audio can play - duration:', recordedAudio?.duration);
      });

      recordedAudio.load();
    };

    mediaRecorder.start();
    return true;
  } catch (error) {
    console.error('Error starting recording:', error);
    return false;
  }
};

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    return true;
  }
  return false;
};

const playRecording = () => {
  if (recordedAudio) {
    recordedAudio.currentTime = 0;
    recordedAudio.play();
    return true;
  }
  return false;
};

const isRecording = () => {
  return mediaRecorder?.state === 'recording';
};

const hasRecording = () => {
  return recordedAudio !== null;
};

const waitForRecordingProcessing = (): Promise<void> => {
  return new Promise(resolve => {
    if (cachedDuration !== null) {
      resolve();
      return;
    }

    const checkProcessing = () => {
      if (cachedDuration !== null) {
        resolve();
      } else {
        setTimeout(checkProcessing, 50);
      }
    };

    checkProcessing();
  });
};

const getRecordingDuration = async (): Promise<number | null> => {
  if (cachedDuration !== null) {
    return cachedDuration;
  }

  if (recordedBlob) {
    try {
      const duration = await getAccurateDuration(recordedBlob);
      cachedDuration = duration;
      return duration;
    } catch (error) {
      console.error('Error getting duration:', error);
      return null;
    }
  }

  return null;
};

const getRecordingSize = (): number | null => {
  return recordedBlob ? recordedBlob.size : null;
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export {
  setupContext,
  startRecording,
  stopRecording,
  playRecording,
  isRecording,
  hasRecording,
  getAudioContext,
  getSourceNode,
  getRecordingDuration,
  getRecordingSize,
  formatDuration,
  formatSize,
  waitForRecordingProcessing,
};
