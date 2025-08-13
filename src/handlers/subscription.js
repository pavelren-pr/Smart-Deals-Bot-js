const { constants } = require('../config');

module.exports = {
  checkSubscription: async (ctx) => {
    if (!ctx.from) return false;
    const userId = ctx.from.id;

    try {
      // Проверка кэша
      if (subscriptionCache.has(userId)) {
        return subscriptionCache.get(userId);
      }
      
      // Проверка подписки через API Telegram
      const chatMember = await ctx.api.getChatMember(
        constants.SUBSCRIPTION.TARGET_GROUP, 
        userId
      );
      
      const isSubscribed = ["member", "creator", "administrator"]
        .includes(chatMember.status);

      // Сохранение в кэш
      subscriptionCache.set(userId, isSubscribed);
      setTimeout(() => subscriptionCache.delete(userId), 
        constants.SUBSCRIPTION.CACH_TTL);

      return isSubscribed;
    } catch (error) {
      console.error("Ошибка проверки подписки:", error);
      return false;
    }
  }
};