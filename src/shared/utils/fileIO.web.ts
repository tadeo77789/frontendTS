

export const downloadTextFile = (filename: string, content: string, mime = 'application/json'): void => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const pickTextFile = (accept = 'application/json,.json'): Promise<string | null> =>
  new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';

    let settled = false;
    const settle = (val: string | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(val);
    };

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return settle(null);
      const reader = new FileReader();
      reader.onload = () => settle(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => settle(null);
      reader.readAsText(file);
    };

    document.body.appendChild(input);
    input.click();
  });

export const isFileIOSupported = (): boolean => true;
