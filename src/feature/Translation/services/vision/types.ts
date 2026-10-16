
import type { SignDetectionResult } from '../../../../shared/types';

export interface VisionFrame {

  base64: string;

  width: number;

  height: number;

  capturedAt: string;
}

export interface SignVisionProvider {

  readonly name: string;

  /**
   * Si el proveedor lee la imagen de VisionFrame.base64. Cuando es false el
   * agente no dispara la camara: el mock no mira la foto y en Android cada
   * disparo suena el obturador y congela la vista previa.
   */
  readonly requiresFrame?: boolean;

  init?: () => Promise<void>;

  detect: (frame: VisionFrame) => Promise<SignDetectionResult>;

  dispose?: () => void;
}

export type { SignDetectionResult };
