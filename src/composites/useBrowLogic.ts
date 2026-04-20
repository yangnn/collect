import { abs, add, divide, multiply, sqrt, subtract } from "mathjs";

export type FaceShape = "oval" | "round" | "square";

export interface LandmarkPoint {
  x: number;
  y: number;
}

export interface BrowPoints {
  start: LandmarkPoint;
  arch: LandmarkPoint;
  end: LandmarkPoint;
  control: LandmarkPoint;
}

export interface BrowPairPoints {
  left: BrowPoints;
  right: BrowPoints;
}

export interface BrowDiagnosisResult {
  points: BrowPairPoints;
  confidence: number;
  symmetryScore: number;
  notes: string[];
}

export interface FaceShapeEstimate {
  faceShape: FaceShape;
  confidence: number;
  metrics: {
    widthToHeightRatio: number;
    jawToCheekRatio: number;
  };
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const normalizePoint = (
  point: LandmarkPoint,
  imageSize?: { width: number; height: number },
): LandmarkPoint => {
  if (!imageSize || imageSize.width <= 0 || imageSize.height <= 0) {
    return { x: clamp01(point.x), y: clamp01(point.y) };
  }

  const needsNormalization =
    point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1;

  if (!needsNormalization) {
    return { x: clamp01(point.x), y: clamp01(point.y) };
  }

  return {
    x: clamp01(divide(point.x, imageSize.width) as number),
    y: clamp01(divide(point.y, imageSize.height) as number),
  };
};

const midpoint = (a: LandmarkPoint, b: LandmarkPoint): LandmarkPoint => ({
  x: divide(add(a.x, b.x), 2) as number,
  y: divide(add(a.y, b.y), 2) as number,
});

const distance = (a: LandmarkPoint, b: LandmarkPoint): number => {
  const dx = subtract(a.x, b.x) as number;
  const dy = subtract(a.y, b.y) as number;
  return sqrt(add(multiply(dx, dx), multiply(dy, dy)) as number) as number;
};

const projectRayPoint = (
  origin: LandmarkPoint,
  target: LandmarkPoint,
  scale: number,
): LandmarkPoint => {
  const dx = subtract(target.x, origin.x) as number;
  const dy = subtract(target.y, origin.y) as number;
  return {
    x: clamp01(add(origin.x, multiply(dx, scale)) as number),
    y: clamp01(add(origin.y, multiply(dy, scale)) as number),
  };
};

const lerpPoint = (
  from: LandmarkPoint,
  to: LandmarkPoint,
  t: number,
): LandmarkPoint => ({
  x: clamp01(add(from.x, multiply(subtract(to.x, from.x) as number, t)) as number),
  y: clamp01(add(from.y, multiply(subtract(to.y, from.y) as number, t)) as number),
});

const mirrorPoint = (point: LandmarkPoint, centerX: number): LandmarkPoint => ({
  x: clamp01(subtract(multiply(2, centerX) as number, point.x) as number),
  y: clamp01(point.y),
});

const computeSingleBrow = (
  landmarks: LandmarkPoint[],
  faceShape: FaceShape,
  imageSize: { width: number; height: number } | undefined,
  indexMap: { innerEye: number; pupilOuter: number; eyeOuter: number },
): BrowPoints | null => {
  const innerEyeRaw = landmarks[indexMap.innerEye];
  const noseWingRaw = landmarks[1];
  const pupilOuterRaw = landmarks[indexMap.pupilOuter];
  const eyeOuterRaw = landmarks[indexMap.eyeOuter];
  if (!innerEyeRaw || !noseWingRaw || !pupilOuterRaw || !eyeOuterRaw) {
    return null;
  }

  const innerEye = normalizePoint(innerEyeRaw, imageSize);
  const noseWing = normalizePoint(noseWingRaw, imageSize);
  const pupilOuter = normalizePoint(pupilOuterRaw, imageSize);
  const eyeOuter = normalizePoint(eyeOuterRaw, imageSize);

  const start: LandmarkPoint = {
    x: innerEye.x,
    y: clamp01(innerEye.y - 0.11),
  };

  const arch = projectRayPoint(noseWing, pupilOuter, 1.08);
  const end = projectRayPoint(noseWing, eyeOuter, 1.2);

  if (faceShape === "round") {
    arch.y = clamp01(multiply(arch.y, 0.85) as number);
  }

  const blended = midpoint(midpoint(start, end), {
    x: arch.x,
    y: clamp01(arch.y - 0.04),
  });

  let control: LandmarkPoint = blended;
  if (faceShape === "square") {
    const curveDelta = abs(subtract(blended.y, arch.y)) as number;
    control = {
      x: blended.x,
      y: clamp01(
        subtract(blended.y, add(multiply(curveDelta, 0.2), 0.02)) as number,
      ),
    };
  }

  return {
    start,
    arch,
    end,
    control,
  };
};

const getSymmetryScore = (
  left: BrowPoints,
  right: BrowPoints,
  centerX: number,
): number => {
  const keys: Array<keyof BrowPoints> = ["start", "arch", "end", "control"];
  const totalDiff = keys.reduce((sum, key) => {
    const mirroredRight = mirrorPoint(right[key], centerX);
    const dx = abs(subtract(left[key].x, mirroredRight.x)) as number;
    const dy = abs(subtract(left[key].y, mirroredRight.y)) as number;
    return add(sum, add(dx, dy)) as number;
  }, 0);
  const averageDiff = divide(totalDiff, keys.length * 2) as number;
  return clamp01(subtract(1, multiply(averageDiff, 4)) as number);
};

export const useBrowLogic = () => {
  const estimateFaceShape = (
    landmarks: LandmarkPoint[],
    imageSize?: { width: number; height: number },
  ): FaceShapeEstimate | null => {
    if (!landmarks || landmarks.length < 455) {
      return null;
    }

    const leftCheek = normalizePoint(landmarks[234], imageSize);
    const rightCheek = normalizePoint(landmarks[454], imageSize);
    const forehead = normalizePoint(landmarks[10], imageSize);
    const chin = normalizePoint(landmarks[152], imageSize);
    const jawLeft = normalizePoint(landmarks[172], imageSize);
    const jawRight = normalizePoint(landmarks[397], imageSize);

    const cheekWidth = distance(leftCheek, rightCheek);
    const faceHeight = distance(forehead, chin);
    const jawWidth = distance(jawLeft, jawRight);

    if (faceHeight <= 0 || cheekWidth <= 0) {
      return null;
    }

    const widthToHeightRatio = divide(cheekWidth, faceHeight) as number;
    const jawToCheekRatio = divide(jawWidth, cheekWidth) as number;

    let faceShape: FaceShape = "oval";
    let confidence = 0.75;

    if (widthToHeightRatio >= 0.86) {
      if (jawToCheekRatio >= 0.84) {
        faceShape = "square";
        confidence = 0.82;
      } else {
        faceShape = "round";
        confidence = 0.8;
      }
    } else if (jawToCheekRatio >= 0.86 && widthToHeightRatio >= 0.8) {
      faceShape = "square";
      confidence = 0.78;
    }

    return {
      faceShape,
      confidence,
      metrics: {
        widthToHeightRatio,
        jawToCheekRatio,
      },
    };
  };

  const computeBrowDiagnosis = (
    landmarks: LandmarkPoint[],
    faceShape: FaceShape,
    imageSize?: { width: number; height: number },
  ): BrowDiagnosisResult | null => {
    if (!landmarks || landmarks.length < 470) {
      return null;
    }
    const leftBrow = computeSingleBrow(landmarks, faceShape, imageSize, {
      innerEye: 362,
      pupilOuter: 474,
      eyeOuter: 263,
    });
    const rightBrow = computeSingleBrow(landmarks, faceShape, imageSize, {
      innerEye: 133,
      pupilOuter: 469,
      eyeOuter: 33,
    });
    const noseWingRaw = landmarks[1];
    if (!leftBrow || !rightBrow || !noseWingRaw) {
      return null;
    }

    // Mirror correction: softly blend brows around face center to reduce asymmetry.
    const centerX = normalizePoint(noseWingRaw, imageSize).x;
    const correctionStrength = 0.35;
    const keys: Array<keyof BrowPoints> = ["start", "arch", "end", "control"];
    const correctedLeft: BrowPoints = { ...leftBrow };
    const correctedRight: BrowPoints = { ...rightBrow };

    keys.forEach((key) => {
      const mirroredRight = mirrorPoint(rightBrow[key], centerX);
      const targetLeft = midpoint(leftBrow[key], mirroredRight);
      const targetRight = mirrorPoint(targetLeft, centerX);
      correctedLeft[key] = lerpPoint(leftBrow[key], targetLeft, correctionStrength);
      correctedRight[key] = lerpPoint(rightBrow[key], targetRight, correctionStrength);
    });

    const symmetryScore = getSymmetryScore(correctedLeft, correctedRight, centerX);

    return {
      points: {
        left: correctedLeft,
        right: correctedRight,
      },
      confidence: 0.86,
      symmetryScore,
      notes: [
        "已分别生成左眉与右眉的眉头、眉峰、眉尾坐标。",
        "已进行镜像矫正以提升双侧眉形一致性。",
        faceShape === "round"
          ? "圆脸建议：提高眉峰可拉长纵向视觉比例。"
          : faceShape === "square"
            ? "方脸建议：使用更柔和弧度，弱化下颌硬朗感。"
            : "椭圆脸建议：保持自然平衡弧度即可。",
      ],
    };
  };

  return { estimateFaceShape, computeBrowDiagnosis };
};
