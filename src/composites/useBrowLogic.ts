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

export interface BrowDiagnosisResult {
  points: BrowPoints;
  confidence: number;
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

    const innerEye = normalizePoint(landmarks[133], imageSize);
    const noseWing = normalizePoint(landmarks[1], imageSize);
    const pupilOuter = normalizePoint(landmarks[469], imageSize);
    const eyeOuter = normalizePoint(landmarks[33], imageSize);

    // Start: vertical projection using inner eye x.
    const start: LandmarkPoint = {
      x: innerEye.x,
      y: clamp01(innerEye.y - 0.11),
    };

    // Arch: ray from nose wing to outer edge of pupil.
    const arch = projectRayPoint(noseWing, pupilOuter, 1.08);

    // End: ray from nose wing to outer eye corner.
    const end = projectRayPoint(noseWing, eyeOuter, 1.2);

    if (faceShape === "round") {
      // Round face correction: move arch up by 15%.
      arch.y = clamp01(multiply(arch.y, 0.85) as number);
    }

    const blended = midpoint(midpoint(start, end), {
      x: arch.x,
      y: clamp01(arch.y - 0.04),
    });

    let control: LandmarkPoint = blended;
    if (faceShape === "square") {
      // Square face correction: increase arc radius by around 20%.
      const curveDelta = abs(subtract(blended.y, arch.y)) as number;
      control = {
        x: blended.x,
        y: clamp01(
          subtract(blended.y, add(multiply(curveDelta, 0.2), 0.02)) as number,
        ),
      };
    }

    return {
      points: { start, arch, end, control },
      confidence: 0.86,
      notes: [
        "已根据三点定位法生成眉头、眉峰、眉尾坐标。",
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
