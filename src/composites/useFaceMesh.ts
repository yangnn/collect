import { FaceMesh } from "@mediapipe/face_mesh";
import type { LandmarkPoint } from "./useBrowLogic";

type FaceMeshResults = {
  multiFaceLandmarks?: Array<Array<{ x: number; y: number; z?: number }>>;
};

type FaceMeshConfig = {
  maxNumFaces?: number;
  refineLandmarks?: boolean;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
};

export const useFaceMesh = (config?: FaceMeshConfig) => {
  const faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  });

  faceMesh.setOptions({
    maxNumFaces: config?.maxNumFaces ?? 1,
    refineLandmarks: config?.refineLandmarks ?? true,
    minDetectionConfidence: config?.minDetectionConfidence ?? 0.6,
    minTrackingConfidence: config?.minTrackingConfidence ?? 0.6,
  });

  const estimateLandmarks = async (
    image: HTMLImageElement,
  ): Promise<LandmarkPoint[] | null> =>
    new Promise((resolve, reject) => {
      const onResult = (results: FaceMeshResults) => {
        faceMesh.onResults(() => undefined);
        const points =
          results.multiFaceLandmarks?.[0]?.map((pt) => ({
            x: pt.x,
            y: pt.y,
          })) ?? null;
        resolve(points);
      };

      faceMesh.onResults(onResult);
      faceMesh.send({ image }).catch((error: unknown) => reject(error));
    });

  return {
    estimateLandmarks,
  };
};
