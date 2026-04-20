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

在 `useBrowLogic.ts` 中实现三点定位，并扩展为左右眉分别建模：

- 右眉：
  - 眉头 Start：内眼角 `Landmark 133` 垂直投影
  - 眉峰 Arch：鼻翼 `Landmark 1` -> 瞳孔外缘 `Landmark 469` 射线
  - 眉尾 End：鼻翼 `Landmark 1` -> 外眼角 `Landmark 33` 射线
- 左眉：
  - 眉头 Start：内眼角 `Landmark 362` 垂直投影
  - 眉峰 Arch：鼻翼 `Landmark 1` -> 瞳孔外缘 `Landmark 474` 射线
  - 眉尾 End：鼻翼 `Landmark 1` -> 外眼角 `Landmark 263` 射线

脸型修正：

- Round：眉峰 y 坐标向上偏移 15%
- Square：通过抬高贝塞尔控制点，增加约 20% 弧度半径

### 左右镜像矫正（新增）

系统会在双眉独立计算后，基于中轴线（鼻翼 x 坐标）执行镜像矫正：

- 将右眉关键点镜像到左侧，与左眉点求中间目标
- 以 35% 权重将左右眉向目标位置平滑靠拢（避免过度僵硬）
- 输出 `symmetryScore`（0-1）表示矫正后的双侧一致性

前端渲染层会分别绘制左右眉曲线，并展示左右关键点坐标与对称度。

### 自动脸型识别（新增）

系统在上传后会基于 Face Mesh 关键点自动估计脸型：

- 颧骨宽度：`Landmark 234` 到 `Landmark 454`
- 面部高度：`Landmark 10` 到 `Landmark 152`
- 下颌宽度：`Landmark 172` 到 `Landmark 397`

使用宽高比和下颌/颧骨比进行规则分类：

- `widthToHeightRatio` 较高且 `jawToCheekRatio` 较高 -> Square
- `widthToHeightRatio` 较高且 `jawToCheekRatio` 较低 -> Round
- 其余默认 -> Oval

上传组件支持两种模式：

- 自动识别脸型（默认）
- 手动指定脸型（作为覆盖）

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
