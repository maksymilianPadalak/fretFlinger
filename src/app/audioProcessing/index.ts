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
} from './audioProcessing';

// Export note frequency functions
export {
  noteToHz,
  getAvailableNotes,
  isValidNote,
  hzToNote,
} from './noteFrequencies';
