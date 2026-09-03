
import type { SignDetectionResult } from '../../../../shared/types';

export interface VisionFrame {

  base64: string;

  width: number;

  height: number;

  capturedAt: string;
}

export interface SignVisionProvider {

  readonly name: string;

  init?: () => Promise<void>;

  detect: (frame: VisionFrame) => Promise<SignDetectionResult>;

  dispose?: () => void;
}

export type { SignDetectionResult };
