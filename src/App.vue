<script setup lang="ts">
import { computed } from "vue";
import ImageUploader from "./components/ImageUploader.vue";
import BrowCanvas from "./components/BrowCanvas.vue";
import DiagnosticCard from "./components/DiagnosticCard.vue";
import { useFaceMesh } from "./composites/useFaceMesh";
import { useBrowLogic, type FaceShape } from "./composites/useBrowLogic";
import { useDiagnosticStore } from "./stores/useDiagnosticStore";

const store = useDiagnosticStore();
const { estimateLandmarks } = useFaceMesh();
const { estimateFaceShape, computeBrowDiagnosis } = useBrowLogic();

const hasData = computed(() => !!store.rawImage && !!store.diagnosis);

const handleImageSelected = async (payload: {
  file: File;
  url: string;
  faceShape?: FaceShape;
}) => {
  store.setProcessing(true);
  store.setError(null);

  try {
    const image = new Image();
    image.src = payload.url;
    await image.decode();

    const manualFaceShape = payload.faceShape;
    store.setImage({
      element: image,
      url: payload.url,
      faceShape: manualFaceShape ?? "oval",
    });

    const points = await estimateLandmarks(image);
    if (!points?.length) {
      store.setError("未检测到清晰人脸，请上传正面无遮挡照片。");
      return;
    }

    const estimate = estimateFaceShape(points, {
      width: image.width,
      height: image.height,
    });

    let faceShapeMode: "auto" | "manual" | "fallback" = "auto";
    if (manualFaceShape) {
      faceShapeMode = "manual";
    } else if (!estimate) {
      faceShapeMode = "fallback";
    }

    const finalFaceShape = manualFaceShape ?? estimate?.faceShape ?? "oval";

    store.setLandmarks(points);
    store.setFaceShape(finalFaceShape);
    store.setFaceShapeMode(faceShapeMode);
    store.setFaceShapeEstimate(estimate);

    const diagnosis = computeBrowDiagnosis(points, finalFaceShape, {
      width: image.width,
      height: image.height,
    });
    if (!diagnosis) {
      store.setError("关键点计算失败，请更换照片重试。");
      return;
    }

    store.setDiagnosis(diagnosis);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "处理图片时出现未知错误。";
    store.setError(`诊断失败：${message}`);
  } finally {
    store.setProcessing(false);
  }
};
</script>

<template>
  <main class="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <header class="mb-8">
      <h1 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        眉部 AI 诊断系统（Web MVP）
      </h1>
      <p class="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">
        上传正脸照片后，系统将基于 Face Mesh 与三点定位法，生成理想眉形引导线及个性化诊断建议。
      </p>
    </header>

    <section class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div class="space-y-6">
        <ImageUploader
          :is-processing="store.isProcessing"
          :face-shape="store.faceShape"
          @selected="handleImageSelected"
        />

        <p
          v-if="store.errorMessage"
          class="rounded-lg bg-rose-900/40 p-3 text-sm text-rose-200"
        >
          {{ store.errorMessage }}
        </p>

        <BrowCanvas
          v-if="hasData"
          :image-element="store.rawImage!"
          :anchors="store.diagnosis!.points"
        />
        <div
          v-else
          class="rounded-2xl border border-dashed border-slate-600 bg-slate-900/30 p-10 text-center text-sm text-slate-400"
        >
          {{
            store.isProcessing
              ? "正在进行人脸关键点检测..."
              : "上传图片后将在这里显示算法叠加效果。"
          }}
        </div>
      </div>

      <DiagnosticCard
        :result="store.diagnosis"
        :face-shape="store.faceShape"
        :face-shape-estimate="store.faceShapeEstimate"
        :face-shape-mode="store.faceShapeMode"
      />
    </section>
  </main>
</template>
