// Función para ajustar el color (aclarar u oscurecer)
export function adjustColor(color, amount) {
  // Si no hay color, devolver el color por defecto
  if (!color) return '#00f2fe';

  // Eliminar el # si existe
  const cleanColor = color.replace('#', '');

  // Convertir a valores RGB
  let r = Number.parseInt(cleanColor.slice(0, 2), 16);
  let g = Number.parseInt(cleanColor.slice(2, 4), 16);
  let b = Number.parseInt(cleanColor.slice(4, 6), 16);

  // Ajustar los valores
  r = Math.min(255, Math.max(0, r + amount));
  g = Math.min(255, Math.max(0, g + amount));
  b = Math.min(255, Math.max(0, b + amount));

  // Convertir de nuevo a hexadecimal
  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');
  return `#${rHex}${gHex}${bHex}`;
}
