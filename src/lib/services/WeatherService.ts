/**
 * OpenWeather API service for weather data
 */

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  clouds: number;
  sunrise: number;
  sunset: number;
}

interface ForecastData {
  date: Date;
  temperature: {
    min: number;
    max: number;
  };
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenWeather API key not configured');
    }
  }

  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
    try {
      const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        clouds: data.clouds.all,
        sunrise: data.sys.sunrise,
        sunset: data.sys.sunset,
      };
    } catch (error) {
      console.error('Error fetching current weather:', error);
      return null;
    }
  }

  async getForecast(lat: number, lon: number, days: number = 5): Promise<ForecastData[]> {
    try {
      const url = `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Group by day and get daily min/max
      const dailyForecasts: Record<string, ForecastData> = {};

      data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toISOString().split('T')[0];

        if (!dailyForecasts[dateKey]) {
          dailyForecasts[dateKey] = {
            date,
            temperature: {
              min: item.main.temp_min,
              max: item.main.temp_max,
            },
            description: item.weather[0].description,
            icon: item.weather[0].icon,
            humidity: item.main.humidity,
            windSpeed: Math.round(item.wind.speed * 3.6),
          };
        } else {
          // Update min/max temperatures
          dailyForecasts[dateKey].temperature.min = Math.min(
            dailyForecasts[dateKey].temperature.min,
            item.main.temp_min
          );
          dailyForecasts[dateKey].temperature.max = Math.max(
            dailyForecasts[dateKey].temperature.max,
            item.main.temp_max
          );
        }
      });

      return Object.values(dailyForecasts)
        .slice(0, days)
        .map(forecast => ({
          ...forecast,
          temperature: {
            min: Math.round(forecast.temperature.min),
            max: Math.round(forecast.temperature.max),
          },
        }));
    } catch (error) {
      console.error('Error fetching forecast:', error);
      return [];
    }
  }

  async getWeatherForCity(cityName: string): Promise<WeatherData | null> {
    try {
      const url = `${this.baseUrl}/weather?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=metric`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: Math.round(data.wind.speed * 3.6),
        clouds: data.clouds.all,
        sunrise: data.sys.sunrise,
        sunset: data.sys.sunset,
      };
    } catch (error) {
      console.error('Error fetching weather for city:', error);
      return null;
    }
  }

  getWeatherIconUrl(icon: string): string {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }

  /**
   * Get jetlag-optimized recommendations based on weather
   */
  getJetlagWeatherRecommendations(weather: WeatherData, travelDirection: 'east' | 'west' | 'none'): string[] {
    const recommendations: string[] = [];

    // Sunlight recommendations
    if (weather.clouds < 50) {
      if (travelDirection === 'east') {
        recommendations.push('☀️ Great sunlight conditions for morning light therapy');
      } else if (travelDirection === 'west') {
        recommendations.push('☀️ Excellent conditions for evening light exposure');
      }
    } else {
      recommendations.push('☁️ Cloudy weather - consider using a light therapy lamp');
    }

    // Temperature recommendations
    if (weather.temperature < 10) {
      recommendations.push('🧥 Cold weather - bundle up for outdoor light exposure');
    } else if (weather.temperature > 30) {
      recommendations.push('🌡️ Hot weather - stay hydrated during outdoor activities');
    }

    // Humidity recommendations
    if (weather.humidity > 70) {
      recommendations.push('💧 High humidity - ensure proper hydration');
    }

    return recommendations;
  }
}

export const weatherService = new WeatherService();
