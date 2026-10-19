// Deterministic cuisine and category food photography engine
// High-resolution, optimized WebP Unsplash images (authentic, everyday casual photography)

export const POPULAR_BRAND_IMAGES: Record<string, string> = {
  mcdonald: 'https://images.unsplash.com/photo-1552895638-f7fe08d2f7d5?auto=format&fit=crop&w=800&q=80', // casual fast food fries & burger tray
  starbucks: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&w=800&q=80', // coffee shop cup & cafe
  'tim horton': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80', // coffee & donut counter
  subway: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80', // submarine sandwich
  chipotle: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80', // burrito bowl & chips
  'five guys': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80', // burger & fries tray
  wendy: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80', // fast food burger & fries
  'burger king': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80',
  'a&w': 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80', // diner burger in basket with fries
  popeyes: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80', // fried chicken
  "jimmy's coffee": 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80', // cozy cafe chalkboard counter
  dineen: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=800&q=80', // espresso machine & brick wall cafe
  balzac: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80', // cafe pastry case & seating
  aroma: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=800&q=80', // lively coffee bar
  'second cup': 'https://images.unsplash.com/photo-1508766917616-d22f3f1eea14?auto=format&fit=crop&w=800&q=80', // barista cafe counter
  'pret a manger': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
  panera: 'https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&w=800&q=80', // bakery counter
  kinton: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80', // ramen
  sansotei: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
  'pizza pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  domino: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
};

export const CUISINE_IMAGE_COLLECTIONS: Record<string, string[]> = {
  // Real neighborhood cafes & coffee shops (interior, counter, espresso machine, pastry case)
  // Absolutely NO fine-dining rooms, disco balls, or dark studio macros
  cafe: [
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80', // cozy cafe interior, chalkboard menu, plants, laptop seating
    'https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=800&q=80', // real coffee bar counter, espresso machine, brick wall
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80', // real cafe pastry display case, counter, sunlit cafe tables
    'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=800&q=80', // lively bustling coffee shop with barista brewing
    'https://images.unsplash.com/photo-1508766917616-d22f3f1eea14?auto=format&fit=crop&w=800&q=80', // friendly baristas making coffee at counter
  ],
  coffee: [
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=800&q=80',
  ],
  // Real casual burgers (diner baskets & combos, NOT $35 fine-dining gourmet truffles)
  burger: [
    'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80', // casual burger & fries combo on tray
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80', // casual diner burger lunch with fries
    'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80', // diner burger in basket with fries
  ],
  fast_food: [
    'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1552895638-f7fe08d2f7d5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80',
  ],
  pizza: [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
  ],
  italian: [
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=800&q=80',
  ],
  sandwich: [
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
  ],
  deli: [
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&w=800&q=80',
  ],
  bakery: [
    'https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&w=800&q=80', // real bakery shop counter & cases
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  ],
  bagel: [
    'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=800&q=80', // fresh bagels & bread
    'https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&w=800&q=80',
  ],
  sushi: [
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80',
  ],
  japanese: [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
  ],
  ramen: [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=800&q=80',
  ],
  mexican: [
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80',
  ],
  tacos: [
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80',
  ],
  vietnamese: [
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503764654157-72ddec414209?auto=format&fit=crop&w=800&q=80',
  ],
  pho: [
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
  ],
  chinese: [
    'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
  ],
  asian: [
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
  ],
  thai: [
    'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
  ],
  indian: [
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
  ],
  mediterranean: [
    'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  ],
  middle_eastern: [
    'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  ],
  salad: [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  ],
  healthy: [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  ],
  bbq: [
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  ],
  pub: [
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
  ],
  bar: [
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
  ],
  // Warm, bright, friendly casual neighborhood lunch spots (NO fine dining banquets)
  general: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', // sunlit casual bistro eatery with patrons having lunch
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80', // cozy casual eatery with chalkboard menu
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80', // daytime lunch counter & sunny tables
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80', // casual lunch plate
  ],
};

function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getFallbackRestaurantImage(
  name: string = '',
  cuisine?: string,
  amenity?: string
): string {
  const lowerName = name.toLowerCase();
  const lowerCuisine = (cuisine || '').toLowerCase();
  const lowerAmenity = (amenity || '').toLowerCase();
  const combined = `${lowerCuisine} ${lowerAmenity} ${lowerName}`;

  // 1. Direct Brand Match (iconic, casual, recognizable visuals)
  for (const [brand, photo] of Object.entries(POPULAR_BRAND_IMAGES)) {
    if (lowerName.includes(brand)) {
      return photo;
    }
  }

  // 2. High-Priority Cafe / Coffee Detection
  // Matches whenever the amenity is a cafe, or name/cuisine implies coffee, cafe, roastery, espresso, tea, boba
  const isCafe =
    lowerAmenity === 'cafe' ||
    lowerCuisine.includes('coffee') ||
    lowerCuisine.includes('cafe') ||
    lowerCuisine.includes('tea') ||
    lowerCuisine.includes('espresso') ||
    lowerCuisine.includes('bakery') ||
    lowerName.includes('cafe') ||
    lowerName.includes('coffee') ||
    lowerName.includes('espresso') ||
    lowerName.includes('roaster') ||
    lowerName.includes('roasting') ||
    lowerName.includes('boba') ||
    lowerName.includes('tea house');

  if (isCafe) {
    const cafePhotos = CUISINE_IMAGE_COLLECTIONS.cafe;
    return cafePhotos[stringHash(name || 'cafe') % cafePhotos.length];
  }

  // 3. Fast Food / Casual Burger Detection
  const isFastFood =
    lowerAmenity === 'fast_food' ||
    lowerCuisine.includes('burger') ||
    lowerCuisine.includes('fast_food') ||
    lowerName.includes('burger');

  if (isFastFood) {
    const burgerPhotos = CUISINE_IMAGE_COLLECTIONS.burger;
    return burgerPhotos[stringHash(name || 'burger') % burgerPhotos.length];
  }

  // 4. Specific Cuisines (pizza, tacos, asian, ramen, sushi, etc.)
  for (const [key, photos] of Object.entries(CUISINE_IMAGE_COLLECTIONS)) {
    if (key !== 'general' && key !== 'cafe' && key !== 'coffee' && combined.includes(key)) {
      const idx = stringHash(name || key) % photos.length;
      return photos[idx];
    }
  }

  // 5. General Casual Lunch Fallback (Bright casual dining, never luxury banquets)
  const generalPhotos = CUISINE_IMAGE_COLLECTIONS.general;
  const idx = stringHash(name || 'lunch') % generalPhotos.length;
  return generalPhotos[idx];
}
