import { LiveWeatherData, VibeType } from '../types';

export async function fetchLiveWeatherByCoords(lat: number, lon: number): Promise<LiveWeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather forecast');
  const data = await res.json();
  const current = data.current;
  const code = current.weather_code || 0;
  const temp = Math.round(current.temperature_2m);
  const wind = Math.round(current.wind_speed_10m);
  const humidity = current.relative_humidity_2m;

  const { vibe, condition, intensity, chaos } = mapWmoCodeToVibe(code, temp, wind);

  return {
    cityName: 'Current Location',
    temperature: temp,
    condition,
    windSpeed: wind,
    humidity,
    mappedVibe: vibe,
    mappedIntensity: intensity,
    mappedChaos: chaos,
  };
}

export async function fetchLiveWeatherByCity(cityName: string): Promise<LiveWeatherData> {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) throw new Error('Geocoding search failed');
  const geoData = await geoRes.json();
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`City "${cityName}" not found`);
  }
  const result = geoData.results[0];
  const weather = await fetchLiveWeatherByCoords(result.latitude, result.longitude);
  return {
    ...weather,
    cityName: `${result.name}${result.country_code ? `, ${result.country_code}` : ''}`,
  };
}

function mapWmoCodeToVibe(code: number, tempC: number, windKmh: number): {
  vibe: VibeType;
  condition: string;
  intensity: number;
  chaos: number;
} {
  // WMO Weather interpretation codes
  // 0: Clear sky, 1,2,3: Mainly clear/partly cloudy/overcast
  // 51,53,55, 61,63,65, 80..82: Rain/drizzle/showers
  // 95,96,99: Thunderstorm
  // 71,73,75,77,85,86: Snow

  if (code >= 95) {
    return {
      vibe: 'electric-storm',
      condition: 'Thunderstorm with Lightning',
      intensity: Math.min(95, 65 + windKmh * 0.5),
      chaos: 80,
    };
  }

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      vibe: 'melancholy-rain',
      condition: code >= 65 ? 'Heavy Rain & Downpour' : 'Reflective Rainfall',
      intensity: Math.min(85, 35 + code * 0.4),
      chaos: Math.min(50, 10 + windKmh * 0.4),
    };
  }

  if (tempC >= 28) {
    return {
      vibe: 'radiant-heat',
      condition: tempC >= 35 ? 'Scorching Thermal Wave' : 'Warm Sunny Radiance',
      intensity: Math.min(90, 40 + (tempC - 25) * 4),
      chaos: 35,
    };
  }

  if (tempC <= 0 && code >= 71) {
    return {
      vibe: 'aurora-borealis',
      condition: 'Sub-Zero Frost & Mystic Sky',
      intensity: 50,
      chaos: 25,
    };
  }

  // Default: Calm Breeze
  return {
    vibe: 'calm-breeze',
    condition: windKmh > 20 ? 'Brisk Atmospheric Wind' : 'Tranquil Gentle Breeze',
    intensity: Math.min(80, 25 + windKmh * 1.2),
    chaos: Math.min(45, 15 + windKmh * 0.5),
  };
}
