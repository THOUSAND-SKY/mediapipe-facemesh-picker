import { MeshResult } from '../types';
// @ts-ignore
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

class FaceMeshService {
  private faceLandmarker: any = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initialize();
  }

  private async initialize() {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      
      this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          // Switch to CPU to prevent "index out of bounds" errors on some GPU/Browser combos
          delegate: "CPU" 
        },
        outputFaceBlendshapes: false,
        runningMode: "IMAGE",
        numFaces: 1
      });
    } catch (error) {
      console.error("Failed to initialize FaceLandmarker:", error);
    }
  }

  public async processImage(imageElement: HTMLImageElement): Promise<MeshResult> {
    // Ensure initialization is complete
    if (!this.faceLandmarker) {
      if (this.initPromise) {
        await this.initPromise;
      }
      // Retry init if still null
      if (!this.faceLandmarker) {
        await this.initialize();
      }
    }

    if (!this.faceLandmarker) {
        throw new Error("FaceLandmarker service failed to initialize. Please reload the page.");
    }

    // Sanity check dimensions to prevent WASM index out of bounds
    if (imageElement.naturalWidth === 0 || imageElement.naturalHeight === 0) {
      throw new Error("Image dimensions are zero. Image might not be fully loaded.");
    }

    try {
      // FaceLandmarker.detect is synchronous for IMAGE mode
      const result = this.faceLandmarker.detect(imageElement);

      // Map the FaceLandmarker result to our internal MeshResult structure
      // result.faceLandmarks is NormalizedLandmark[][]
      if (result.faceLandmarks && result.faceLandmarks.length > 0) {
        return {
          multiFaceLandmarks: result.faceLandmarks,
          imageWidth: imageElement.naturalWidth,
          imageHeight: imageElement.naturalHeight,
        };
      } else {
        return {
          multiFaceLandmarks: [],
          imageWidth: imageElement.naturalWidth,
          imageHeight: imageElement.naturalHeight,
        };
      }
    } catch (e) {
      console.error("Detection failed:", e);
      throw e;
    }
  }
}

export const faceMeshService = new FaceMeshService();