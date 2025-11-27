export interface WatermarkSettings {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  rotation: number;
}

export interface Size {
  width: number;
  height: number;
}

export enum Tab {
  UPLOAD = 'UPLOAD',
  SETTINGS = 'SETTINGS',
  AI_GENERATE = 'AI_GENERATE'
}

export interface Photo {
  id: string;
  src: string;
  file: File;
  name: string;
}