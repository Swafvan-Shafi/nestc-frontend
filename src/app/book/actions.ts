'use server';

export async function reverseGeocode(lat: number, lng: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`;
  const res = await fetch(url, { headers: { 'User-Agent': 'NestC-Campus-App/1.0' }});
  if (!res.ok) throw new Error('Failed to fetch geocode');
  const data = await res.json();
  
  // Format to match expected Google Maps output structure in page.tsx
  return {
    results: data.display_name ? [{ formatted_address: data.display_name }] : []
  };
}

const NITC_PLACES = [
  { name: 'Mega Hostel', lat: 11.3216, lon: 75.9338, desc: 'Mega Boys Hostel, NITC Campus' },
  { name: 'A Hostel', lat: 11.3195, lon: 75.9345, desc: 'A Hostel, NITC Campus' },
  { name: 'B Hostel', lat: 11.3188, lon: 75.9350, desc: 'B Hostel, NITC Campus' },
  { name: 'C Hostel', lat: 11.3180, lon: 75.9355, desc: 'C Hostel, NITC Campus' },
  { name: 'D Hostel', lat: 11.3175, lon: 75.9360, desc: 'D Hostel, NITC Campus' },
  { name: 'E Hostel', lat: 11.3170, lon: 75.9365, desc: 'E Hostel, NITC Campus' },
  { name: 'F Hostel', lat: 11.3165, lon: 75.9370, desc: 'F Hostel, NITC Campus' },
  { name: 'G Hostel', lat: 11.3160, lon: 75.9375, desc: 'G Hostel, NITC Campus' },
  { name: 'PG Hostel', lat: 11.3200, lon: 75.9330, desc: 'PG Hostel, NITC Campus' },
  { name: 'Ladies Hostel (LH)', lat: 11.3230, lon: 75.9300, desc: 'Ladies Hostel, NITC Campus' },
  { name: 'Main Canteen', lat: 11.3210, lon: 75.9340, desc: 'Main Canteen, NITC Campus' },
  { name: 'Main Building', lat: 11.3220, lon: 75.9350, desc: 'Main Administrative Building, NITC Campus' },
  { name: 'Rajpath', lat: 11.3215, lon: 75.9355, desc: 'Rajpath Road, NITC Campus' },
  { name: 'Central Library', lat: 11.3225, lon: 75.9360, desc: 'Central Library, NITC Campus' },
  { name: 'Main Gate', lat: 11.3150, lon: 75.9380, desc: 'Main Entrance Gate, NITC Campus' }
];

export async function getPlacesAutocomplete(input: string) {
  const query = input.toLowerCase();
  
  // 1. First, search local hardcoded NITC places
  const localMatches = NITC_PLACES.filter(p => 
    p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query)
  ).map(item => ({
    place_id: `${item.lat},${item.lon}`,
    description: item.desc,
    structured_formatting: {
      main_text: item.name,
      secondary_text: item.desc
    }
  }));

  // If we already found good local matches, don't wait for slow OSM
  if (localMatches.length >= 3) {
    return { predictions: localMatches.slice(0, 5) };
  }

  // 2. Fetch from Nominatim
  let osmMatches: any[] = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600);
    
    const NITC_BOUNDS = '75.9200,11.3100,75.9500,11.3300';
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=3&countrycodes=in&accept-language=en&viewbox=${NITC_BOUNDS}&bounded=1`;
    
    try {
      const res = await fetch(url, { 
        headers: { 'User-Agent': 'NestC-Campus-App/1.0 (nestnitc@gmail.com)' },
        signal: controller.signal
      });
      if (res.ok) {
        const data = await res.json();
        osmMatches = data.map((item: any) => ({
          place_id: `${item.lat},${item.lon}`,
          description: item.display_name,
          structured_formatting: {
            main_text: item.display_name.split(',')[0],
            secondary_text: item.display_name
          }
        }));
      }
    } finally {
      clearTimeout(timeoutId); // Critical: always clear timeout so Node event loop doesn't hang!
    }
  } catch (e) {
    // Ignore timeout aborts
  }

  // 3. Combine results (Local first, then OSM)
  const predictions = [...localMatches, ...osmMatches].slice(0, 5);

  return { predictions };
}

export async function getPlaceDetails(placeId: string) {
  // We encoded lat,lon in place_id for Nominatim
  const [lat, lng] = placeId.split(',');
  return {
    result: {
      geometry: {
        location: {
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        }
      }
    }
  };
}
