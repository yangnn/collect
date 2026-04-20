<script setup lang="ts">
import type {
  BrowDiagnosisResult,
  FaceShape,
  FaceShapeEstimate,
} from "../composites/useBrowLogic";

const props = defineProps<{
  result: BrowDiagnosisResult | null;
  faceShape: FaceShape;
  faceShapeEstimate: FaceShapeEstimate | null;
  faceShapeMode: "auto" | "manual" | "fallback" | null;
}>();

const toText = (value: number) => value.toFixed(3);

const faceShapeLabel: Record<FaceShape, string> = {
  oval: "椭圆脸 (Oval)",
  round: "圆脸 (Round)",
  square: "方脸 (Square)",
};
</script>

<template>
  <section class="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
    <h2 class="text-lg font-semibold text-white">诊断报告</h2>
    <p class="mt-2 text-sm text-slate-300">
      当前脸型：<span class="font-medium text-cyan-200">{{
        faceShapeLabel[props.faceShape]
      }}</span>
    </p>
    <p v-if="props.faceShapeEstimate" class="mt-1 text-xs text-slate-400">
      {{
        props.faceShapeMode === "auto"
          ? "来源：自动识别"
          : props.faceShapeMode === "manual"
            ? "来源：手动指定"
            : "来源：自动失败后回退"
      }}，置信度：{{ (props.faceShapeEstimate.confidence * 100).toFixed(1) }}%
      <template v-if="props.faceShapeEstimate.metrics.widthToHeightRatio !== undefined">
        ，宽高比：{{ props.faceShapeEstimate.metrics.widthToHeightRatio.toFixed(3) }}
      </template>
      <template v-if="props.faceShapeEstimate.metrics.jawToCheekRatio !== undefined">
        ，下颌/颧骨比：{{ props.faceShapeEstimate.metrics.jawToCheekRatio.toFixed(3) }}
      </template>
    </p>

    <template v-if="props.result">
      <p class="mt-1 text-sm text-slate-300">
        诊断置信度：
        <span class="font-semibold text-emerald-300"
          >{{ (props.result.confidence * 100).toFixed(1) }}%</span
        >
      </p>

      <div class="mt-4 space-y-2 text-xs text-slate-200">
        <div class="rounded-md bg-slate-950/70 px-3 py-2">
          眉头 Start:
          <span class="font-mono"
            >({{ toText(props.result.points.start.x) }},
            {{ toText(props.result.points.start.y) }})</span
          >
        </div>
        <div class="rounded-md bg-slate-950/70 px-3 py-2">
          眉峰 Arch:
          <span class="font-mono"
            >({{ toText(props.result.points.arch.x) }},
            {{ toText(props.result.points.arch.y) }})</span
          >
        </div>
        <div class="rounded-md bg-slate-950/70 px-3 py-2">
          眉尾 End:
          <span class="font-mono"
            >({{ toText(props.result.points.end.x) }},
            {{ toText(props.result.points.end.y) }})</span
          >
        </div>
        <div class="rounded-md bg-slate-950/70 px-3 py-2">
          控制点 Control:
          <span class="font-mono"
            >({{ toText(props.result.points.control.x) }},
            {{ toText(props.result.points.control.y) }})</span
          >
        </div>
      </div>

      <ul class="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-300">
        <li v-for="(note, idx) in props.result.notes" :key="idx">{{ note }}</li>
      </ul>
    </template>

    <p
      v-else
      class="mt-4 rounded-md bg-slate-950/70 px-3 py-3 text-sm text-slate-400"
    >
      上传正脸照片后，将在这里显示三点定位结果和个性化建议。
    </p>
  </section>
</template>
