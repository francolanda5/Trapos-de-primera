/**
 * Imágenes propias de las camisetas, en public/assets/jerseys/.
 * Cada id de esta lista tiene 3 archivos: <id>-frente.webp, <id>-espalda.webp y <id>-detalle.webp.
 * Una camiseta que no esté en la lista sigue usando la foto que tenga cargada.
 */
export const GENERATED_IMAGE_IDS: string[] = [
  'arg-1986',
  'arg-1990',
  'arg-1994',
  'arg-2022',
  'boca-2024',
  'river-2024',
  'racing-2024',
  'independiente-2024',
  'san-lorenzo-2024',
  'estudiantes-2024',
  'velez-2024',
  'chacarita-1996',
  'ferro-1998',
  'atlanta-2001',
  'quilmes-2024',
  'allboys-2023',
  'almirante-2024',
  'chicago-2024'
];

export function getGeneratedImages(id: string): { image: string; galleryImages: string[] } | null {
  if (!GENERATED_IMAGE_IDS.includes(id)) return null;
  const frente = `/assets/jerseys/${id}-frente.webp`;
  return {
    image: frente,
    galleryImages: [frente, `/assets/jerseys/${id}-espalda.webp`, `/assets/jerseys/${id}-detalle.webp`]
  };
}

// Las fotos del catálogo anterior estaban todas en este servidor.
export function isLegacyPhoto(url?: string): boolean {
  return Boolean(url?.includes('lh3.googleusercontent.com/aida-public/'));
}

/**
 * Migración de datos guardados en localStorage: cambia solo las imágenes y solo si la camiseta
 * sigue con una foto del catálogo anterior. Precio, stock y demás ediciones quedan como estaban,
 * igual que una imagen que el administrador haya cambiado a mano.
 */
export function upgradeJerseyImages<T extends { id: string; image: string }>(jersey: T): T {
  const generated = getGeneratedImages(jersey.id);
  return generated && isLegacyPhoto(jersey.image) ? { ...jersey, ...generated } : jersey;
}
