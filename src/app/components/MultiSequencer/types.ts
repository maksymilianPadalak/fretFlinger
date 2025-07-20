export interface MultiSequencerProps {
  className?: string;
  externalPreset?: Preset | null;
  onPresetLoaded?: (presetName: string) => void;
}

export interface Step {
  active: boolean;
  note: string;
}

export interface Track {
  id: string;
  name: string;
  steps: Step[];
  volume: number;
  muted: boolean;
  color: string;
}

export interface Preset {
  name: string;
  description: string;
  bpm: number;
  tracks: {
    [trackId: string]: {
      steps: { active: boolean; note: string }[];
      volume: number;
      muted: boolean;
    };
  };
}

export type TrackColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'blue'
  | 'purple'
  | 'green'
  | 'pink';
