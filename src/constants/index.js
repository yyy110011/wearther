export const DEFAULT_INVENTORY = {
  base_short: { label: "Short Sleeve T-shirt", count: 10 },
  base_long: { label: "Long Sleeve / Thin Knit", count: 3 },
  bottom_light: { label: "Light Trousers / Jeans", count: 3 },
  bottom_heavy: { label: "Heavy Trousers / Corduroy", count: 2 },
  outer_light: { label: "Lightweight Jacket / Windbreaker", count: 1 },
  outer_heavy: { label: "Heavy Coat / Down Jacket", count: 1 },
  underwear: { label: "Underwear", count: 15 },
  socks: { label: "Socks", count: 10 }
};

// 重定義溫標邏輯，確保 23.9°C 以下即進入涼爽模式
export const DEFAULT_MAPPING = [
  { min: 24, max: 50, base: "base_short", bottom: "bottom_light", outer: null, desc: "Warm & Comfortable" },
  { min: 20, max: 24, base: "base_short", bottom: "bottom_light", outer: "outer_light", desc: "A bit brisk, light layer recommended" },
  { min: 16, max: 20, base: "base_long", bottom: "bottom_heavy", outer: "outer_light", desc: "Cool weather, stay covered" },
  { min: 10, max: 16, base: "base_long", bottom: "bottom_heavy", outer: "outer_light", desc: "Chilly conditions" },
  { min: -50, max: 10, base: "base_long", bottom: "bottom_heavy", outer: "outer_heavy", desc: "Cold/Freezing" }
];

export const WMO_WEATHER_CODES = {
  0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
  45: "Fog", 48: "Depositing Rime Fog", 51: "Light Drizzle", 53: "Moderate Drizzle",
  55: "Dense Drizzle", 61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
  71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow", 95: "Thunderstorm"
};
