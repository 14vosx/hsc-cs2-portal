const MAP_IMAGES: Readonly<Record<string, string>> = {
  de_ancient: 'map-images/de_ancient.png',
  de_anubis: 'map-images/de_anubis.png',
  de_dust2: 'map-images/de_dust2.png',
  de_inferno: 'map-images/de_inferno.png',
  de_mirage: 'map-images/de_mirage.png',
  de_nuke: 'map-images/de_nuke.png',
  de_overpass: 'map-images/de_overpass.png',
  de_train: 'map-images/de_train.png',
};

export function bunkerMapImage(mapName: string | null | undefined): string | null {
  return mapName ? MAP_IMAGES[mapName] ?? null : null;
}

export function displayBunkerMapName(mapName: string | null | undefined): string {
  return mapName?.replace(/^de_/, '').toUpperCase() || '—';
}
