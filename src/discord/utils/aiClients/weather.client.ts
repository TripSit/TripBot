import { WeatherData } from '../aiTypes';

export default class WeatherClient {
  private readonly apiKey: string;

  private apiUrl = 'https://api.tomorrow.io/v4/weather/realtime';

  private latitude: string;

  private longitude: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? env.WEATHER_TOKEN ?? '';
    this.latitude = env.WEATHER_LATITUDE ?? '';
    this.longitude = env.WEATHER_LONGITUDE ?? '';
  }

  async getWeather(): Promise<string> {
    const response = await fetch(
      `${this.apiUrl}?location=${this.latitude},${this.longitude}&apikey=${this.apiKey}`,
      {
        method: 'GET',
        headers: { accept: 'application/json', 'accept-encoding': 'deflate, gzip, br' },
      },
    );
    const data = (await response.json()) as WeatherData;
    return WeatherClient.summarizeWeather(data);
  }

  static summarizeWeather(data: WeatherData): string {
    const { values } = data.data;

    // Map of field names to human-readable labels
    const fieldLabels: Record<string, string> = {
      temperature: 'Temperature (in C)',
      temperatureApparent: 'Feels Like (in C)',
      dewPoint: 'Dew Point (in C)',
      humidity: 'Humidity (in %)',
      windSpeed: 'Wind Speed',
      windGust: 'Wind Gust',
      windDirection: 'Wind Direction',
      precipitationProbability: 'Precipitation Probability',
      rainIntensity: 'Rain Intensity',
      sleetIntensity: 'Sleet Intensity',
      snowIntensity: 'Snow Intensity',
      cloudCover: 'Cloud Cover',
      uvIndex: 'UV Index',
      visibility: 'Visibility',
      pressureSurfaceLevel: 'Pressure',
    };

    // Only include fields with a value that is not 0, null, or undefined
    const summaryParts = Object.entries(fieldLabels)
      .filter(([key]) => {
        const value = (values as Record<string, number>)[key];
        return value !== undefined && value !== 0;
      })
      .map(([key, label]) => {
        const value = (values as Record<string, number>)[key];
        if (key === 'temperature' || key === 'temperatureApparent' || key === 'dewPoint') {
          const fahrenheit = (value * 9) / 5 + 32;
          return `${label}: ${value.toFixed(1)}°C (${fahrenheit.toFixed(1)}°F)`;
        }
        return `${label}: ${value.toString()}`;
      });

    // Optionally, always include temperature and location
    return summaryParts.join('\n');
  }
}
