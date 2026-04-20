import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type {
  BrowDiagnosisResult,
  FaceShape,
  FaceShapeEstimate,
  LandmarkPoint,
} from "../composites/useBrowLogic";

export const useDiagnosticStore = defineStore("diagnostic", () => {
  const rawImage = ref<HTMLImageElement | null>(null);
  const rawImageUrl = ref<string | null>(null);
  const landmarks = ref<LandmarkPoint[] | null>(null);
  const diagnosis = ref<BrowDiagnosisResult | null>(null);
  const isProcessing = ref(false);
  const errorMessage = ref<string | null>(null);
  const faceShape = ref<FaceShape>("oval");
  const faceShapeEstimate = ref<FaceShapeEstimate | null>(null);
  const faceShapeMode = ref<"auto" | "manual" | "fallback" | null>(null);

  const hasImage = computed(() => Boolean(rawImage.value));
  const hasDiagnosis = computed(() => Boolean(diagnosis.value));

  function setImage(payload: {
    element: HTMLImageElement;
    url: string;
    faceShape?: FaceShape;
  }) {
    rawImage.value = payload.element;
    rawImageUrl.value = payload.url;
    faceShape.value = payload.faceShape ?? faceShape.value;
    landmarks.value = null;
    diagnosis.value = null;
    errorMessage.value = null;
    faceShapeEstimate.value = null;
  }

  function setLandmarks(nextLandmarks: LandmarkPoint[]) {
    landmarks.value = nextLandmarks;
  }

  function setDiagnosis(result: BrowDiagnosisResult) {
    diagnosis.value = result;
    errorMessage.value = null;
  }

  function setFaceShape(nextFaceShape: FaceShape) {
    faceShape.value = nextFaceShape;
  }

  function setFaceShapeEstimate(estimate: FaceShapeEstimate | null) {
    faceShapeEstimate.value = estimate;
  }

  function setFaceShapeMode(mode: "auto" | "manual" | "fallback" | null) {
    faceShapeMode.value = mode;
  }

  function setProcessing(status: boolean) {
    isProcessing.value = status;
  }

  function setError(message: string | null) {
    errorMessage.value = message;
  }

  function resetAll() {
    rawImage.value = null;
    rawImageUrl.value = null;
    landmarks.value = null;
    diagnosis.value = null;
    isProcessing.value = false;
    errorMessage.value = null;
    faceShape.value = "oval";
    faceShapeEstimate.value = null;
    faceShapeMode.value = null;
  }

  return {
    rawImage,
    rawImageUrl,
    landmarks,
    diagnosis,
    isProcessing,
    errorMessage,
    faceShape,
    faceShapeEstimate,
    faceShapeMode,
    hasImage,
    hasDiagnosis,
    setImage,
    setLandmarks,
    setDiagnosis,
    setFaceShape,
    setFaceShapeEstimate,
    setFaceShapeMode,
    setProcessing,
    setError,
    resetAll,
  };
});
