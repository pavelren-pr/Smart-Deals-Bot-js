module.exports = {
  BOT_COMMANDS: [
    {
      command: 'start',
      description: 'Начать взаимодействие с ботом',
    }
  ],
  
  SUBSCRIPTION: {
    TARGET_CHAT_ID: -1002406307871,
    TARGET_GROUP: -1002162448649,
    CACH_TTL: 10 * 1000,
    SUBSCRIBE_TEXT: '❌ Для использования бота необходимо подписаться на канал!',
    SUBSCRIBE_URL: 'https://t.me/SmartDealsLTDink'
  },

  RESPONSES: {
    START: 'Привет! Для начала работы подпишись на канал: <a href="https://t.me/SmartDealsLTDink">ссылка</a>',
    CATALOG: 'Выбери свой курс обучения',
    FREE_MATERIALS: 'Выбраны Бесплатные полезные материалы 🕊\nДанный каталог будет постоянно дополняться и редактироваться чтобы всегда оставаться актуальным. Вы можете внести свой вклад в общее дело и помочь другим, поделившись полезными методичками/примерами работ/книгами🤝\nИзучить каталог того, что на данный момент доступно можно по кнопке ниже🔍\n\n"Наука сокращает нам опыты быстротекущей жизни" ©Пушкин А.С., "Борис Годунов"',
    OFFER_SERVICE: 'Мы ценим твою инициативу, :)\nДля предложения работы или услуги напиши нашему менеджеру: <a href="https://t.me/SmartDealsManager">Менеджер</a>\nПриветствуется добавление бесплатных материалов в общий каталог, а так же выполнение работ через наш сервис',
    DEFAULT: 'Что Вам нужно?',
    BACK: 'Назад 🔙'
  },

  BUTTONS: {
    CATALOG: 'Перейти к каталогу работ 🗃',
    FREE_MATERIALS: 'Бесплатные полезные материалы 🕊',
    OFFER_SERVICE: 'Предложить работу или услугу 🥂'
  },

  COURSES: {
    SECOND_YEAR: '2 курс ⭐️⭐️',
    THIRD_YEAR: '3 курс ⭐️⭐️⭐️',
    PRACTICE: 'Практика 🚢'
  },

  SUBJECTS: {
    MECHANICS: 'Механика ⚙',
    MSS: 'МСС 📏',
    TUS: 'ТУС 🚢',
    MOS: 'МОС 🧮',
    BVP: 'Безопасность судоходства на ВВП🛟',
    LVVP: 'Общая лоция ВВП 🌉',
    GMOS: 'ГМОС 🌦️',
    NIL: 'НиЛ 🧭',
    TSS: 'ТСС 📺'
  },

  MATERIALS: {
    DRIVE_LINKS: {
      SECOND_YEAR: 'https://drive.google.com/drive/folders/139n63GVsB8piVV-7iCV6CZg5x92S_w9z?usp=drive_link',
      THIRD_YEAR: 'https://drive.google.com/drive/folders/1YTIPIGtSyndFX6gwQ4a8mcjK55SUz3_-?usp=drive_link',
      PRACTICE: 'https://drive.google.com/drive/folders/1QhJqQ7YzFuHSn1LddPKaUMqYPUs10vpY?usp=sharing'
    },
    MANAGER_LINK: 'https://t.me/SmartDealsManager'
  },

  SESSION_INITIAL: () => ({
    order: {
      waitingForData: false,
      dataReceived: false,
    },
    order1: {
      waitingForData1: false,
      dataReceived1: false,
    },
    // ... остальные состояния заказов ...
  })
};