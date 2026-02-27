import { useState, useCallback, useEffect, useMemo } from 'react';
import { WMO_WEATHER_CODES, DEFAULT_MAPPING } from '../constants';

/**
 * Custom hook for weather fetching, geolocation, and outfit recommendation.
 */
export function useWeather({ returnTime, inventory, preferences }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);

  const fetchWeather = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      let lat, lon, locationName;
      if (params.lat && params.lon) {
        lat = params.lat; lon = params.lon;
        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        const geo = await geoRes.json();
        locationName = geo.locality || geo.city || "Current Location";
      } else if (params.city) {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(params.city)}&count=1`);
        const geoData = await geoRes.json();
        if (!geoData.results) throw new Error("City not found.");
        lat = geoData.results[0].latitude; lon = geoData.results[0].longitude;
        locationName = geoData.results[0].name;
      } else throw new Error("Invalid parameters.");

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,weather_code&timezone=auto`;
      const response = await fetch(weatherUrl);
      const data = await response.json();

      const isNight = parseInt(returnTime.split(':')[0]) >= 18;
      const eveningDrop = isNight ? 4.2 : 0.5;
      const simulatedReturnFeelsLike = data.current.apparent_temperature - eveningDrop;

      setWeather({
        location: locationName,
        current: {
          temp: parseFloat(data.current.temperature_2m.toFixed(1)),
          feels_like: parseFloat(data.current.apparent_temperature.toFixed(1)),
          condition: WMO_WEATHER_CODES[data.current.weather_code] || "Clear",
          pop: data.current.precipitation > 0 ? 80 : 5
        },
        returnTime: {
          feels_like: parseFloat(simulatedReturnFeelsLike.toFixed(1))
        }
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
      setWeather(null);
    } finally { setLoading(false); }
  }, [returnTime]);

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => { fetchWeather({ city: 'Taipei' }); setError("GPS Fail. Used Taipei."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchWeather]);

  // Auto-fetch on mount
  useEffect(() => { handleGeolocation(); }, [handleGeolocation]);

  const recommendation = useMemo(() => {
    if (!weather) return null;
    const findMap = (t) => DEFAULT_MAPPING.find(m => t >= m.min && t < m.max) || DEFAULT_MAPPING[2];

    const sensitivityOffset = 3;
    const nowFeels = weather.current.feels_like;
    const laterFeels = weather.returnTime.feels_like;

    const upperTemp = preferences.upperSensitive ? Math.min(nowFeels, laterFeels) - sensitivityOffset : Math.min(nowFeels, laterFeels);
    const lowerTemp = preferences.lowerSensitive ? Math.min(nowFeels, laterFeels) - sensitivityOffset : Math.min(nowFeels, laterFeels);

    const nowMap = findMap(preferences.upperSensitive ? nowFeels - sensitivityOffset : nowFeels);
    const laterMap = findMap(preferences.upperSensitive ? laterFeels - sensitivityOffset : laterFeels);
    const lowerMap = findMap(lowerTemp);

    const outerLabel = nowMap.outer ? inventory[nowMap.outer]?.label : (laterMap.outer ? inventory[laterMap.outer]?.label : null);

    let statusNote = null;
    if (nowMap.outer && !laterMap.outer) {
      statusNote = "Wear your jacket out; temperature is brisk now.";
    } else if (!nowMap.outer && laterMap.outer) {
      statusNote = "Pack a jacket for the evening chill.";
    } else if (nowMap.outer && laterMap.outer) {
      statusNote = "Brisk all day. Wear your outer layer.";
    }

    return {
      base: inventory[findMap(upperTemp).base]?.label || "Base Layer",
      bottom: inventory[lowerMap.bottom]?.label || "Trousers",
      outer: outerLabel,
      statusNote,
      trend: laterFeels > nowFeels ? 'up' : 'down',
      diff: Math.abs(Math.round(nowFeels - laterFeels)),
      desc: nowMap.desc
    };
  }, [weather, inventory, preferences]);

  return { loading, error, weather, recommendation, fetchWeather, handleGeolocation };
}
