require('dotenv').config(); // Загружаем переменные из .env
const { Telegraf,
  Markup
 } = require('telegraf');
const { message } = require('telegraf/filters');

// Проверяем, что токен есть
const token = process.env.BOT_TOKEN;

const bot = new Telegraf(token);

bot.start((ctx) => ctx.reply(`Добро пожаловать! ${ctx.message.from.first_name ? ctx.message.from.first_name : "незнакомец"}, Я ваш бот для общения.`));
bot.help((ctx) => ctx.reply('Отправьте мне стикер'));
bot.on(message('sticker'), (ctx) => ctx.reply('❤️'));
bot.hears('hi', (ctx) => ctx.reply('Hey there'));

bot.command('go', (ctx) => {
  try {
  ctx.replyWithHTML('<b>Выберите действие</b>', Markup.inlineKeyboard(
    [
      [Markup.button.callback('Написать в группу', 'btn_1')], 
      [Markup.button.callback('Отправить сообщение админу', 'btn_2')],
      [Markup.button.callback('Показать информацию', 'btn_3')], 
      [Markup.button.callback('Отправить скриншот', 'btn_4')],
    ]))
  } catch(e) {
    console.error('Ошибка при обработке команды /go:', e);
    ctx.reply('Произошла ошибка при обработке вашей команды. Пожалуйста, попробуйте позже.');
  }
  })

bot.action('btn_1', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.replyWithDice({ emoji: '🎲' });
  } catch (e) {
    console.error('Ошибка при обработке кнопки btn_1:', e);
    ctx.reply('Произошла ошибка при обработке вашей команды. Пожалуйста, попробуйте позже.');
  }
})

bot.launch()
  .then(() => console.log("🤖 Бот запущен!"))
  .catch((err) => console.error("Ошибка запуска бота:", err));

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));