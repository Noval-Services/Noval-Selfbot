const fetch = require('node-fetch');

module.exports = {
  name: 'weather',
  description: 'Xem thông tin thời tiết của một thành phố.',
  usage: 'weather <city>',
  async execute(client, message, args) {
    if (!args.length) {
      return message.channel.send('Vui lòng nhập tên thành phố. Ví dụ: `weather Hanoi`');
    }

    const city = args.join(' ');
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return message.channel.send('Chưa cấu hình API key cho OpenWeatherMap.');
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=vi`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        return message.channel.send('Không tìm thấy thành phố hoặc có lỗi xảy ra.');
      }
      const data = await res.json();

      // Emoji cho trạng thái thời tiết
      const weatherIcons = {
        'Thunderstorm': '⛈️',
        'Drizzle': '🌦️',
        'Rain': '🌧️',
        'Snow': '❄️',
        'Clear': '☀️',
        'Clouds': '☁️',
        'Mist': '🌫️',
        'Smoke': '🌫️',
        'Haze': '🌫️',
        'Dust': '🌫️',
        'Fog': '🌫️',
        'Sand': '🌫️',
        'Ash': '🌫️',
        'Squall': '💨',
        'Tornado': '🌪️'
      };

      const weather = data.weather[0];
      const icon = weatherIcons[weather.main] || '';
      const temp = data.main.temp;
      const feels = data.main.feels_like;
      const humidity = data.main.humidity;
      const wind = data.wind.speed;
      const cityName = `${data.name}, ${data.sys.country}`;

      const embed = {
        color: 0x1e90ff,
        title: `Thời tiết tại ${cityName}`,
        description: `${icon} **${weather.description.charAt(0).toUpperCase() + weather.description.slice(1)}**`,
        fields: [
          { name: '🌡️ Nhiệt độ', value: `${temp}°C (Cảm giác: ${feels}°C)`, inline: true },
          { name: '💧 Độ ẩm', value: `${humidity}%`, inline: true },
          { name: '💨 Gió', value: `${wind} m/s`, inline: true }
        ],
        footer: { text: 'Nguồn: OpenWeatherMap' }
      };

      message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      message.channel.send('Có lỗi xảy ra khi lấy dữ liệu thời tiết.');
    }
  }
};
