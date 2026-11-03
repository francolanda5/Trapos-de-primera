/**
 * Portadas de las tarjetas "Elegí tu cancha" del Inicio.
 * Son enlaces directos a Wikimedia Commons: miniaturas de 960 px, salvo Primera Nacional,
 * cuyo original mide 600 px de ancho.
 * Si cambia una foto, hay que actualizar también "Créditos de imágenes" en el README.
 */
export interface CategoryCover {
  url: string;
  position: string; // qué parte de la foto queda a la vista al recortarla
  author: string;
  source: string;
  license: string;
}

export const CATEGORY_COVERS: Record<string, CategoryCover> = {
  'Primera División': {
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Estadio_Alberto_J._Armando_field_night_view.jpg/960px-Estadio_Alberto_J._Armando_field_night_view.jpg',
    position: 'center 75%',
    author: 'Ministerio de Cultura de la Nación',
    source: 'https://commons.wikimedia.org/wiki/File:Estadio_Alberto_J._Armando_field_night_view.jpg',
    license: 'CC BY-SA 2.0'
  },
  'Primera Nacional': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Estadio_chacarita_juniors.jpg',
    position: 'center 55%',
    author: 'EstudiantesFotografias',
    source: 'https://commons.wikimedia.org/wiki/File:Estadio_chacarita_juniors.jpg',
    license: 'CC BY-SA 4.0'
  },
  'Primera B Metropolitana': {
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1c/Estadio_Don_Le%C3%B3n_Kolbowsky%2C_del_Club_Atl%C3%A9tico_Atlanta.jpg/960px-Estadio_Don_Le%C3%B3n_Kolbowsky%2C_del_Club_Atl%C3%A9tico_Atlanta.jpg',
    position: 'center 35%',
    author: 'Ulises Icardi',
    source: 'https://commons.wikimedia.org/wiki/File:Estadio_Don_Le%C3%B3n_Kolbowsky,_del_Club_Atl%C3%A9tico_Atlanta.jpg',
    license: 'CC BY-SA 4.0'
  },
  'Selección Argentina': {
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/Argentinian_Fans_-_140713-8433-jikatu_%2814679000633%29.jpg/960px-Argentinian_Fans_-_140713-8433-jikatu_%2814679000633%29.jpg',
    position: 'center',
    author: 'Jimmy Baikovicius',
    source: 'https://commons.wikimedia.org/wiki/File:Argentinian_Fans_-_140713-8433-jikatu_(14679000633).jpg',
    license: 'CC BY-SA 2.0'
  }
};
