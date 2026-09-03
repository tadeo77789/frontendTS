

export const downloadTextFile = (_filename: string, _content: string): void => {
  throw new Error('downloadTextFile solo está disponible en web por ahora');
};

export const pickTextFile = (): Promise<string | null> => {
  throw new Error('pickTextFile solo está disponible en web por ahora');
};

export const isFileIOSupported = (): boolean => false;
