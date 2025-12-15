require('dotenv').config();
const { Bot, session, GrammyError, HttpError, Keyboard, InlineKeyboard } = require('grammy');
const { error } = require('node:console');
const { hydrate } = require('@grammyjs/hydrate');
const { parse } = require('node:path');
const { is } = require('type-is');
const { get } = require('node:http');
const loyalty = require('./loyalty');

const bot = new Bot(process.env.BOT_TOKEN);
bot.use(hydrate());

const MY_CHAT_ID = -4913298319; // ID чата с моими заказами
const MATH_CHAT_ID = -4801211812; // ID чата по вышмату
const CHERCHENIE_CHAT_ID = -4970188906; // ID чата, куда будут отправляться уведомления о заказах по Инженерной графике и Начерталке
const OTHER_ORDERS_CHAT_ID = -1003079570200; // ID чата, для всех остальных заказов
const TARGET_GROUP = -1002162448649; //Наш тгк
const userLastMessages = new Map(); 
const CACH_TTL =  10 * 1000;
const subscriptionCache = new Map();
const myCardNumber = process.env.MY_CARD_NUMBER;
const ivanCardNumber = process.env.IVAN_CARD_NUMBER;
const myCellNumber = process.env.MY_CELL_NUMBER;
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
    
    orderFlow: { //Все остальные заказы
        active: false,
        workId: null,
        needQueue: [],
        data: {},
    },
    order8: { //МСС Тест
        waitingForData8: false,
        step8: 0,
        email8: null,
        com8: null,
        pay8: false,
    },
    })
}));


// Блок 1. Объявление констант для цен.
const commission = 20;
const nach1_9 = 520; // 375
const nach10_12 = 590; 
const nachall1_9 = 3890; // 3375
const nachall10_12 = 1680;
const nachANDinjgraf = 10190;
const inj146 = 1190;
const inj5 = 890;
const injALL = 6690;
const costVal = 1090;
const costBalka = 1090;
const costMSS_PZ1 = 490;
const costMSS_PZ2 = 990;
const costMSS_PZ3 = 490;
const costMSS_PZ4 = 1190;
const costMSS_test = 490;
const costGMOS_PZ1 = 490;
const costGMOS_PZ2 = 590;
const costGMOS_PZ3 = 490;
const costGMOS_PZ4 = 790;
const costGMOS_laba = 8990;
const costTUS_kurs = 2190;
const costMOS_Kurs = 1790;
const costMOS_river_PZ2 = 690;
const costMOS_river_PZ4 = 690;
const costBS_high = 890;
const costOLVVP_Stvor = 790;
const costNIL_sea_RGR = 790;
const costNIL_river_RGR = 2790;
const costNil_1tide = 1350;
const costNil_2tide = 390;
const costNil_3tide = 390;
const costNil_4tide = 450;
const costNil_5tide = 450;
const costNil_ALLtide = 2630;
const costMiUStasks = 2390;
const costMiUStasks_break = 1590;
const costTSS_Test = 3390;
const costTSS_Test_pract = 2290; //добавить
const costAstro_kr1 = 1190; //добавить
const costAstro_kr2 = 1690; //добавить
const costVVPRadio_kurs = 3470; //добавить


//Каталог работ
const WORKS = {

    //2 курс
    nach1_9: {
        title: '2 курс ⭐⭐\nНачертательная геометрия 📒\n1–9 задачи (каждая отдельно) 📎',
        price: nach1_9,
        back: 'backnachert',
        needs: ['photo'],
        prompt: '📸 Прикрепите фотографию(и) вашего задания (1–9) 📸'
    },
    nach10_12: {
        title: '2 курс ⭐⭐\nНачертательная геометрия 📒\n10–12 задачи (каждая отдельно) 🖼️',
        price: nach10_12,
        back: 'backnachert',
        needs: ['photo'],
        prompt: '📸 Прикрепите фотографию вашего задания (10–12) 📸'
    },
    nachall1_9: {
        title: '2 курс ⭐⭐\nНачертательная геометрия 📒\n1–9 задачи вместе 🪢',
        price: nachall1_9,
        back: 'backnachert',
        needs: ['photo'],
        prompt: '📸 Прикрепите фотографии всех заданий 1–9 📸'
    },
    nachall10_12: {
        title: '2 курс ⭐⭐\nНачертательная геометрия 📒\n10–12 задачи вместе 🧺',
        price: nachall10_12,
        back: 'backnachert',
        needs: ['photo'],
        prompt: '📸 Прикрепите фотографии всех заданий 10–12 📸'
    },
    inj146: {
        title: '2 курс ⭐⭐\nИнженерная графика 🗜️\n1–4 и 6 работа (каждая отдельно) 🕋',
        price: inj146,
        back: 'backinj',
        needs: ['photo'],
        prompt: '📸 Прикрепите фотографию(и) задания (1–4 и 6) 📸\n(если каких-то заданий у Вас ещё нет, Вы можете отправить их позже менеджеру) 🤝'
    },
    inj5: {
        title: '2 курс ⭐⭐\nИнженерная графика 🗜️\n5 работа (эскизирование) 🖼️',
        price: inj5,
        back: 'backinj',
        needs: ['photo'],
        prompt: '📸 Прикрепите фотографию(и) задания (Эскизирование) 📸'
    },
    injALL: {
        title: '2 курс ⭐⭐\nИнженерная графика 🗜️\n🦁 Весь комплект 🦁',
        price: injALL,
        back: 'backinj',
        needs: ['photo'],
        prompt: '📸 Прикрепите фотографии всех заданий по Инженерной графике 📸\n(если каких-то заданий у Вас ещё нет, Вы можете отправить их позже менеджеру)'
    },
    nachANDinjgraf: {
        title: '2 курс ⭐⭐\nНачертательная геометрия 📒 + Инженерная графика 🗜️\n👑 Царский набор 👑',
        price: nachANDinjgraf,
        back: 'back1',
        needs: ['photo'],
        prompt: '📸 Прикрепите фотографии всех заданий по Начерту и Инжграфу 📸\n(если каких-то заданий у Вас ещё нет, Вы можете отпрвить их позже менеджеру)'
    },
    mech_beam: {
        title: '2 курс ⭐⭐\nПредмет - Механика ⚙\nРабота - Расчёт Балки 🧮',
        price: costBalka,
        back: 'back2',
        needs: ['details'],
        prompt: 'Отправьте одним сообщением:\n1. Номер по журналу группы\n 2. Номер группы\n4. Вашу фамилию и инициалы'
    },
    mech_val: {
        title: '2 курс ⭐⭐\nПредмет - Механика ⚙\nРабота - Расчёт Вала 📏',
        price: costVal,
        back: 'back2',
        needs: ['details'],
        prompt: 'Отправьте одним сообщением:\n1. Номер по журналу группы\n 2. Номер группы\n4. Вашу фамилию и инициалы'
    },

    //3 курс
    mss_pz1: { 
        title: "МСС 📏 — ПЗ №1 🗒️", 
        price: costMSS_PZ1, 
        needs: ["variant"], 
        back: "back4",
        prompt: 'Отправьте последнюю цифру Вашего номера по журналу группы'
    },
    mss_pz2: { 
        title: "МСС 📏 — ПЗ №2 📓", 
        price: costMSS_PZ2, 
        needs: ['photo'], 
        back: "back4",
        prompt: '📸 Прикрепите фотографию Ваших измерений 📸'
    },
    mss_pz3: { 
        title: "МСС 📏 — ПЗ №3 📒", 
        price: costMSS_PZ3, 
        needs: ["variant"], 
        back: "back4",
        prompt: 'Отправьте последнюю цифру Вашего номера по журналу группы'
    },
    mss_pz4: { 
        title: "МСС 📏 — ПЗ №4 📔", 
        price: costMSS_PZ4, 
        needs: ["variant"], 
        back: "back4",
        prompt: 'Отправьте Ваш номер по журналу группы'
    },
    GMOS_PZ1: {
        title: "ГМОС 🌦️ — Практическая работа №1 🌡️", 
        price: costGMOS_PZ1, 
        needs: ["variant"], 
        back: "bbackToGMOS",
        prompt: 'Отправьте Ваш вариант (Если Ваш номер по списку ≤ 25, то вариант = номеру по списку, иначе варинат = (номер по списку - 25) :-)'
    },
    GMOS_PZ2: {
        title: "ГМОС 🌦️ — Практическая работа №2 🪁", 
        price: costGMOS_PZ2, 
        needs: ["variant"], 
        back: "bbackToGMOS",
        prompt: 'Отправьте Ваш вариант (Если Ваш номер по списку ≤ 12, то вариант = номеру по списку, иначе варинат = (номер по списку - (12 или 24)) :-)'
    },
    GMOS_PZ3: {
        title: "ГМОС 🌦️ — Практическая работа №3 💦", 
        price: costGMOS_PZ3, 
        needs: ["variant"], 
        back: "bbackToGMOS",
        prompt: 'Отправьте Ваш вариант (Если Ваш номер по списку ≤ 20, то вариант = номеру по списку, иначе варинат = (номер по списку - 20 :-)'
    },
    GMOS_PZ4: {
        title: "ГМОС 🌦️ — Практическая работа №4 ⛈️", 
        price: costGMOS_PZ4, 
        needs: ["variant"], 
        back: "backToGMOS",
        prompt: 'Отправьте Ваш вариант (Если Ваш номер по списку ≤ 16, то вариант = номеру по списку, иначе варинат = (номер по списку - 16 :-)'
    },
    GMOS_laba: {
        title: "ГМОС 🌦️ — БОЛЬШАЯ ЛАБА (Бояринов) 💎", 
        price: costGMOS_laba, 
        needs: ["details"], 
        back: "backToGMOS",
        prompt: 'Отправьте одним сообщением:\n\n(Если каких-то данных не хватает или Вы их не знаете - не пишите их, позже наш менеджер уточнит всё)\n\n1. Порт отхода\n2. Порт прихода\n3. Дату и время выхода\n4. Скорость хода на тихой воде\n5. Водоизмещение\n6. Период собственного колебания судна\n7. Осадку судна в порту выхода\n8. Фамилию и инициалы всех в команде'
    },
    tus_kurs: {
        title: '3 курс ⭐⭐⭐\nПредмет - ТУС 🚢\nРабота - Курсовая 🎯',
        price: costTUS_kurs,
        back: 'back5',
        needs: ['details'],
        prompt: 'Отправьте одним сообщением:\n1. Номер по журналу группы\n 2. Номер группы\n4. Вашу фамилию и инициалы'
    },
    mos_kurs: {
        title: '3 курс ⭐⭐⭐\nМОС 🧮\nКурсовая работа 🚢',
        price: costMOS_Kurs,
        back: 'back6',
        needs: ['details'],
        prompt: 'Отправьте одним сообщением:\n1. Номер по журналу группы\n 2. Номер группы\n4. Вашу фамилию и инициалы'
    },
    mos_river_pz2: {
        title: '3 курс ⭐⭐⭐\nМОС 🧮\nПоток: Река-море 🌉🌊\nПЗ №2. Сферические треугольники',
        price: costMOS_river_PZ2,
        back: 'back8',
        needs: ['variant'],
        prompt: 'Отправьте номер своего варианта' 
    },
    mos_river_pz4: {
        title: '3 курс ⭐⭐⭐\nМОС 🧮\nПоток: Река-море 🌉🌊\nПЗ №4. Оценка нав параметров',
        price: costMOS_river_PZ4,
        back: 'back8',
        needs: ['variant'],
        prompt: 'Отправьте номер своего варианта'
    },
    bs_high: {
        title: '3 курс ⭐⭐⭐\nБезопасность судоходства на ВВП 🛟\nОпределение высоты подмостового габарита',
        price: costBS_high,
        back: 'back9',
        needs: ['details'],
        prompt: 'Отправьте одним сообщением:\n1. Номер по журналу группы\n 2. Номер группы\n4. Вашу фамилию и инициалы\n5. День и месяц рождения'
    },
    olvvp_stvor: {
        title: '3 курс ⭐⭐⭐\nОбщая лоция ВВП 🌉\nПЗ «Расчёт линейного навигационного створа»',
        price: costOLVVP_Stvor,
        back: 'back10',
        needs: ['variant'],
        prompt: 'Отправьте номер варианта (две последние цифры номера зачётки)'
    },
    nil_sea_rgr: {
        title: '3 курс ⭐⭐⭐\nНиЛ 🧭\nПоток: Море 🌊\nРГР «вертикальный угол» (4 задачи)',
        price: costNIL_sea_RGR,
        back: 'back12',
        needs: ['details'],
        prompt: 'Отправьте одним сообщением:\n1. Номер варианта\n2. Номер группы\n4. Вашу фамилию и инициалы'
    },
    nil_river_rgr9: {
        title: '3 курс ⭐⭐⭐\nНиЛ 🧭\nПоток: Река-море 🌉🌊\nРГР «9 задач по 6 сборникам»',
        price: costNIL_river_RGR,
        back: 'back13',
        needs: ['variant'],
        prompt: 'Отправьте номер своего варианта'
    },
    tss_test: {
        title: '3 курс ⭐⭐⭐\nТСС 📺\n11 тестов (РЛС, РНС, АИС и др.) 🖥️',
        price: costTSS_Test,
        back: 'backTSS',
        needs: ['details'],
        prompt: 'Отправьте одним сообщением логин и пароль от фарватера.'
    },
    tss_test_pract: {
        title: '3 курс ⭐⭐⭐\nТСС 📺\n5 тестов на фарватере (практика) 🖥️',
        price: costTSS_Test_pract,
        back: 'backTSS',
        needs: ['details'],
        prompt: 'Отправьте одним сообщением логин и пароль от фарватера.'
    },
    Astro_kr1: {
        title: '3 курс ⭐⭐⭐\nАстрономия 🌌\nПомощь на контрольной по ТВА 🔭',
        price: costAstro_kr1,
        back: 'backAstro1',
        needs: ['details'],
        prompt: 'Отправьте одним сообщением дату проведения контрольной работы.'
    },

    // 4 курс
    nil_1tide: {
        title: '4 курс ⭐⭐⭐⭐\nНиЛ 🧭\nПриливы 1 задача 🏄',
        price: costNil_1tide,
        back: 'backNil4',
        needs: ['details'],
        prompt: 'Отправьте номер своего варианта (101 - 170)'
    },
    nil_2tide: {
        title: '4 курс ⭐⭐⭐⭐\nНиЛ 🧭\nПриливы 2 задача 🦞',
        price: costNil_2tide,
        back: 'backNil4',
        needs: ['details'],
        prompt: 'Отправьте номер своего варианта (201 - 270)'
    },
    nil_3tide: {
        title: '4 курс ⭐⭐⭐⭐\nНиЛ 🧭\nПриливы 3 задача 🚤',
        price: costNil_3tide,
        back: 'backNil4',
        needs: ['details'],
        prompt: 'Отправьте номер своего варианта (301 - 370)'
    },
    nil_4tide: {
        title: '4 курс ⭐⭐⭐⭐\nНиЛ 🧭\nПриливы 4 задача 🚣',
        price: costNil_4tide,
        back: 'backNil4',
        needs: ['details'],
        prompt: 'Отправьте номер своего варианта (401 - 470)'
    },
    nil_5tide: {
        title: '4 курс ⭐⭐⭐⭐\nНиЛ 🧭\nПриливы 5 задача 🪸',
        price: costNil_5tide,
        back: 'backNil4',
        needs: ['details'],
        prompt: 'Отправьте номер своего варианта (501 - 570)'
    },
    nil_ALLtide: {
        title: '4 курс ⭐⭐⭐⭐\nНиЛ 🧭\n👑 Все задачи на приливы 👑',
        price: costNil_ALLtide,
        back: 'backNil4',
        needs: ['details'],
        prompt: 'Отправьте номер своего варианта (01 - 70)'
    },
    MiUS_tasks: {
        title: '4 курс ⭐⭐⭐⭐\nМиУС 🚢\n7 задач по пособию 🚤',
        price: costMiUStasks,
        back: 'backMiUS4',
        needs: ['details'],
        prompt: 'Отправьте свой номер по журналу группы'
    },
    MiUS_tasks_break: {
        title: '4 курс ⭐⭐⭐⭐\nМиУС 🚢\n4 задачи на торможение 🐌',
        price: costMiUStasks_break,
        back: 'backMiUS4',
        needs: ['details'],
        prompt: 'Отправьте свой номер по журналу группы'
    },
    tss_test2: {
        title: '4 курс ⭐⭐⭐⭐\nТСС 📺\n11 тестов (РЛС, РНС, АИС и др.) 🖥️',
        price: costTSS_Test,
        back: 'backTSS2',
        needs: ['details'],
        prompt: 'Отправьте одним сообщением логин и пароль от фарватера.'
    },
    tss_test_pract2: {
        title: '4 курс ⭐⭐⭐⭐\nТСС 📺\n5 тестов на фарватере (практика) 🖥️',
        price: costTSS_Test_pract,
        back: 'backTSS2',
        needs: ['details'],
        prompt: 'Отправьте одним сообщением логин и пароль от фарватера.'
    },
    Astro_kr2: {
        title: '4 курс ⭐⭐⭐⭐\nАстрономия 🌌\nПомощь на контрольной по МАЕ 🔭',
        price: costAstro_kr2,
        back: 'backAstro2',
        needs: ['details'],
        prompt: 'Отправьте одним сообщением дату проведения контрольной работы.'
    },
    VVPRadio_kurs: {
        title: '4 курс ⭐⭐⭐⭐\nРадиосвязь на ВВП 📻\nКурсовая работа 🎛️',
        price: costVVPRadio_kurs,
        back: 'backVVPRadio',
        needs: ['details'],
        prompt: 'Отправьте свой номер по журналу группы.'
    },
};

//Разделение способов оплаты
const WORK_PAYMENT = {
    
    // 2 курс
    nach1_9: myCardNumber,
    nach10_12: myCardNumber,
    nachall1_9: myCardNumber,
    nachall10_12: myCardNumber,
    inj146: myCardNumber,
    inj5: myCardNumber,
    injALL: myCardNumber,
    nachANDinjgraf: myCardNumber,
    mech_beam: myCardNumber,
    mech_val: myCardNumber,
    
    //3 курс
    mss_pz1: myCardNumber,
    mss_pz2: myCardNumber,
    mss_pz3: myCardNumber,
    mss_pz4: myCardNumber,
    GMOS_PZ1: myCardNumber,
    GMOS_PZ2: myCardNumber,
    GMOS_PZ3: myCardNumber,
    GMOS_PZ4: myCardNumber,
    GMOS_laba: myCardNumber,
    mos_river_pz2: myCardNumber,
    mos_river_pz4: myCardNumber,
    mos_kurs: myCardNumber,
    bs_high: myCardNumber,
    olvvp_stvor: myCardNumber,
    nil_sea_rgr: myCardNumber,
    nil_river_rgr9: myCardNumber,
    tss_test: myCardNumber,
    tss_test_pract: myCardNumber,
    Astro_kr1: myCardNumber,
    tus_kurs: myCardNumber,
    
    // 4 курс
    tss_test2: myCellNumber,
    nil_1tide: myCellNumber,
    nil_2tide: myCellNumber,
    nil_3tide: myCellNumber,
    nil_4tide: myCellNumber,
    nil_5tide: myCellNumber,
    nil_ALLtide: myCellNumber,
    MiUS_tasks: myCellNumber,
    MiUS_tasks_break: myCellNumber,
    tss_test_pract2: myCellNumber,
    VVPRadio_kurs: myCellNumber,
    Astro_kr2: myCellNumber,
};

//Разделение работ по чатам
const WORK_CHAT = {
    nach1_9: CHERCHENIE_CHAT_ID,
    nach10_12: CHERCHENIE_CHAT_ID,
    nachall1_9: CHERCHENIE_CHAT_ID,
    nachall10_12: CHERCHENIE_CHAT_ID,
    inj146: CHERCHENIE_CHAT_ID,
    inj5: CHERCHENIE_CHAT_ID,
    injALL: CHERCHENIE_CHAT_ID,
    nachANDinjgraf: CHERCHENIE_CHAT_ID,
    mech_beam: MY_CHAT_ID,
    mech_val: MY_CHAT_ID,
    mss_pz1: MY_CHAT_ID,
    mss_pz2: MY_CHAT_ID,
    mss_pz3: MY_CHAT_ID,
    mss_pz4: MY_CHAT_ID,
    GMOS_PZ1: MY_CHAT_ID,
    GMOS_PZ2: MY_CHAT_ID,
    GMOS_PZ3: MY_CHAT_ID,
    GMOS_PZ4: MY_CHAT_ID,
    GMOS_laba: MY_CHAT_ID,
    tus_kurs: MY_CHAT_ID,
    mos_kurs: MY_CHAT_ID,
    mos_river_pz2: MY_CHAT_ID,
    mos_river_pz4: MY_CHAT_ID,
    bs_high: MY_CHAT_ID,
    olvvp_stvor: MY_CHAT_ID,
    nil_sea_rgr: MY_CHAT_ID,
    nil_river_rgr9: MY_CHAT_ID,
    nil_1tide: MY_CHAT_ID,
    nil_2tide: MY_CHAT_ID,
    nil_3tide: MY_CHAT_ID,
    nil_4tide: MY_CHAT_ID,
    nil_5tide: MY_CHAT_ID,
    nil_ALLtide: MY_CHAT_ID,
    MiUS_tasks: MY_CHAT_ID,
    MiUS_tasks_break: MY_CHAT_ID,
    tss_test: MY_CHAT_ID,
    tss_test2: MY_CHAT_ID,
    Astro_kr2: OTHER_ORDERS_CHAT_ID,
    tss_test_pract: MY_CHAT_ID,
    Astro_kr1: MY_CHAT_ID,
    tss_test_pract2: MY_CHAT_ID,
    VVPRadio_kurs: MY_CHAT_ID,
};

// Форматирование цены с учётом лояльности (loyalty.getPriceForUser)
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
    const phone = ctx.session?.userInfo?.phoneNumber ? `\n+${ctx.session.userInfo.phoneNumber}` : "";
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

//Функция для выбора нужного чата для каждой работы
function getTargetChat(workId) {
  return WORK_CHAT[workId] || MY_CHAT_ID; // по умолчанию — мой чат
}

//Функция для выбора метода оплаты для каждой работы
function getPaymentTarget(workId) {
  return WORK_PAYMENT[workId] || myCardNumber; // по умолчанию — моя карта
}

// Блок 1.2. Объявление переменных для ссылок
const channelLink = 'https://t.me/SmartDealsLTDink'
const trackingManagerLink = 'https://t.me/SmartDealsManager';
const trackingMathLink = 'https://t.me/SmartDeals_Math';
//Гугл диск
const loyaltyDocLink = 'https://docs.google.com/document/d/1tcjS6BL9TVWVeH-cG7jj0lyYwJtyPViWj60lzhd3x-A/edit?usp=sharing';
const DriveCatalogLink = 'https://drive.google.com/drive/folders/1oXGLvXAXfbeADoh07X3WhOX0WOLeg9mR?usp=sharing';
const Drive1yearLink = 'https://drive.google.com/drive/folders/1nAbmEz2CvQAzk2yZG8jdBrZ7VpDy8Dle?usp=sharing';
const Drive2yearLink = 'https://drive.google.com/drive/folders/1GtQEJQESq0OVhOGmWE3zo94PfScD3ypk?usp=sharing';
const Drive3yearLink = 'https://drive.google.com/drive/folders/1pU-uhO03bL6IJq9Js6f-DtaomNwPd90t?usp=sharing';
const Drive4yearLink = 'https://drive.google.com/drive/folders/1ImX8bRsg1OFrsIY0LmuYjecOfuu2U4N_?usp=sharing';
const DrivePractice = 'https://drive.google.com/drive/folders/1lNX7F6AUTA7SSIhwhLlQebDFvGnAJT-E?usp=sharing';
//Примеры работ
const exampNach1_9 = 'https://drive.google.com/drive/folders/1CSjpSp2XiJqxycJXp3o00CR1hqjqeRiM?usp=drive_link';
const exampNach10_12 = 'https://drive.google.com/drive/folders/1bpOYzgQNVlOgCoLvcJPRf6wjuk04Q_zP?usp=drive_link';
const exampNachANDinjg = 'https://drive.google.com/drive/folders/1Nacwdu7XOAtyDwlOAI4FCD1kRS-I_2dK?usp=drive_link';
const exampInj = 'https://drive.google.com/drive/folders/159OVJn9QT20-hGvFLYNJkygWH3jPIP1t?usp=drive_link';

// Блок 1.3. Объявления других переменных
const afterConfReply = `✅ Заказ успешно оформлен ✅ \n\n💬 Ожидайте ответ менеджера 💬`;
const seaTreasure = `💰 Морская Сокровищница 💰\n\nНаш каталог постоянно дополняется и совершенствуется чтобы всегда оставаться актуальным. ` + 
`<a href="${DriveCatalogLink}">В сокровищнице есть</a> (и не только это)\n
Вы можете внести свой вклад в общее дело и помочь другим, поделившись полезными в учёбе материалами за достойное ` + 
`<a href="${loyaltyDocLink}">вознаграждение (см п. 4)</a> с нашей стороны 🤝\n
"Наука сокращает нам опыты быстротекущей жизни" \n© Пушкин А.С., "Борис Годунов"`;
const cherchenieMESS = `\n\nВсе работы делаются на бумаге для черчения 📜\n\nДоставка в Стрельну осуществляется в четверг и в пятницу, так же есть возможность вывоза с Межевого канала сразу после исполнения работы 🚚`;
const payconfmes = `\n\nДля <b><u>подтверждения</u></b> заказа отправьте скиншот перевода боту 🤖`;
const helpONSubject = `\n\nЕсли Вас интересуют другие работы по этому предмету 🗒️ или же помощь на кр, зачёте или экзамене ✅, ` + 
`то напишите нашему <a href="${trackingManagerLink}">менеджеру</a> ✍\n\nДля заказа доступны 🛒`;
var waitingOrderMes; //Переменная для изменения сообщений, отправляемых в группу заказчиков

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
    .text('Астрономия 🌌', 'astro1').row()
    .text('НиЛ 🧭', 'nil').row()
    .text('ТСС 📺', 'tss').row()
    .text('Назад 🔙', 'back');
const inlineKeyboard4year = new InlineKeyboard()
    .text('НиЛ 🧭', 'nil4').row()
    .text('МиУС 🚢', 'MiUS4').row()
    .text('ТСС 📺', 'tss2').row()
    .text('Астрономия 🌌', 'astro2').row()
    .text('Радиосвязь на ВВП 📻', 'VVPRadio').row()
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
const inlineKeyboardGMOSworks = new InlineKeyboard()
    .text('Практическая работа №1 🌡️', 'GMOSpz1').row()
    .text('Практическая работа №2 🪁', 'GMOSpz2').row()
    .text('Практическая работа №3 💦', 'GMOSpz3').row()
    .text('Практическая работа №4 ⛈️', 'GMOSpz4').row()
    .text('БОЛЬШАЯ ЛАБА (Бояринов) 💎', 'GMOSlaba').row()
    .text('Назад 🔙', 'back3')
const inlineKeyboard8 = new InlineKeyboard()
    .text('Расчет линейного навигационного створа', 'rlns').row()
    .text('Назад 🔙', 'back3')
const inlineKeyboard9 = new InlineKeyboard()
    .text('Курсовая работа 🎯', 'kurs').row()
    .text('Назад 🔙', 'back3')
const inlineKeyboard34 = new InlineKeyboard()
    .text('11 тестов (РЛС, РНС, АИС и др.) 🖥️', 'test1').row()
    .text('5 тестов на фарватере (практика) 🖥️', 'testpract').row()
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
const inlineKeyboardAstro1 = new InlineKeyboard()
    .text('Помощь на контрольной по ТВА', 'astro_kr1').row()
    .text('Назад 🔙', 'back3')
const inlineKeyboardTSS4 = new InlineKeyboard()
    .text('11 тестов (РЛС, РНС, АИС и др.) 🖥️', 'tss4test').row()
    .text('5 тестов на фарватере (практика) 🖥️', 'testpract2').row()
    .text('Назад 🔙', 'back4year')
const inlineKeyboardNil = new InlineKeyboard()
    .text('Приливы 1 задача 🏄', 'nil1tide').row()
    .text('Приливы 2 задача 🦞', 'nil2tide').row()
    .text('Приливы 3 задача 🚤', 'nil3tide').row()
    .text('Приливы 4 задача 🚣', 'nil4tide').row()
    .text('Приливы 5 задача 🪸', 'nil5tide').row()
    .text('👑 Все задачи на приливы 👑', 'nilALLtide').row()
    .text('Назад 🔙', 'back4year')
const inlineKeyboardMiUS4 = new InlineKeyboard()
    .text('7 задач по пособию 🚤', 'MiUS_tasks').row()
    .text('4 задачи на торможение 🐌', 'MiUS_tasks_break').row()
    .text('Назад 🔙', 'back4year')
const inlineKeyboardAstro2 = new InlineKeyboard()
    .text('Помощь на контрольной по МАЕ', 'astro_kr2').row()
    .text('Назад 🔙', 'back4year')
const inlineKeyboardVVPRadio = new InlineKeyboard()
    .text('Курсовая работа 🎛️', 'VVPRadio_kurs').row()
    .text('Назад 🔙', 'back4year')
//Клавиатуры через конструктор (доделать)
const inlineKeyboard19 = orderKb('order8', 'back4'); //Итоговый тест по МСС (доделать)

// 2 курс
const inlineKeyboard4  = orderKb('order:mech_beam', 'back2'); // Механика. Балка
const inlineKeyboard5  = orderKb('order:mech_val',  'back2'); // Механика. Вал
const inlineKeyboardNachertorder1_9 = orderKb('order:nach1_9', 'backnachert') //Начерталка
const inlineKeyboardNachertorder10_12 = orderKb('order:nach10_12', 'backnachert') //Начерталка
const inlineKeyboardNachertALLorder1_9 = orderKb('order:nachall1_9', 'backnachert') //Начерталка
const inlineKeyboardNachertALLorder10_12 = orderKb('order:nachall10_12', 'backnachert') //Начерталка
const inlineKeyboardNacherANDinj = orderKb('order:nachANDinjgraf', 'back1') //Начерталка и Инжграф
const inlineKeyboardinj146 = orderKb('order:inj146', 'backinj') //Инжграф
const inlineKeyboardinj5 = orderKb('order:inj5', 'backinj') //Инжграф
const inlineKeyboardinjALL = orderKb('order:injALL', 'backinj') //Инжграф

// 3 курс
const inlineKeyboard14 = orderKb('order:mss_pz1', WORKS["mss_pz1"].back); // МСС ПЗ1
const inlineKeyboard15 = orderKb('order:mss_pz2', WORKS["mss_pz2"].back); // МСС ПЗ2
const inlineKeyboard16 = orderKb('order:mss_pz3', WORKS["mss_pz3"].back); // МСС ПЗ3
const inlineKeyboard17 = orderKb('order:mss_pz4', WORKS["mss_pz4"].back); // МСС ПЗ4
const inlineKeyboardGMOSpz1 = orderKb('order:GMOS_PZ1',      'backToGMOS');  // ГМОС ПЗ1
const inlineKeyboardGMOSpz2 = orderKb('order:GMOS_PZ2',      'backToGMOS');  // ГМОС ПЗ2
const inlineKeyboardGMOSpz3 = orderKb('order:GMOS_PZ3',      'backToGMOS');  // ГМОС ПЗ3
const inlineKeyboardGMOSpz4 = orderKb('order:GMOS_PZ4',      'backToGMOS');  // ГМОС ПЗ4
const inlineKeyboardGMOSlaba = orderKb('order:GMOS_laba',      'backToGMOS');  // ГМОС ЛАБА
const inlineKeyboard20 = orderKb('order:tus_kurs',      'back5');  // ТУС курсовая
const inlineKeyboard23 = orderKb('order:mos_kurs',      'back6');  // МОС курсовая
const inlineKeyboard25 = orderKb('order:mos_river_pz2', 'back8');  // МОС ПЗ2
const inlineKeyboard26 = orderKb('order:mos_river_pz4', 'back8');  // МОС ПЗ4
const inlineKeyboard28 = orderKb('order:bs_high',       'back9');  // БС ВВП подмостовой габарит
const inlineKeyboard29 = orderKb('order:olvvp_stvor',   'back10'); // ОЛВВП линейный створ
const inlineKeyboard31 = orderKb('order:nil_sea_rgr',   'back12'); // НиЛ море РГР
const inlineKeyboard32 = orderKb('order:nil_river_rgr9','back13'); // НиЛ река-море РГР
const inlineKeyboard35 = orderKb('order:tss_test',      'backTSS'); // ТСС 11 тестов
const inlineKeyboard36 = orderKb('order:tss_test_pract',      'backTSS'); // ТСС 5 тестов
const inlineKeyboardAstro_kr1 = orderKb('order:Astro_kr1',      'backAstro1'); // кр по ТВА

// 4 курс
const inlineKeyboardNil1tide = orderKb('order:nil_1tide',      'backNil4');  // НиЛ приливы 1 задача
const inlineKeyboardNil2tide = orderKb('order:nil_2tide',      'backNil4');  // НиЛ приливы 2 задача
const inlineKeyboardNil3tide = orderKb('order:nil_3tide',      'backNil4');  // НиЛ приливы 3 задача
const inlineKeyboardNil4tide = orderKb('order:nil_4tide',      'backNil4');  // НиЛ приливы 4 задача
const inlineKeyboardNil5tide = orderKb('order:nil_5tide',      'backNil4');  // НиЛ приливы 5 задача
const inlineKeyboardNilALLtide = orderKb('order:nil_ALLtide',      'backNil4');  // НиЛ приливы все задачи
const inlineKeyboardMiUS_tasks = orderKb('order:MiUS_tasks',      'backMiUS4');  // МиУС 7 задач по пособию
const inlineKeyboardMiUS_tasks_break = orderKb('order:MiUS_tasks_break',      'backMiUS4');  // МиУС 4 задачи на торможение
const inlineKeyboardTSStest = orderKb('order:tss_test2',      'backTSS2');  // ТСС 11 тестов
const inlineKeyboardTSStest2 = orderKb('order:tss_test_pract2',      'backTSS2'); // ТСС 5 тестов
const inlineKeyboardAstro_kr2 = orderKb('order:Astro_kr2',      'backAstro2'); // кр по МАЕ
const inlineKeyboardVVPRadio_kurs = orderKb('order:VVPRadio_kurs',      'backVVPRadio'); // курсач по радиосвязи на ВВП
const orederKeyboard1 = new InlineKeyboard()
    .text('Заказ взят ✅', 'take1');

const writeManager2 = new InlineKeyboard()
    .text('✅ Отправил скриншот', 'pay2');

const WriteManagerUnic = new InlineKeyboard()
    .url('✍ Написать менеджеру', trackingManagerLink).row()

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
`<a href="${loyaltyDocLink}">вознаградим Вас (см. п. 4)</a> за пополнение общей сокровищницы, а так же выполнение работ через наш сервис`, {
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

bot.callbackQuery('4-year', async (ctx) => {
    await ctx.callbackQuery.message.editText('4 курс ⭐⭐⭐\nВыберите предмет 🛒', {
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard4year,
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
    await ctx.callbackQuery.message.editText(`1-9 задача (каждая отдельно) 📎\n\n${line}\n
Работы по номерам:\n1. Выполнить проекцию точки на всех плоскостях по двум проекциям.\n2. Выполнить проекцию точки на всех плоскостях по координатам. 
3. Выполнить проекцию фигуры на плоскости.\n4. Найти пересечение фигур. \n5. Найти пересечение прямой с плоскостью. 
6. Найти фигуру пересечения плоскости с обьемной фигурой.\n7. Найти фигуру пересечения плоскости с обьемной фигурой. 
8. Найти точки пересечения прямой с фигурой.\n9. Выполнить вырез в фигуре на всех плоскостях.\n\nПосле оплаты отправьте менеджеру фотографию задания 📸\n
Примеры работ доступны по <a href="${exampNach1_9}">ссылке</a> 🔍`, {
        disable_web_page_preview: true,
        reply_markup: inlineKeyboardNachertorder1_9,
        parse_mode: 'HTML'
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nach10_12', async (ctx) => {
    const { line } = formatPriceInfo(ctx, nach10_12);
    await ctx.callbackQuery.message.editText(`10-12 задача (каждая отдельно) 📎\n\n${line}\n
Работы по номерам:\n1. Построить линию пересечения поверхностей геометрических тел\n2. Определить расстояние от точки А до прямой l
3. Определить расстояние от точки A до плоскости ɑ\n\nПосле оплаты отправьте менеджеру фотографию задания 📸\n
Примеры работ доступны по <a href="${exampNach10_12}">ссылке</a> 🔍`, {
        disable_web_page_preview: true,
        reply_markup: inlineKeyboardNachertorder10_12,
        parse_mode: 'HTML'
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nachall1_9', async (ctx) => {
    const { line } = formatPriceInfo(ctx, nachall1_9);
    await ctx.callbackQuery.message.editText(`1-9 задача (вместе) 📎\n\n${line}\n\nРаботы по номерам:
1. Выполнить проекцию точки на всех плоскостях по двум проекциям.\n2. Выполнить проекцию точки на всех плоскостях по координатам. 
3. Выполнить проекцию фигуры на плоскости.\n4. Найти пересечение фигур. \n5. Найти пересечение прямой с плоскостью. 
6. Найти фигуру пересечения плоскости с обьемной фигурой.\n7. Найти фигуру пересечения плоскости с обьемной фигурой. 
8. Найти точки пересечения прямой с фигурой.\n9. Выполнить вырез в фигуре на всех плоскостях.\n\nПосле оплаты отправьте менеджеру фотографию заданий 📸\n
Примеры работ доступны по <a href="${exampNach1_9}">ссылке</a> 🔍`, {
        disable_web_page_preview: true,
        reply_markup: inlineKeyboardNachertALLorder1_9,
        parse_mode: 'HTML'
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nachall10_12', async (ctx) => {
    const { line } = formatPriceInfo(ctx, nachall10_12);
    await ctx.callbackQuery.message.editText(`10-12 задача (вместе) 📎\n\n${line}\n\nРаботы по номерам:
1. Построить линию пересечения поверхностей геометрических тел\n2. Определить расстояние от точки А до прямой l
3. Определить расстояние от точки A до плоскости ɑ\n\nПосле оплаты отправьте менеджеру фотографию заданий 📸\n\nПримеры работ доступны по <a href="${exampNach10_12}">ссылке</a> 🔍`, {
        disable_web_page_preview: true,
        reply_markup: inlineKeyboardNachertALLorder10_12,
        parse_mode: 'HTML'
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nachANDinjgraf', async (ctx) => {
    const { line } = formatPriceInfo(ctx, nachANDinjgraf);
    await ctx.callbackQuery.message.editText(`🦁 Весь начерт и инжграф 🦁\n👑 Царский набор 👑\n\n${line}\n\n
Что входит в заказ:\n1. Все, нужные для зачёта работы по начерталке (1 - 9)\n2. Все работы по инженерной графике (1 - 6)\n
После оплаты отправьте менеджеру фотографии заданий 📸\n\nПримеры работ доступны по <a href="${exampNachANDinjg}">ссылке</a> 🔍`, {
        disable_web_page_preview: true,
        reply_markup: inlineKeyboardNacherANDinj,
        parse_mode: 'HTML'
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('inj146', async (ctx) => {
    const { line } = formatPriceInfo(ctx, inj146);
    await ctx.callbackQuery.message.editText(`1-4 и 6 работа (каждая отдельно) 📐\n\n${line}\n\nРаботы по номерам:
1. Выполнить чертёж детали.\n2. Выполнить чертёж детали.\n3. Выполнить чертёж в двух проекциях болтового соединения. 
4. Выполнить чертёж в двух проекциях  шпилечного соединения.\n6. Выполнить чертёж отдельной детали со сборного чертежа.
\nПосле оплаты отправьте менеджеру фотографии заданий 📸\n\nПримеры работ доступны по <a href="${exampInj}">ссылке</a> 🔍`, {
        disable_web_page_preview: true,
        reply_markup: inlineKeyboardinj146,
        parse_mode: 'HTML'
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('inj5', async (ctx) => {
    const { line } = formatPriceInfo(ctx, inj5);
    await ctx.callbackQuery.message.editText(`5 работа (эскизирование) 🎈\n\n${line}\n\n
После оплаты отправьте менеджеру фотографию задания 📸\n\nПримеры работ доступны по <a href="${exampInj}">ссылке</a> 🔍`, {
        disable_web_page_preview: true,
        reply_markup: inlineKeyboardinj5,
        parse_mode: 'HTML'
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('injALL', async (ctx) => {
    const { line } = formatPriceInfo(ctx, injALL);
    await ctx.callbackQuery.message.editText(`Весь инжграф ‼️Выгода 1460₽‼️\n\n${line}\n\nРаботы по номерам:
1. Выполнить чертёж детали.\n2. Выполнить чертёж детали.\n3. Выполнить чертёж в двух проекциях болтового соединения. 
4. Выполнить чертёж в двух проекциях  шпилечного соединения.\n5. Выполнить эскиз детали.\n6. Выполнить чертёж отдельной детали со сборного чертежа.
\nПосле оплаты отправьте менеджеру фотографии заданий 📸\n\nПримеры работ доступны по <a href="${exampInj}">ссылке</a> 🔍`, {
        disable_web_page_preview: true,
        reply_markup: inlineKeyboardinjALL,
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
    await ctx.callbackQuery.message.editText(`3 курс ⭐⭐⭐\nГМОС 🌦️${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: `HTML`,
        reply_markup: inlineKeyboardGMOSworks,
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

bot.callbackQuery('astro1', async (ctx) => {
    await ctx.callbackQuery.message.editText(`3 курс ⭐⭐⭐\nАстрономия 🌌${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardAstro1,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nil4', async (ctx) => {
    await ctx.callbackQuery.message.editText(`4 курс ⭐⭐⭐⭐\nНиЛ 🧭${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardNil,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('MiUS4', async (ctx) => {
    await ctx.callbackQuery.message.editText(`4 курс ⭐⭐⭐⭐\nМиУС 🚢${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardMiUS4,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('tss2', async (ctx) => {
    await ctx.callbackQuery.message.editText(`4 курс ⭐⭐⭐⭐\nТСС 📺${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardTSS4,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('astro2', async (ctx) => {
    await ctx.callbackQuery.message.editText(`4 курс ⭐⭐⭐⭐\nАстрономия 🌌${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardAstro2,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('VVPRadio', async (ctx) => {
    await ctx.callbackQuery.message.editText(`4 курс ⭐⭐⭐⭐\nРадиосвязь на ВВП 📻${helpONSubject}`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardVVPRadio,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pz1', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMSS_PZ1);
    await ctx.callbackQuery.message.editText(`ПЗ №1 🗒️\n\n${line}\n\nРабота выполняется в электронном виде.` + 
`Для выполнения работы нам необходим Ваш номер варианта - это последняя цифра номера по списку группы.\n
Пример готовой <a href="https://drive.google.com/file/d/1WhHlsomBeMD3nz6kEiT_WrtTOzKmRHgI/view?usp=drive_link">работы</a> 🔍\n
Срок выполнения - 1 день`, {
        disable_web_page_preview: true,
        reply_markup: inlineKeyboard14,
        parse_mode: 'HTML'
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('pz2', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMSS_PZ2);
    await ctx.callbackQuery.message.editText(`ПЗ №2 📓\n\n${line}\n
Пример готовой <a href="https://drive.google.com/file/d/1-Q_KDObrjOvk1S-lz7iOiR8zbNX8Ly5_/view?usp=drive_link">работы</a> 🔍
Срок выполнения - 1 день`, {
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
    await ctx.callbackQuery.message.editText(`11 тестов (РЛС, РНС, АИС и др.) 🖥️\n\n${line}\n
Срок выполнения: 4 - 7 дней.\nДля выполнения работы Вам нужно отправить логин и пароль от фарватера`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard35,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('testpract', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costTSS_Test_pract);
    await ctx.callbackQuery.message.editText(`5 тестов на фарватере 🖥️\n\n${line}\n
Срок выполнения: 4 - 7 дней.\nДля выполнения работы Вам нужно отправить логин и пароль от фарватера`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard36,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('astro_kr1', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costAstro_kr1);
    await ctx.callbackQuery.message.editText(`Помощь на контрольной по ТВА 🔭\n\n${line}\n
Для согласования помощи на контрольной, напишите дату проведения контрольной ✍️`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardAstro_kr1,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('GMOSpz1', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costGMOS_PZ1);
    await ctx.callbackQuery.message.editText(`Практическая работа №1 🌡️\n\n${line}\n
Срок выполнения: 1 день`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardGMOSpz1,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('GMOSpz2', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costGMOS_PZ2);
    await ctx.callbackQuery.message.editText(`Практическая работа №2 🪁\n\n${line}\n
Срок выполнения: 1 день`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardGMOSpz2,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('GMOSpz3', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costGMOS_PZ3);
    await ctx.callbackQuery.message.editText(`Практическая работа №3 💦\n\n${line}\n
Срок выполнения: 1 день`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardGMOSpz3,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('GMOSpz4', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costGMOS_PZ4);
    await ctx.callbackQuery.message.editText(`Практическая работа №4 ⛈️\n\n${line}\n
Срок выполнения: 1 день`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardGMOSpz4,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('GMOSlaba', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costGMOS_laba);
    await ctx.callbackQuery.message.editText(`БОЛЬШАЯ ЛАБА (Бояринов) 💎\n\n${line}\n
Срок выполнения: 1 день`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardGMOSlaba,
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

bot.callbackQuery('nil1tide', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costNil_1tide);
    await ctx.callbackQuery.message.editText(`Приливы 1 задача 🏄\n\n${line}\n
Пример готовой <a href="https://drive.google.com/file/d/1YA1Pt6gvx2FD_BmadUO286rwK6X53FIL/view?usp=drive_link">работы</a>\n
Срок выполнения: 1 день`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardNil1tide,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nil2tide', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costNil_2tide);
    await ctx.callbackQuery.message.editText(`Приливы 2 задача 🦞\n\n${line}\n
Пример готовой <a href="https://drive.google.com/file/d/1E1wirTunuxKro6qo2r1J9e0z2O9HN-3P/view?usp=drive_link">работы</a>\n
Срок выполнения: 1 день`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardNil2tide,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nil3tide', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costNil_3tide);
    await ctx.callbackQuery.message.editText(`Приливы 3 задача 🚤\n\n${line}\n
Пример готовой <a href="https://drive.google.com/file/d/18_hbHB7RNwDsnzOeEKCTKaJnIWDMeJru/view?usp=drive_link">работы</a>\n
Срок выполнения: 1 день`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardNil3tide,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nil4tide', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costNil_4tide);
    await ctx.callbackQuery.message.editText(`Приливы 4 задача 🚣\n\n${line}\n
Пример готовой <a href="https://drive.google.com/file/d/1eUfiKArqCBZGp-1Zq3tNjHOblWsHJAqY/view?usp=drive_link">работы</a>\n
Срок выполнения: 1 день`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardNil4tide,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nil5tide', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costNil_5tide);
    await ctx.callbackQuery.message.editText(`Приливы 5 задача 🪸\n\n${line}\n
Пример готовой <a href="https://drive.google.com/file/d/1KRrwMoKHpWtc0jKzvb9G7KepC7QZEXvv/view?usp=drive_link">работы</a>\n
Срок выполнения: 1 день`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardNil5tide,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('nilALLtide', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costNil_ALLtide);
    await ctx.callbackQuery.message.editText(`👑 Все задачи на приливы 👑\n\n${line}\n
Пример готовой <a href="https://drive.google.com/drive/folders/1oalkjgVXOzTB8g01PGV5LaKSGWZVOdmi?usp=drive_link">работы</a>\n
Срок выполнения: 1 день`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardNilALLtide,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('MiUS_tasks', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMiUStasks);
    await ctx.callbackQuery.message.editText(`7 задач по пособию 🚤\n\n${line}\n
Пример готовой <a href="https://drive.google.com/file/d/13dF2TK0Qu4fSXnk6-HlobiIV4vzMfqq2/view?usp=drive_link">работы</a>\n
Срок выполнения: 1 день`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardMiUS_tasks,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('MiUS_tasks_break', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMiUStasks_break);
    await ctx.callbackQuery.message.editText(`4 задачи на торможение 🐌\n\n${line}\n
Пример готовой <a href="https://drive.google.com/file/d/1nb3V4HEFwPBtnkxRXTH-TKWSf5EVKlMk/view?usp=drive_link">работы</a>\n
Срок выполнения: 1 день`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardMiUS_tasks_break,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('tss4test', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costTSS_Test);
    await ctx.callbackQuery.message.editText(`11 тестов (РЛС, РНС, АИС и др.) 🖥️\n\n${line}\n
Срок выполнения: 1 - 2 дня.\nДля выполнения работы Вам нужно отправить логин и пароль от фарватера`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardTSStest,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('testpract2', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costTSS_Test_pract);
    await ctx.callbackQuery.message.editText(`5 тестов на фарватере🖥️\n\n${line}\n
Срок выполнения: 4 - 7 дней.\nДля выполнения работы Вам нужно отправить логин и пароль от фарватера`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardTSStest2,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('astro_kr2', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costAstro_kr2);
    await ctx.callbackQuery.message.editText(`Помощь на контрольной по МАЕ 🔭\n\n${line}\n
Для согласования помощи на контрольной, напишите дату проведения контрольной ✍️`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardAstro_kr2,
    })
    await ctx.answerCallbackQuery()
})

bot.callbackQuery('VVPRadio_kurs', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costVVPRadio_kurs);
    await ctx.callbackQuery.message.editText(`Курсовая работа 🎛️\n\n${line}\n
Срок выполнения: 4 - 7 дней.`, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardVVPRadio_kurs,
    })
    await ctx.answerCallbackQuery()
})

//Блок 6. Обработка разных типов заказов

bot.callbackQuery('order8', async (ctx) => {
    const { line } = formatPriceInfo(ctx, costMSS_test);
    ctx.session.order8.waitingForData8 = true;
    ctx.session.order8.step8 = 1;
    await ctx.reply(`3 курс ⭐⭐⭐\nМСС 📏\nтоговый тест по МСС 🖥️\n\n${line}\n
Для получения доступа к тестам Вам необходимо отправить свою почту боту`, { parse_mode: 'HTML' });
    await ctx.answerCallbackQuery();
});

bot.callbackQuery(/order:(.+)/, async (ctx) => {
    const workId = ctx.match[1];
    const work = WORKS[workId];
    if (!work) return ctx.answerCallbackQuery({ text: "Неизвестная работа" });

    const { line } = formatPriceInfo(ctx, work.price);

    // Заголовок + цена + индивидуальная подсказка к данным
    await ctx.reply(`${work.title}\n\n${line}\n\n${work.prompt}`, { parse_mode: 'HTML' } );

    // Запускаем универсальный поток
    ctx.session.orderFlow = {
        active: true,
        workId,
        needQueue: [...(work.needs || ['details'])],
        data: {},
    };
    await ctx.answerCallbackQuery();
});


//Работаем с текстом от пользователя
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

    //Обработчик всех заказов
    const flow = ctx.session.orderFlow;
    if (flow?.active) {
    const work = WORKS[flow.workId];
    if (!work) { flow.active = false; return; }

    const next = flow.needQueue[0];

    if (next === "variant") {
        const text = (ctx.message.text || "").trim();
        if (!text) return ctx.reply("Введите номер варианта.");
        flow.data.variant = text;
        flow.needQueue.shift();
    } else if (next === "details") {
        const text = (ctx.message.text || "").trim();
        if (!text) return ctx.reply("Отправьте одним сообщением все необходимые данные.");
        flow.data.details = text;
        // Сохраним исходное сообщение — пригодится, если нужен будет пересыл
        userLastMessages.set(ctx.from.id, ctx.message);
        flow.needQueue.shift();
    }

    if (flow.needQueue.length === 0) {
        const { line } = formatPriceInfo(ctx, work.price);
        const dataBlock = flow.data.details ? `Данные:\n${flow.data.details}` : (flow.data.variant ? `Ваш вариант: ${flow.data.variant}` : '');

        // Сообщение пользователю
        const paymentTarget = getPaymentTarget(flow.workId);
        await ctx.reply(`${work.title}\n\n${line}\n\n${dataBlock}\n\n` + `Для оплаты переведите указанную сумму: ${paymentTarget}`,
        { disable_web_page_preview: true, parse_mode: 'HTML', reply_markup: WriteManagerUnic });

        // Черновик для менеджера (ожидаем подтверждение оплаты)
        const managerMsg =`${buildUserReference(ctx)} собирается сделать заказ\n\n${work.title}\n` + (dataBlock ? dataBlock + '\n' : '') +
            getPriceForWork(ctx, work.price);

        const targetChat = getTargetChat(flow.workId);

        waitingOrderMes = (await ctx.api.sendMessage(targetChat, managerMsg)).message_id;

        await ctx.reply(payconfmes, { disable_web_page_preview: true, parse_mode: 'HTML' });

        return;
    } else {
        // Подсказка следующего шага
        const field = flow.needQueue[0];
        await ctx.reply(field === "variant" ? "Введите номер вашего варианта:" : "Отправьте одним сообщением все необходимые данные:");
        return;
    }
}

    //Все остальные обработчики заказов (пока старые)

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
});


// Временное хранилище для альбомов
const mediaBuffer = {};

// Обработка фото и документов + чек об оплате
bot.on(["message:photo", "message:document"], async (ctx) => {
    const flow = ctx.session.orderFlow;
    if (!flow?.active) return;
    const work = WORKS[flow.workId];
    if (!work) return;

    let fileId, type;
    if (ctx.message.photo) {
        const largest = ctx.message.photo[ctx.message.photo.length - 1];
        fileId = largest.file_id;
        type = "photo";
    } else if (ctx.message.document) {
        fileId = ctx.message.document.file_id;
        type = "document";
    }

    const next = flow.needQueue[0];

    // === 1) Исходные данные (задание) ===
    if (next === "photo") {
        // Если это альбом
        if (ctx.message.media_group_id) {
        const groupId = ctx.message.media_group_id;
        mediaBuffer[groupId] = mediaBuffer[groupId] || { files: [], ctx, handled: false };

        mediaBuffer[groupId].files.push({ fileId, type });

        if (!mediaBuffer[groupId].timer) {
            mediaBuffer[groupId].timer = setTimeout(async () => {
            const group = mediaBuffer[groupId];
            if (!group || group.handled) return;
            group.handled = true;

            // Сохраняем все файлы альбома
            flow.data.media = flow.data.media || [];
            flow.data.media.push(...group.files);

            // Завершаем очередь только здесь!
            flow.needQueue.shift();

            const { line } = formatPriceInfo(group.ctx, work.price);
            
            const paymentTarget = getPaymentTarget(flow.workId);

            await group.ctx.reply(
                `${work.title}\n\n${line}\n\n📎 Файлы/фотографии задания получены\n\nДля оплаты переведите указанную сумму: ${paymentTarget}`,
                { disable_web_page_preview: true, parse_mode: 'HTML', reply_markup: WriteManagerUnic }
            );

            const managerMsg = `${buildUserReference(group.ctx)} собирается сделать заказ\n\n${work.title}\n` + getPriceForWork(group.ctx, work.price);
            
            const targetChat = getTargetChat(flow.workId);
            
            waitingOrderMes = (await group.ctx.api.sendMessage(targetChat, managerMsg)).message_id;

            await ctx.reply(payconfmes, { disable_web_page_preview: true, parse_mode: 'HTML' });

            for (const f of group.files) {
                if (f.type === "photo") {
                await group.ctx.api.sendPhoto(targetChat, f.fileId);
                } else {
                await group.ctx.api.sendDocument(targetChat, f.fileId);
                }
            }

            delete mediaBuffer[groupId];
            }, 500); // ждём полсекунды, чтобы собрать весь альбом
        }
        return;
        }

        // Если одиночное фото/файл
        flow.data.media = flow.data.media || [];
        flow.data.media.push({ fileId, type });

        flow.needQueue.shift();

        const { line } = formatPriceInfo(ctx, work.price);

        const paymentTarget = getPaymentTarget(flow.workId);

        await ctx.reply(`${work.title}\n\n${line}\n\n📎 Файл/фотография задания получен\n\nДля оплаты переведите указанную сумму: ${paymentTarget}`,
        { disable_web_page_preview: true, parse_mode: 'HTML', reply_markup: WriteManagerUnic });

        const managerMsg = `${buildUserReference(ctx)} собирается сделать заказ\n\n${work.title}\n` + getPriceForWork(ctx, work.price);

        const targetChat = getTargetChat(flow.workId);

        waitingOrderMes = (await ctx.api.sendMessage(targetChat, managerMsg)).message_id;

        await ctx.reply(payconfmes, { disable_web_page_preview: true, parse_mode: 'HTML' });

        if (type === "photo") {
        await ctx.api.sendPhoto(targetChat, fileId);
        } else {
        await ctx.api.sendDocument(targetChat, fileId);
        }

        return;
    }

    // === 2) Чек об оплате (заказ уже собран) ===
    if (!next) {
        const caption = `${buildUserReference(ctx)} прислал чек об оплате заказа:\n\n${work.title}`;

        // Лояльность. Добавление общей суммы выручки
        const priceInfo = loyalty.getPriceForUser(ctx.from.id, work.price);
        const discountedPrice = priceInfo.discountedPrice;
        loyalty.addToTotal(ctx.from.id, ctx.from.username, discountedPrice);

        await ctx.reply(`✅ Спасибо! Скриншот оплаты получен и отправлен <a href="${trackingManagerLink}">менеджеру</a> 💬\nОн скоро свяжется с Вами ✍️`, {parse_mode: 'HTML'} );

        const targetChat = getTargetChat(flow.workId);

        if (targetChat) {
            if (type === "photo") {
            await ctx.api.sendPhoto(targetChat, fileId, { caption });
            } else { await ctx.api.sendDocument(targetChat, fileId, { caption });}
        } else { console.error("❌ Не найден чат для работы:", flow.workId);}
            // 🔒 Закрываем заказ — больше чеков/фото бот не принимает
            flow.active = false;
        return;
    }
});


//Блок n пересылка сообщений в группы
//После оплаты заказа пользователем
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

bot.callbackQuery('pay2', async (ctx) => {
    if (ctx.session.order8.dataReceived8) {
        const msg = `Запрос доступа${buildUserReference(ctx)}\n\n3 курс\nПредмет - МСС 📏\nИтоговый тест по МСС 🖥️${getPriceForWork(ctx, costMSS_test)}
Почта: ${ctx.session.order8.email8}`;
        await ctx.api.sendMessage(MY_CHAT_ID, msg);
        await ctx.reply(afterConfReply);
        ctx.session.order8.dataReceived8 = false;
    }
    await ctx.answerCallbackQuery()
})


bot.callbackQuery('backward', async (ctx) => {
    if (ctx.session.order8.step8 === 2) {
        ctx.session.order8.waitingForData8 = true;
        ctx.session.order8.step8 = 1;
        const { line } = formatPriceInfo(ctx, costMSS_test);
        await ctx.reply(`Итоговый тест по МСС 🖥️\n\n${line}\n
Для получения доступа к тестам Вам необходимо отправить свою почту боту (желательно @gmail.com)`, { parse_mode: 'HTML' });
        await ctx.answerCallbackQuery();
        return;
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

bot.callbackQuery('back4year', async (ctx) => {
    await go(ctx, '4 курс ⭐⭐⭐⭐\nВыберите предмет 🛒', inlineKeyboard4year);
});

bot.callbackQuery('back2', async (ctx) => {
    await go(ctx, `2 курс ⭐⭐\nМеханика ⚙${helpONSubject}`, inlineKeyboard3);
});

bot.callbackQuery('backnachert', async (ctx) => {
    await go(ctx, `2 курс ⭐⭐\nНачерталка 📒${cherchenieMESS}${helpONSubject}`, inlineKeyboardNachert);
});

bot.callbackQuery('backinj', async (ctx) => {
    await go(ctx, `2 курс ⭐⭐\nИнженерная графика 🗜️${cherchenieMESS}${helpONSubject}`, inlineKeyboarInjgraf);
});

bot.callbackQuery('back4', async (ctx) => {
    await go(ctx, `3 курс ⭐⭐⭐\nМСС 📏${helpONSubject}`, inlineKeyboard7);
});

bot.callbackQuery('back5', async (ctx) => {
    await go(ctx, `3 курс ⭐⭐⭐\nТУС 🚢${helpONSubject}`, inlineKeyboard9);
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

bot.callbackQuery('backToGMOS', async (ctx) => {
    await go(ctx, `3 курс ⭐⭐⭐\nГМОС 🌦️${helpONSubject}`, inlineKeyboardGMOSworks);
});

bot.callbackQuery('backTSS', async (ctx) => {
    await go(ctx, `3 курс ⭐⭐⭐\nТСС 📺${helpONSubject}`, inlineKeyboard34);
});

bot.callbackQuery('backAstro1', async (ctx) => {
    await go(ctx, `3 курс ⭐⭐⭐\nАстрономия 🌌${helpONSubject}`, inlineKeyboardAstro1);
});

bot.callbackQuery('backAstro2', async (ctx) => {
    await go(ctx, `4 курс ⭐⭐⭐⭐\nАстрономия 🌌${helpONSubject}`, inlineKeyboardAstro2);
});

bot.callbackQuery('backTSS2', async (ctx) => {
    await go(ctx, `4 курс ⭐⭐⭐⭐\nТСС 📺${helpONSubject}`, inlineKeyboardTSS4);
});

bot.callbackQuery('backNil4', async (ctx) => {
    await go(ctx, `4 курс ⭐⭐⭐⭐\nНиЛ 🧭${helpONSubject}`, inlineKeyboardNil);
});

bot.callbackQuery('backMiUS4', async (ctx) => {
    await go(ctx, `4 курс ⭐⭐⭐⭐\nМиУС 🚢${helpONSubject}`, inlineKeyboardMiUS4);
});

bot.callbackQuery('backVVPRadio', async (ctx) => {
    await go(ctx, `4 курс ⭐⭐⭐⭐\nРадиосвязь на ВВП 📻${helpONSubject}`, inlineKeyboardVVPRadio);
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