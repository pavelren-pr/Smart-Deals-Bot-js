const { Keyboard, InlineKeyboard } = require('grammy');

module.exports = {
  // Основные клавиатуры
  main: new Keyboard()
    .text('Перейти к каталогу работ 🗃').row()
    .text('Бесплатные полезные материалы 🕊').row()
    .text('Предложить работу или услугу 🥂').resized(),
    
  courseSelection: new InlineKeyboard()
    .text('2 курс ⭐️⭐️', '2-year').row()
    .text('3 курс ⭐️⭐️⭐️', '3-year'),
    
  freeMaterials: new InlineKeyboard()
    .text('2 курс ⭐️⭐️', '2-year1').row()
    .text('3 курс ⭐️⭐️⭐️', '3-year1').row()
    .text('Практика 🚢', 'prac').row()
    .text('Предложить работу или услугу 🥂', 'usl'),
    
  // Специализированные клавиатуры
  mechanics: new InlineKeyboard()
    .text('Расчёт Вала 📏', 'shaft').row()
    .text('Расчёт Балки 🧮', 'beam').row()
    .text('Назад 🔙', 'back1'),
    
  thirdYearSubjects: new InlineKeyboard()
    .text('МСС 📏', 'mss').row()
    .text('ТУС 🚢', 'tus').row()
    .text('МОС 🧮', 'mos').row()
    .text('Безопасность судоходства на ВВП🛟', 'bvvp').row()
    .text('Общая лоция ВВП 🌉', 'lvvp').row()
    .text('ГМОС 🌦️', 'gmos').row()
    .text('НиЛ 🧭', 'nil').row()
    .text('ТСС 📺', 'tss').row()
    .text('Назад 🔙', 'back'),
    
  subscriptionCheck: new InlineKeyboard()
        .text('Подписался!', 'sub1'),
    
    managerLink: new InlineKeyboard()
        .url("Написать менеджеру ✍️", "https://t.me/SmartDealsManager"),
    
    main: new Keyboard()
        .text('Перейти к каталогу работ 🗃').row()
        .text('Бесплатные полезные материалы 🕊').row()
        .text('Предложить работу или услугу 🥂').resized()
};