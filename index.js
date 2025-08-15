require('dotenv').config()
const { Bot, session, GrammyError, HttpError, Keyboard, InlineKeyboard } = require('grammy');
const { error } = require('node:console');
const { hydrate } = require('@grammyjs/hydrate');
const { parse } = require('node:path');

const bot = new Bot(process.env.BOT_TOKEN);
bot.use(hydrate());

const TARGET_CHAT_ID = 7195122925; // ID менеджера (пока что так), куда будут отправляться уведомления
const MATH_CHAT_ID = 0;
const TARGET_GROUP = -1002162448649;
const userLastMessages = new Map(); 
const CACH_TTL =  10 * 1000;
const subscriptionCache = new Map();

bot.api.setMyCommands([
    {
        command: 'start',
        description: 'Начать взаимодействие с ботом',
    },
]);

const costVal = "990";
const costBalka = "990";
const costMSS_PZ1 = "490";
const costMSS_PZ2 = "690";
const costMSS_PZ3 = "490";
const costMSS_PZ4 = "1090";
const costMSS_test = "490";
const costTUS_kurs = "2190";
const costMOS_sea_Kurs = "1790";
const costMOS_river_Kurs = "1790";
const costMOS_river_PZ1 = "-";
const costMOS_river_PZ2 = "590";
const costMOS_river_PZ3 = "-";
const costMOS_river_PZ4 = "590";
const costBS_high = "890";
const costOLVVP_Stvor = "790";
const costNIL_sea_RGR = "790";
const costNIL_river_RGR = "2790";
const costTSS_Test = "3290";

const inlineKeyboar = new InlineKeyboard().text('Подписался!', 'sub1')
const subKeyboard = new InlineKeyboard().text('✅Подписался!', 'sub');
const mainKeyboard = new Keyboard()
    .text('Перейти к каталогу работ 🗃').row()
    .text('Бесплатные полезные материалы 🕊').row()
    .text('Предложить работу или услугу 🥂').resized();
const inlineKeyboard = new InlineKeyboard()
    .text('2 курс ⭐️⭐️', '2-year').row()
    .text('3 курс ⭐️⭐️⭐️', '3-year').row()
    .text('4 курс ⭐️⭐️⭐️⭐️', '4-year');
const inlineKeyboard1 = new InlineKeyboard()
    .text('2 курс ⭐️⭐️', '2-year1').row()
    .text('3 курс ⭐️⭐️⭐️', '3-year1').row()
    .text('4 курс ⭐️⭐️⭐️⭐️', '4-year1').row()
    .text('Практика 🚢', 'prac').row()
    .text('Предложить работу или услугу 🥂', 'usl');
const urlKeyboard = new InlineKeyboard()
    .url("Ссылка на Google Drive 📁", "https://drive.google.com/drive/folders/139n63GVsB8piVV-7iCV6CZg5x92S_w9z?usp=drive_link").row()
    .text('Назад 🔙', 'back14');
const urlKeyboard1 = new InlineKeyboard()
    .url("Ссылка на Google Drive 📁", "https://drive.google.com/drive/folders/1YTIPIGtSyndFX6gwQ4a8mcjK55SUz3_-?usp=drive_link").row()
    .text('Назад 🔙', 'back14');
const urlKeyboard2 = new InlineKeyboard()
    .url("Ссылка на Google Drive 📁", "https://drive.google.com/drive/folders/1QhJqQ7YzFuHSn1LddPKaUMqYPUs10vpY?usp=sharing").row()
    .text('Назад 🔙', 'back14');
const urlKeyboard3 = new InlineKeyboard()
    .url("Написать менеджеру ✍️", "https://t.me/SmartDealsManager").row()
    .text('Назад 🔙', 'back14');
const urlKeyboard4 = new InlineKeyboard()
    .url("Написать менеджеру ✍️", "https://t.me/SmartDealsManager");
const inlineKeyboard2 = new InlineKeyboard()
    .text('Механика ⚙', 'engine').row()
    .text('Назад 🔙', 'back');
 const inlineKeyboard6 = new InlineKeyboard()
    .text('МСС 📏', 'mss').row()
    .text('ТУС 🚢', 'tus').row()
    .text('МОС 🧮', 'mos').row()
    .text('Безопасность судоходства на ВВП🛟', 'bvvp').row()
    .text('Общая лоция ВВП 🌉', 'lvvp').row()
    .text('ГМОС 🌦️', 'gmos').row()
    .text('НиЛ 🧭', 'nil').row()
    .text('ТСС 📺', 'tss').row()
    .text('Назад 🔙', 'back');
const inlineKeyboard7 = new InlineKeyboard()
    .text('ПЗ №1', 'pz1').row()
    .text('ПЗ №2', 'pz2').row()
    .text('ПЗ №3', 'pz3').row()
    .text('ПЗ №4', 'pz4').row()
    .text('Шпоры к летучкам', 'shpora').row()
    .text('Итоговый тест по МСС 🖥️', 'test').row()
    .text('Назад 🔙', 'back3')
const inlineKeyboard8 = new InlineKeyboard()
    .text('Расчет линейного навигационного створа', 'rlns').row()
    .text('Шпоры к экзамену', 'shpora1').row()
    .text('Назад 🔙', 'back3')
const inlineKeyboard9 = new InlineKeyboard()
    .text('Курсовая работа 🎯', 'kurs').row()
    .text('Назад 🔙', 'back3')
const inlineKeyboard34 = new InlineKeyboard()
    .text('Тесты на фарватере🖥️', 'test1').row()
    .text('Назад 🔙', 'back3')
const inlineKeyboard10 = new InlineKeyboard()
    .text('Море 🌊', 'sea').row()
    .text('Река-море 🌉🌊', 'river').row()
    .text('Назад 🔙', 'back3')
const mossea = new InlineKeyboard()
    .text('Практические работы 1-10 🧩', 'pract').row()
    .text('Помощь на контрольных 🤝', 'help').row()
    .text('Курсовая работа 🚢', 'kurs2').row()
    .text('Назад 🔙', 'back6')
const mosriver = new InlineKeyboard()
    .text('Курсовая работа 🚢', 'kurs3').row()
    .text('Практическое задание 1', 'pr1').row()
    .text('ПЗ №2. Сферические треугольники', 'trg').row()
    .text('Практическое задание 3', 'pr3').row()
    .text('ПЗ №4. Оценка нав параметров', 'nav').row()
    .text('Помощь на контрольных 🤝', 'help1').row()
    .text('Назад 🔙', 'back6')
const inlineKeyboard11 = new InlineKeyboard()
    .text('Заказать работу', 'order2').row()
    .text('Назад 🔙', 'back3')
const inlineKeyboard12 = new InlineKeyboard()
    .text('Море 🌊', 'sea1').row()
    .text('Река-море 🌉🌊', 'river1').row()
    .text('Назад 🔙', 'back3')
const nilkeyboard = new InlineKeyboard()
    .text('РГР вертикальный угол (4 задачи)', 'rgr').row()
    .text('Назад 🔙', 'back11')
const nilkeyboard1 = new InlineKeyboard()
    .text('РГР 9 задач по 6 сборникам 📚', 'rgr1').row()
    .text('Помощь на контрольных 🤝', 'help2').row()
    .text('Назад 🔙', 'back11')
const inlineKeyboard13 = new InlineKeyboard()
    .text('Опр. высоты подмостового габарита 🌉', 'high').row()
    .text('Назад 🔙', 'back3')
const inlineKeyboard14 = new InlineKeyboard()
    .text('Заказать работу', 'order3').row()
    .text('Назад 🔙', 'back4')
const inlineKeyboard15 = new InlineKeyboard()
    .text('Заказать работу', 'order4').row()
    .text('Назад 🔙', 'back4')
const inlineKeyboard16 = new InlineKeyboard()
    .text('Заказать работу', 'order5').row()
    .text('Назад 🔙', 'back4')
const inlineKeyboard17 = new InlineKeyboard()
    .text('Заказать работу', 'order6').row()
    .text('Назад 🔙', 'back4')
const inlineKeyboard18 = new InlineKeyboard()
    .text('Заказать работу', 'order7').row()
    .text('Назад 🔙', 'back4')
const inlineKeyboard19 = new InlineKeyboard()
    .text('Заказать работу', 'order8').row()
    .text('Назад 🔙', 'back4')
const inlineKeyboard20 = new InlineKeyboard()
    .text('Заказать работу', 'order9').row()
    .text('Назад 🔙', 'back5')
const inlineKeyboard21 = new InlineKeyboard()
    .text('Заказать работу', 'order10').row()
    .text('Назад 🔙', 'back7')
const inlineKeyboard22 = new InlineKeyboard()
    .text('Заказать работу', 'order11').row()
    .text('Назад 🔙', 'back7')
const inlineKeyboard23 = new InlineKeyboard()
    .text('Заказать работу', 'order12').row()
    .text('Назад 🔙', 'back7')
const inlineKeyboard24 = new InlineKeyboard()
    .text('Заказать работу', 'order13').row()
    .text('Назад 🔙', 'back8')
const inlineKeyboard25 = new InlineKeyboard()
    .text('Заказать работу', 'order14').row()
    .text('Назад 🔙', 'back8')
const inlineKeyboard26 = new InlineKeyboard()
    .text('Заказать работу', 'order15').row()
    .text('Назад 🔙', 'back8')
const inlineKeyboard27 = new InlineKeyboard()
    .text('Заказать работу', 'order16').row()
    .text('Назад 🔙', 'back8')
const inlineKeyboard28 = new InlineKeyboard()
    .text('Заказать работу', 'order17').row()
    .text('Назад 🔙', 'back9')
const inlineKeyboard29 = new InlineKeyboard()
    .text('Заказать работу', 'order18').row()
    .text('Назад 🔙', 'back10')
const inlineKeyboard30 = new InlineKeyboard()
    .text('Заказать работу', 'order19').row()
    .text('Назад 🔙', 'back10')
const inlineKeyboard31 = new InlineKeyboard()
    .text('Заказать работу', 'order20').row()
    .text('Назад 🔙', 'back12')
const inlineKeyboard32 = new InlineKeyboard()
    .text('Заказать работу', 'order21').row()
    .text('Назад 🔙', 'back13')
const inlineKeyboard33 = new InlineKeyboard()
    .text('Заказать работу', 'order22').row()
    .text('Назад 🔙', 'back13')
const inlineKeyboard35 = new InlineKeyboard()
    .text('Заказать работу', 'order23').row()
    .text('Назад 🔙', 'back14')
const inlineKeyboard3 = new InlineKeyboard()
    .text('Расчёт Вала 📏', 'shaft').row()
    .text('Расчёт Балки 🧮', 'beam').row()
    .text('Назад 🔙', 'back1');
const inlineKeyboard4 = new InlineKeyboard()
    .text('Заказать работу', 'order').row()
    .text('Назад 🔙', 'back2');
const inlineKeyboard5 = new InlineKeyboard()
    .text('Заказать работу', 'order1').row()
    .text('Назад 🔙', 'back2');
const orederKeyboard1 = new InlineKeyboard()
    .text('Заказ взят ✅', 'take1');
const orederKeyboard2 = new InlineKeyboard()
    .text('Заказ выполнен ✅', 'take2');
const trackingLink = 'https://t.me/SmartDealsManager';
const writeManager = new InlineKeyboard()
    .text('Отправил скриншот', 'pay');
const writeManager1 = new InlineKeyboard()
    .text('Отправил скриншот', 'pay1');
const writeManager2 = new InlineKeyboard()
    .text('Отправил скриншот', 'pay2');
const writeManager4 = new InlineKeyboard()
    .text('Отправил скриншот', 'pay4');
const writeManager5 = new InlineKeyboard()
    .text('Отправил скриншот', 'pay5');
const writeManager6 = new InlineKeyboard()
    .text('Отправил скриншот', 'pay6');
const writeManager7 = new InlineKeyboard()
    .text('Отправил скриншот', 'pay7');
const writeManager8 = new InlineKeyboard()
    .text('Отправил скриншот', 'pay8');
const writeManager9 = new InlineKeyboard()
    .text('Отправил скриншот', 'pay9');
const writeManager10 = new InlineKeyboard()
    .text('Отправил скриншот', 'pay10');
const writeManager11 = new InlineKeyboard()
    .text('Отправил скриншот', 'pay11');
const writeManager12 = new InlineKeyboard()
    .text('Отправил скриншот', 'pay12');
const writeManager23 = new InlineKeyboard()
    .text('Отправил скриншот', 'pay23');
const WriteManager3 = new InlineKeyboard()
    .text('Отправил скриншот', 'Pay3');
const WriteManager4 = new InlineKeyboard()
    .text('Отправил скриншот', 'Pay4');
const WriteManager5 = new InlineKeyboard()
    .text('Отправил скриншот', 'Pay5');
const WriteManager6 = new InlineKeyboard()
    .text('Отправил скриншот', 'Pay6');
const WriteManager16 = new InlineKeyboard()
    .text('Написал менеджеру', 'Pay16');
const WriteManager19 = new InlineKeyboard()
    .text('Написал менеджеру', 'Pay19');
const WriteManager22 = new InlineKeyboard()
    .text('Написал менеджеру', 'Pay22');
const WriteManager10 = new InlineKeyboard()
    .text('Отправил скриншот', 'Pay10');
const WriteManager11 = new InlineKeyboard()
    .text('Написал менеджеру', 'Pay11');
const replyKeyBoard = new InlineKeyboard()
    .text('Взять заказ', 'take');
const emailKeyboard = new InlineKeyboard()
    .text('Отправил не тот адрес, вернуться назад', 'backward').row()
    .text('Всё верно!', 'ok');
const loginKeyboard = new InlineKeyboard()
    .text('Отправил не тот логин и пароль', 'backward1').row()
    .text('Всё верно!', 'ok1');

async function checkSubscription(ctx) {
    if (!ctx.from) return false;

    const userId = ctx.from.id;

    try {
        if (subscriptionCache.has(userId)){
            return subscriptionCache.get(userId);
        }
        
        const chatMember = await ctx.api.getChatMember(TARGET_GROUP, userId);
        const isSubscriped = ["member", "creator", "administrator"].includes(chatMember.status);

        subscriptionCache.set(userId, isSubscriped);

        setTimeout(() => subscriptionCache.delete(userId), CACH_TTL);

        return isSubscriped;
    } catch (error) {
        console.error("Ошибка проверки подписки:", error);
        return false;
    }
}

bot.use(async (ctx, next) => {
    if (ctx.message?.text?.startsWith('/start') || ctx.callbackQuery) {
        return next();
    }

    const isSubscriped = await checkSubscription(ctx);

    if (!isSubscriped) {
        const timestamp = Date.now();
        const newKeyboard = new InlineKeyboard()
            .url("Подписаться 🔗", `https://t.me/SmartDealsLTDink?check=${timestamp}`).row()
            .text("Проверить снова 🔄", "sub1");
        return ctx.reply(`❌ Для использования бота необходимо подписаться на канал!`, {
            parse_mode: 'HTML',
            reply_markup: newKeyboard
        });
        return
    }
    return next();
})

bot.command('start', async (ctx) => {
    await ctx.react('❤‍🔥')
    await ctx.reply('Привет! Для начала работы подпишись на канал: <a href="https://t.me/SmartDealsLTDink">ссылка</a>', {
        parse_mode: 'HTML',
        reply_markup: inlineKeyboar,
    })
})

bot.callbackQuery('sub1', async (ctx) => { 
    try {
        await ctx.answerCallbackQuery("🔍 Проверяем подписку...");
        
        // const isSubscribed = await checkSubscription(ctx);

        if (!ctx.from) {
            throw new Error("Не удалось получить данные пользователя");
        }
        
        const userId = ctx.from.id;
        const timestamp = Date.now();
        
        try {

            const chatMember = await ctx.api.getChatMember(TARGET_GROUP, userId);
            
            if (["member", "creator", "administrator"].includes(chatMember.status)) {
                await ctx.reply('Можем приступать к работе',{
                    reply_markup: mainKeyboard,
                })

            } else {
                const newKeyboard = new InlineKeyboard()
                    .url("Подписаться 🔗", `https://t.me/SmartDealsLTDink?check=${timestamp}`).row()
                    .text("Проверить снова 🔄", "sub1");

                await ctx.reply(`Вы ещё не подписаны на канал!`, {
                    parse_mode: 'HTML',
                    reply_markup: newKeyboard,
                });
            }
        } catch (apiError) {
            console.error("Ошибка API при проверке подписки:", apiError);
        
            if (apiError.description.includes("bot is not a member") || 
                apiError.description.includes("chat not found")) {
                await ctx.reply("Бот не может проверить подписку. Пожалуйста, сообщите администратору.");
            } else {
                const newKeyboard = new InlineKeyboard()
                    .url("Подписаться 🔗", `https://t.me/SmartDealsLTDink?check=${timestamp}`).row()
                    .text("Проверить снова 🔄", "sub1");

                await ctx.reply(`Не удалось проверить подписку. Попробуйте подписаться и проверьте снова:`, {
                    parse_mode: 'HTML',
                    reply_markup: newKeyboard,
                });
            }
        }
        } catch (err) {
            console.error("Ошибка проверки подписки:",err);
            await ctx.answerCallbackQuery("Ошибка проверки подписки. Попробуйте позже.");
    }
})

bot.hears('Перейти к каталогу работ 🗃', async (ctx) => {
    await ctx.reply('Выбери свой курс обучения', {
        reply_markup: inlineKeyboard,
    })
})

bot.hears('Бесплатные полезные материалы 🕊', async (ctx) => {
    await ctx.reply('Выбраны Бесплатные полезные материалы 🕊\nДанный каталог будет постоянно дополняться и редактироваться чтобы всегда оставаться актуальным. Вы можете внести свой вклад в общее дело и помочь другим, поделившись полезными методичками/примерами работ/книгами🤝\nИзучить каталог того, что на данный момент доступно можно по кнопке ниже🔍\n\n"Наука сокращает нам опыты быстротекущей жизни" ©Пушкин А.С., "Борис Годунов"', {
        reply_markup: inlineKeyboard1,
    })
})

bot.hears('Предложить работу или услугу 🥂', async (ctx) => {
    const user = ctx.from;
    await ctx.reply(`Мы ценим твою инициативу, ${user.first_name} ${user.last_name || ""} :)\nДля предложения работы или услуги напиши нашему менеджеру: <a href="https://t.me/SmartDealsManager">Менеджер</a>\nПриветствуется добавление бесплатных материалов в общий каталог, а так же выполнение работ через наш сервис`, {
        parse_mode: `HTML`,
        reply_markup: urlKeyboard4,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('2-year', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выберите предмет', {
        reply_markup: inlineKeyboard2,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('2-year1', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбрано: Бесплатные полезные материалы 🕊\n2 курс\nВсе материалы расположены на Google Drive, для доступа необходимо перейти по ссылке :)', {
        reply_markup: urlKeyboard,
    })
    await ctx.answerCallbackQuery()
})


bot.callbackQuery('3-year', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выберите предмет', {
        reply_markup: inlineKeyboard6,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('3-year1', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбрано: Бесплатные полезные материалы 🕊\n3 курс\nВсе материалы расположены на Google Drive, для доступа необходимо перейти по ссылке :)', {
        reply_markup: urlKeyboard1,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('prac', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбрано: Бесплатные полезные материалы 🕊\nПрактика 🚢\nДля доступа к материалу необходимо перейти по ссылке ниже', {
        reply_markup: urlKeyboard2,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('usl', async (ctx) => {
    const user = ctx.from;
    await ctx.callbackQuery.message.editText(`Мы ценим твою инициативу, ${user.first_name} ${user.last_name || ""} :)\nДля предложения работы или услуги напиши нашему менеджеру: <a href="https://t.me/SmartDealsManager">Менеджер</a>\nПриветствуется добавление бесплатных материалов в общий каталог, а так же выполнение работ через наш сервис`, {
        parse_mode: `HTML`,
        reply_markup: urlKeyboard3,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('back', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбери свой курс обучения', {
        reply_markup: inlineKeyboard,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('back3', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выберите предмет', {
        reply_markup: inlineKeyboard6,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('engine', async (ctx) => {
    await ctx.callbackQuery.message.editText('По Механике ⚙, Вы можете заказать следующие работы:', {
        reply_markup: inlineKeyboard3,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('beam', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Расчёт Балки 🧮\nСтоимость: ${costBalka}₽\n\nРабота выполняется полностью в электронном виде, Вам будет нужно только распечатать её и сдать\n\nДля расчёта необходимы следующие данные:\n1. Ваш номер по журналу (у преподавателя могут быть свои списки, поэтому лучше уточнить)\n2. Ваш номер учебной группы\n3. Ваша фамилия и инициалы (для оформления титульного листа)`, {
    reply_markup: inlineKeyboard4,
})
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('shaft', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Расчёт Вала 📏\nСтоимость: ${costVal}₽\n\nРабота выполняется полностью в электронном виде, Вам будет нужно только распечатать её и сдать. Срок выполнения: 1 день.\n\nДля расчёта необходимы следующие данные:\n1. Ваш номер по журналу (у преподавателя могут быть свои списки, поэтому лучше уточнить)\n2. Ваш номер учебной группы\n3. Ваша фамилия и инициалы (для оформления титульного листа)`, {
        reply_markup: inlineKeyboard5,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('mos', async (ctx) => {
    await ctx.callbackQuery.message.editText('Предмет: МОС 🧮\nДалее выберете ваш поток обучения:', {
        reply_markup: inlineKeyboard10,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('tss', async (ctx) => {
    await ctx.callbackQuery.message.editText('По ТСС 📺, Вы можете заказать следующие работы:', {
        reply_markup: inlineKeyboard34,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('gmos', async (ctx) => {
    await ctx.callbackQuery.message.editText(`По ГМОС 🌦️ доступны для заказа все лабы у Гордиенко, а также большая лабораторка у Бояринова для уточнения цен пишите менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`, {
        parse_mode: `HTML`,
        reply_markup: inlineKeyboard11,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nil', async (ctx) => {
    await ctx.callbackQuery.message.editText('Предмет: НиЛ 🧭\nДалее выберете ваш поток обучения:', {
        reply_markup: inlineKeyboard12,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('bvvp', async (ctx) => {
    await ctx.callbackQuery.message.editText('По Безопасности судоходства на ВВП🛟, Вы можете заказать следующие работы:', {
        reply_markup: inlineKeyboard13,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('mss', async (ctx) => {
    await ctx.callbackQuery.message.editText('По МСС 📏, Вы можете заказать следующие работы:', {
        reply_markup: inlineKeyboard7,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('tus', async (ctx) => {
    await ctx.callbackQuery.message.editText('По ТУС 🚢, Вы можете заказать следующие работы:', {
        reply_markup: inlineKeyboard9,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('lvvp', async (ctx) => {
    await ctx.callbackQuery.message.editText('По Общей лоции ВВП 🌉, Вы можете заказать следующие работы:\n\nЕсли вас интересует конспект, переходите в бесплатные материалы, он там доступен', {
        reply_markup: inlineKeyboard8,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pz1', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет МСС\nЗадание ПЗ №1\nСтоимость работы - ${costMSS_PZ1}₽\nНомер варианта это последняя цифра номера по списку`, {
        reply_markup: inlineKeyboard14,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pz2', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет МСС\nЗадание ПЗ №2\nСтоимость работы - ${costMSS_PZ2}₽\nНомер варианта это последняя цифра номера по списку\nСрок выполнения - 10 минут`, {
        reply_markup: inlineKeyboard15,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pz3', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет МСС\nЗадание ПЗ №3\nСтоимость работы - ${costMSS_PZ3}₽\nНомер варианта это последняя цифра номера по списку\nСрок выполнения - 10 минут`, {
        reply_markup: inlineKeyboard16,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pz4', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет МСС\nЗадание ПЗ №4\nСтоимость работы - ${costMSS_PZ4}₽\nНомер варианта это последняя цифра номера по списку\nСрок выполнения - 1-2 дня`, {
        reply_markup: inlineKeyboard17,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('shpora', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет МСС\nШпоры к летучками\nВ наличии имеются шпоры ко всем летучками для заказа пишите менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`, {
        parse_mode: `HTML`,
        reply_markup: inlineKeyboard18,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('test', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет МСС\nИтоговый тест по МСС 🖥️\nСтоимость работы - ${costMSS_test}₽\nДля получения доступа к тестам Вам необходимо отправить свою почту боту`, {
        reply_markup: inlineKeyboard19,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('test1', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет ТСС\n11 тестов на фарватере🖥️\nСтоимость работы - ${costTSS_Test}₽\nСрок выполнения: 1 -2 дня.\nДля выполнения работы Вам нужно отправить логин и пароль от фарватера`, {
        reply_markup: inlineKeyboard35,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('kurs', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет ТУС 🚢\nКурсовая работа 🎯\nСтоимость работы - ${costTUS_kurs}₽\n\nРабота выполняется полностью в электронном виде со всеми графиками и титульным листом, Вам будет нужно только распечатать её и сдать. Срок выполнения: 1 день.\n\nДля выполнения работы необходимы следующие данные:\n1. Ваш номер по журналу\n2. Ваш номер учебной группы\n3. Ваша фамилия и инициалы (для оформления титульного листа)`, {
        reply_markup: inlineKeyboard20,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('sea', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбран 3 курс, предмет МОС 🧮\nПоток: Море 🌊\nДля заказа доступны следующие работы:', {
        reply_markup: mossea,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('river', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбран 3 курс, предмет МОС 🧮\nПоток: Река-море 🌉🌊\nДля заказа доступны следующие работы:', {
        reply_markup: mosriver,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pract', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбран 3 курс, предмет МОС 🧮\nПоток: Море 🌊\nЗадание: Практические работы 1-10 🧩', {
        reply_markup: inlineKeyboard21,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('help', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбран 3 курс, предмет МОС 🧮\nПоток: Море 🌊\nЗадание: Помощь на контрольных 🤝', {
        reply_markup: inlineKeyboard22,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('help1', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбран 3 курс, предмет МОС 🧮\nПоток: Река-море 🌉🌊\nЗадание: Помощь на контрольных 🤝', {
        reply_markup: inlineKeyboard27,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('help2', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбран 3 курс, предмет НиЛ 🧭 \nПоток:  Река-море 🌉🌊\nЗадание: Помощь на контрольных 🤝', {
        reply_markup: inlineKeyboard33,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nav', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет МОС 🧮\nПоток: Река-море 🌉🌊\nЗадание: ПЗ №4. Оценка нав параметров\nСтоимость: ${costMOS_river_PZ4}₽`, {
        reply_markup: inlineKeyboard26,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('trg', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет МОС 🧮\nПоток: Река-море 🌉🌊\nЗадание: ПЗ №2. Сферические треугольники\nСтоимость: ${costMOS_river_PZ2}₽`, {
        reply_markup: inlineKeyboard25,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('kurs2', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет МОС 🧮\nПоток: Море 🌊\nЗадание: Курсовая работа 🚢\nСтоимость: ${costMOS_sea_Kurs}₽\n\nКурсовая выполняется в электронном виде, для сдачи её Вам будет необходимо переписать расчётную часть работы от руки. Графики предоставляются так же в электронном виде, для помощи Вам с черчением графиков мы сделали гайд как их правильно перечертить на миллиметровку. Так же для успешной защиты Вам будет необходимо переписать теоретический блок. Всю необходимую для защиты информацию мы Вам предоставим.\n\nДля выполнения курсовой необходим Ваш вариант по журналу преподавателя, эти варианты могут не совпадать с номером по журналу группы.`, {
        reply_markup: inlineKeyboard23,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('kurs3', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет МОС 🧮\nПоток: Река-море 🌉🌊\nЗадание: Курсовая работа 🚢\nСтоимость: ${costMOS_river_Kurs}₽\n\nКурсовая выполняется в электронном виде, для сдачи её Вам будет необходимо переписать расчётную часть работы от руки. Графики предоставляются так же в электронном виде, для помощи Вам с черчением графиков мы сделали гайд как их правильно перечертить на миллиметровку. Так же для успешной защиты Вам будет необходимо переписать теоретический блок. Всю необходимую для защиты информацию мы Вам предоставим.\n\nДля выполнения курсовой необходим Ваш вариант по журналу преподавателя, эти варианты могут не совпадать с номером по журналу группы.`, {
        reply_markup: inlineKeyboard24,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('high', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет Безопасность судоходства на ВВП🛟\nОпределение высоты подмостового габарита🌉\nСтоимость: ${costBS_high}₽\n\nРабота выполняется в электронном виде с графиком, рисунком моста и титульным листом. График мы предоставляем в электронном виде для печати, титульный лист так же печатается, а всю остальную работу, вместе с рисунком моста, Вам необходимо будет переписать от руки на листах А4 и скрепить все листы степлером. Страницы для печати 1 и 4.\nСрок выполнения: 1 день.\n\nДля выполнения работы необходимы следующие данные:\n1. Ваш номер по журналу\n2. Ваш номер учебной группы\n3. Ваша фамилия и инициалы (для оформления титульного листа)\n4. День и месяц вашего рождения`, {
        reply_markup: inlineKeyboard28,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('rlns', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет Общая лоции ВВП 🌉\nПЗ "Расчёт линейного навигационного створа"\nСтоимость: ${costOLVVP_Stvor}₽\n\nНомер варианта - последние две цифры номера в вашем студенческом/курсантском/зачётной книжке`, {
        reply_markup: inlineKeyboard29,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('shpora1', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет Общая лоции ВВП 🌉\nШпоры к экзамену\n\nБилеты выполнены в виде бумажных книжечек 7/10см\nПредоставляем Вам готовые экземпляры\nдля заказа пишите менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`, {
        parse_mode: `HTML`,
        reply_markup: inlineKeyboard30,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('sea1', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбран 3 курс, предмет НиЛ 🧭\nПоток: Море 🌊\nДля заказа доступны следующие работы:', {
        reply_markup: nilkeyboard,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('river1', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбран 3 курс, предмет НиЛ 🧭\nПоток: Река-море 🌉🌊\nДля заказа доступны следующие работы:', {
        reply_markup: nilkeyboard1,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('rgr', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет НиЛ 🧭 \nПоток: Море 🌊\nЗадание: РГР вертикальный угол (4 задачи)\nСтоимость: ${costNIL_sea_RGR}₽\n\nРабота выполняется полностью в электронном виде со всеми графиками и титульным листом, Вам будет нужно только распечатать её и сдать. Срок выполнения: 1 день.\n\nДля выполнения работы необходимы следующие данные:\n1. Ваш номер по журналу\n2. Ваш номер учебной группы\n3. Ваша фамилия и инициалы (для оформления титульного листа)`, {
        reply_markup: inlineKeyboard31,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('rgr1', async (ctx) => {
    await ctx.callbackQuery.message.editText(`Выбран 3 курс, предмет НиЛ 🧭 \nПоток:  Река-море 🌉🌊\nЗадание: РГР 9 задач по 6 сборникам 📚\nСтоимость: ${costNIL_river_RGR}₽`, {
        reply_markup: inlineKeyboard32,
    })
    await ctx.answerCallbackQuery()
})

bot.use(session({ initial: () => ({
    order: {
        waitingForData: false,
        dataReceived: false,
    },
    order1: {
        waitingForData1: false,
        dataReceived1: false,
    },
    order2: {
        waitingForData2: false,
        step2: 0,
        com2: null
    },
    order3: {
        waitingForData3: false,
        step3: 0,
        var3: null,
        com3: null,
        pay3: false,
    },
    order4: {
        waitingForData4: false,
        step4: 0,
        var4: null,
        com4: null,
        pay4: false,
    },
    order5: {
        waitingForData5: false,
        step5: 0,
        var5: null,
        com5: null,
        pay5: false,
    },
    order6: {
        waitingForData6: false,
        step6: 0,
        var6: null,
        com6: null,
        pay6: false,
    },
    order7: {
        waitingForData7: false,
        step7: 0,
        com7: null,
        pay7: false,
    },
    order8: {
        waitingForData8: false,
        step8: 0,
        email8: null,
        com8: null,
        pay8: false,
    },
    order9: {
        waitingForData9: false,
        pay9: false,
    },
    order10: {
        waitingForData10: false,
        step10: 0,
        com10: null,
        pay10: false,
    },
    order11: {
        waitingForData11: false,
        step11: 0,
        com11: null,
        pay11: false,
    },
    order12: {
        waitingForData12: false,
        pay12: false,
    },
    order13: {
        waitingForData13: false,
        pay13: false,
    },
    order14: {
        waitingForData14: false,
        pay14: false,
    },
    order15: {
        waitingForData15: false,
        pay15: false,
    },
    order16: {
        waitingForData16: false,
        step16: 0,
        com16: null,
        pay16: false,
    },
    order17: {
        waitingForData17: false,
        pay17: false,
    },
    order18: {
        waitingForData18: false,
        pay18: false,
    },
    order19: {
        waitingForData19: false,
        step19: 0,
        com19: null,
        pay19: false,
    },
    order20: {
        waitingForData20: false,
        pay20: false,
    },
    order21: {
        waitingForData21: false,
        pay21: false,
    },
    order22: {
        waitingForData22: false,
        step22: 0,
        com22: null,
        pay22: false,
    },
    order23: {
        waitingForData23: false,
        com23: null,
        step23: false,
        dataReceived23: false,
    },
    })
}));

bot.callbackQuery('order1', async (ctx) => {
    ctx.session.order.waitingForData = true;
    await ctx.reply(`Расчёт Вала 📏\nСтоимость: ${costVal}₽\n\nНапишите в сообщении боту следующие данные для выполнения работы:\n1. Ваш номер по журналу (у преподавателя могут быть свои списки, поэтому лучше уточнить)\n2. Ваш номер учебной группы\n3. Ваша фамилия и инициалы (для оформления титульного листа)`);
    await ctx.answerCallbackQuery();
})

bot.callbackQuery('order', async (ctx) => {
    ctx.session.order1.waitingForData1 = true;
    await ctx.reply(`Расчёт Балки 🧮\nСтоимость: ${costBalka}₽\n\nНапишите в сообщении боту следующие данные для выполнения работы:\n1. Ваш номер по журналу (у преподавателя могут быть свои списки, поэтому лучше уточнить)\n2. Ваш номер учебной группы\n3. Ваша фамилия и инициалы (для оформления титульного листа)`);
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('order2', async (ctx) => {
    ctx.session.order2.waitingForData2 = true;
    ctx.session.order2.step2 = 1;
    await ctx.reply('Предмет - ГМОС 🌦️\n Доступны для заказа все лабы у Гордиенко и большая лабораторка у Бояринова\n\nТеперь напишите ограничения по срокам исполнения заказа и комментарии к заказу');
    await ctx.answerCallbackQuery();
})

bot.callbackQuery('order3', async (ctx) => {
    ctx.session.order3.waitingForData3 = true;
    ctx.session.order3.step3 = 1;
    await ctx.reply(`Предмет - МСС 📏\nРабота - ПЗ №1\nСтоимость: ${costMSS_PZ1}₽\n\nДля заказа работы введите номер своего варианта`);
    await ctx.answerCallbackQuery();
})

bot.callbackQuery('order4', async (ctx) => {
    ctx.session.order4.waitingForData4 = true;
    ctx.session.order4.step4 = 1;
    await ctx.reply(`Предмет - МСС 📏\nРабота - ПЗ №2\nСтоимость: ${costMSS_PZ2}₽\n\nДля заказа работы введите номер своего варианта`);
    await ctx.answerCallbackQuery();
})

bot.callbackQuery('order5', async (ctx) => {
    ctx.session.order5.waitingForData5 = true;
    ctx.session.order5.step5 = 1;
    await ctx.reply(`Предмет - МСС 📏\nРабота - ПЗ №3\nСтоимость: ${costMSS_PZ3}₽\n\nДля заказа работы введите номер своего варианта`);
    await ctx.answerCallbackQuery();
})

bot.callbackQuery('order6', async (ctx) => {
    ctx.session.order6.waitingForData6 = true;
    ctx.session.order6.step6 = 1;
    await ctx.reply(`Предмет - МСС 📏\nРабота - ПЗ №4\nСтоимость: ${costMSS_PZ4}₽\n\nДля заказа работы введите номер своего варианта`);
    await ctx.answerCallbackQuery();
})

bot.callbackQuery('order7', async (ctx) => {
    ctx.session.order7.waitingForData7 = true;
    ctx.session.order7.step7 = 1;
    await ctx.reply('Предмет - МСС 📏\nШпоры к летучками\n\nТеперь напишите ограничения по срокам исполнения заказа и комментарии к заказу');
    await ctx.answerCallbackQuery();
})

bot.callbackQuery('order8', async (ctx) => {
    ctx.session.order8.waitingForData8 = true;
    ctx.session.order8.step8 = 1;
    await ctx.reply(`Предмет - МСС 📏\nИтоговый тест по МСС 🖥️\nСтоимость: ${costMSS_test}₽\n\nДля получения доступа к тестам Вам необходимо отправить свою почту боту`);
    await ctx.answerCallbackQuery();
})

bot.callbackQuery('order9', async (ctx) => {
    ctx.session.order9.waitingForData9 = true;
    await ctx.reply(`Предмет - ТУС 🚢\nКурсовая работа 🎯\nСтоимость: ${costTUS_kurs}₽\n\nНапишите в сообщении боту следующие данные для выполнения работы:\n1. Ваш номер по журналу\n2. Номер учебной группы\n3. Ваша фамилия и инициалы (для оформления титульного листа)`);
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order10', async (ctx) => {
    ctx.session.order10.waitingForData10 = true;
    ctx.session.order10.step10 = 1;
    await ctx.reply('Предмет - МОС 🧮\nПоток: Море 🌊\nЗадание: Практические работы 1-10 🧩\n\nТеперь напишите ограничения по срокам исполнения заказа и комментарии к заказу');
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order11', async (ctx) => {
    ctx.session.order11.waitingForData11 = true;
    ctx.session.order11.step11 = 1;
    await ctx.reply('Предмет - МОС 🧮\nПоток: Море 🌊\nЗадание: Помощь на контрольных 🤝\n\nТеперь напишите ограничения по срокам исполнения заказа и комментарии к заказу');
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order12', async (ctx) => {
    ctx.session.order12.waitingForData12 = true;
    await ctx.reply(`Предмет - МОС 🧮\nПоток: Море 🌊\nЗадание: Курсовая работа 🚢\nСтоимость: ${costMOS_sea_Kurs}₽\n\nДля заказа работы введите номер своего варианта по журналу преподавателя, эти варианты могут не совпадать с номером по журналу группы.`);
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order13', async (ctx) => {
    ctx.session.order13.waitingForData13 = true;
    await ctx.reply(`Предмет - МОС 🧮\nПоток: Река-море 🌉🌊\nЗадание: Курсовая работа 🚢\nСтоимость: ${costMOS_river_Kurs}₽\n\nДля заказа работы введите номер своего варианта по журналу преподавателя, эти варианты могут не совпадать с номером по журналу группы.`);
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order14', async (ctx) => {
    ctx.session.order14.waitingForData14 = true;
    await ctx.reply(`Предмет - МОС 🧮\nПоток: Река-море 🌉🌊\nПЗ №2. Сферические треугольники\nСтоимость: ${costMSS_PZ2}₽\nДля заказа работы введите номер своего варианта`);
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order15', async (ctx) => {
    ctx.session.order15.waitingForData15 = true;
    await ctx.reply(`Предмет - МОС 🧮\nПоток: Река-море 🌉🌊\nПЗ №4. Оценка нав параметров\nСтоимость: ${costMSS_PZ4}₽\nДля заказа работы введите номер своего варианта`);
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order16', async (ctx) => {
    ctx.session.order16.waitingForData16 = true;
    ctx.session.order16.step16 = 1;
    await ctx.reply('Предмет - МОС 🧮\nПоток: Река-море 🌉🌊\nЗадание: Помощь на контрольных 🤝\n\nТеперь напишите ограничения по срокам исполнения заказа и комментарии к заказу');
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order17', async (ctx) => {
    ctx.session.order17.waitingForData17 = true;
    await ctx.reply(`Предмет - Безопасность судоходства на ВВП🛟\nОпределение высоты подмостового габарита🌉\nСтоимость: ${costBS_high}₽\nНапишите в сообщении боту следующие данные для выполнения работы:\n1. Ваш номер по журналу\n2. Номер учебной группы\n3. Ваша фамилия и инициалы (для оформления титульного листа)\n4. Ваш день и месяц рождения`);
    await ctx.answerCallbackQuery();    
})


bot.callbackQuery('order18', async (ctx) => {
    ctx.session.order18.waitingForData18 = true;
    await ctx.reply(`Предмет - Общая лоции ВВП 🌉\nПЗ "Расчёт линейного навигационного створа"\nСтоимость: ${costOLVVP_Stvor}₽\n\nДля заказа работы введите номер своего варианта`);
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order19', async (ctx) => {
    ctx.session.order19.waitingForData19 = true;
    ctx.session.order19.step19 = 1;
    await ctx.reply('Предмет - Общая лоции ВВП 🌉\nШпоры к экзамену\n\nТеперь напишите ограничения по срокам исполнения заказа и комментарии к заказу');
    await ctx.answerCallbackQuery();
})

bot.callbackQuery('order20', async (ctx) => {
    ctx.session.order20.waitingForData20 = true;
    await ctx.reply(`Предмет - НиЛ 🧭 \nПоток: Море 🌊\nЗадание: РГР вертикальный угол (4 задачи)\nСтоимость: ${costNIL_sea_RGR}₽\n\nНапишите в сообщении боту следующие данные для выполнения работы:\n1. Ваш номер по журналу\n2. Номер учебной группы\n3. Ваша фамилия и инициалы (для оформления титульного листа)`);
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order21', async (ctx) => {
    ctx.session.order21.waitingForData21 = true;
    await ctx.reply(`Предмет - НиЛ 🧭 \nПоток:  Река-море 🌉🌊\nЗадание: РГР 9 задач по 6 сборникам 📚\nСтоимость: ${costNIL_river_RGR}₽\nДля заказа работы введите номер своего варианта`);
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order22', async (ctx) => {
    ctx.session.order22.waitingForData22 = true;
    ctx.session.order22.step22 = 1;
    await ctx.reply('Предмет - НиЛ 🧭\nПоток: Река-море 🌉🌊\nЗадание: Помощь на контрольных 🤝\n\nТеперь напишите ограничения по срокам исполнения заказа и комментарии к заказу');
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order23', async (ctx) => {
    ctx.session.order23.waitingForData23 = true;
    await ctx.reply(`Предмет - ТСС 📺\n11 тестов на фарватере🖥️\nСтоимость работы - ${costTSS_Test}₽\n\nНапишите в сообщении боту Ваш логин и пароль от фарватера`);
    await ctx.answerCallbackQuery();
})

bot.on("message:text", async (ctx) => {

    if (ctx.session.order?.waitingForData) {
    userLastMessages.set(ctx.from.id, ctx.message);
    await ctx.reply(`Ваш заказ:\n\n2 курс ⭐️⭐️\nПредмет - Механика ⚙\nРабота - Расчёт Вала 📏\nСтоимость: ${costVal}₽\nДанные:\n${ctx.message.text}\n\nДля оплаты заказа переведите ${costVal} на номер карты: 2200701713115514\nПосле оплаты отправьте скиншот перевода нашему менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
        parse_mode: `HTML`,
        reply_markup: writeManager
    })
    ctx.session.order.waitingForData = false;
    ctx.session.order.dataReceived = true;
    return;
    }


    if (ctx.session.order1?.waitingForData1) {
        console.log('Обработка данных заказа...');
        userLastMessages.set(ctx.from.id, ctx.message);
    await ctx.reply(`Ваш заказ:\n\n2 курс ⭐️⭐️\nПредмет - Механика ⚙\nРабота - Расчёт Балки 🧮\nСтоимость: ${costBalka}₽\nДанные:\n${ctx.message.text}\n\nДля оплаты заказа переведите ${costBalka} на номер карты: 2200701713115514\nПосле оплаты отправьте скиншот перевода нашему менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
        parse_mode: `HTML`,
        reply_markup: writeManager1
    })
    ctx.session.order1.waitingForData1 = false;
    ctx.session.order1.dataReceived1 = true;
    return;
    }

    if (ctx.session.order2?.waitingForData2) {

        if (ctx.session.order2.step2 === 1) {
        
            ctx.session.order2.com2 = ctx.message.text;

            const user = ctx.from;
            const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
            const userInfo = `Пользователь: ${userLink}`;
            const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - ГМОС 🌦️\nСроки и комментарии:\n${ctx.session.order2.com2}`;
            await ctx.api.sendMessage(
            TARGET_CHAT_ID,
            msg,
            {parse_mode: `HTML`}
            );

            await ctx.reply(`Заказ принят!\nДетали заказа:\n3 курс ⭐️⭐️⭐️\nПредмет - ГМОС 🌦️\nСроки и комментарии:\n${ctx.session.order2.com2}\nДля оплаты заказа и уточнения деталей напишите менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
            parse_mode: `HTML`
            });

            ctx.session.order2 = {
                waitingForData2: false,
                step2: 0,
                com2: null
            };
            return;
        }
    }

    if (ctx.session.order3?.waitingForData3){

        if (ctx.session.order3.step3 === 1) {
            ctx.session.order3.var3 = ctx.message.text;
            ctx.session.order3.step3 = 2;
            await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nРабота - ПЗ №1\nСтоимость: ${costMSS_PZ1}₽\nВариант: ${ctx.session.order3.var3}\n\nТеперь напишите ограничения по срокам исполнения заказа и комментарии к заказу`,{
        });
            return;
        }
        if (ctx.session.order3.step3 === 2) {
        
            ctx.session.order3.com3 = ctx.message.text;

            userLastMessages.set(ctx.from.id, ctx.message);
            await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nРабота - ПЗ №1\nСтоимость: ${costMSS_PZ1}₽\nВариант: ${ctx.session.order3.var3}\nСроки и комментарии:\n${ctx.session.order3.com3}\nДля оплаты заказа и уточнения деталей напишите менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
                parse_mode: `HTML`,
                reply_markup: WriteManager3
            })

            ctx.session.order3 = {
            waitingForData3: false,
            step3: 0,
            pay3: true,
            var3: ctx.session.order3.var3,
            com3: ctx.session.order3.com3,
            };
            return;
        }
    }


    if (ctx.session.order4?.waitingForData4) {

        if (ctx.session.order4.step4 === 1) {
            ctx.session.order4.var4 = ctx.message.text;
            ctx.session.order4.step4 = 2;
            await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nРабота - ПЗ №2\nСтоимость: ${costMSS_PZ2}₽\nВариант: ${ctx.session.order4.var4}\n\nТеперь напишите ограничения по срокам исполнения заказа и комментарии к заказу`,{
        });
            return;
        }
        if (ctx.session.order4.step4 === 2) {
        
            ctx.session.order4.com4 = ctx.message.text;
            
            userLastMessages.set(ctx.from.id, ctx.message);
            await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nРабота - ПЗ №2\nСтоимость: ${costMSS_PZ2}₽\nВариант: ${ctx.session.order4.var4}\nСроки и комментарии:\n${ctx.session.order4.com4}\nДля оплаты заказа и уточнения деталей напишите менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
                parse_mode: `HTML`,
                reply_markup: WriteManager4
            })

            ctx.session.order4 = {
                waitingForData4: false,
                step4: 0,
                pay4: true,
                var4: ctx.session.order4.var4,
                com4: ctx.session.order4.com4,
            };
            return;
        }
    }


    if (ctx.session.order5?.waitingForData5) {

        if (ctx.session.order5.step5 === 1) {
            ctx.session.order5.var5 = ctx.message.text;
            ctx.session.order5.step5 = 2;
            await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nРабота - ПЗ №3\nСтоимость: ${costMSS_PZ3}₽\nВариант: ${ctx.session.order5.var5}\n\nТеперь напишите ограничения по срокам исполнения заказа и комментарии к заказу`,{
        });
            return;
        }
        if (ctx.session.order5.step5 === 2) {
        
            ctx.session.order5.com5 = ctx.message.text;

            userLastMessages.set(ctx.from.id, ctx.message);
            await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nРабота - ПЗ №3\nСтоимость: ${costMSS_PZ3}₽\nВариант: ${ctx.session.order5.var5}\nСроки и комментарии:\n${ctx.session.order5.com5}\nДля оплаты заказа и уточнения деталей напишите менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
                parse_mode: `HTML`,
                reply_markup: WriteManager5
            })

            ctx.session.order5 = {
                waitingForData5: false,
                step5: 0,
                pay5: true,
                var5: ctx.session.order5.var5,
                com5: ctx.session.order5.com5,
            };
            return;
        }
    }
    
    
    if (ctx.session.order6?.waitingForData6) {

        if (ctx.session.order6.step6 === 1) {
            ctx.session.order6.var6 = ctx.message.text;
            ctx.session.order6.step6 = 2;
            await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nРабота - ПЗ №4\nСтоимость: ${costMSS_PZ4}₽\nВариант: ${ctx.session.order6.var6}\n\nТеперь напишите ограничения по срокам исполнения заказа и комментарии к заказу`,{
        });
            return;
        }
        if (ctx.session.order6.step6 === 2) {
        
            ctx.session.order6.com6 = ctx.message.text;
            
            userLastMessages.set(ctx.from.id, ctx.message);
            await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nРабота - ПЗ №4\nСтоимость: ${costMSS_PZ4}₽\nВариант: ${ctx.session.order6.var6}\nСроки и комментарии:\n${ctx.session.order6.com6}\nДля оплаты заказа и уточнения деталей напишите менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
                parse_mode: `HTML`,
                reply_markup: WriteManager6
            })

        ctx.session.order6 = {
                waitingForData6: false,
                step6: 0,
                pay6: true,
                var6: ctx.session.order6.var6,
                com6: ctx.session.order6.com6
            };
            return;
        }
    }

    
    if (ctx.session.order7?.waitingForData7) {

        if (ctx.session.order7.step7 === 1) {
        
            ctx.session.order7.com7 = ctx.message.text;

            const user = ctx.from;
            const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
            const userInfo = `Пользователь: ${userLink}`;
            const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nШпоры к летучками\nСроки и комментарии:\n${ctx.session.order7.com7}`;
            await ctx.api.sendMessage(
            TARGET_CHAT_ID,
            msg,
            {parse_mode: `HTML`}
            // {reply_markup: replyKeyBoard}
            );

            await ctx.reply(`Заказ принят!\nДетали заказа:\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nШпоры к летучками\nСроки и комментарии:\n${ctx.session.order7.com7}\nДля оплаты заказа и уточнения деталей напишите менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
            parse_mode: `HTML`
            });

        ctx.session.order7 = {
                waitingForData7: false,
                step7: 0,
                com7: null
            };
            return;
        }
    }


    if (ctx.session.order8?.waitingForData8) {
        if (ctx.message.entities) {
            const emailEntities = ctx.message.entities.filter(e => e.type === "email");
            if (emailEntities.length > 0) {

                if (ctx.session.order8.step8 === 1) {
                ctx.session.order8.email8 = ctx.message.text.substring(
                    emailEntities[0].offset,   
                    emailEntities[0].offset + emailEntities[0].length
                );
                ctx.session.order8.step8 = 2;
                await ctx.reply(`Спасибо, Ваш почтовый адрес принят\nВаш адрес: ${ctx.session.order8.email8}`,{
                    reply_markup: emailKeyboard
                });
                return;
                }
            }
            
        } 
        await ctx.reply("Ошибка, для доступа к материалам необходимо ввести адрес электронной почты");
        
    }

    if (ctx.session.order9?.waitingForData9) {
    userLastMessages.set(ctx.from.id, ctx.message);
    await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - ТУС 🚢\nКурсовая работа 🎯\nСтоимость: ${costTUS_kurs}₽\nДанные для расчёта:\n${ctx.message.text}\n\nДля оплаты заказа переведите ${costTUS_kurs} на номер карты: 2200701713115514\nПосле оплаты отправьте скиншот перевода нашему менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
        parse_mode: `HTML`,
        reply_markup: writeManager4
    })
    ctx.session.order9.waitingForData9 = false;
    ctx.session.order9.pay9 = true;
    return;
    }

    if (ctx.session.order10?.waitingForData10) {

        if (ctx.session.order10.step10 === 1) {
        
            ctx.session.order10.com10 = ctx.message.text;
            
            userLastMessages.set(ctx.from.id, ctx.message);
            await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nПоток: Море 🌊\nЗадание: Практические работы 1-10 🧩\nСроки и комментарии:\n${ctx.session.order10.com10}\n\nДля оплаты заказа и уточнения деталей напишите менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
                parse_mode: `HTML`,
                reply_markup: WriteManager10
            })

            ctx.session.order10 = {
                waitingForData10: false,
                step10: 0,
                com10: ctx.session.order10.com10,
                pay10: true,
            };
            return;
        }
    }

    if (ctx.session.order11?.waitingForData11) {

        if (ctx.session.order11.step11 === 1) {
        
            ctx.session.order11.com11 = ctx.message.text;
            
            userLastMessages.set(ctx.from.id, ctx.message);
            await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nПоток: Море 🌊\nЗадание: Помощь на контрольных 🤝\nСроки и комментарии:\n${ctx.session.order11.com11}\n\nДля оплаты заказа и уточнения деталей напишите менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
                parse_mode: `HTML`,
                reply_markup: WriteManager11
            })

            ctx.session.order11 = {
                waitingForData11: false,
                step11: 0,
                com11: ctx.session.order11.com11,
                pay11: true,
            };
            return;
        }
    }

    if (ctx.session.order12?.waitingForData12) {
        userLastMessages.set(ctx.from.id, ctx.message);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nПоток: Море 🌊\nЗадание: Курсовая работа 🚢\nСтоимость: ${costMOS_sea_Kurs}₽\nДанные для расчёта:\n${ctx.message.text}\n\nДля оплаты заказа переведите ${costMOS_sea_Kurs} на номер карты: 2200701713115514\nПосле оплаты отправьте скиншот перевода нашему менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
            parse_mode: `HTML`,
            reply_markup: writeManager5
        })
        ctx.session.order12.waitingForData12 = false;
        ctx.session.order12.pay12 = true;
        return;
    }

    if (ctx.session.order13?.waitingForData13) {
        userLastMessages.set(ctx.from.id, ctx.message);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nПоток: Река-море 🌉🌊\nЗадание: Курсовая работа 🚢\nСтоимость: ${costMOS_river_Kurs}₽\nДанные для расчёта:\n${ctx.message.text}\n\nДля оплаты заказа переведите ${costMOS_river_Kurs} на номер карты: 2200701713115514\nПосле оплаты отправьте скиншот перевода нашему менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
            parse_mode: `HTML`,
            reply_markup: writeManager6
        })
        ctx.session.order13.waitingForData13 = false;
        ctx.session.order13.pay13 = true;
        return;
    }

    if (ctx.session.order14?.waitingForData14) {
        userLastMessages.set(ctx.from.id, ctx.message);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nПоток: Река-море 🌉🌊\nЗадание: ПЗ №2. Сферические треугольники\nСтоимость: ${costMOS_river_PZ2}₽\nВаш вариант:\n${ctx.message.text}\n\nДля оплаты заказа переведите ${costMOS_river_PZ2} на номер карты: 2200701713115514\nПосле оплаты отправьте скиншот перевода нашему менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
            parse_mode: `HTML`,
            reply_markup: writeManager7
        })
        ctx.session.order14.waitingForData14 = false;
        ctx.session.order14.pay14 = true;
        return;
    }

    if (ctx.session.order15?.waitingForData15) {
        userLastMessages.set(ctx.from.id, ctx.message);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nПоток: Река-море 🌉🌊\nЗадание: ПЗ №4. Оценка нав параметров\nСтоимость: ${costMOS_river_PZ4}₽\nВаш вариант:\n${ctx.message.text}\n\nДля оплаты заказа переведите ${costMOS_river_PZ4} на номер карты: 2200701713115514\nПосле оплаты отправьте скиншот перевода нашему менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
            parse_mode: `HTML`,
            reply_markup: writeManager8
        })
        ctx.session.order15.waitingForData15 = false;
        ctx.session.order15.pay15 = true;
        return;
    }

    if (ctx.session.order16?.waitingForData16) {

        if (ctx.session.order16.step16 === 1) {
        
            ctx.session.order16.com16 = ctx.message.text;
            
            userLastMessages.set(ctx.from.id, ctx.message);
            await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nПоток: Река-море 🌉🌊\nЗадание: Помощь на контрольных 🤝\nСроки и комментарии:\n${ctx.session.order16.com16}\n\nДля оплаты заказа и уточнения деталей напишите менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
                parse_mode: `HTML`,
                reply_markup: WriteManager16
            })

            ctx.session.order16 = {
                waitingForData16: false,
                step16: 0,
                pay16: true,
                com16: ctx.session.order16.com16,
            };
            return;
        }
    }

    if (ctx.session.order17?.waitingForData17) {
        userLastMessages.set(ctx.from.id, ctx.message);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - Безопасность судоходства на ВВП🛟\nОпределение высоты подмостового габарита🌉\nСтоимость: ${costBS_high}₽\nДанные для расчёта:\n${ctx.message.text}\n\nДля оплаты заказа переведите ${costBS_high} на номер карты: 2200701713115514\nПосле оплаты отправьте скиншот перевода нашему менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
            parse_mode: `HTML`,
            reply_markup: writeManager9
        })
        ctx.session.order17.waitingForData17 = false;
        ctx.session.order17.pay17 = true;
        return;
    }

    if (ctx.session.order18?.waitingForData18) {
        userLastMessages.set(ctx.from.id, ctx.message);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - Общая лоции ВВП 🌉\nПЗ "Расчёт линейного навигационного створа"\nСтоимость: ${costOLVVP_Stvor}₽\nВаш вариант:\n${ctx.message.text}\n\nДля оплаты заказа переведите ${costOLVVP_Stvor} на номер карты: 2200701713115514\nПосле оплаты отправьте скиншот перевода нашему менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
            parse_mode: `HTML`,
            reply_markup: writeManager10
        })
        ctx.session.order18.waitingForData18 = false;
        ctx.session.order18.pay18 = true;
        return;
    }

    if (ctx.session.order19?.waitingForData19) {

        if (ctx.session.order19.step19 === 1) {
        
            ctx.session.order19.com19 = ctx.message.text;
            
            userLastMessages.set(ctx.from.id, ctx.message);
            await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - Общая лоции ВВП 🌉\nШпоры к экзамену\nСроки и комментарии:\n${ctx.session.order19.com19}\nДля оплаты заказа и уточнения деталей напишите менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
                parse_mode: `HTML`,
                reply_markup: WriteManager19
            })

            ctx.session.order19 = {
                waitingForData19: false,
                step19: 0,
                com19: ctx.session.order19.com19,
                pay19: true,
            };
            return;
        }
    }

    if (ctx.session.order20?.waitingForData20) {
    userLastMessages.set(ctx.from.id, ctx.message);
    await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - НиЛ 🧭 \nПоток: Море 🌊\nЗадание: РГР вертикальный угол (4 задачи)\nСтоимость: ${costNIL_sea_RGR}₽\nДанные для расчёта:\n${ctx.message.text}\n\nДля оплаты заказа переведите ${costNIL_sea_RGR} на номер карты: 2200701713115514\nПосле оплаты отправьте скиншот перевода нашему менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
        parse_mode: `HTML`,
        reply_markup: writeManager11
    })
    ctx.session.order20.waitingForData20 = false;
    ctx.session.order20.pay20 = true;
    return;
    }

    if (ctx.session.order21?.waitingForData21) {
        userLastMessages.set(ctx.from.id, ctx.message);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - НиЛ 🧭 \nПоток:  Река-море 🌉🌊\nЗадание: РГР 9 задач по 6 сборникам 📚\nСтоимость: ${costNIL_river_RGR}₽\nВаш вариант:\n${ctx.message.text}\n\nДля оплаты заказа переведите ${costNIL_river_RGR} на номер карты: 2200701713115514\nПосле оплаты отправьте скиншот перевода нашему менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
            parse_mode: `HTML`,
            reply_markup: writeManager12
        })
        ctx.session.order21.waitingForData21 = false;
        ctx.session.order21.pay21 = true;
        return;
    }

    if (ctx.session.order22?.waitingForData22) {

        if (ctx.session.order22.step22 === 1) {
        
            ctx.session.order22.com22 = ctx.message.text;
            
            userLastMessages.set(ctx.from.id, ctx.message);
            await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - НиЛ 🧭\nПоток: Река-море 🌉🌊\nЗадание: Помощь на контрольных 🤝\nСроки и комментарии:\n${ctx.session.order22.com22}\n\nДля оплаты заказа и уточнения деталей напишите менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`,{
                parse_mode: `HTML`,
                reply_markup: WriteManager22
            })

            ctx.session.order22 = {
                waitingForData22: false,
                step22: 0,
                com22: ctx.session.order22.com22,
                pay22: true,
            };
            return;
        }
    }

    if (ctx.session.order23?.waitingForData23) {
        ctx.session.order23.com23 = ctx.message.text;
        await ctx.reply(`Спасибо, Ваш логин и пароль принят\nПроверьте все ли верно: \n${ctx.session.order23.com23}`,{
            reply_markup: loginKeyboard
        });
            ctx.session.order23.waitingForData23 = false;
            ctx.session.order23.step23 = true;
        return;
    } 
});



bot.callbackQuery('pay', async (ctx) => {
    if (ctx.session.order.dataReceived) {

    const userid = ctx.from.id;
    const lastMessage = userLastMessages.get(userid);

    if (!lastMessage) {
        await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
        return;
    }

    const user = ctx.from;
    const originaltext = lastMessage.text;
    const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
    const userInfo = `Пользователь: ${userLink}`;
    const msg = `Новый заказ!\n${userInfo}\n2 курс ⭐️⭐️\nПредмет - Механика ⚙\nРабота - Расчёт Вала 📏\nСтоимость: ${costVal}₽\nДанные:\n${originaltext}`;
    await ctx.api.sendMessage(
        TARGET_CHAT_ID,
        msg,
        // {reply_markup: replyKeyBoard}
    );
    await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера');
    ctx.session.order.dataReceived = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay1', async (ctx) => {
    if (ctx.session.order1.dataReceived1) {
        const userid = ctx.from.id;
    const lastMessage = userLastMessages.get(userid);

    if (!lastMessage) {
        await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
        return;
    }

    const user = ctx.from;
    const originaltext = lastMessage.text;
    const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
    const userInfo = `Пользователь: ${userLink}`;
    const msg = `Новый заказ!\n${userInfo}\n2 курс ⭐️⭐️\nПредмет - Механика ⚙\nРабота - Расчёт Балки 🧮\nСтоимость: ${costBalka}₽\nДанные:\n${originaltext}`;
    await ctx.api.sendMessage(
        TARGET_CHAT_ID,
        msg,
        // {reply_markup: replyKeyBoard}
    );
    await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')
    ctx.session.order1.dataReceived1 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('Pay3', async (ctx) => {
    if (ctx.session.order3.pay3) {
        const userid = ctx.from.id;
    const lastMessage = userLastMessages.get(userid);

    if (!lastMessage) {
        await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
        return;
    }
    const user = ctx.from;
    const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
    const userInfo = `Пользователь: ${userLink}`;
    const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nРабота - ПЗ №1\nСтоимость: ${costMSS_PZ1}₽\nВариант: ${ctx.session.order3.var3}\nСроки и комментарии:\n${ctx.session.order3.com3}`;
    await ctx.api.sendMessage(
    TARGET_CHAT_ID,
    msg,
    // {reply_markup: replyKeyBoard}
    );

    await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')

    ctx.session.order3.pay3 = false;
    ctx.session.order3.var3 = null;
    ctx.session.order3.com3 = null;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('Pay4', async (ctx) => {
    if (ctx.session.order4.pay4) {
        const userid = ctx.from.id;
    const lastMessage = userLastMessages.get(userid);

    if (!lastMessage) {
        await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
        return;
    }
    const user = ctx.from;
    const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
    const userInfo = `Пользователь: ${userLink}`;
    const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nРабота - ПЗ №2\nСтоимость: ${costMSS_PZ2}₽\nВариант: ${ctx.session.order4.var4}\nСроки и комментарии:\n${ctx.session.order4.com4}`;
    await ctx.api.sendMessage(
    TARGET_CHAT_ID,
    msg,
    // {reply_markup: replyKeyBoard}
    );

    await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')

    ctx.session.order4.pay4 = false;
    ctx.session.order4.var4 = null;
    ctx.session.order4.com4 = null;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('Pay5', async (ctx) => {
    if (ctx.session.order5.pay5) {
        const userid = ctx.from.id;
    const lastMessage = userLastMessages.get(userid);

    if (!lastMessage) {
        await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
        return;
    }
    const user = ctx.from;
    const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
    const userInfo = `Пользователь: ${userLink}`;
    const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nРабота - ПЗ №3\nСтоимость: ${costMSS_PZ3}₽\nВариант: ${ctx.session.order5.var5}\nСроки и комментарии:\n${ctx.session.order5.com5}`;
    await ctx.api.sendMessage(
    TARGET_CHAT_ID,
    msg,
    // {reply_markup: replyKeyBoard}
    );

    await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')

    ctx.session.order5.pay5 = false;
    ctx.session.order5.var5 = null;
    ctx.session.order5.com5 = null;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('Pay6', async (ctx) => {
    if (ctx.session.order6.pay6) {
        const userid = ctx.from.id;
    const lastMessage = userLastMessages.get(userid);

    if (!lastMessage) {
        await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
        return;
    }
    const user = ctx.from;
    const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
    const userInfo = `Пользователь: ${userLink}`;
    const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nРабота - ПЗ №4\nСтоимость: ${costMSS_PZ4}₽\nВариант: ${ctx.session.order6.var6}\nСроки и комментарии:\n${ctx.session.order6.com6}`;
    await ctx.api.sendMessage(
    TARGET_CHAT_ID,
    msg,
    // {reply_markup: replyKeyBoard}
    );

    await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')

    ctx.session.order6 = {
        pay6: false,
        var6: null,
        com6: null,
    };
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('Pay10', async (ctx) => {
    if (ctx.session.order10.pay10) {
        const userid = ctx.from.id;
    const lastMessage = userLastMessages.get(userid);

    if (!lastMessage) {
        await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
        return;
    }
    const user = ctx.from;
    const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
    const userInfo = `Пользователь: ${userLink}`;
    const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nПоток: Море 🌊\nЗадание: Практические работы 1-10 🧩\nСроки и комментарии:\n${ctx.session.order10.com10}`;
    await ctx.api.sendMessage(
        TARGET_CHAT_ID,
        msg,
        // {reply_markup: replyKeyBoard}
    );

    await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')

    ctx.session.order10 = {
        pay10: false,
        com10: null,
    };
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('Pay11', async (ctx) => {
    if (ctx.session.order11.pay11) {
        const userid = ctx.from.id;
    const lastMessage = userLastMessages.get(userid);

    if (!lastMessage) {
        await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
        return;
    }
    const user = ctx.from;
    const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
    const userInfo = `Пользователь: ${userLink}`;
    const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nПоток: Море 🌊\nЗадание: Помощь на контрольных 🤝\nСроки и комментарии:\n${ctx.session.order11.com11}`;
    await ctx.api.sendMessage(
        TARGET_CHAT_ID,
        msg,
        // {reply_markup: replyKeyBoard}
    );


    await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')

    ctx.session.order11 = {
        pay11: false,
        com11: null,
    };
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('Pay16', async (ctx) => {
    if (ctx.session.order16.pay16) {
        const userid = ctx.from.id;
    const lastMessage = userLastMessages.get(userid);

    if (!lastMessage) {
        await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
        return;
    }
    const user = ctx.from;
    const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
    const userInfo = `Пользователь: ${userLink}`;
    const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nПоток: Река-море 🌉🌊\nЗадание: Помощь на контрольных 🤝\nСроки и комментарии:\n${ctx.session.order16.com16}`;
    await ctx.api.sendMessage(
        TARGET_CHAT_ID,
        msg,
        // {reply_markup: replyKeyBoard}
    );



    await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')

    ctx.session.order16 = {
        pay16: false,
        com16: null,
    };
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('Pay19', async (ctx) => {
    if (ctx.session.order19.pay19) {
        const userid = ctx.from.id;
    const lastMessage = userLastMessages.get(userid);

    if (!lastMessage) {
        await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
        return;
    }
    const user = ctx.from;
    const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
    const userInfo = `Пользователь: ${userLink}`;
    const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - Общая лоции ВВП 🌉\nШпоры к экзамену\nСроки и комментарии:\n${ctx.session.order19.com19}`;
    await ctx.api.sendMessage(
    TARGET_CHAT_ID,
    msg,
    // {reply_markup: replyKeyBoard}
    );



    await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')

    ctx.session.order19 = {
        pay19: false,
        com19: null,
    };
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('Pay22', async (ctx) => {
    if (ctx.session.order22.pay22) {
        const userid = ctx.from.id;
    const lastMessage = userLastMessages.get(userid);

    if (!lastMessage) {
        await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
        return;
    }
    const user = ctx.from;
    const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
    const userInfo = `Пользователь: ${userLink}`;
    const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - НиЛ 🧭\nПоток: Река-море 🌉🌊\nЗадание: Помощь на контрольных 🤝\nСроки и комментарии:\n${ctx.session.order22.com22}`;
    await ctx.api.sendMessage(
        TARGET_CHAT_ID,
        msg,
        // {reply_markup: replyKeyBoard}
    );



    await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')

    ctx.session.order22 = {
        pay22: false,
        com22: null,
    };
    }
    await ctx.answerCallbackQuery()
})



bot.callbackQuery('ok', async (ctx) => {
    if (ctx.session.order8.step8 === 2) {
        await ctx.reply(`Предмет - МСС 📏\nИтоговый тест по МСС 🖥️\nСтоимость: ${costMSS_test}₽\nВаша почта: ${ctx.session.order8.email8}\nДля оплаты заказа и получения доступа переведите ${costMSS_test} на номер карты:\n2200701713115514\nПосле оплаты отправьте скиншот перевода нашему менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`, {
            parse_mode: `HTML`,
            reply_markup: writeManager2
        });
        await ctx.answerCallbackQuery();
        ctx.session.order8.waitingForData8 = false;
        ctx.session.order8.dataReceived8 = true;
    }
    
})

bot.callbackQuery('ok1', async (ctx) => {
    if (ctx.session.order23.step23) {
        await ctx.reply(`Предмет - ТСС 📺\n11 тестов на фарватере🖥️\nСтоимость работы - ${costTSS_Test}₽\nВаш логин и пароль:\n${ctx.session.order23.com23}\nДля оплаты заказа и получения доступа переведите ${costTSS_Test} на номер карты:\n2200701713115514\nПосле оплаты отправьте скиншот перевода нашему менеджеру✍: <a href="https://t.me/SmartDealsManager">ссылка</a>`, {
            parse_mode: `HTML`,
            reply_markup: writeManager23
        });
        await ctx.answerCallbackQuery();
        ctx.session.order23.step23 = false;
        ctx.session.order23.dataReceived23 = true;
    }
    
})

bot.callbackQuery('pay2', async (ctx) => {
    if (ctx.session.order8.dataReceived8) {

        const user = ctx.from;
        const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
        const userInfo = `Пользователь: ${userLink}`;
        const msg = `Запрос доступа\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nИтоговый тест по МСС 🖥️\nСтоимость: ${costMSS_test}₽\nПочта: ${ctx.session.order8.email8}`;
        await ctx.api.sendMessage(
            TARGET_CHAT_ID,
            msg,
            // {reply_markup: replyKeyBoard}
        );
        await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера');
        ctx.session.order8.dataReceived8 = false;
    }

    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay23', async (ctx) => {
    if (ctx.session.order23.dataReceived23) {

        const user = ctx.from;
        const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
        const userInfo = `Пользователь: ${userLink}`;
        const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - ТСС 📺\n11 тестов на фарватере🖥️\nСтоимость - ${costTSS_Test}₽\nЛогин и пароль:\n${ctx.session.order23.com23}`;
        await ctx.api.sendMessage(
            TARGET_CHAT_ID,
            msg,
            // {reply_markup: replyKeyBoard}
        );
        await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера');
        ctx.session.order23.dataReceived23 = false;
    }

    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay4', async (ctx) => {
    if (ctx.session.order9.pay9) {
        const userid = ctx.from.id;
        const lastMessage = userLastMessages.get(userid);

        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }

        const user = ctx.from;
        const originaltext = lastMessage.text;
        const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
        const userInfo = `Пользователь: ${userLink}`;
        const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - ТУС 🚢\nРабота - Курсовая работа 🎯\nСтоимость: ${costTUS_kurs}₽\nДанные:\n${originaltext}`;
        await ctx.api.sendMessage(
            TARGET_CHAT_ID,
            msg,
            // {reply_markup: replyKeyBoard}
        );
        await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')
        ctx.session.order9.pay9 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay5', async (ctx) => {
    if (ctx.session.order12.pay12) {
        const userid = ctx.from.id;
        const lastMessage = userLastMessages.get(userid);

        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }

        const user = ctx.from;
        const originaltext = lastMessage.text;
        const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
        const userInfo = `Пользователь: ${userLink}`;
        const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nПоток: Море 🌊\nЗадание: Курсовая работа 🚢\nСтоимость: ${costMOS_sea_Kurs}₽\nДанные:\n${originaltext}`;
        await ctx.api.sendMessage(
            TARGET_CHAT_ID,
            msg,
            // {reply_markup: replyKeyBoard}
        );
        await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')
        ctx.session.order12.pay12 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay6', async (ctx) => {
    if (ctx.session.order13.pay13) {
        const userid = ctx.from.id;
        const lastMessage = userLastMessages.get(userid);

        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }

        const user = ctx.from;
        const originaltext = lastMessage.text;
        const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
        const userInfo = `Пользователь: ${userLink}`;
        const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nПоток: Река-море 🌉🌊\nЗадание: Курсовая работа 🚢\nСтоимость: ${costMOS_river_Kurs}₽\nДанные:\n${originaltext}`;
        await ctx.api.sendMessage(
            TARGET_CHAT_ID,
            msg,
            // {reply_markup: replyKeyBoard}
        );
        await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')
        ctx.session.order13.pay13 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay7', async (ctx) => {
    if (ctx.session.order14.pay14) {
        const userid = ctx.from.id;
        const lastMessage = userLastMessages.get(userid);

        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }

        const user = ctx.from;
        const originaltext = lastMessage.text;
        const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
        const userInfo = `Пользователь: ${userLink}`;
        const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nПоток: Море 🌊\nЗадание: ПЗ №2. Сферические треугольники\nСтоимость: ${costMOS_river_PZ2}₽\nВариант:\n${originaltext}`;
        await ctx.api.sendMessage(
            TARGET_CHAT_ID,
            msg,
            // {reply_markup: replyKeyBoard}
        );
        await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')
        ctx.session.order14.pay14 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay8', async (ctx) => {
    if (ctx.session.order15.pay15) {
        const userid = ctx.from.id;
        const lastMessage = userLastMessages.get(userid);

        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }

        const user = ctx.from;
        const originaltext = lastMessage.text;
        const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
        const userInfo = `Пользователь: ${userLink}`;
        const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nПоток: Море 🌊\nЗадание: ПЗ №4. Оценка нав параметров\nСтоимость: ${costMOS_river_PZ4}₽\nВариант:\n${originaltext}`;
        await ctx.api.sendMessage(
            TARGET_CHAT_ID,
            msg,
            // {reply_markup: replyKeyBoard}
        );
        await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')
        ctx.session.order15.pay15 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay9', async (ctx) => {
    if (ctx.session.order17.pay17) {
        const userid = ctx.from.id;
        const lastMessage = userLastMessages.get(userid);

        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }

        const user = ctx.from;
        const originaltext = lastMessage.text;
        const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
        const userInfo = `Пользователь: ${userLink}`;
        const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - Безопасность судоходства на ВВП🛟\nОпределение высоты подмостового габарита🌉\nСтоимость: ${costBS_high}₽\nДанные для расчёта:\n${originaltext}`;
        await ctx.api.sendMessage(
            TARGET_CHAT_ID,
            msg,
            // {reply_markup: replyKeyBoard}
        );
        await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')
        ctx.session.order17.pay17 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay10', async (ctx) => {
    if (ctx.session.order18.pay18) {
        const userid = ctx.from.id;
        const lastMessage = userLastMessages.get(userid);

        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }

        const user = ctx.from;
        const originaltext = lastMessage.text;
        const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
        const userInfo = `Пользователь: ${userLink}`;
        const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - Общая лоции ВВП 🌉\nПЗ "Расчёт линейного навигационного створа"\nСтоимость: ${costOLVVP_Stvor}₽\nВариант:\n${originaltext}`;
        await ctx.api.sendMessage(
            TARGET_CHAT_ID,
            msg,
            // {reply_markup: replyKeyBoard}
        );
        await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')
        ctx.session.order18.pay18 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay11', async (ctx) => {
    if (ctx.session.order20.pay20) {
        const userid = ctx.from.id;
        const lastMessage = userLastMessages.get(userid);

        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }

        const user = ctx.from;
        const originaltext = lastMessage.text;
        const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
        const userInfo = `Пользователь: ${userLink}`;
        const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - НиЛ 🧭 \nПоток: Море 🌊\nЗадание: РГР вертикальный угол (4 задачи)\nСтоимость: ${costNIL_sea_RGR}₽\nДанные:\n${originaltext}`;
        await ctx.api.sendMessage(
            TARGET_CHAT_ID,
            msg,
            // {reply_markup: replyKeyBoard}
        );
        await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')
        ctx.session.order20.pay20 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay12', async (ctx) => {
    if (ctx.session.order21.pay21) {
        const userid = ctx.from.id;
        const lastMessage = userLastMessages.get(userid);

        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }

        const user = ctx.from;
        const originaltext = lastMessage.text;
        const userLink = `<a href="tg://user?id=${user.id}">${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</a>`;
        const userInfo = `Пользователь: ${userLink}`;
        const msg = `Новый заказ!\n${userInfo}\n3 курс ⭐️⭐️⭐️\nПредмет - НиЛ 🧭 \nПоток:  Река-море 🌉🌊\nЗадание: РГР 9 задач по 6 сборникам 📚\nСтоимость: ${costNIL_sea_RGR}₽\nВариант:\n${originaltext}`;
        await ctx.api.sendMessage(
            TARGET_CHAT_ID,
            msg,
            // {reply_markup: replyKeyBoard}
        );
        await ctx.reply('Заказ успешно оформлен! Ожидайте ответ менеджера')
        ctx.session.order21.pay21 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('backward', async (ctx) => {
    if (ctx.session.order8.step8 === 2) {
        ctx.session.order8.waitingForData8 = true;
        ctx.session.order8.step8 = 1;
        await ctx.reply(`Предмет - МСС 📏\nИтоговый тест по МСС 🖥️\nСтоимость: ${costMSS_test}₽\n\nДля получения доступа к тестам Вам необходимо отправить свою почту боту`);
        await ctx.answerCallbackQuery();
        return;
    }

})

bot.callbackQuery('backward1', async (ctx) => {
    if (ctx.session.order23.step23) {
        ctx.session.order23.waitingForData23 = true;
        await ctx.reply(`Предмет - ТСС 📺\n11 тестов на фарватере🖥️\nСтоимость работы - ${costTSS_Test}₽\n\nНапишите в сообщении боту Ваш логин и пароль от фарватера`);
        await ctx.answerCallbackQuery();
        }

})

// bot.callbackQuery('take', async (ctx) => {
//     const originaltext = lastMessage.text;
//     const userInfo = `Пользователь: ${user.first_name} ${user.last_name || ""}, id: ${user.id}`;
//     const msg = `Новый заказ!\n${userInfo}\n2 курс ⭐️⭐️\nПредмет - Механика ⚙\nРабота - Расчёт Вала 📏\nСтоимость: 990₽\nДанные:\n${originaltext}`;
//     await ctx.callbackQuery.message.editText(msg, {
//     reply_markup: orederKeyboard1,
// })
//     await ctx.answerCallbackQuery()
// })

// bot.callbackQuery('take1', async (ctx) => {
//     await ctx.callbackQuery.message.editText(msg, {
//     reply_markup: orederKeyboard2,
// })
//     await ctx.answerCallbackQuery()
// })

bot.callbackQuery('back1', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выберите предмет', {
        reply_markup: inlineKeyboard2,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('back2', async (ctx) => {
    await ctx.callbackQuery.message.editText('По Механике ⚙, Вы можете заказать следующие работы:', {
        reply_markup: inlineKeyboard3,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('back4', async (ctx) => {
    await ctx.callbackQuery.message.editText('По МСС 📏, Вы можете заказать следующие работы:', {
        reply_markup: inlineKeyboard7,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('back5', async (ctx) => {
    await ctx.callbackQuery.message.editText('По ТУС 🚢, Вы можете заказать следующие работы:', {
        reply_markup: inlineKeyboard9,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('back6', async (ctx) => {
    await ctx.callbackQuery.message.editText('Предмет: МОС 🧮\nДалее выберете ваш поток обучения:', {
        reply_markup: inlineKeyboard10,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('back7', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбран 3 курс, предмет МОС 🧮\nПоток: Море 🌊\nДля заказа доступны следующие работы:', {
        reply_markup: mossea,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('back8', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбран 3 курс, предмет МОС 🧮\nПоток: Река-море 🌉🌊\nДля заказа доступны следующие работы:', {
        reply_markup: mosriver,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('back9', async (ctx) => {
    await ctx.callbackQuery.message.editText('По Безопасности судоходства на ВВП🛟, Вы можете заказать следующие работы:', {
        reply_markup: inlineKeyboard13,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('back10', async (ctx) => {
    await ctx.callbackQuery.message.editText('По Общей лоции ВВП 🌉, Вы можете заказать следующие работы:\n\nЕсли вас интересует конспект, переходите в бесплатные материалы, он там доступен', {
        reply_markup: inlineKeyboard8,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('back11', async (ctx) => {
    await ctx.callbackQuery.message.editText('Предмет: НиЛ 🧭\nДалее выберете ваш поток обучения:', {
        reply_markup: inlineKeyboard12,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('back12', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбран 3 курс, предмет НиЛ 🧭\nПоток: Море 🌊\nДля заказа доступны следующие работы:', {
        reply_markup: nilkeyboard,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('back13', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбран 3 курс, предмет НиЛ 🧭\nПоток: Река-море 🌉🌊\nДля заказа доступны следующие работы:', {
        reply_markup: nilkeyboard1,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('back14', async (ctx) => {
    await ctx.callbackQuery.message.editText('Выбраны Бесплатные полезные материалы 🕊\nДанный каталог будет постоянно дополняться и редактироваться чтобы всегда оставаться актуальным. Вы можете внести свой вклад в общее дело и помочь другим, поделившись полезными методичками/примерами работ/книгами🤝\nИзучить каталог того, что на данный момент доступно можно по кнопке ниже🔍\n\n"Наука сокращает нам опыты быстротекущей жизни" ©Пушкин А.С., "Борис Годунов"', {
        reply_markup: inlineKeyboard1,
    })
})

bot.on('msg:text', async (ctx) =>{
    await ctx.reply('Что Вам нужно?', {
        reply_markup: mainKeyboard,
    })
})


bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;

    if (e instanceof GrammyError) {
        console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
    } else {
        console.error("Unknown error:", e);
    }
})

bot.start();
