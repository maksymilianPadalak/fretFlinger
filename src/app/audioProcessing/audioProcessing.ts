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

const setupContext = async (contextRef: React.RefObject<AudioContext>) => {
  try {
    const guitar = await getGuitar();
    const context = new AudioContext();
    const source = context.createMediaStreamSource(guitar);
    source.connect(context.destination);
    contextRef.current = context;
    audioContext = context;
    sourceNode = source;
  } catch (error) {
    console.error('Error setting up audio context:', error);
  }
};

const getAudioContext = () => audioContext;
const getSourceNode = () => sourceNode;

let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];
let recordedAudio: HTMLAudioElement | null = null;

const startRecording = async () => {
  try {
    const stream = await getGuitar();
    mediaRecorder = new MediaRecorder(stream);
    recordedChunks = [];

    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);
      recordedAudio = new Audio(audioUrl);
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

export {
  setupContext,
  startRecording,
  stopRecording,
  playRecording,
  isRecording,
  hasRecording,
  getAudioContext,
  getSourceNode,
};
