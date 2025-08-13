require('dotenv').config();
const { Bot, session, GrammyError, HttpError } = require('grammy');
const { hydrate } = require('@grammyjs/hydrate');

// Импорт конфигов
const constants = require('./config/constants');
const prices = require('./config/prices');
const keyboards = require('./config/keyboard-templates');

const bot = new Bot(process.env.BOT_API_KEY);
bot.use(hydrate());

const userLastMessages = new Map(); 
const subscriptionCache = new Map();

bot.api.setMyCommands(constants.BOT_COMMANDS);

// Middleware проверки подписки
bot.use(async (ctx, next) => {
  if (ctx.message?.text?.startsWith('/start') || ctx.callbackQuery) {
    return next();
  }

  // ... реализация проверки подписки с использованием constants.SUBSCRIPTION
});

// Обработчики команд
bot.command('start', async (ctx) => {
  await ctx.react('❤‍🔥');
  await ctx.reply(constants.RESPONSES.START, {
    parse_mode: 'HTML',
    reply_markup: keyboards.subscriptionCheck
  });
});

// Обработчики текстовых сообщений
bot.hears('Перейти к каталогу работ 🗃', async (ctx) => {
  await ctx.reply(constants.RESPONSES.CATALOG, {
    reply_markup: keyboards.courseSelection
  });
});

bot.hears('Бесплатные полезные материалы 🕊', async (ctx) => {
  await ctx.reply(constants.RESPONSES.FREE_MATERIALS, {
    reply_markup: keyboards.freeMaterials
  });
});

// ... остальные обработчики

// Запуск бота
bot.catch((err) => {
  // Обработка ошибок
});

bot.start();