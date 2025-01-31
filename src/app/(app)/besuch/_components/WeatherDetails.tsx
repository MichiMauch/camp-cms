import React, { useEffect, useState } from "react";
import { Sun, Wind, Droplets, Sunrise, Sunset, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ReactAnimatedWeather from "react-animated-weather";

interface WeatherDetailsProps {
  latitude: number;
  longitude: number;
}

const iconMapping: { [key: string]: string } = {
  "01d": "CLEAR_DAY",
  "01n": "CLEAR_NIGHT",
  "02d": "PARTLY_CLOUDY_DAY",
  "02n": "PARTLY_CLOUDY_NIGHT",
  "03d": "CLOUDY",
  "03n": "CLOUDY",
  "04d": "CLOUDY",
  "04n": "CLOUDY",
  "09d": "RAIN",
  "09n": "RAIN",
  "10d": "RAIN",
  "10n": "RAIN",
  "11d": "SLEET",
  "11n": "SLEET",
  "13d": "SNOW",
  "13n": "SNOW",
  "50d": "FOG",
  "50n": "FOG",
};

const WeatherDetails: React.FC<WeatherDetailsProps> = ({
  latitude,
  longitude,
}) => {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [feelsLike, setFeelsLike] = useState<number | null>(null);
  const [windSpeed, setWindSpeed] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [pressure, setPressure] = useState<number | null>(null);
  const [sunrise, setSunrise] = useState<string | null>(null);
  const [sunset, setSunset] = useState<string | null>(null);
  const [weatherIcon, setWeatherIcon] = useState<string | null>(null);
  const [weatherDescription, setWeatherDescription] = useState<string | null>(
    null
  );

  useEffect(() => {
    async function fetchWeather() {
      if (!latitude || !longitude) return;
      try {
        const response = await fetch(
          `/api/weather?lat=${latitude}&lon=${longitude}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch weather data");
        }
        const data = await response.json();
        setTemperature(parseFloat(data.main.temp.toFixed(1)));
        setFeelsLike(parseFloat(data.main.feels_like.toFixed(1)));
        setWindSpeed(data.wind.speed);
        setHumidity(data.main.humidity);
        setPressure(data.main.grnd_level);
        setSunrise(
          new Date(data.sys.sunrise * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
        setSunset(
          new Date(data.sys.sunset * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
        setWeatherIcon(data.weather[0].icon);
        setWeatherDescription(data.weather[0].description);
      } catch (err) {
        console.error("Fehler beim Abrufen der Wetterdaten:", err);
      }
    }

    fetchWeather();
  }, [latitude, longitude]);

  const icon = iconMapping[weatherIcon || ""] || "CLEAR_DAY";

  return (
    <div
      className="col-span-12 lg:col-span-8 rounded-[2rem] border overflow-hidden shadow-lg"
      style={{ backgroundColor: "rgba(31, 41, 45, 0.8)" }} // Hier die RGB-Farbe von #1F292D mit Transparenz
    >
      <div className="h-full p-8">
        <h2 className="text-2xl font-semibold mb-6">Aktuelle Wetterdaten</h2>
        <div className="space-y-6">
          {/* Erste Reihe: Temperatur, Status, Aufgang und Untergang */}
          <div className="grid grid-cols-4 gap-6">
            {/* Temperatur und Status (Box 1 und 2 verbunden) */}
            <div className="flex items-center gap-4 col-span-2">
              <div className="flex items-center gap-3">
                {weatherIcon && (
                  <ReactAnimatedWeather
                    icon={icon}
                    color="white"
                    size={45}
                    animate={true}
                  />
                )}
                <span className="text-4xl font-bold">
                  {temperature !== null ? `${temperature}°C` : "Lädt..."}
                </span>
              </div>
              <Badge className="text-base px-4 py-1">
                {weatherDescription !== null ? weatherDescription : "Lädt..."}
              </Badge>
            </div>
            {/* Sonnenaufgang (Box 3) */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Sonnenaufgang</p>
              <div className="flex gap-2">
                <Sunrise className="h-5 w-5 text-primary" />
                <span className="text-xl">
                  {sunrise !== null ? sunrise : "Lädt..."}
                </span>
              </div>
            </div>
            {/* Sonnenuntergang (Box 4) */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Sonnenuntergang</p>
              <div className="flex gap-2">
                <Sunset className="h-5 w-5 text-primary" />
                <span className="text-xl">
                  {sunset !== null ? sunset : "Lädt..."}
                </span>
              </div>
            </div>
          </div>

          {/* Zweite Reihe: Weitere Wetterdaten */}
          <div className="grid grid-cols-4 gap-6">
            {/* Gefühlte Temperatur */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Gefühlt</p>
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-primary opacity-70" />
                <span className="text-xl">
                  {feelsLike !== null ? `${feelsLike}°C` : "Lädt..."}
                </span>
              </div>
            </div>
            {/* Wind */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Wind</p>
              <div className="flex items-center gap-2">
                <Wind className="h-5 w-5 text-primary" />
                <span className="text-xl">
                  {windSpeed !== null ? `${windSpeed} km/h` : "Lädt..."}
                </span>
              </div>
            </div>
            {/* Luftfeuchtigkeit */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Luftfeuchtigkeit</p>
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" />
                <span className="text-xl">
                  {humidity !== null ? `${humidity}%` : "Lädt..."}
                </span>
              </div>
            </div>
            {/* Luftdruck */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Luftdruck</p>
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                <span className="text-xl">
                  {pressure !== null ? `${pressure} hPa` : "Lädt..."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherDetails;
