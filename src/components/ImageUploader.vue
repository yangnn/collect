<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import type { FaceShape } from "../composites/useBrowLogic";

interface SelectedPayload {
  file: File;
  url: string;
  faceShape?: FaceShape;
}

interface Props {
  isProcessing?: boolean;
  faceShape?: FaceShape;
}

const props = withDefaults(defineProps<Props>(), {
  isProcessing: false,
  faceShape: "oval",
});

const emit = defineEmits<{
  (event: "selected", payload: SelectedPayload): void;
}>();

const previewUrl = ref("");
let previousObjectUrl = "";
const selectedFaceShape = ref<FaceShape>(props.faceShape);
const useAutoFaceShape = ref(true);

const releasePrevious = () => {
  if (previousObjectUrl) {
    URL.revokeObjectURL(previousObjectUrl);
    previousObjectUrl = "";
  }
};

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  releasePrevious();
  const url = URL.createObjectURL(file);
  previousObjectUrl = url;
  previewUrl.value = url;

  emit("selected", {
    file,
    url,
    faceShape: useAutoFaceShape.value ? undefined : selectedFaceShape.value,
  });
};

onBeforeUnmount(() => {
  releasePrevious();
});
</script>

<template>
  <section class="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
    <h2 class="text-lg font-semibold text-white">上传照片</h2>
    <p class="mt-2 text-sm text-slate-300">
      建议上传正脸、光线均匀、眉毛无遮挡的照片，以提高识别与诊断稳定性。
    </p>

    <label
      class="mt-4 inline-flex cursor-pointer items-center rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
    >
      选择图片
      <input
        class="hidden"
        type="file"
        accept="image/*"
        :disabled="props.isProcessing"
        @change="onFileChange"
      />
    </label>

    <div class="mt-4">
      <p class="mb-2 text-sm text-slate-300">脸型模式：</p>
      <label
        class="inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-1 text-sm"
      >
        <input v-model="useAutoFaceShape" type="checkbox" />
        自动识别脸型
      </label>
    </div>

    <div class="mt-4" :class="{ 'opacity-60': useAutoFaceShape }">
      <p class="mb-2 text-sm text-slate-300">手动脸型偏好（自动模式下仅作回退）</p>
      <div class="flex flex-wrap gap-2">
        <label class="inline-flex items-center gap-1 rounded-md bg-slate-800 px-3 py-1 text-sm">
          <input
            v-model="selectedFaceShape"
            type="radio"
            value="oval"
            :disabled="useAutoFaceShape"
          />
          椭圆脸
        </label>
        <label class="inline-flex items-center gap-1 rounded-md bg-slate-800 px-3 py-1 text-sm">
          <input
            v-model="selectedFaceShape"
            type="radio"
            value="round"
            :disabled="useAutoFaceShape"
          />
          圆脸
        </label>
        <label class="inline-flex items-center gap-1 rounded-md bg-slate-800 px-3 py-1 text-sm">
          <input
            v-model="selectedFaceShape"
            type="radio"
            value="square"
            :disabled="useAutoFaceShape"
          />
          方脸
        </label>
      </div>
    </div>

    <div v-if="previewUrl" class="mt-4 rounded-xl border border-slate-700 p-2">
      <img
        :src="previewUrl"
        alt="Uploaded preview"
        class="max-h-80 w-full rounded-lg object-contain"
      />
    </div>
  </section>
</template>
