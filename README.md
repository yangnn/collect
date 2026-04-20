# 眉部 AI 诊断系统 (Web MVP)

基于 Vue 3 + Vite + Pinia + Tailwind CSS + MediaPipe Face Mesh 的单页 Web 应用，用于上传正脸图片后进行眉部三点定位诊断并可视化渲染。

## 技术栈

- Vue 3 (Script Setup + TypeScript)
- Vite
- Pinia
- Tailwind CSS
- @mediapipe/face_mesh
- mathjs

## 项目结构

```text
src/
├── assets/
├── components/
│   ├── ImageUploader.vue
│   ├── BrowCanvas.vue
│   └── DiagnosticCard.vue
├── composites/
│   ├── useFaceMesh.ts
│   └── useBrowLogic.ts
├── stores/
│   └── useDiagnosticStore.ts
├── App.vue
└── main.ts
```

## 核心算法（MVP）

在 `useBrowLogic.ts` 中实现三点定位：

- 眉头 Start：参考内眼角 `Landmark 133` 垂直投影
- 眉峰 Arch：鼻翼 `Landmark 1` 到瞳孔外缘 `Landmark 469` 射线推算
- 眉尾 End：鼻翼 `Landmark 1` 到外眼角 `Landmark 33` 射线推算

脸型修正：

- Round：眉峰 y 坐标向上偏移 15%
- Square：通过抬高贝塞尔控制点，增加约 20% 弧度半径

## 运行方式

```bash
npm install
npm run dev
```

构建：

```bash
npm run typecheck
npm run build
```
