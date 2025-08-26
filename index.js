require('dotenv').config()
const { Bot, session, GrammyError, HttpError, Keyboard, InlineKeyboard } = require('grammy');
const { error } = require('node:console');
const { hydrate } = require('@grammyjs/hydrate');
const { parse } = require('node:path');
const { is } = require('type-is');
const { get } = require('node:http');
const loyalty = require('./loyalty');

const bot = new Bot(process.env.BOT_TOKEN);
bot.use(hydrate());

const TARGET_CHAT_ID = 7195122925; // ID менеджера (пока что так), куда будут отправляться уведомления
const MATH_CHAT_ID = 0; // ID чата по вышмату
const MY_CHAT_ID = 0; // ID чата, куда будут отправляться уведомления о заказах (не обо всех)
const TARGET_GROUP = -1002162448649;
const userLastMessages = new Map(); 
const CACH_TTL =  10 * 1000;
const subscriptionCache = new Map();
const myCardNumber = process.env.MY_CARD_NUMBER;
const ivanCardNumber = process.env.IVAN_CARD_NUMBER;
const muCellNumber = process.env.MY_CELL_NUMBER;
const ivanCellNumber = process.env.IVAN_CELL_NUMBER;

bot.api.setMyCommands([
    {
        command: 'start',
        description: 'Начать взаимодействие с ботом',
    },
]);


//Блок 0. Инициализация сессии и глобальных переменных
bot.use(session({ initial: () => ({
    userInfo: {
            waitingForPhone: false,
            phoneNumber: null,
            hasUsername: false
        },
    order: { //Расчёт Балки
        waitingForData: false,
        dataReceived: false,
    },
    order1: { //Расчёт Вала
        waitingForData1: false,
        dataReceived1: false,
    },
    order2: { //ГМОС всё (надо усложнить)
        waitingForData2: false,
        step2: 0,
        com2: null
    },
    order3: { // МСС ПЗ №1
        waitingForData3: false,
        var3: null,
        pay3: false,
    },
    order4: { // МСС ПЗ №2
        waitingForData4: false,
        var4: null,
        pay4: false,
    },
    order5: { // МСС ПЗ №3
        waitingForData5: false,
        var5: null,
          pay5: false,
    },
    order6: { // МСС ПЗ №4
        waitingForData6: false,
        var6: null,
        pay6: false,
    },  
    order8: { //МСС Тест
        waitingForData8: false,
        step8: 0,
        email8: null,
        com8: null,
        pay8: false,
    },
    order9: { //ТУС курсовая работа
        waitingForData9: false,
        pay9: false,
    },
    order12: { //Мос курсовая работа
        waitingForData12: false,
        pay12: false,
    },
    order14: { //МОС река-море ПЗ 2
        waitingForData14: false,
        pay14: false,
    },
    order15: { //МОС река-море ПЗ 4
        waitingForData15: false,
        pay15: false,
    },
    order17: { //Безопасность судоходства на ВВП РГР
        waitingForData17: false,
        pay17: false,
    },
    order18: { //Общая лоция ВВП РГР
        waitingForData18: false,
        pay18: false,
    },
    order20: { //НиЛ море ргр вертикальный угол
        waitingForData20: false,
        pay20: false,
    },
    order21: { //НиЛ река-море РГР 9 задач
        waitingForData21: false,
        pay21: false,
    },
    order23: { //ТСС Тест
        waitingForData23: false,
        com23: null,
        step23: false,
        dataReceived23: false,
    },
    })
}));


// Блок 1. Объявление констант для цен.
const commission = 20;
const nach1_9 = 490;
const nach10_12 = 550;
const nachall1_9 = 3690;
const nachall10_12 = 1380;
const nachANDinjgraf = 7690;
const inj146 = 990;
const inj5 = 790;
const njALL = 4280;
const costVal = 990;
const costBalka = 990;
const costMSS_PZ1 = 490;
const costMSS_PZ2 = 690;
const costMSS_PZ3 = 490;
const costMSS_PZ4 = 1090;
const costMSS_test = 490;
const costTUS_kurs = 2190;
const costMOS_Kurs = 1790;
const costMOS_river_PZ2 = 590;
const costMOS_river_PZ4 = 590;
const costBS_high = 890;
const costOLVVP_Stvor = 790;
const costNIL_sea_RGR = 790;
const costNIL_river_RGR = 2790;
const costTSS_Test = 3290;

// 1) Форматирование цены с учётом лояльности (loyalty.getPriceForUser)
function formatPriceInfo(ctx, basePrice) {
    const info = loyalty.getPriceForUser(ctx.from.id, basePrice); // Итоговая строка с зачёркнутой базовой и жирной финальной ценой + ранг и скидка
        const base = Number(basePrice);
        const crossed = info.discountedPrice >= base ? "" : `${base}₽`;
    return {
        line: `Стоимость: <s>${crossed}</s>    ‼️ <u><b>${info.discountedPrice}₽</b></u> ‼️\n\nВаш ранг: <b>${info.rankName}</b>\nВаша скидка: <b>${info.discountPercent > 0 ? info.discountPercent : 0}%</b>📈`,
        info,
    };
}

//форматируем цену с учетом скидки и комиссии для работников
function getPriceForWork(ctx, basePrice) {
    const priceInfo = loyalty.getPriceForUser(ctx.from.id, basePrice);
    const discountedPrice = priceInfo.discountedPrice;
    const priceWithoutCommission = Math.round(discountedPrice * (100 - commission))/100;
    return `\nСтоимость: ${discountedPrice}₽ (${priceWithoutCommission}₽)\n`;
}

// 2) «Хвост» с данными пользователя для сообщений менеджеру
function buildUserReference(ctx) {
  const user = ctx.from;
  const phone = ctx.session?.userInfo?.phoneNumber
    ? `\n+${ctx.session.userInfo.phoneNumber}`
    : "";
  return `\n\nПользователь: ${user.first_name} ${user.last_name ? user.last_name : ''}\n@${user.username}\n${user.id} ${phone}`;
}


// 3) Универсальный переход на экран (меньше кода в back-кнопках)
async function go(ctx, text, keyboard) {
  await ctx.callbackQuery.message.editText(text, { reply_markup: keyboard, disable_web_page_preview: true, parse_mode: 'HTML' });
  await ctx.answerCallbackQuery();
}

// 4) Фабрика типовых клавиатур: «Заказать» + «Назад»
function orderKb(orderCode, backCode) {
  return new InlineKeyboard()
    .text('✅ Заказать работу', orderCode).row()
    .text('Назад 🔙', backCode);
}

// 5) Показ кнопки «Подписаться» (используем в проверке подписки)
function subscribeKeyboard() {
  const timestamp = Date.now();
  return new InlineKeyboard()
    .url("Подписаться 🔗", `${channelLink}?check=${timestamp}`).row()
    .text("Проверить снова 🔄", "sub1");
}

// Блок 1.2. Объявление переменных для ссылок
const channelLink = 'https://t.me/SmartDealsLTDink'
const trackingManagerLink = 'https://t.me/SmartDealsManager';
const trackingMathLink = 'https://t.me/SmartDealsMathManager';
const loyaltyDocLink = 'https://docs.google.com/document/d/1tcjS6BL9TVWVeH-cG7jj0lyYwJtyPViWj60lzhd3x-A/edit?usp=sharing';
const DriveCatalogLink = 'https://drive.google.com/drive/folders/1oXGLvXAXfbeADoh07X3WhOX0WOLeg9mR?usp=sharing';
const Drive1yearLink = 'https://drive.google.com/drive/folders/1nAbmEz2CvQAzk2yZG8jdBrZ7VpDy8Dle?usp=sharing';
const Drive2yearLink = 'https://drive.google.com/drive/folders/1GtQEJQESq0OVhOGmWE3zo94PfScD3ypk?usp=sharing';
const Drive3yearLink = 'https://drive.google.com/drive/folders/1pU-uhO03bL6IJq9Js6f-DtaomNwPd90t?usp=sharing';
const Drive4yearLink = 'https://drive.google.com/drive/folders/1ImX8bRsg1OFrsIY0LmuYjecOfuu2U4N_?usp=sharing';
const DrivePractice = 'https://drive.google.com/drive/folders/1lNX7F6AUTA7SSIhwhLlQebDFvGnAJT-E?usp=sharing';

// Блок 1.3. Объявления других переменных
const afterConfReply = `✅ Заказ успешно оформлен ✅ \n\n💬 Ожидайте ответ менеджера 💬`;
const seaTreasure = `💰 Морская Сокровищница 💰\n\nНаш каталог постоянно дополняется и совершенствуется чтобы всегда оставаться актуальным. ` + 
`<a href="${DriveCatalogLink}">В сокровищнице есть</a> (и не только это)\n
Вы можете внести свой вклад в общее дело и помочь другим, поделившись полезными в учёбе материалами за достойное ` + 
`<a href="${loyaltyDocLink}">вознаграждение (см п. 4)</a> с нашей стороны 🤝\n
"Наука сокращает нам опыты быстротекущей жизни" \n© Пушкин А.С., "Борис Годунов"`;
const cherchenieMESS = `\n\nВсе работы делаются на бумаге для черчения 📜\n\nДоставка в Стрельну осуществляется в четверг и в пятницу, так же есть возможность вывоза с Межевого канала сразу после исполнения работы 🚚`;
const payconfmes = `\n\nПосле оплаты отправьте скиншот перевода нашему <a href="${trackingManagerLink}">менеджеру</a> ✍ и затем обязательно нажмите кнопку ⬇️ ниже\n"✅ Отправил скриншот"`;
const helpONSubject = `\n\nЕсли Вас интересуют другие работы по этому предмету 🗒️ или же помощь на кр, зачёте или экзамене ✅, ` + 
`то напишите нашему <a href="${trackingManagerLink}">менеджеру</a> ✍\n\nДля заказа доступны 🛒`;

//Блок 2. Объявление всех используемых клавиатур
const inlineKeyboar = new InlineKeyboard().text('Подписался!', 'sub1')
const subKeyboard = new InlineKeyboard().text('✅Подписался!', 'sub');
const mainKeyboard = new Keyboard()
    .text('🗃 Каталог работ 🗃').row() 
    .text('💰 Морская Сокровищница 💰').row()
    .text('🥂 Предложить работу 🥂').row() 
    .text('💵 Программа лояльности 💵').resized();
const inlineKeyboard = new InlineKeyboard()
    .text('1 курс ⭐️', '1-year').row()
    .text('2 курс ⭐️⭐️', '2-year').row()
    .text('3 курс ⭐️⭐️⭐️', '3-year').row()
    .text('4 курс ⭐️⭐️⭐️⭐️', '4-year');
const inlineKeyboard1 = new InlineKeyboard()
    .text('1 курс ⭐️', '1-year1').row()
    .text('2 курс ⭐️⭐️', '2-year1').row()
    .text('3 курс ⭐️⭐️⭐️', '3-year1').row()
    .text('4 курс ⭐️⭐️⭐️⭐️', '4-year1').row()
    .text('Практика 🚢', 'prac').row()
    .text('🥂 Предложить работу 🥂', 'usl');
const urlKeyboard1year = new InlineKeyboard()
    .url("Ссылка на Google Drive 📁", `${Drive1yearLink}`).row()
    .text('Назад 🔙', 'back14');
const urlKeyboard = new InlineKeyboard()
    .url("Ссылка на Google Drive 📁", `${Drive2yearLink}`).row()
    .text('Назад 🔙', 'back14');
const urlKeyboard1 = new InlineKeyboard()
    .url("Ссылка на Google Drive 📁", `${Drive3yearLink}`).row()
    .text('Назад 🔙', 'back14');
const urlKeyboard4year = new InlineKeyboard()
    .url("Ссылка на Google Drive 📁", `${Drive4yearLink}`).row()
    .text('Назад 🔙', 'back14');
const urlKeyboard2 = new InlineKeyboard()
    .url("Ссылка на Google Drive 📁", `${DrivePractice}`).row()
    .text('Назад 🔙', 'back14');
const urlKeyboard3 = new InlineKeyboard()
    .url("Написать менеджеру ✍️", `${trackingManagerLink}`).row()
    .text('Назад 🔙', 'back14');
const urlKeyboard4 = new InlineKeyboard()
    .url("Написать менеджеру ✍️", `${trackingManagerLink}`);
const inlineKeyboard1year = new InlineKeyboard()
    .text('Вышмат 📐', 'math1').row()
    .text('Назад 🔙', 'back');
const inlineKeyboard2 = new InlineKeyboard()
    .text('Начерталка 📒', 'nachert').row()
    .text('Инженерная графика 🗜️', 'injgraf').row()
    .text('Механика ⚙', 'engine').row()
    .text('Вышмат 📐', 'math2').row()
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
const inlineKeyboardNachert = new InlineKeyboard()
    .text('1-9 задача (каждая отдельно) 📎', 'nach1_9').row()
    .text('10-12 задача (каждая отдельно) 🗒️', 'nach10_12').row()
    .text('1-9 задача (вместе) ‼️Выгода 720₽‼️', 'nachall1_9').row()
    .text('10-12 задача (вместе) ‼️Выгода 270₽‼️', 'nachall10_12').row()
    .text('Весь начерт и инжграф ‼️Выгода 2460₽‼️', 'nachANDinjgraf').row()
    .text('Назад 🔙', 'back1')
const inlineKeyboarInjgraf = new InlineKeyboard()
    .text('1-4 и 6 работа (каждая отдельно) 📐', 'inj146').row()
    .text('5 работа (эскизирование) 🎈', 'inj5').row()
    .text('Весь инжграф ‼️Выгода 1460₽‼️', 'injALL').row()
    .text('Весь начерт и инжграф ‼️Выгода 2460₽‼️', 'nachANDinjgraf').row()
    .text('Назад 🔙', 'back1')
const inlineKeyboard3 = new InlineKeyboard()
    .text('Расчёт Вала 📏', 'shaft').row()
    .text('Расчёт Балки 🧮', 'beam').row()
    .text('Назад 🔙', 'back1');
const inlineKeyboard7 = new InlineKeyboard()
    .text('ПЗ №1 🗒️', 'pz1').row()
    .text('ПЗ №2 📓', 'pz2').row()
    .text('ПЗ №3 📒', 'pz3').row()
    .text('ПЗ №4 📔', 'pz4').row()
    .text('Итоговый тест по МСС 🖥️', 'test').row()
    .text('Назад 🔙', 'back3')
const inlineKeyboard8 = new InlineKeyboard()
    .text('Расчет линейного навигационного створа', 'rlns').row()
    .text('Назад 🔙', 'back3')
const inlineKeyboard9 = new InlineKeyboard()
    .text('Курсовая работа 🎯', 'kurs').row()
    .text('Назад 🔙', 'back3')
const inlineKeyboard34 = new InlineKeyboard()
    .text('Тесты на фарватере 🖥️', 'test1').row()
    .text('Назад 🔙', 'back3')
const inlineKeyboard10 = new InlineKeyboard()
    .text('Море 🌊', 'sea').row()
    .text('Река-море 🌉🌊', 'river').row()
    .text('Назад 🔙', 'back3')
const mossea = new InlineKeyboard()
    .text('Курсовая работа 🚢', 'kurs2').row()
    .text('Назад 🔙', 'back6')
const mosriver = new InlineKeyboard()
    .text('Курсовая работа 🚢', 'kurs2').row()
    .text('ПЗ №2. Сферические треугольники', 'trg').row()
    .text('ПЗ №4. Оценка нав параметров', 'nav').row()
    .text('Назад 🔙', 'back6')
const inlineKeyboard12 = new InlineKeyboard()
    .text('Море 🌊', 'sea1').row()
    .text('Река-море 🌉🌊', 'river1').row()
    .text('Назад 🔙', 'back3')
const nilkeyboard = new InlineKeyboard()
    .text('РГР вертикальный угол (4 задачи)', 'rgr').row()
    .text('Назад 🔙', 'back11')
const nilkeyboard1 = new InlineKeyboard()
    .text('РГР 9 задач по 6 сборникам 📚', 'rgr1').row()
    .text('Назад 🔙', 'back11')
const inlineKeyboard13 = new InlineKeyboard()
    .text('Опр. высоты подмостового габарита 🌉', 'high').row()
    .text('Назад 🔙', 'back3')

//Клавиатуры через конструктор (доделать)
const inlineKeyboard4 = orderKb('order', 'back2');
const inlineKeyboard5 = orderKb('order1', 'back2');

const inlineKeyboard11 = orderKb('order2', 'back3')
const inlineKeyboard14 = orderKb('order3', 'back4');
const inlineKeyboard15 = orderKb('order4', 'back4');
const inlineKeyboard16 = orderKb('order5', 'back4');
const inlineKeyboard17 = orderKb('order6', 'back4');
const inlineKeyboard19 = orderKb('order8', 'back4');
const inlineKeyboard20 = orderKb('order9', 'back5');
const inlineKeyboard23 = orderKb('order12', 'back6');

const inlineKeyboard25 = orderKb('order14', 'back8');
const inlineKeyboard26 = orderKb('order15', 'back8');

const inlineKeyboard28 = orderKb('order17', 'back9');
const inlineKeyboard29 = orderKb('order18', 'back10');

const inlineKeyboard31 = orderKb('order20', 'back12');
const inlineKeyboard32 = orderKb('order21', 'back13');

const inlineKeyboard35 = orderKb('order23', 'back14');
const inlineKeyboardNachertorder1_9 = orderKb('order24', 'backnachert')
const inlineKeyboardNachertorder10_12 = orderKb('order25', 'backnachert')
const inlineKeyboardNachertALLorder1_9 = orderKb('order26', 'backnachert')
const inlineKeyboardNachertALLorder10_12 = orderKb('order27', 'backnachert')
const inlineKeyboardNacherANDinj = orderKb('order28', 'back1')
const inlineKeyboardinj146 = orderKb('order29', 'backinj')
const inlineKeyboardinj5 = orderKb('order30', 'backinj')
const inlineKeyboardinjALL = orderKb('order31', 'backinj')
const orederKeyboard1 = new InlineKeyboard()
    .text('Заказ взят ✅', 'take1');
const orederKeyboard2 = new InlineKeyboard()
    .text('Заказ выполнен ✅', 'take2');
const writeManager = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'pay');
const writeManager1 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'pay1');
const writeManager2 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'pay2');
const writeManager4 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'pay4');
const writeManager5 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'pay5');
const writeManager6 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'pay6');
const writeManager7 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'pay7');
const writeManager8 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'pay8');
const writeManager9 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'pay9');
const writeManager10 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'pay10');
const writeManager11 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'pay11');
const writeManager12 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'pay12');
const writeManager23 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'pay23');
const WriteManager3 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'Pay3');
const WriteManager4 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'Pay4');
const WriteManager5 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'Pay5');
const WriteManager6 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'Pay6');
const WriteManager16 = new InlineKeyboard()
    .text('✅ Написал менеджеру', 'Pay16');
const WriteManager19 = new InlineKeyboard()
    .text('✅ Написал менеджеру', 'Pay19');
const WriteManager22 = new InlineKeyboard()
    .text('✅ Написал менеджеру', 'Pay22');
const WriteManager10 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'Pay10');
const WriteManager11 = new InlineKeyboard()
    .text('Написал менеджеру', 'Pay11');
const writeMathManager1 = new InlineKeyboard()
    .url("Написать менеджеру по вышмату ✍️", trackingMathLink).row()
    .text('Назад 🔙', 'back1year');
const writeMathManager2 = new InlineKeyboard()
    .url("Написать менеджеру по вышмату ✍️", trackingMathLink).row()
    .text('Назад 🔙', 'back1');
const replyKeyBoard = new InlineKeyboard()
    .text('Взять заказ', 'take');
const emailKeyboard = new InlineKeyboard()
    .text('Отправил не тот адрес, вернуться назад', 'backward').row()
    .text('Всё верно!', 'ok');
const loginKeyboard = new InlineKeyboard()
    .text('Отправил не тот логин и пароль', 'backward1').row()
    .text('Всё верно!', 'ok1');


//Блок 3. Проверка подписки на канал (+постоянная проверка подписки)
async function checkSubscription(ctx) {
    if (!ctx.from) return false;

    const userId = ctx.from.id;
    
    if (subscriptionCache.has(userId)) {
        return subscriptionCache.get(userId);
    }
    
    try {
        const chatMember = await ctx.api.getChatMember(TARGET_GROUP, userId);
        const isSubscribed = ["member", "creator", "administrator"].includes(chatMember.status);
        
        subscriptionCache.set(userId, isSubscribed);
        setTimeout(() => subscriptionCache.delete(userId), CACH_TTL);
        
        return isSubscribed;
    } catch (error) {
        console.error("Ошибка API при проверке подписки:", error);
        return false;
    }
}

bot.use(async (ctx, next) => {
    if (ctx.message?.text?.startsWith('/start') || ctx.callbackQuery) {
        return next();
    }

    const isSubscribed = await checkSubscription(ctx);

    if (!isSubscribed) {
        const timestamp = Date.now();
        const newKeyboard = new InlineKeyboard()
            .url("Подписаться 🔗", `${channelLink}?check=${timestamp}`).row()
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

    tg_id = ctx.from.id; // Сохраняем ID пользователя

    // Гарантируем инициализацию userInfo
    ctx.session.userInfo = ctx.session.userInfo || {
        waitingForPhone: false,
        phoneNumber: null,
        hasUsername: false
    };

    // Проверяем наличие username
    ctx.session.userInfo.hasUsername = !!ctx.from.username;
    if (!ctx.session.userInfo.hasUsername) {
        ctx.session.userInfo.waitingForPhone = true;
        await ctx.reply(`Привет! Для начала работы подпишись на <a href="${channelLink}">канал</a>\n\n` +
                       '❗ У вас не установлен username в Telegram. ❗\n' + 'Для связи с вами нам нужен ваш номер телефона.\n' +
                       'Пожалуйста, нажмите кнопку ниже, чтобы поделиться номером:', {
            parse_mode: 'HTML',
            reply_markup: new Keyboard()
                .requestContact("📱 Отправить номер телефона")
                .resized()
        });
    } else {
        await ctx.reply(`Привет! Для начала работы подпишись на <a href="${channelLink}">канал</a>`, {
            parse_mode: 'HTML',
            reply_markup: inlineKeyboar,
        });
    }
})

// Обработчик для сообщений с контактом
bot.on("message:contact", async (ctx) => {
    if (ctx.session.userInfo.waitingForPhone) {
        const phoneNumber = ctx.message.contact.phone_number;
        
        // Сохраняем номер телефона в сессии
        ctx.session.userInfo.phoneNumber = phoneNumber;
        ctx.session.userInfo.waitingForPhone = false;
        
        await ctx.reply(`✅ Спасибо! Ваш номер ${phoneNumber} сохранён.\n\n` +
                        'Теперь подпишитесь на канал для продолжения работы:', {
            parse_mode: 'HTML',
            reply_markup: inlineKeyboar
        });
    }
});

bot.callbackQuery('sub1', async (ctx) => {
  try {
    await ctx.answerCallbackQuery({ text: "🔍 Проверяем подписку.", show_alert: false });

    const isSubscribed = await checkSubscription(ctx);
    if (!isSubscribed) {
      await ctx.reply('Вы ещё не подписаны на канал!', {
        parse_mode: 'HTML',
        reply_markup: subscribeKeyboard(),
      });
      return;
    }

    // Если подписан — проверяем контакт
    if (!ctx.session.userInfo.hasUsername && !ctx.session.userInfo.phoneNumber) {
      ctx.session.userInfo.waitingForPhone = true;
      await ctx.reply('❗ Для связи нам нужен ваш номер телефона.\nПожалуйста, нажмите кнопку ниже:', {
        reply_markup: new Keyboard().requestContact("📱 Отправить номер телефона").resized()
      });
      return;
    }

    // Всё ок — вперёд к главному меню
    await ctx.reply('✅ Спасибо за подписку ✅\n\n🤝 Можем приступать к работе 🤝', {
      reply_markup: mainKeyboard,
    });

  } catch (err) {
    console.error("Ошибка в обработчике sub1:", err);
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text: "⚠️ Произошла ошибка. Попробуйте позже.", show_alert: true });
    }
  }
});

//Блок 4. Логика работы бота
bot.hears('🗃 Каталог работ 🗃', async (ctx) => {
    await ctx.reply('Выберите курс 🧭', {
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
    })
})

bot.hears('💰 Морская Сокровищница 💰', async (ctx) => {
    await ctx.reply(seaTreasure, {
    disable_web_page_preview: true,
    parse_mode: `HTML`,
    reply_markup: inlineKeyboard1,
    })
})

bot.hears('🥂 Предложить работу 🥂', async (ctx) => {
    const user = ctx.from;
    await ctx.reply(`Мы ценим твою инициативу, \n✨${user.first_name}✨\n
Для предложения работы или услуги напиши нашему <a href="${trackingManagerLink}">менеджеру</a> \n\nБудем очень рады и достойно ` +
`<a href="${loyaltyDocLink}">вознаградим Вас (см. п. 4)</a> ` + 
`за пополнение общей сокровищницы, а так же выполнение работ через наш сервис`, {
        parse_mode: `HTML`,
        reply_markup: urlKeyboard4,
    })
})

bot.hears('💵 Программа лояльности 💵', async (ctx) => {
    
    const user = ctx.from;
    const info = loyalty.getPriceForUser(user.id);
    
    let msg = `📊 Информация о вас:\n\n` + `👤 Пользователь: ${user.first_name}\n` + `💰 Общая сумма заказов: ${info.total}₽\n` + 
            `🏅 Ранг: ${info.rankName}\n` + `🔖 Скидка: ${info.discountPercent}%\n`;
    
    if (info.progressToNext) {
        msg += `\n➡️ До следующего ранга (${info.progressToNext.nextName}) осталось ${info.progressToNext.need}₽`;
    } else { msg += `\n👑 Вы достигли максимального ранга!`; }

    await ctx.reply(`<b>💵 Программа лояльности 💵\n⚓ "Посейдонов Фарватер" ⚓\n\n</b>` + msg +
                    `\n\nКак это работает:\n\n1. Ваши заказы = Ваш статус: Каждый рубль, потраченный на наши работы, приближает вас к титулам, достойным Посейдона! ` +
                    `Чем больше общая сумма ваших покупок, тем выше ваш ранг и скидка на все будущие заказы!\n\n2. Величественные Ранги Посейдона:\n` +
                    `\n🌊 Искатель Глубин (0+ ₽) Скидка: 0% 🌊\n` +
                    `\n🌀 Повелитель Течений (5000+ ₽) Скидка: 5% 🌀\n` +
                    `\n🧜 Тритон Премудрости (7000+ ₽) Скидка: 7%! 🧜\n` +
                    `\n👑 Посланник Посейдона (10000+ ₽) Скидка: 10%! 👑\n\nПодробные условия читайте <a href="${loyaltyDocLink}">тут</a> 📜`, {
        disable_web_page_preview: true,
        parse_mode: `HTML`,
    })
})    

bot.callbackQuery('1-year', async (ctx) => {
    await ctx.callbackQuery.message.editText('1 курс ⭐\nВыберите предмет 🛒', {
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard1year,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('1-year1', async (ctx) => {
    await ctx.callbackQuery.message.editText(`💰Морская Сокровищница💰\n1 курс ⭐️
Все материалы расположены на Google Drive, для доступа необходимо перейти по ссылке 🔗`, {
        parse_mode: 'HTML',
        reply_markup: urlKeyboard1year,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('2-year', async (ctx) => {
    await ctx.callbackQuery.message.editText('2 курс ⭐⭐\nВыберите предмет 🛒', {
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard2,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('2-year1', async (ctx) => {
    await ctx.callbackQuery.message.editText(`💰Морская Сокровищница💰\n2 курс ⭐️⭐️
Все материалы расположены на Google Drive, для доступа необходимо перейти по ссылке 🔗`, {
        parse_mode: 'HTML',
        reply_markup: urlKeyboard,
    })
    await ctx.answerCallbackQuery()
})


bot.callbackQuery('3-year', async (ctx) => {
    await ctx.callbackQuery.message.editText('3 курс ⭐⭐⭐\nВыберите предмет 🛒', {
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard6,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('3-year1', async (ctx) => {
    await ctx.callbackQuery.message.editText(`💰Морская Сокровищница💰\n3 курс ⭐️⭐️⭐️
Все материалы расположены на Google Drive, для доступа необходимо перейти по ссылке 🔗`, {
        parse_mode: 'HTML',
        reply_markup: urlKeyboard1,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('4-year1', async (ctx) => {
    await ctx.callbackQuery.message.editText(`💰Морская Сокровищница💰\n4 курс ⭐️⭐️⭐️⭐️
Все материалы расположены на Google Drive, для доступа необходимо перейти по ссылке 🔗`, {
        parse_mode: 'HTML',
        reply_markup: urlKeyboard4year,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('prac', async (ctx) => {
    await ctx.callbackQuery.message.editText(`💰Морская Сокровищница💰\nПрактика 🚢
Для доступа к материалу необходимо перейти по ссылке 🔗`, {
        parse_mode: 'HTML',
        reply_markup: urlKeyboard2,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('usl', async (ctx) => {
    const user = ctx.from;
    await ctx.callbackQuery.message.editText(`Мы ценим твою инициативу, \n✨${user.first_name}✨\n
Для предложения работы или услуги напиши нашему <a href="${trackingManagerLink}">менеджеру</a> \n\nБудем очень рады и достойно ` +
`<a href="${loyaltyDocLink}">вознаградим Вас (см. п. 4)</a> ` + 
`за пополнение общей сокровищницы, а так же выполнение работ через наш сервис`, {
        parse_mode: `HTML`,
        reply_markup: urlKeyboard3,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('math1', async (ctx) => {
    await ctx.callbackQuery.message.editText(`1 курс ⭐\nВышмат 📐\n
Отправьте интересующее Вас задание или работу в чат с менеджером нашего математического отдела 🧮\n
Он соориентирует Вас по срокам выполнения работы и её стоимости 🤝`, {
        parse_mode: 'HTML',
        reply_markup: writeMathManager1,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('injgraf', async (ctx) => {
    await ctx.callbackQuery.message.editText(`2 курс ⭐⭐\nИнженерная графика 🗜️${cherchenieMESS}${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboarInjgraf,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nachert', async (ctx) => {
    await ctx.callbackQuery.message.editText(`2 курс ⭐⭐\nНачерталка 📒${cherchenieMESS}${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardNachert,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('math2', async (ctx) => {
    await ctx.callbackQuery.message.editText(`2 курс ⭐⭐\nВышмат 📐\n
Отправьте интересующее Вас задание или работу в чат с менеджером нашего математического отдела 🧮\n\n
Он соориентирует Вас по срокам выполнения работы и её стоимости 🤝`, {
        parse_mode: 'HTML',
        reply_markup: writeMathManager2,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('engine', async (ctx) => {
    await ctx.callbackQuery.message.editText(`2 курс ⭐⭐\nМеханика ⚙${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard3,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nach1_9', async (ctx) => {
    const { line } = formatPriceInfo(ctx, nach1_9);
    await ctx.callbackQuery.message.editText(`1-9 задача (каждая отдельно)📎\n\n${line}\n
После оплаты отправьте менеджеру фотографию задания 📸\n\nРаботы по номерам:
1. Выполнить проекцию точки на всех плоскостях по двум проекциям.\n2. Выполнить проекцию точки на всех плоскостях по координатам. 
3. Выполнить проекцию фигуры на плоскости.\n4. Найти пересечение фигур. \n5. Найти пересечение прямой с плоскостью. 
6. Найти фигуру пересечения плоскости с обьемной фигурой.\n7. Найти фигуру пересечения плоскости с обьемной фигурой. 
8. Найти точки пересечения прямой с фигурой.\n9. Выполнить вырез в фигуре на всех плоскостях.\n\n Примеры работ доступны по ` + 
`<a href="https://drive.google.com/drive/folders/1CSjpSp2XiJqxycJXp3o00CR1hqjqeRiM?usp=drive_link">ссылке</a>`, {
        disable_web_page_preview: true,
        reply_markup: inlineKeyboardNachertorder1_9,
        parse_mode: 'HTML'
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nach10_12', async (ctx) => {
    const { line } = formatPriceInfo(ctx, nach10_12);
    await ctx.callbackQuery.message.editText(`10-12 задача (каждая отдельно)📎\n\n${line}\n\nДля заказа напишите номер интересующей задачи:
1. Построить линию пересечения поверхностей геометрических тел\n2. Определить расстояние от точки А до прямой l
3. Определить расстояние от точки A до плоскости ɑ`, {
        disable_web_page_preview: true,
        reply_markup: inlineKeyboardNachertorder10_12,
        parse_mode: 'HTML'
    })
    await ctx.answerCallbackQuery()
})



bot.callbackQuery('beam', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costBalka);
    await ctx.callbackQuery.message.editText(`Расчёт Балки 🧮\n\n${line}\n
Работа выполняется полностью в электронном виде, Вам нужно будет только распечатать её и сдать\n\nДля расчёта необходимы следующие данные:
1. Ваш номер по журналу (у преподавателя могут быть свои списки, поэтому лучше уточнить)\n2. Ваш номер учебной группы
3. Ваша фамилия и инициалы`, {
        disable_web_page_preview: true,
        reply_markup: inlineKeyboard4,
        parse_mode: 'HTML'
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('shaft', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costVal);
    await ctx.callbackQuery.message.editText(`Расчёт Вала 📏\n\n${line}\n
Работа выполняется полностью в электронном виде, Вам нужно будет только распечатать её и сдать. Срок выполнения: 1 день. \n
Для расчёта необходимы следующие данные:\n1. Ваш номер по журналу (у преподавателя могут быть свои списки, поэтому лучше уточнить)
2. Ваш номер учебной группы\n3. Ваша фамилия и инициалы`, {
        disable_web_page_preview: true,
        reply_markup: inlineKeyboard5,
        parse_mode: 'HTML'
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('mos', async (ctx) => {
    await ctx.callbackQuery.message.editText('3 курс ⭐⭐⭐\nМОС 🧮\nДалее выберете ваш поток обучения:', {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard10,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('tss', async (ctx) => {
    await ctx.callbackQuery.message.editText(`3 курс ⭐⭐⭐\nТСС 📺${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard34,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('gmos', async (ctx) => {
    await ctx.callbackQuery.message.editText(`3 курс ⭐⭐⭐\nГМОС 🌦️ доступны для заказа все лабы у Гордиенко, а также большая лабораторка у Бояринова\n 
Для уточнения цен пишите <a href="${trackingManagerLink}">менеджеру</a> ✍`, {
        parse_mode: `HTML`,
        reply_markup: inlineKeyboard11,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nil', async (ctx) => {
    await ctx.callbackQuery.message.editText('3 курс ⭐⭐⭐\nНиЛ 🧭\nДалее выберете ваш поток обучения:', {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard12,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('bvvp', async (ctx) => {
    await ctx.callbackQuery.message.editText(`3 курс ⭐⭐⭐\nБезопасность судоходства на ВВП 🛟${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard13,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('mss', async (ctx) => {
    await ctx.callbackQuery.message.editText(`3 курс ⭐⭐⭐\nМСС 📏${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard7,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('tus', async (ctx) => {
    await ctx.callbackQuery.message.editText(`3 курс ⭐⭐⭐\nТУС 🚢${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard9,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('lvvp', async (ctx) => {
    await ctx.callbackQuery.message.editText(`3 курс ⭐⭐⭐\nОбщая лоция ВВП 🌉${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard8,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pz1', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMSS_PZ1);
    await ctx.callbackQuery.message.editText(`ПЗ №1 🗒️\n\n${line}\n\nРабота выполняется в электронном виде.` + 
` Для выполнения работы нам необходим Ваш номер варианта - это последняя цифра номера по списку группы.\n\nСрок выполнения - 1 день`, {
        disable_web_page_preview: true,
        reply_markup: inlineKeyboard14,
        parse_mode: 'HTML'
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pz2', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMSS_PZ2);
    await ctx.callbackQuery.message.editText(`ПЗ №2 📓\n\n${line}\n\nНомер варианта это последняя цифра номера по списку. ` + 
`Для выполнения работы нам необходим Ваш номер по списку учебной группы.\n\nСрок выполнения - 1 день`, {
        disable_web_page_preview: true,
        reply_markup: inlineKeyboard15,
        parse_mode: 'HTML'
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pz3', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMSS_PZ3);
    await ctx.callbackQuery.message.editText(`ПЗ №3 📒\n\n${line}\n\nНомер варианта это последняя цифра номера по списку\n
Срок выполнения - 1 день`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard16,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pz4', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMSS_PZ4);
    await ctx.callbackQuery.message.editText(`ПЗ №4 📔\n\n${line}\n\nНомер варианта это последняя цифра номера по списку\n
Срок выполнения - 1-2 дня`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard17,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('test', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMSS_test);
    await ctx.callbackQuery.message.editText(`Итоговый тест по МСС 🖥️\n\n${line}\n
Для получения доступа к тестам Вам необходимо отправить свою почту боту`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard19,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('test1', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costTSS_Test);
    await ctx.callbackQuery.message.editText(`11 тестов на фарватере🖥️\n\n${line}\n
Срок выполнения: 1 -2 дня.\nДля выполнения работы Вам нужно отправить логин и пароль от фарватера`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard35,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('kurs', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costTUS_kurs);
    await ctx.callbackQuery.message.editText(`Курсовая работа 🎯\n\n${line}\n
Работа выполняется полностью в электронном виде со всеми графиками и титульным листом. 
Вам будет нужно только распечатать её и сдать.\n\nСрок выполнения: 1 день.\n\nДля выполнения работы необходимы следующие данные:
1. Ваш номер по журналу\n2. Ваш номер учебной группы\n3. Ваша фамилия и инициалы`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard20,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('sea', async (ctx) => {
    await ctx.callbackQuery.message.editText(`3 курс ⭐⭐⭐\nМОС 🧮\nПоток: Море 🌊${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: mossea,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('river', async (ctx) => {
    await ctx.callbackQuery.message.editText(`3 курс ⭐⭐⭐\nМОС 🧮\nПоток: Река-море 🌉🌊${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: mosriver,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nav', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMOS_river_PZ4);
    await ctx.callbackQuery.message.editText(`3 курс ⭐⭐⭐\nМОС 🧮\nПоток: Река-море 🌉🌊
Задание: ПЗ №4. Оценка нав параметров\n\n${line}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard26,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('trg', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMOS_river_PZ2);
    await ctx.callbackQuery.message.editText(`3 курс ⭐⭐⭐\nМОС 🧮\nПоток: Река-море 🌉🌊
Задание: ПЗ №2. Сферические треугольники\n\n${line}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard25,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('kurs2', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMOS_Kurs);
    await ctx.callbackQuery.message.editText(`Курсовая работа 🚢\n\n${line}\n\nРабота выполняется в электронном виде 💡
Для её сдачи Вам будет необходимо переписать расчётную часть работы от руки. Графики предоставляются в электронном виде. 
В подарок предоставляется гайд как правильно чертить графики в курсовой, а так же вся неоюъодимая теория к курсовой.\n
Для выполнения курсовой необходим Ваш вариант по журналу преподавателя, эти варианты могут не совпадать с номером по журналу группы 📜`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard23,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('high', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costBS_high);
    await ctx.callbackQuery.message.editText(`Определение высоты подмостового габарита🌉\n\n${line}\n
Работа выполняется в электронном виде с графиком, рисунком моста и титульным листом 💡 
График мы предоставляем в электронном виде для печати, титульный лист так же печатается 🖨️ 
Всю остальную работу, вместе с рисунком моста, Вам необходимо будет переписать от руки на листах А4 и скрепить все листы степлером 📎 
Страницы для печати 1 и 4.\nСрок выполнения: 1 день.\n\nДля выполнения работы необходимы следующие данные:\n1. Ваш номер по журналу
2. Ваш номер учебной группы\n3. Ваша фамилия и инициалы\n4. День и месяц вашего рождения`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard28,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('rlns', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costOLVVP_Stvor);
    await ctx.callbackQuery.message.editText(`ПЗ "Расчёт линейного навигационного створа" 🛥️\n\n${line}\n
Номер варианта - последние две цифры номера в вашем студенческом/курсантском/зачётной книжке`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard29,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('sea1', async (ctx) => {
    await ctx.callbackQuery.message.editText(`3 курс ⭐⭐⭐\nНиЛ 🧭\nПоток: Море 🌊${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: nilkeyboard,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('river1', async (ctx) => {
    await ctx.callbackQuery.message.editText(`3 курс ⭐⭐⭐\nНиЛ 🧭\nПоток: Река-море 🌉🌊${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: nilkeyboard1,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('rgr', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costNIL_sea_RGR);
    await ctx.callbackQuery.message.editText(`РГР вертикальный угол (4 задачи)\n\n${line}\n
Работа выполняется полностью в электронном виде со всеми графиками и титульным листом 💡 Вам будет нужно только распечатать её и сдать 🖨️
Срок выполнения: 1 день.\n\nДля выполнения работы необходимы следующие данные:\n1. Ваш номер по журналу\n2. Ваш номер учебной группы
3. Ваша фамилия и инициалы`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard31,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('rgr1', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costNIL_river_RGR);
    await ctx.callbackQuery.message.editText(`РГР 9 задач по 6 сборникам 📚\n\n${line}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard32,
    })
    await ctx.answerCallbackQuery()
})


//Блок 6. Обработка разных типов заказов
bot.callbackQuery('ordernach1_9', async (ctx) => {
    
})

bot.callbackQuery('order1', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costVal);
    ctx.session.order.waitingForData = true;
    await ctx.reply(`Расчёт Вала 📏\n\n${line}\n\nНапишите в сообщении боту следующие данные для выполнения работы:
1. Ваш номер по журналу (у преподавателя могут быть свои списки, поэтому лучше уточнить)\n2. Ваш номер учебной группы
3. Ваша фамилия и инициалы`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();
})

bot.callbackQuery('order', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costBalka);
    ctx.session.order1.waitingForData1 = true;
    await ctx.reply(`Расчёт Балки 🧮\n\n${line}\n\nНапишите в сообщении боту следующие данные для выполнения работы:
1. Ваш номер по журналу (у преподавателя могут быть свои списки, поэтому лучше уточнить)\n2. Ваш номер учебной группы
3. Ваша фамилия и инициалы`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('order2', async (ctx) => {
    ctx.session.order2.waitingForData2 = true;
    ctx.session.order2.step2 = 1;
    await ctx.reply(`3 курс ⭐⭐⭐\nГМОС 🌦️\n Доступны для заказа все лабы у Гордиенко и большая лабораторка у Бояринова\n
Теперь напишите ограничения по срокам исполнения заказа и комментарии к заказу`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();
})

bot.callbackQuery('order3', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMSS_PZ1);
    ctx.session.order3.waitingForData3 = true;
    await ctx.reply(`3 курс ⭐⭐⭐\nМСС 📏\nПЗ №1 🗒️\n\n${line}\n\nДля заказа работы введите номер своего варианта`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();
})

bot.callbackQuery('order4', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMSS_PZ2);
    ctx.session.order4.waitingForData4 = true;
    await ctx.reply(`3 курс ⭐⭐⭐\nМСС 📏\nПЗ №2 📓\n\n${line}\n\nДля заказа работы введите номер своего варианта`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();
})

bot.callbackQuery('order5', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMSS_PZ3);
    ctx.session.order5.waitingForData5 = true;
    await ctx.reply(`3 курс ⭐⭐⭐\nМСС 📏\nПЗ №3 📒\n\n${line}\n\nДля заказа работы введите номер своего варианта`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();
})

bot.callbackQuery('order6', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMSS_PZ4);
    ctx.session.order6.waitingForData6 = true;
    await ctx.reply(`3 курс ⭐⭐⭐\nМСС 📏\nПЗ №4 📔\n\n${line}\n\nДля заказа работы введите номер своего варианта`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();
})

bot.callbackQuery('order8', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMSS_test);
    ctx.session.order8.waitingForData8 = true;
    ctx.session.order8.step8 = 1;
    await ctx.reply(`3 курс ⭐⭐⭐\nМСС 📏\nтоговый тест по МСС 🖥️\n\n${line}\n
Для получения доступа к тестам Вам необходимо отправить свою почту боту`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();
})

bot.callbackQuery('order9', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costTUS_kurs);
    ctx.session.order9.waitingForData9 = true;
    await ctx.reply(`Предмет - ТУС 🚢\nКурсовая работа 🎯\n\n${line}\n
Напишите в сообщении боту следующие данные для выполнения работы:\n1. Ваш номер по журналу\n2. Номер учебной группы
3. Ваша фамилия и инициалы (для оформления титульного листа)`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order12', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMOS_Kurs);
    ctx.session.order12.waitingForData12 = true;
    await ctx.reply(`Предмет - МОС 🧮\nЗадание: Курсовая работа 🚢\n\n${line}\n
Для заказа работы введите номер своего варианта по журналу преподавателя, эти варианты могут не совпадать с номером по журналу группы.`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order14', async (ctx) => {
    ctx.session.order14.waitingForData14 = true;
    const { line } = formatPriceInfo(ctx, costMSS_PZ2);
    await ctx.reply(`Предмет - МОС 🧮\nПоток: Река-море 🌉🌊\nПЗ №2. Сферические треугольники\n\n${line}\n
Для заказа работы введите номер своего варианта`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order15', async (ctx) => {
    ctx.session.order15.waitingForData15 = true;
    const { line } = formatPriceInfo(ctx, costMSS_PZ4);
    await ctx.reply(`Предмет - МОС 🧮\nПоток: Река-море 🌉🌊\nПЗ №4. Оценка нав параметров\n\n${line}\n
Для заказа работы введите номер своего варианта`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order17', async (ctx) => {
    ctx.session.order17.waitingForData17 = true;
    const { line } = formatPriceInfo(ctx, costBS_high);
    await ctx.reply(`Предмет - Безопасность судоходства на ВВП🛟\nОпределение высоты подмостового габарита🌉\n\n${line}\n
Напишите в сообщении боту следующие данные для выполнения работы:\n1. Ваш номер по журналу\n2. Номер учебной группы
3. Ваша фамилия и инициалы\n4. Ваш день и месяц рождения`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();    
})


bot.callbackQuery('order18', async (ctx) => {
    ctx.session.order18.waitingForData18 = true;
    const { line } = formatPriceInfo(ctx, costOLVVP_Stvor);
    await ctx.reply(`Предмет - Общая лоции ВВП 🌉\nПЗ "Расчёт линейного навигационного створа"\n\n${line}\n
Для заказа работы введите номер своего варианта`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order20', async (ctx) => {
    ctx.session.order20.waitingForData20 = true;
    const { line } = formatPriceInfo(ctx, costNIL_sea_RGR);
    await ctx.reply(`Предмет - НиЛ 🧭 \nПоток: Море 🌊\nЗадание: РГР вертикальный угол (4 задачи)\n\n${line}\n
Напишите в сообщении боту следующие данные для выполнения работы:\n1. Ваш номер по журналу\n2. Номер учебной группы
3. Ваша фамилия и инициалы (для оформления титульного листа)`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order21', async (ctx) => {
    ctx.session.order21.waitingForData21 = true;
    await ctx.reply(`Предмет - НиЛ 🧭 \nПоток:  Река-море 🌉🌊\nЗадание: РГР 9 задач по 6 сборникам 📚
Стоимость: ${costNIL_river_RGR}₽\nДля заказа работы введите номер своего варианта`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();    
})

bot.callbackQuery('order23', async (ctx) => {
    ctx.session.order23.waitingForData23 = true;
    const { line } = formatPriceInfo(ctx, costTSS_Test);
    await ctx.reply(`Предмет - ТСС 📺\n11 тестов на фарватере🖥️\n\n${line}\n
Напишите в сообщении боту Ваш логин и пароль от фарватера`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();
})

bot.on("message:text", async (ctx) => {
    // Проверяем, ожидаем ли мы номер телефона
    if (ctx.session.userInfo.waitingForPhone) {
        await ctx.reply('Пожалуйста, отправьте ваш номер телефона, используя кнопку ниже:', {
            reply_markup: new Keyboard()
                .requestContact("Отправить номер телефона")
                .resized()
        });
        return;
    }

    if (ctx.session.order?.waitingForData) {
    userLastMessages.set(ctx.from.id, ctx.message);
    const { line } = formatPriceInfo(ctx, costVal);
    await ctx.reply(`Ваш заказ:\n\n2 курс ⭐️⭐️\nПредмет - Механика ⚙\nРабота - Расчёт Вала 📏\n\n${line}\n
Данные:\n${ctx.message.text}\n\nДля оплаты заказа переведите указанную сумму на номер карты: ${myCardNumber}${payconfmes}`,{
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
        const { line } = formatPriceInfo(ctx, costBalka);
    await ctx.reply(`Ваш заказ:\n\n2 курс ⭐️⭐️\nПредмет - Механика ⚙\nРабота - Расчёт Балки 🧮\n\n${line}\n
Данные:\n${ctx.message.text}\n\nДля оплаты заказа переведите указанную сумму на номер карты: ${myCardNumber}${payconfmes}`,{
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

            const msg = `Новый заказ!${buildUserReference(ctx)}3 курс\nПредмет - ГМОС 🌦️\n\nСроки и комментарии:\n${ctx.session.order2.com2}`;
            await ctx.api.sendMessage(TARGET_CHAT_ID, msg);

            await ctx.reply(`Заказ принят!\n\nДетали заказа:\n3 курс ⭐️⭐️⭐️\nПредмет - ГМОС 🌦️\n
Сроки и комментарии: ${ctx.session.order2.com2}\nДля оплаты заказа и уточнения деталей напишите менеджеру✍: <a href="${trackingManagerLink}">ссылка</a>`,{
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

    if (ctx.session.order3?.waitingForData3) {
        const { line } = formatPriceInfo(ctx, costMSS_PZ1);
        ctx.session.order3.var3 = ctx.message.text.trim();
        userLastMessages.set(ctx.from.id, ctx.message);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nРабота - ПЗ №1\n\n${line}\n\nВариант: ${ctx.session.order3.var3}\n
Для оплаты заказа переведите указанную сумму на номер карты: ${myCardNumber}${payconfmes}`, { parse_mode: 'HTML', reply_markup: WriteManager3 });
        ctx.session.order3.waitingForData3 = false;
        ctx.session.order3.pay3 = true;
    return;
    }

    if (ctx.session.order4?.waitingForData4) {
        const { line } = formatPriceInfo(ctx, costMSS_PZ2);
        ctx.session.order4.var4 = ctx.message.text.trim();
        userLastMessages.set(ctx.from.id, ctx.message);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nРабота - ПЗ №2\n\n${line}\n\nВариант: ${ctx.session.order4.var4}\n
Для оплаты заказа переведите указанную сумму на номер карты: ${myCardNumber}${payconfmes}`, { parse_mode: 'HTML', reply_markup: WriteManager4 });
        ctx.session.order4.waitingForData4 = false;
        ctx.session.order4.pay4 = true;
    return;
    }


    if (ctx.session.order5?.waitingForData5) {
        const { line } = formatPriceInfo(ctx, costMSS_PZ3);
        ctx.session.order5.var5 = ctx.message.text.trim();
        userLastMessages.set(ctx.from.id, ctx.message);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nРабота - ПЗ №3\n\n${line}\n\nВариант: ${ctx.session.order5.var5}\n
Для оплаты заказа переведите указанную сумму на номер карты: ${myCardNumber}${payconfmes}`, { parse_mode: 'HTML', reply_markup: WriteManager5 });
        ctx.session.order5.waitingForData5 = false;
        ctx.session.order5.pay5 = true;
    return;
    }

    if (ctx.session.order6?.waitingForData6) {
        const { line } = formatPriceInfo(ctx, costMSS_PZ4);
        ctx.session.order6.var6 = ctx.message.text.trim();
        userLastMessages.set(ctx.from.id, ctx.message);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МСС 📏\nРабота - ПЗ №4\n\n${line}\n\nВариант: ${ctx.session.order6.var6}\n
Для оплаты заказа переведите указанную сумму на номер карты: ${myCardNumber}${payconfmes}`, { parse_mode: 'HTML', reply_markup: WriteManager6 });
        ctx.session.order6.waitingForData6 = false;
        ctx.session.order6.pay6 = true;
    return;
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
    const { line } = formatPriceInfo(ctx, costTUS_kurs);
    await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - ТУС 🚢\nКурсовая работа 🎯\n\n${line}\n\nДанные для расчёта:
${ctx.message.text}\n\nДля оплаты заказа переведите указанную сумму на номер карты: ${myCardNumber}${payconfmes}`,{
        parse_mode: `HTML`,
        reply_markup: writeManager4
    })
    ctx.session.order9.waitingForData9 = false;
    ctx.session.order9.pay9 = true;
    return;
    }

    if (ctx.session.order12?.waitingForData12) {
        userLastMessages.set(ctx.from.id, ctx.message);
        const { line } = formatPriceInfo(ctx, costMOS_Kurs);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nЗадание: Курсовая работа 🚢\n\n${line}
\nДанные для расчёта:\n${ctx.message.text}\n\nДля оплаты заказа переведите указанную сумму на номер карты: ${myCardNumber}${payconfmes}`,{
            parse_mode: `HTML`,
            reply_markup: writeManager5
        })
        ctx.session.order12.waitingForData12 = false;
        ctx.session.order12.pay12 = true;
        return;
    }

    if (ctx.session.order14?.waitingForData14) {
        const { line } = formatPriceInfo(ctx, costMOS_river_PZ2);
        userLastMessages.set(ctx.from.id, ctx.message);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nПоток: Река-море 🌉🌊\nЗадание: ПЗ №2. Сферические треугольники\n
${line}\n\nВаш вариант:\n${ctx.message.text}\n\nДля оплаты заказа переведите указанную сумму на номер карты: ${myCardNumber}${payconfmes}`,{
            parse_mode: `HTML`,
            reply_markup: writeManager7
        })
        ctx.session.order14.waitingForData14 = false;
        ctx.session.order14.pay14 = true;
        return;
    }

    if (ctx.session.order15?.waitingForData15) {
        const { line } = formatPriceInfo(ctx, costMOS_river_PZ4);
        userLastMessages.set(ctx.from.id, ctx.message);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - МОС 🧮\nПоток: Река-море 🌉🌊
Задание: ПЗ №4. Оценка навигационных параметров.\n\n${line}\n
Ваш вариант:\n${ctx.message.text}\nДля оплаты заказа переведите указанную сумму на номер карты: ${myCardNumber}${payconfmes}`,{
            parse_mode: `HTML`,
            reply_markup: writeManager8
        })
        ctx.session.order15.waitingForData15 = false;
        ctx.session.order15.pay15 = true;
        return;
    }

    if (ctx.session.order17?.waitingForData17) {
        const { line } = formatPriceInfo(ctx, costBS_high);
        userLastMessages.set(ctx.from.id, ctx.message);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - Безопасность судоходства на ВВП🛟
Определение высоты подмостового габарита🌉\n\n${line}\nДанные для расчёта:\n${ctx.message.text}\n
Для оплаты заказа переведите указанную сумму на номер карты: ${myCardNumber}${payconfmes}`,{
            parse_mode: `HTML`,
            reply_markup: writeManager9
        })
        ctx.session.order17.waitingForData17 = false;
        ctx.session.order17.pay17 = true;
        return;
    }

    if (ctx.session.order18?.waitingForData18) {
        const { line } = formatPriceInfo(ctx, costOLVVP_Stvor);
        userLastMessages.set(ctx.from.id, ctx.message);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - Общая лоции ВВП 🌉\nПЗ "Расчёт линейного навигационного створа"
\n${line}\n\nВаш вариант:\n${ctx.message.text}\n
Для оплаты заказа переведите указанную сумму на номер карты: ${myCardNumber}${payconfmes}`,{
            parse_mode: `HTML`,
            reply_markup: writeManager10
        })
        ctx.session.order18.waitingForData18 = false;
        ctx.session.order18.pay18 = true;
        return;
    }

    if (ctx.session.order20?.waitingForData20) {
    const { line } = formatPriceInfo(ctx, costNIL_sea_RGR);
    userLastMessages.set(ctx.from.id, ctx.message);
    await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - НиЛ 🧭 \nПоток: Море 🌊\nЗадание: РГР вертикальный угол (4 задачи)
\n${line}\n\nДанные для расчёта:\n${ctx.message.text}\n
Для оплаты заказа переведите указанную сумму на номер карты: ${myCardNumber}${payconfmes}`,{
        parse_mode: `HTML`,
        reply_markup: writeManager11
    })
    ctx.session.order20.waitingForData20 = false;
    ctx.session.order20.pay20 = true;
    return;
    }

    if (ctx.session.order21?.waitingForData21) {
        const { line } = formatPriceInfo(ctx, costNIL_river_RGR);
        userLastMessages.set(ctx.from.id, ctx.message);
        await ctx.reply(`Ваш заказ:\n\n3 курс ⭐️⭐️⭐️\nПредмет - НиЛ 🧭 \nПоток:  Река-море 🌉🌊\nЗадание: РГР 9 задач по 6 сборникам 📚
\n${line}\n\nВаш вариант:\n${ctx.message.text}\n
Для оплаты заказа переведите ${costNIL_river_RGR} на номер карты: ${myCardNumber}${payconfmes}`,{
            parse_mode: `HTML`,
            reply_markup: writeManager12
        })
        ctx.session.order21.waitingForData21 = false;
        ctx.session.order21.pay21 = true;
        return;
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


//Блок n пересылка сообщений в группы
bot.callbackQuery('pay', async (ctx) => {
    if (ctx.session.order.dataReceived) {
    const lastMessage = userLastMessages.get(ctx.from.id);

    if (!lastMessage) {
        await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
        return;
    }
    const originaltext = lastMessage.text;
    const msg = `Новый заказ!${buildUserReference(ctx)}\n\n2 курс\nПредмет - Механика ⚙
Работа - Расчёт Вала 📏${getPriceForWork(ctx, costVal)}Данные:\n${originaltext}`;
    await ctx.api.sendMessage(TARGET_CHAT_ID, msg);
    await ctx.reply(afterConfReply);
    ctx.session.order.dataReceived = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay1', async (ctx) => {
    if (ctx.session.order1.dataReceived1) {
    const lastMessage = userLastMessages.get(ctx.from.id);

    if (!lastMessage) {
        await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
        return;
    }
    const originaltext = lastMessage.text;
    const msg = `Новый заказ!${buildUserReference(ctx)}\n\n2 курс\nПредмет - Механика ⚙\nРабота - Расчёт Балки 🧮${getPriceForWork(ctx, costBalka)}Данные:\n${originaltext}`;
    await ctx.api.sendMessage(TARGET_CHAT_ID, msg);
    await ctx.reply(afterConfReply)
    ctx.session.order1.dataReceived1 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('Pay3', async (ctx) => {
    if (ctx.session.order3.pay3) {
        const msg = `Новый заказ!${buildUserReference(ctx)}\n\n3 курс\nПредмет - МСС 📏\nРабота - ПЗ №1${getPriceForWork(ctx, costMSS_PZ1)}Вариант: ${ctx.session.order3.var3}`;
        await ctx.api.sendMessage(TARGET_CHAT_ID, msg);
        await ctx.reply(afterConfReply);
        ctx.session.order3.pay3 = false;
        ctx.session.order3.var3 = null;
    }
    await ctx.answerCallbackQuery();
});

bot.callbackQuery('Pay4', async (ctx) => {
    if (ctx.session.order4.pay4) {
        const msg = `Новый заказ!${buildUserReference(ctx)}\n\n3 курс\nПредмет - МСС 📏\nРабота - ПЗ №2${getPriceForWork(ctx, costMSS_PZ2)}Вариант: ${ctx.session.order4.var4}`;
        await ctx.api.sendMessage(TARGET_CHAT_ID, msg);
        await ctx.reply(afterConfReply);
        ctx.session.order4.pay4 = false;
        ctx.session.order4.var4 = null;
    }
    await ctx.answerCallbackQuery();
});

bot.callbackQuery('Pay5', async (ctx) => {
    if (ctx.session.order5.pay5) {
        const msg = `Новый заказ!${buildUserReference(ctx)}\n\n3 курс\nПредмет - МСС 📏\nРабота - ПЗ №3${getPriceForWork(ctx, costMSS_PZ3)}Вариант: ${ctx.session.order5.var5}`;
        await ctx.api.sendMessage(TARGET_CHAT_ID, msg);
        await ctx.reply(afterConfReply);
        ctx.session.order5.pay5 = false;
        ctx.session.order5.var5 = null;
    } 
    await ctx.answerCallbackQuery();
});

bot.callbackQuery('Pay6', async (ctx) => {
    if (ctx.session.order6.pay6) {
        const msg = `Новый заказ!${buildUserReference(ctx)}\n\n3 курс\nПредмет - МСС 📏\nРабота - ПЗ №4${getPriceForWork(ctx, costMSS_PZ4)}Вариант: ${ctx.session.order6.var6}`;
        await ctx.api.sendMessage(TARGET_CHAT_ID, msg);
        await ctx.reply(afterConfReply);
        ctx.session.order6.pay6 = false;
        ctx.session.order6.var6 = null;
    }
    await ctx.answerCallbackQuery();
});

bot.callbackQuery('ok', async (ctx) => {
    if (ctx.session.order8.step8 === 2) {
        const { line } = formatPriceInfo(ctx, costMSS_test);
        await ctx.reply(`Предмет - МСС 📏\nИтоговый тест по МСС 🖥️\n\n${line}\nВаша почта: ${ctx.session.order8.email8}
Для оплаты заказа и получения доступа переведите указанную сумму на номер карты: ${myCardNumber}${payconfmes}`, {
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
        const { line } = formatPriceInfo(ctx, costTSS_Test);
        await ctx.reply(`Предмет - ТСС 📺\n11 тестов на фарватере🖥️\n\n${line}\n\nВаш логин и пароль:\n${ctx.session.order23.com23}
Для оплаты заказа и получения доступа переведите указанную сумму на номер карты:\n${myCardNumber}${payconfmes}`, {
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
        const msg = `Запрос доступа${buildUserReference(ctx)}\n\n3 курс\nПредмет - МСС 📏\nИтоговый тест по МСС 🖥️${getPriceForWork(ctx, costMSS_test)}
Почта: ${ctx.session.order8.email8}`;
        await ctx.api.sendMessage(TARGET_CHAT_ID, msg);
        await ctx.reply(afterConfReply);
        ctx.session.order8.dataReceived8 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay23', async (ctx) => {
    if (ctx.session.order23.dataReceived23) {
        const msg = `Новый заказ!${buildUserReference(ctx)}}\n\n3 курс\nПредмет - ТСС 📺\n11 тестов на фарватере🖥️${getPriceForWork(ctx, costTSS_Test)}
Логин и пароль:\n${ctx.session.order23.com23}`;
        await ctx.api.sendMessage(TARGET_CHAT_ID, msg);
        await ctx.reply(afterConfReply);
        ctx.session.order23.dataReceived23 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay4', async (ctx) => {
    if (ctx.session.order9.pay9) {
        const lastMessage = userLastMessages.get(ctx.from.id);
        const originaltext = lastMessage.text;
        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }
        const msg = `Новый заказ!${buildUserReference(ctx)}\n\n3 курс\nПредмет - ТУС 🚢\nРабота - Курсовая 🎯${getPriceForWork(ctx, costTUS_kurs)}Данные:\n${originaltext}`;
        await ctx.api.sendMessage(TARGET_CHAT_ID, msg);
        await ctx.reply(afterConfReply)
        ctx.session.order9.pay9 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay5', async (ctx) => {
    if (ctx.session.order12.pay12) {
        const lastMessage = userLastMessages.get(ctx.from.id);
        const originaltext = lastMessage.text;
        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }
        const msg = `Новый заказ!${buildUserReference(ctx)}\n\n3 курс\nПредмет - МОС 🧮
Задание: Курсовая 🚢${getPriceForWork(ctx, costMOS_Kurs)}Данные:\n${originaltext}`;
        await ctx.api.sendMessage(TARGET_CHAT_ID, msg);
        await ctx.reply(afterConfReply)
        ctx.session.order12.pay12 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay7', async (ctx) => {
    if (ctx.session.order14.pay14) {
        const lastMessage = userLastMessages.get(ctx.from.id);
        const originaltext = lastMessage.text;
        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }
        const msg = `Новый заказ!${buildUserReference(ctx)}\n\n3 курс\nПредмет - МОС 🧮\nПоток: Море 🌊\nЗадание: ПЗ №2. Сферические треугольники
${getPriceForWork(ctx, costMOS_river_PZ2)}\nВариант:\n${originaltext}`;
        await ctx.api.sendMessage(TARGET_CHAT_ID, msg);
        await ctx.reply(afterConfReply)
        ctx.session.order14.pay14 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay8', async (ctx) => {
    if (ctx.session.order15.pay15) {
        const lastMessage = userLastMessages.get(ctx.from.id);
        const originaltext = lastMessage.text;
        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }
        const msg = `Новый заказ!${buildUserReference(ctx)}\n\n3 курс\nПредмет - МОС 🧮\nПоток: Море 🌊\nЗадание: ПЗ №4. Оценка нав параметров
${getPriceForWork(ctx, costMOS_river_PZ4)}Вариант:\n${originaltext}`;
        await ctx.api.sendMessage(TARGET_CHAT_ID, msg);
        await ctx.reply(afterConfReply)
        ctx.session.order15.pay15 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay9', async (ctx) => {
    if (ctx.session.order17.pay17) {
        const lastMessage = userLastMessages.get(ctx.from.id);
        const originaltext = lastMessage.text;
        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }
        const msg = `Новый заказ!${buildUserReference(ctx)}\n\n3 курс ⭐️⭐️⭐️\nПредмет - Безопасность судоходства на ВВП🛟\nОпределение высоты подмостового габарита🌉
${getPriceForWork(ctx, costBS_high)}Данные для расчёта:\n${originaltext}`;
        await ctx.api.sendMessage(TARGET_CHAT_ID, msg);
        await ctx.reply(afterConfReply)
        ctx.session.order17.pay17 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay10', async (ctx) => {
    if (ctx.session.order18.pay18) {
        const lastMessage = userLastMessages.get(ctx.from.id);
        const originaltext = lastMessage.text;
        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }
        const msg = `Новый заказ!${buildUserReference(ctx)}\n\n3 курс\nПредмет - Общая лоции ВВП 🌉\nПЗ "Расчёт линейного навигационного створа"
${getPriceForWork(ctx, costOLVVP_Stvor)}Вариант:\n${originaltext}`;
        await ctx.api.sendMessage(TARGET_CHAT_ID, msg);
        await ctx.reply(afterConfReply)
        ctx.session.order18.pay18 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay11', async (ctx) => {
    if (ctx.session.order20.pay20) {
        const lastMessage = userLastMessages.get(ctx.from.id);
        const originaltext = lastMessage.text;
        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }
        const msg = `Новый заказ!${buildUserReference(ctx)}\n\n3 курс\nПредмет - НиЛ 🧭 \nПоток: Море 🌊\nЗадание: РГР вертикальный угол (4 задачи)
${getPriceForWork(ctx, costNIL_sea_RGR)}Данные:\n${originaltext}`;
        await ctx.api.sendMessage(TARGET_CHAT_ID, msg);
        await ctx.reply(afterConfReply)
        ctx.session.order20.pay20 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pay12', async (ctx) => {
    if (ctx.session.order21.pay21) {
        const lastMessage = userLastMessages.get(ctx.from.id);
        const originaltext = lastMessage.text;
        if (!lastMessage) {
            await ctx.answerCallbackQuery("Не найдено предыдущее сообщение");
            return;
        }
        const msg = `Новый заказ!${buildUserReference(ctx)}\n\n3 курс ⭐️⭐️⭐️\nПредмет - НиЛ 🧭 \nПоток:  Река-море 🌉🌊\nЗадание: РГР 9 задач по 6 сборникам 📚
${getPriceForWork(ctx, costNIL_sea_RGR)}Вариант:\n${originaltext}`;
        await ctx.api.sendMessage(TARGET_CHAT_ID, msg);
        await ctx.reply(afterConfReply)
        ctx.session.order21.pay21 = false;
    }
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('backward', async (ctx) => {
    if (ctx.session.order8.step8 === 2) {
        ctx.session.order8.waitingForData8 = true;
        ctx.session.order8.step8 = 1;
        const { line } = formatPriceInfo(ctx, costMSS_test);
        await ctx.reply(`Итоговый тест по МСС 🖥️\n\n${line}\n
Для получения доступа к тестам Вам необходимо отправить свою почту боту`, { parse_mode: 'HTML' });
        await ctx.answerCallbackQuery();
        return;
    }
})

bot.callbackQuery('backward1', async (ctx) => {
    if (ctx.session.order23.step23) {
        ctx.session.order23.waitingForData23 = true;
        const { line } = formatPriceInfo(ctx, costTSS_Test);
        await ctx.reply(`11 тестов на фарватере🖥️\n\n${line}\n
Срок выполнения: 1 -2 дня.\nДля выполнения работы Вам нужно отправить логин и пароль от фарватера`, { parse_mode: 'HTML' });
        await ctx.answerCallbackQuery();
    }
})


//Кнопки назад
bot.callbackQuery('back', async (ctx) => {
    await go(ctx, 'Выберите курс 🧭', inlineKeyboard);
});

bot.callbackQuery('back1year', async (ctx) => {
    await go(ctx, '1 курс ⭐\nВыберите предмет 🛒', inlineKeyboard1year)
});

bot.callbackQuery('back1', async (ctx) => {
    await go(ctx, '2 курс ⭐⭐\nВыберите предмет 🛒', inlineKeyboard2);
});

bot.callbackQuery('back3', async (ctx) => {
    await go(ctx, '3 курс ⭐⭐⭐\nВыберите предмет 🛒', inlineKeyboard6);
});

bot.callbackQuery('back2', async (ctx) => {
    await go(ctx, `2 курс ⭐⭐\nМеханика ⚙${helpONSubject}`, inlineKeyboard3);
});

bot.callbackQuery('backnachert', async (ctx) => {
    await go(ctx, `2 курс ⭐⭐\nНачерталка 📒${cherchenieMESS}${helpONSubject}`, inlineKeyboardNachert);
});

bot.callbackQuery('back4', async (ctx) => {
    await go(ctx, '3 курс ⭐⭐⭐\nПо МСС 📏, Вы можете заказать следующие работы:', inlineKeyboard7);
});

bot.callbackQuery('back5', async (ctx) => {
    await go(ctx, '3 курс ⭐⭐⭐\nПо ТУС 🚢, Вы можете заказать следующие работы:', inlineKeyboard9);
});

bot.callbackQuery('back6', async (ctx) => {
    await go(ctx, '3 курс ⭐⭐⭐\nМОС 🧮\nДалее выберете ваш поток обучения:', inlineKeyboard10);
});

bot.callbackQuery('back7', async (ctx) => {
    await go(ctx, `3 курс ⭐⭐⭐\nМОС 🧮\nПоток: Море 🌊${helpONSubject}`, mossea);
});

bot.callbackQuery('back8', async (ctx) => {
    await go(ctx, `3 курс ⭐⭐⭐\nМОС 🧮\nПоток: Река-море 🌉🌊${helpONSubject}`, mosriver);
});

bot.callbackQuery('back9', async (ctx) => {
    await go(ctx, `3 курс ⭐⭐⭐\nБезопасность судоходства на ВВП🛟${helpONSubject}`, inlineKeyboard13);
});

bot.callbackQuery('back10', async (ctx) => {
    await go(ctx, `3 курс ⭐⭐⭐\nОбщая лоция ВВП 🌉${helpONSubject}`, inlineKeyboard8);
});

bot.callbackQuery('back11', async (ctx) => {
    await go(ctx, '3 курс ⭐⭐⭐\nНиЛ 🧭\nДалее выберете ваш поток обучения:', inlineKeyboard12);
});

bot.callbackQuery('back12', async (ctx) => {
    await go(ctx, `3 курс ⭐⭐⭐\nНиЛ 🧭\nПоток: Море 🌊${helpONSubject}`, nilkeyboard);
});

bot.callbackQuery('back13', async (ctx) => {
    await go(ctx, `3 курс ⭐⭐⭐\nНиЛ 🧭\nПоток: Река-море 🌉🌊${helpONSubject}`, nilkeyboard1);
});

bot.callbackQuery('back14', async (ctx) => {
    await go(ctx, seaTreasure, inlineKeyboard1);
});


//Обработка ошибок
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