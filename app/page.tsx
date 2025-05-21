"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=26.2034&longitude=-98.2300&current_weather=true&temperature_unit=fahrenheit"
        );
        const data = await res.json();
        setWeather(data.current_weather);
      } catch (e) {
        setWeather(null);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, []);

  const codeToIcon = (code: number) => {
    switch (code) {
      case 0: return "☀️";
      case 1: return "🌤️";
      case 2: return "⛅";
      case 3: return "☁️";
      case 45:
      case 48: return "🌫️";
      case 51:
      case 53:
      case 55: return "🌦️";
      case 56:
      case 57: return "🧊🌦️";
      case 61:
      case 63:
      case 65: return "🌧️";
      case 66:
      case 67: return "🧊🌧️";
      case 71:
      case 73:
      case 75: return "🌨️";
      case 77: return "❄️";
      case 80:
      case 81:
      case 82: return "🌦️";
      case 85:
      case 86: return "🌨️";
      case 95: return "⛈️";
      case 96:
      case 99: return "⛈️🧊";
      default: return "🌎";
    }
  };
  const codeToText = (code: number) => {
    switch (code) {
      case 0: return "Clear sky";
      case 1: return "Mainly clear";
      case 2: return "Partly cloudy";
      case 3: return "Overcast";
      case 45: return "Fog";
      case 48: return "Depositing rime fog";
      case 51: return "Light drizzle";
      case 53: return "Drizzle";
      case 55: return "Dense drizzle";
      case 56: return "Light freezing drizzle";
      case 57: return "Freezing drizzle";
      case 61: return "Slight rain";
      case 63: return "Moderate rain";
      case 65: return "Heavy rain";
      case 66: return "Light freezing rain";
      case 67: return "Heavy freezing rain";
      case 71: return "Slight snow fall";
      case 73: return "Moderate snow fall";
      case 75: return "Heavy snow fall";
      case 77: return "Snow grains";
      case 80: return "Slight rain showers";
      case 81: return "Moderate rain showers";
      case 82: return "Violent rain showers";
      case 85: return "Slight snow showers";
      case 86: return "Heavy snow showers";
      case 95: return "Thunderstorm";
      case 96: return "Thunderstorm with slight hail";
      case 99: return "Thunderstorm with heavy hail";
      default: return "Unknown";
    }
  };

  return (
    <div className="w-full sm:w-64 mx-auto sm:mx-0 bg-background/80 border rounded-xl shadow flex flex-col items-center p-5 text-center">
      <div className="text-sm text-muted-foreground mb-1">McAllen, TX</div>
      {loading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : weather ? (
        <>
          <div className="text-4xl mb-1">{codeToIcon(weather.weathercode)}</div>
          <div className="text-2xl font-bold mb-1">{weather.temperature}°F</div>
          <div className="text-sm text-muted-foreground">{codeToText(weather.weathercode)}</div>
        </>
      ) : (
        <div className="text-red-500 text-sm">Weather unavailable</div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-grid-tactical"></div>
      </div>

      {/* Hero Section with Weather */}
      <div className="max-w-7xl mx-auto relative z-10 py-24 px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-5xl font-bold tracking-tight mb-6 animate-fade-in-up">
              Transform Your Contract Data into{" "}
              <span className="text-accent">Actionable Insights</span>
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto sm:mx-0 animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards] [--animation-duration:800ms]">
              Build Tactical LLC helps you make sense of your data with powerful analytics,
              real-time synchronization of data, and enterprise-grade security.
            </p>
          </div>
          <WeatherWidget />
        </div>
      </div>
    </>
  );
}
