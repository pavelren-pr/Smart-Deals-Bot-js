const { constants, prices } = require('../config');
const keyboards = require('../keyboards/templates');

module.exports = (bot) => {
  // Обработка команды /start
  bot.command('start', async (ctx) => {
    await ctx.react('❤‍🔥');
    await ctx.reply(constants.RESPONSES.START, {
      parse_mode: 'HTML',
      reply_markup: keyboards.subscriptionCheck
    });
  });

  // Обработка кнопки каталога
  bot.hears(constants.BUTTONS.CATALOG, async (ctx) => {
    await ctx.reply(constants.RESPONSES.CATALOG, {
      reply_markup: keyboards.courseSelection
    });
  });

  // Обработка бесплатных материалов
  bot.hears(constants.BUTTONS.FREE_MATERIALS, async (ctx) => {
    await ctx.reply(constants.RESPONSES.FREE_MATERIALS, {
      reply_markup: keyboards.freeMaterials
    });
  });

  // Обработка предложения услуг
  bot.hears(constants.BUTTONS.OFFER_SERVICE, async (ctx) => {
    const user = ctx.from;
    const response = constants.RESPONSES.OFFER_SERVICE
      .replace('{firstName}', user.first_name)
      .replace('{lastName}', user.last_name || "");
    
    await ctx.reply(response, {
      parse_mode: 'HTML',
      reply_markup: keyboards.managerLink
    });
  });

  // Обработка любых других текстовых сообщений
  bot.on('message:text', async (ctx) => {
    await ctx.reply(constants.RESPONSES.DEFAULT, {
      reply_markup: keyboards.main
    });
  });
};