export function onlyDigitsMaxLen(value: string, maxLen: number): string {
    let v = value ?? '';
    v = v.replace(/\D/g, '');
    if (v.length > maxLen) v = v.slice(0, maxLen);
    return v;
}



export function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Error al convertir archivo a base64'));
        reader.readAsDataURL(file);
    });
}

export function urlToDataUrl(url: string): Promise<string> {
  return fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error('No se pudo cargar imagen por defecto');
      return r.blob();
    })
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('No se pudo convertir imagen a base64'));
          reader.readAsDataURL(blob);
        })
    );
}

export function ensureImageDataUrl(base64OrDataUrl: string, mime: string = 'image/jpeg'): string {
    if (!base64OrDataUrl) return '';
    const v = base64OrDataUrl.trim();

    if (v.startsWith('data:image/')) return v;

    
    return `data:${mime};base64,${v}`;
}
