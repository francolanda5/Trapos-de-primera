// Medidas de la guía de talles. Se usan en /guia-de-talles y en el detalle de cada camiseta.
export interface SizeMeasure {
  size: string;
  chestCm: number; // de axila a axila
  lengthCm: number; // del hombro al borde inferior
}

export const SIZE_GUIDE: SizeMeasure[] = [
  { size: 'S', chestCm: 50, lengthCm: 70 },
  { size: 'M', chestCm: 53, lengthCm: 72 },
  { size: 'L', chestCm: 56, lengthCm: 74 },
  { size: 'XL', chestCm: 59, lengthCm: 76 },
  { size: 'XXL', chestCm: 62, lengthCm: 78 }
];
