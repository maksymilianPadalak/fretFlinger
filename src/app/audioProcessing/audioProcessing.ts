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
let convolverNode: ConvolverNode | null = null;
let dryGainNode: GainNode | null = null;
let wetGainNode: GainNode | null = null;
let outputGainNode: GainNode | null = null;

// Create a simple impulse response for convolution reverb
const createImpulseResponse = (
  context: AudioContext,
  duration: number = 2.0,
  decay: number = 2.0
): AudioBuffer => {
  const length = context.sampleRate * duration;
  const impulse = context.createBuffer(2, length, context.sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // Create exponentially decaying white noise
      const n = length - i;
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
    }
  }

  return impulse;
};

const setupContext = async (
  contextRef: React.RefObject<AudioContext>
): Promise<boolean> => {
  try {
    const guitar = await getGuitar();
    const context = new AudioContext();
    const source = context.createMediaStreamSource(guitar);

    // Create convolution reverb nodes
    convolverNode = context.createConvolver();
    dryGainNode = context.createGain();
    wetGainNode = context.createGain();
    outputGainNode = context.createGain();

    // Create impulse response for the reverb
    const impulseResponse = createImpulseResponse(context, 3.0, 2.5); // 3 second reverb with medium decay
    convolverNode.buffer = impulseResponse;

    // Set initial gain levels
    dryGainNode.gain.value = 0.7; // Dry signal level
    wetGainNode.gain.value = 0.5; // Wet signal level
    outputGainNode.gain.value = 1.0; // Master output level

    // Connect the signal chain:
    // Dry path: guitar -> dryGain -> output
    source.connect(dryGainNode);
    dryGainNode.connect(outputGainNode);

    // Wet path: guitar -> convolver -> wetGain -> output
    source.connect(convolverNode);
    convolverNode.connect(wetGainNode);
    wetGainNode.connect(outputGainNode);

    // Output to speakers
    outputGainNode.connect(context.destination);

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

// Function to control reverb amount (0.0 = no reverb, 1.0 = full reverb)
const setReverbLevel = (level: number) => {
  if (wetGainNode) {
    wetGainNode.gain.value = Math.max(0, Math.min(1, level));
  }
};

// Function to control dry signal level (0.0 = no dry, 1.0 = full dry)
const setDryLevel = (level: number) => {
  if (dryGainNode) {
    dryGainNode.gain.value = Math.max(0, Math.min(1, level));
  }
};

// Function to set dry/wet mix (0.0 = all dry, 1.0 = all wet)
const setReverbMix = (mix: number) => {
  if (dryGainNode && wetGainNode) {
    const clampedMix = Math.max(0, Math.min(1, mix));
    dryGainNode.gain.value = 1.0 - clampedMix;
    wetGainNode.gain.value = clampedMix;
  }
};

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
  setReverbLevel,
  setDryLevel,
  setReverbMix,
};
