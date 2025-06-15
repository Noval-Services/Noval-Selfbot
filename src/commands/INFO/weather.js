const { fetch } = require('undici');

module.exports = {
  name: 'weather',
  description: 'See weather information for a city.',
  category: 'INFO',
  hidden: false,
  usage: 'weather <city>',
  async execute(client, message, args) {
    if (!args.length) {
      return message.channel.send('Please provide a city name. Example: `weather Hanoi`');
    }

    const city = args.join(' ');
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return message.channel.send('Cant find city or API down.'); 
      }
      const data = await response.json();

      const current = data.current_condition[0];
      const weatherDesc = current.lang_vi ? current.lang_vi[0].value : current.weatherDesc[0].value;

      const getWeatherEmoji = (code) => {
        const codes = {
          '113': '☀️', // Sunny/Clear
          '116': '⛅', // Partly Cloudy
          '119': '☁️', // Cloudy
          '122': '☁️', // Overcast
          '176': '🌦️', // Patchy rain
          '200': '⛈️', // Thundery outbreaks
          '386': '⛈️', // Patchy light rain with thunder
          '248': '🌫️', // Fog
          '263': '🌦️', // Patchy light drizzle
          '266': '🌧️', // Light drizzle
          '281': '🌧️', // Freezing drizzle
          '293': '🌧️', // Patchy light rain
          '296': '🌧️', // Light rain
        };
        return codes[code] || '🌥️';
      };

      const emoji = getWeatherEmoji(current.weatherCode);
      const area = data.nearest_area[0].areaName[0].value;
      const country = data.nearest_area[0].country[0].value;
      const temp = current.temp_C;
      const feels = current.FeelsLikeC;
      const humidity = current.humidity;
      const wind = current.windspeedKmph;
      const visibility = current.visibility;

      // Visual style giống lệnh help
      const lines = [
        '```yaml',
        '•―――――――――――――――――――――――――――――――――――•',
        `│      🌦️ WEATHER INFORMATION 🌦️     │`,
        '•―――――――――――――――――――――――――――――――――――•',
        `│ Địa điểm   : ${area}, ${country}`,
        `│ Trạng thái : ${emoji} ${weatherDesc}`,
        `│ Nhiệt độ   : ${temp}°C (Cảm giác: ${feels}°C)`,
        `│ Độ ẩm      : ${humidity}%`,
        `│ Gió        : ${wind} km/h`,
        `│ Tầm nhìn   : ${visibility} km`,
        '•―――――――――――――――――――――――――――――――――――•',
        '│ Nguồn: wttr.in',
        '•―――――――――――――――――――――――――――――――――――•',
        '```'
      ];

      message.channel.send(lines.join('\n'));
    } catch (err) {
      console.error(err);
      message.channel.send('Có lỗi xảy ra khi lấy dữ liệu thời tiết.');
    }
  }
};
