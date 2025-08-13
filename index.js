require('dotenv').config(); // Загружаем переменные из .env
const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');

// Проверяем, что токен есть
const token = process.env.BOT_TOKEN;

const bot = new Telegraf(token);

bot.start((ctx) => ctx.reply(`Добро пожаловать! ${ctx.message.from.first_name ? ctx.message.from.first_name : "незнакомец"}, Я ваш бот для общения.`));
bot.help((ctx) => ctx.reply('Отправьте мне стикер'));
bot.on(message('sticker'), (ctx) => ctx.reply('❤️'));
bot.hears('hi', (ctx) => ctx.reply('Hey there'));

bot.launch()
  .then(() => console.log("🤖 Бот запущен!"))
  .catch((err) => console.error("Ошибка запуска бота:", err));

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));