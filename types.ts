export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface MeshResult {
  multiFaceLandmarks: Landmark[][];
  imageWidth: number;
  imageHeight: number;
}

export enum SelectionMode {
  SINGLE = 'SINGLE',
  BRUSH = 'BRUSH', // Placeholder for future expansion
}

export interface AnalysisResult {
  title: string;
  description: string;
}
