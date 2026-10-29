export const DESTINATIONS = [
  {
    id: 'moscow',
    name: 'Moscow',
    number: '01',
    coordinates: '55.76° N · 37.62° E',
    image: '/images/moscow-university.webp',
    imageAlt: 'Moscow State University aerial',
    x: 13,
    y: 67,
    mobileX: 48,
    mobileY: 67,
  },
  {
    id: 'saint-petersburg',
    name: 'Saint Petersburg',
    number: '02',
    coordinates: '59.94° N · 30.32° E',
    image: '/images/saint-petersburg.webp',
    imageAlt: 'Peter and Paul Fortress in Saint Petersburg',
    x: 8,
    y: 52,
    mobileX: 20,
    mobileY: 40,
  },
  {
    id: 'kazan',
    name: 'Kazan',
    number: '03',
    coordinates: '55.80° N · 49.11° E',
    image: '/images/kazan-city.webp',
    imageAlt: 'Kazan Kremlin in Kazan',
    credit: 'A.Savin / Wikipedia',
    creditUrl: 'https://commons.wikimedia.org/wiki/File:Kazan_Kremlin_exterior_view_08-2016_img3.jpg',
    x: 22,
    y: 64,
    mobileX: 78,
    mobileY: 58,
  },
];

export function getDestination(id) {
  return DESTINATIONS.find((destination) => destination.id === id) || null;
}
