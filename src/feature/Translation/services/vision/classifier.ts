

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface ClassificationResult {
  letter: string;
  confidence: number;
}

const dist2D = (a: Landmark, b: Landmark): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

const palmSize = (lm: Landmark[]): number => dist2D(lm[0], lm[9]) || 1;

const isFingerExtended = (
  tip: Landmark,
  pip: Landmark,
  mcp: Landmark,
): boolean => dist2D(tip, mcp) > dist2D(pip, mcp) * 1.4;

const isFingerCurled = (
  tip: Landmark,
  pip: Landmark,
  mcp: Landmark,
): boolean => {
  const ext = dist2D(tip, mcp);
  const pipDist = dist2D(pip, mcp);

  return ext > pipDist * 0.7 && ext < pipDist * 1.3;
};

const isThumbExtended = (lm: Landmark[]): boolean => {
  const tip = lm[4];
  const ip = lm[3];
  const indexMcp = lm[5];
  return dist2D(tip, indexMcp) > dist2D(ip, indexMcp) * 1.1;
};

const isThumbAcrossPalm = (lm: Landmark[]): boolean => {
  const tip = lm[4];
  const indexMcp = lm[5];
  const pinkyMcp = lm[17];
  return dist2D(tip, pinkyMcp) < dist2D(tip, indexMcp);
};

const tipGap = (a: Landmark, b: Landmark, lm: Landmark[]): number =>
  dist2D(a, b) / palmSize(lm);

const fingersTogether = (a: Landmark, b: Landmark, lm: Landmark[]): boolean =>
  tipGap(a, b, lm) < 0.35;

const isIndexMiddleCrossed = (lm: Landmark[]): boolean => {

  const indexSide = lm[8].x - lm[5].x;
  const middleSide = lm[12].x - lm[9].x;
  return indexSide * middleSide < 0 && Math.abs(indexSide) > 0.02;
};

const isThumbBetweenIndexMiddle = (lm: Landmark[]): boolean => {
  const thumb = lm[4];
  const indexBase = lm[5];
  const middleBase = lm[9];
  const minX = Math.min(indexBase.x, middleBase.x);
  const maxX = Math.max(indexBase.x, middleBase.x);
  return thumb.x >= minX - 0.02 && thumb.x <= maxX + 0.02;
};

const isThumbIndexPinch = (lm: Landmark[]): boolean =>
  tipGap(lm[4], lm[8], lm) < 0.25;

const isHandHorizontal = (lm: Landmark[]): boolean => {
  const dx = Math.abs(lm[9].x - lm[0].x);
  const dy = Math.abs(lm[9].y - lm[0].y);
  return dx > dy * 1.1;
};

const isHandPointingDown = (lm: Landmark[]): boolean => lm[9].y > lm[0].y + 0.05;

const avgFingerExtension = (lm: Landmark[]): number => {
  const ratios = [
    dist2D(lm[8], lm[5]) / palmSize(lm),
    dist2D(lm[12], lm[9]) / palmSize(lm),
    dist2D(lm[16], lm[13]) / palmSize(lm),
    dist2D(lm[20], lm[17]) / palmSize(lm),
  ];
  return ratios.reduce((s, v) => s + v, 0) / ratios.length;
};

export const classifyLetterLSC = (landmarks: Landmark[]): ClassificationResult => {
  if (!landmarks || landmarks.length < 21) {
    return { letter: '', confidence: 0 };
  }

  const lm = landmarks;
  const thumbExt = isThumbExtended(lm);
  const indexExt = isFingerExtended(lm[8], lm[6], lm[5]);
  const middleExt = isFingerExtended(lm[12], lm[10], lm[9]);
  const ringExt = isFingerExtended(lm[16], lm[14], lm[13]);
  const pinkyExt = isFingerExtended(lm[20], lm[18], lm[17]);

  const indexCurl = !indexExt && isFingerCurled(lm[8], lm[6], lm[5]);
  const middleCurl = !middleExt && isFingerCurled(lm[12], lm[10], lm[9]);
  const ringCurl = !ringExt && isFingerCurled(lm[16], lm[14], lm[13]);
  const pinkyCurl = !pinkyExt && isFingerCurled(lm[20], lm[18], lm[17]);

  if (!indexExt && !middleExt && !ringExt && !pinkyExt && !indexCurl && !middleCurl) {
    if (isThumbAcrossPalm(lm)) {

      if (isThumbBetweenIndexMiddle(lm)) {
        return { letter: 'T', confidence: 0.78 };
      }

      const thumbTip = lm[4];
      const ringMcp = lm[13];
      if (Math.abs(thumbTip.x - ringMcp.x) < 0.04) {
        return { letter: 'M', confidence: 0.72 };
      }
      return { letter: 'N', confidence: 0.7 };
    }

    if (thumbExt) {

      return { letter: 'A', confidence: 0.85 };
    }

    const thumbToIndexTip = tipGap(lm[4], lm[8], lm);
    if (thumbToIndexTip < 0.3) {
      return { letter: 'E', confidence: 0.7 };
    }
    return { letter: 'S', confidence: 0.78 };
  }

  if (
    !indexExt && !middleExt && !ringExt && !pinkyExt &&
    indexCurl && middleCurl && ringCurl && pinkyCurl
  ) {
    const pinch = tipGap(lm[4], lm[8], lm);
    if (pinch < 0.2) {
      return { letter: 'O', confidence: 0.78 };
    }
    if (pinch < 0.55) {
      return { letter: 'C', confidence: 0.78 };
    }
  }

  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    if (isHandHorizontal(lm) && !thumbExt) {
      return { letter: 'G', confidence: 0.75 };
    }
    return { letter: 'D', confidence: 0.85 };
  }
  if (!indexExt && indexCurl && !middleExt && !ringExt && !pinkyExt) {
    return { letter: 'X', confidence: 0.72 };
  }

  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    if (isHandHorizontal(lm)) {
      return { letter: 'H', confidence: 0.74 };
    }
    if (isIndexMiddleCrossed(lm)) {
      return { letter: 'R', confidence: 0.74 };
    }
    if (thumbExt && isThumbBetweenIndexMiddle(lm)) {
      return { letter: 'K', confidence: 0.74 };
    }
    if (fingersTogether(lm[8], lm[12], lm)) {
      return { letter: 'U', confidence: 0.8 };
    }
    return { letter: 'V', confidence: 0.85 };
  }

  if (indexExt && middleExt && ringExt && !pinkyExt) {
    return { letter: 'W', confidence: 0.85 };
  }

  if (indexExt && middleExt && ringExt && pinkyExt && !thumbExt) {
    return { letter: 'B', confidence: 0.85 };
  }

  if (indexExt && middleExt && ringExt && pinkyExt && thumbExt) {
    return { letter: '5', confidence: 0.85 };
  }

  if (thumbExt && indexExt && !middleExt && !ringExt && !pinkyExt) {
    return { letter: 'L', confidence: 0.85 };
  }

  if (thumbExt && !indexExt && !middleExt && !ringExt && pinkyExt) {
    return { letter: 'Y', confidence: 0.85 };
  }

  if (!indexExt && !middleExt && !ringExt && pinkyExt && !thumbExt) {
    return { letter: 'I', confidence: 0.85 };
  }

  if (middleExt && ringExt && pinkyExt && isThumbIndexPinch(lm)) {
    return { letter: 'F', confidence: 0.78 };
  }

  if (isHandPointingDown(lm)) {
    if (indexExt && middleExt && thumbExt && isThumbBetweenIndexMiddle(lm)) {
      return { letter: 'P', confidence: 0.7 };
    }
    if (indexExt && !middleExt && !ringExt && !pinkyExt && thumbExt) {
      return { letter: 'Q', confidence: 0.7 };
    }
  }

  const avg = avgFingerExtension(lm);
  return { letter: '', confidence: avg < 0.5 ? 0.3 : 0.35 };
};
