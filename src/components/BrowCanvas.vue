<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { BrowPairPoints, BrowPoints } from "../composites/useBrowLogic";

interface Props {
  imageElement: HTMLImageElement;
  anchors: BrowPairPoints;
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  width: 640,
  height: 640,
});

const canvasRef = ref<HTMLCanvasElement | null>(null);

const drawLabel = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
) => {
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
  ctx.fillRect(x + 6, y - 24, 68, 22);
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px sans-serif";
  ctx.fillText(text, x + 12, y - 10);
};

const drawPoint = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  label: string,
) => {
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  drawLabel(ctx, label, x, y);
};

const drawBrowPath = (
  ctx: CanvasRenderingContext2D,
  brow: BrowPoints,
  toCanvasX: (v: number) => number,
  toCanvasY: (v: number) => number,
  strokeStyle: string,
  labelPrefix: string,
) => {
  const startX = toCanvasX(brow.start.x);
  const startY = toCanvasY(brow.start.y);
  const archX = toCanvasX(brow.arch.x);
  const archY = toCanvasY(brow.arch.y);
  const endX = toCanvasX(brow.end.x);
  const endY = toCanvasY(brow.end.y);
  const controlX = toCanvasX(brow.control.x);
  const controlY = toCanvasY(brow.control.y);

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(controlX, controlY, endX, endY);
  ctx.lineWidth = 4;
  ctx.strokeStyle = strokeStyle;
  ctx.stroke();

  drawPoint(ctx, startX, startY, "#14b8a6", `${labelPrefix}-Start`);
  drawPoint(ctx, archX, archY, "#f59e0b", `${labelPrefix}-Arch`);
  drawPoint(ctx, endX, endY, "#f43f5e", `${labelPrefix}-End`);
};

const drawResult = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const img = props.imageElement;
  const imageRatio = img.width / img.height;
  const canvasRatio = canvas.width / canvas.height;
  let drawWidth = canvas.width;
  let drawHeight = canvas.height;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > canvasRatio) {
    drawHeight = canvas.width / imageRatio;
    offsetY = (canvas.height - drawHeight) / 2;
  } else {
    drawWidth = canvas.height * imageRatio;
    offsetX = (canvas.width - drawWidth) / 2;
  }

  // 1. Draw base image layer
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

  const { left, right } = props.anchors;
  const toCanvasX = (v: number) => offsetX + v * drawWidth;
  const toCanvasY = (v: number) => offsetY + v * drawHeight;

  // 2. Draw left and right ideal brow overlays
  drawBrowPath(
    ctx,
    left,
    toCanvasX,
    toCanvasY,
    "rgba(255, 255, 255, 0.72)",
    "L",
  );
  drawBrowPath(
    ctx,
    right,
    toCanvasX,
    toCanvasY,
    "rgba(167, 243, 208, 0.72)",
    "R",
  );
};

onMounted(drawResult);
watch(
  () => [props.imageElement, props.anchors],
  drawResult,
  { deep: true },
);
</script>

<template>
  <div class="rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-lg">
    <canvas
      ref="canvasRef"
      :width="width"
      :height="height"
      class="w-full rounded-xl bg-slate-900"
    />
  </div>
</template>
