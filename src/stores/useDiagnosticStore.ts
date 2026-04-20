import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type {
  BrowDiagnosisResult,
  FaceShape,
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

  const hasImage = computed(() => Boolean(rawImage.value));
  const hasDiagnosis = computed(() => Boolean(diagnosis.value));

  function setImage(payload: {
    element: HTMLImageElement;
    url: string;
    faceShape: FaceShape;
  }) {
    rawImage.value = payload.element;
    rawImageUrl.value = payload.url;
    faceShape.value = payload.faceShape;
    landmarks.value = null;
    diagnosis.value = null;
    errorMessage.value = null;
  }

  function setLandmarks(nextLandmarks: LandmarkPoint[]) {
    landmarks.value = nextLandmarks;
  }

  function setDiagnosis(result: BrowDiagnosisResult) {
    diagnosis.value = result;
    errorMessage.value = null;
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
  }

  return {
    rawImage,
    rawImageUrl,
    landmarks,
    diagnosis,
    isProcessing,
    errorMessage,
    faceShape,
    hasImage,
    hasDiagnosis,
    setImage,
    setLandmarks,
    setDiagnosis,
    setProcessing,
    setError,
    resetAll,
  };
});
