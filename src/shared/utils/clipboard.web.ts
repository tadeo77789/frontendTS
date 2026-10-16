/**
 * Copia texto al portapapeles. Devuelve false cuando el texto esta vacio o la
 * plataforma no deja escribir, para que quien llame muestre el aviso correcto.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  const value = text.trim();
  if (!value) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // El navegador puede negar el permiso: seguimos con el metodo antiguo.
  }

  // navigator.clipboard solo existe en contextos seguros (https o localhost).
  try {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(area);
    return copied;
  } catch {
    return false;
  }
};
