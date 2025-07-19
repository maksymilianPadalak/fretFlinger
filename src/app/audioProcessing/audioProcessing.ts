const getGuitar = () => {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false,
    },
  });
};

const setupContext = async (contextRef: React.RefObject<AudioContext>) => {
  try {
    const guitar = await getGuitar();
    const context = new AudioContext();
    const source = context.createMediaStreamSource(guitar);
    source.connect(context.destination);
    contextRef.current = context;
  } catch (error) {
    console.error('Error setting up audio context:', error);
  }
};

export { setupContext };
