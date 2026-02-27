import { useState, useCallback, useEffect, useMemo } from 'react';
import { WMO_WEATHER_CODES, DEFAULT_MAPPING } from '../constants';

/**
 * Calculate "feels like" temperature using standard meteorological formulas.
 *
 * Uses a combined approach similar to Apple Weather:
 * - Below 10°C: NWS Wind Chill Index (temp + wind)
 * - Above 27°C: NWS Heat Index (temp + humidity)
 * - 10–27°C: Australian Apparent Temperature (temp + humidity + wind)
 *
 * @param {number} tempC - Air temperature in °C
 * @param {number} windKmh - Wind speed in km/h
 * @param {number} humidity - Relative humidity in %
 * @returns {number} Feels-like temperature in °C
 */
function calcFeelsLike(tempC, windKmh, humidity) {

  if (tempC <= 10 && windKmh > 4.8) {
    // NWS Wind Chill (works in °F/mph, convert back)
    const tf = tempC * 9 / 5 + 32;
    const mph = windKmh * 0.621371;
    const wc = 35.74 + 0.6215 * tf - 35.75 * Math.pow(mph, 0.16) + 0.4275 * tf * Math.pow(mph, 0.16);
    return (wc - 32) * 5 / 9;
  }

  if (tempC >= 27 && humidity >= 40) {
    // NWS Heat Index (Rothfusz regression, in °F)
    const tf = tempC * 9 / 5 + 32;
    const rh = humidity;

    // Start with simple formula
    let hi = 0.5 * (tf + 61.0 + (tf - 68.0) * 1.2 + rh * 0.094);

    // If above 80°F, use full Rothfusz regression
    if (hi >= 80) {
      hi = -42.379 + 2.04901523 * tf + 10.14333127 * rh
        - 0.22475541 * tf * rh - 0.00683783 * tf * tf
        - 0.05481717 * rh * rh + 0.00122874 * tf * tf * rh
        + 0.00085282 * tf * rh * rh - 0.00000199 * tf * tf * rh * rh;

      // Low humidity adjustment
      if (rh < 13 && tf >= 80 && tf <= 112) {
        hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(tf - 95)) / 17);
      }
      // High humidity adjustment
      if (rh > 85 && tf >= 80 && tf <= 87) {
        hi += ((rh - 85) / 10) * ((87 - tf) / 5);
      }
    }

    return (hi - 32) * 5 / 9;
  }

  // 10–27°C: Australian BOM Apparent Temperature
  // Reference: Australian Bureau of Meteorology
  // AT = Ta + 0.33×e − 0.70×ws − 4.00
  // Units: Ta in °C, e in hPa, ws in m/s
  // e (vapor pressure) = (RH/100) × 6.105 × exp(17.27×Ta / (237.7+Ta))
  const windMs = windKmh / 3.6;
  const e = (humidity / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  return tempC + 0.33 * e - 0.70 * windMs - 4.00;
}

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

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&timezone=auto`;
      const response = await fetch(weatherUrl);
      const data = await response.json();

      const temp = data.current.temperature_2m;
      // Use wind gusts for feels-like (closer to Apple Weather behavior)
      const windKmh = data.current.wind_gusts_10m || data.current.wind_speed_10m;
      const humidity = data.current.relative_humidity_2m;

      // Calculate feels-like using standard formulas
      const feelsLike = calcFeelsLike(temp, windKmh, humidity);

      const isNight = parseInt(returnTime.split(':')[0]) >= 18;
      const eveningDrop = isNight ? 4.2 : 0.5;
      const simulatedReturnFeelsLike = feelsLike - eveningDrop;

      setWeather({
        location: locationName,
        current: {
          temp: parseFloat(temp.toFixed(1)),
          feels_like: parseFloat(feelsLike.toFixed(1)),
          wind: parseFloat(windKmh.toFixed(0)),
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
