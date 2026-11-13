import type { I18nKey } from './en';

/** Russian. Typed against the English keys, so a missing key fails typecheck. */
export const ru: Record<I18nKey, string> = {
  'app.title': 'Pit Flow',
  'app.subtitle': 'Планирование отработки блоков карьера',
  'layout.blocks': 'Блоки',
  'layout.schedule': 'График',
  'layout.calendar': 'Период планирования',

  // Pages
  'page.home': 'Главная',
  'page.extraction': 'Планирование добычи',
  'page.drilling': 'Планирование бурения',
  'layout.drilling': 'Бурение',
  'home.title': 'Что вы хотите сделать?',
  'home.open': 'Открыть',
  'home.extraction.desc': 'Посуточный график добычи: целевые тоннаж и содержания, вскрыша, зависимости блоков и фактическая добыча.',
  'home.drilling.desc': 'Продолжительность бурения каждого блока по его объёму и характеристикам бурового оборудования.',
  'home.blocksShared': 'Список блоков общий для обеих страниц: загружено блоков — {count}.',
  'home.blocksSharedEmpty': 'Список блоков общий для обеих страниц. Загрузите его на любой из них.',
  'drilling.equipment': 'Буровое оборудование',
  'drilling.uploadEquipment': 'Загрузить список оборудования',
  'drilling.comingSoon': 'Загрузка оборудования и расчёт продолжительности бурения будут добавлены на следующем шаге.',

  // Fields
  'field.elevation': 'Высотная отметка',
  'field.group': 'Группа',
  'field.material': 'Материал',
  'field.volume': 'Объём',
  'field.weight': 'Масса',
  'field.cu': 'Cu',
  'field.mo': 'Mo',
  'field.as': 'As',
  'field.pb': 'Pb',
  'field.eq': 'Cu-экв',
  'field.density': 'Плотность',
  'field.remaining': 'Остаток',

  // Block classes
  'class.ore': 'Руда',
  'class.waste': 'Пустая порода',
  'class.all': 'Все',

  // Block list
  'blocks.empty': 'Блоки не загружены. Загрузите файл CSV или Excel.',
  'blocks.noMatch': 'Нет блоков, соответствующих фильтрам.',
  'blocks.search': 'Поиск по ID блока',
  'blocks.materialFilter': 'Материал',
  'blocks.sort': 'Сортировка',
  'blocks.sort.id': 'ID',
  'blocks.sort.remaining': 'Остаток',
  'blocks.sort.cu': 'Cu',
  'blocks.sort.mo': 'Mo',
  'blocks.sort.eq': 'Cu-экв',
  'blocks.elevationGroup': 'Отметка {elevation} м',
  'blocks.count': '{shown} из {total} блоков',
  'blocks.locked': 'Заблокирован',
  'blocks.lockedBy': 'Ожидает: {parents}',
  'blocks.exhausted': 'Отработан',
  'blocks.listLabel': 'Список блоков. Стрелки — перемещение, Enter — открыть.',

  // Import
  'import.upload': 'Загрузить блоки',
  'import.reading': 'Чтение {name}…',
  'import.failed': 'Не удалось прочитать {name}: {error}',
  'import.empty': 'Файл пуст.',
  'import.mapping.title': 'Сопоставление столбцов',
  'import.mapping.intro':
    'В файле {name} не распознаны некоторые обязательные столбцы. Укажите, в каком столбце файла находится каждое поле.',
  'import.mapping.field': 'Поле',
  'import.mapping.column': 'Столбец файла',
  'import.mapping.sample': 'Первое значение',
  'import.mapping.required': 'обязательно',
  'import.mapping.notMapped': '— нет в файле —',
  'import.mapping.duplicate': 'Столбец «{column}» назначен нескольким полям.',
  'import.mapping.ok': 'Импортировать',
  'import.reimport.title': 'Блоки уже загружены',
  'import.reimport.intro':
    'Загружено блоков: {existing}. В новом файле корректных блоков: {incoming}. Как их объединить?',
  'import.reimport.replace': 'Заменить все',
  'import.reimport.replaceHint':
    'Удалить текущие блоки, остатки и зависимости и загрузить всё заново из файла.',
  'import.reimport.merge': 'Объединить по ID блока',
  'import.reimport.mergeHint':
    'Сохранить остатки и зависимости для совпадающих ID, добавить новые блоки, удалить блоки, отсутствующие в файле.',
  'import.summary.title': 'Итоги импорта — {name}',
  'import.summary.rows': 'Прочитано строк',
  'import.summary.imported': 'Импортировано',
  'import.summary.skipped': 'Пропущено',
  'import.summary.warnings': 'Предупреждения',
  'import.summary.ore': 'Рудных блоков',
  'import.summary.waste': 'Блоков пустой породы',
  'import.summary.format': 'Формат',
  'import.summary.nothing': 'Корректные строки не найдены, текущие блоки не изменены.',
  'import.summary.row': 'Строка',
  'import.summary.level': 'Тип',
  'import.summary.message': 'Подробности',
  'import.summary.error': 'Пропущена',
  'import.summary.warning': 'Предупреждение',
  'import.summary.parseErrors': 'Ошибки разбора файла',
  'import.summary.merge': 'Результат объединения',
  'import.summary.added': 'Добавлено',
  'import.summary.updated': 'Сохранены данные пользователя',
  'import.summary.removed': 'Удалено (нет в файле)',
  'import.summary.droppedDeps': 'Удалённые зависимости (родитель удалён)',
  'import.summary.clamped': 'Остаток уменьшен до новой массы',
  'import.summary.ignoredColumns': 'Игнорируемые столбцы: {columns}',

  // Import validation messages
  'import.err.missing': 'Не указано: {field}',
  'import.err.notNumber': '{field}: не число',
  'import.err.negative': '{field}: должно быть ≥ 0',
  'import.err.positive': '{field}: должно быть > 0',
  'import.err.gradeMax': '{field}: должно быть меньше 100 %',
  'import.warn.duplicateId': 'Повторяющийся ID {id}; переименован в {renamed}',
  'import.warn.density':
    'Объём × плотность = {expected} т отличается от массы {weight} т на {diff} %',

  // Block modal
  'blockModal.title': 'Блок {id}',
  'blockModal.properties': 'Свойства из файла',
  'blockModal.id': 'ID блока',
  'blockModal.class': 'Класс',
  'blockModal.classHint': 'Cu-экв {eq} % при бортовом {cutoff} %',
  'blockModal.sourceRow': 'Строка файла',
  'blockModal.remaining': 'Остаток (т)',
  'blockModal.remainingHint': 'От 0 до исходной массы {weight} т.',
  'blockModal.setFull': 'Полный',
  'blockModal.setZero': 'Отработан',
  'blockModal.dependency': 'Зависит от',
  'blockModal.dependencyHint':
    'Блок можно отрабатывать только после полной отработки выбранного блока — начиная с дня, когда родитель дорабатывается из остатка на начало суток менее {threshold} т.',
  'blockModal.dependencyNone': 'Нет зависимости',
  'blockModal.cycle': 'Это создаст циклическую зависимость: {chain}',
  'blockModal.self': 'Блок не может зависеть от самого себя.',
  'blockModal.children': 'Блоки, ожидающие этот блок',
  'blockModal.save': 'Сохранить',
  'blockModal.optionLabel': '{id} · {material} · {remaining} т',
  'blockModal.lockedNow': 'Сейчас заблокирован: у родителя осталось {remaining} т.',

  // Schedule rows
  'row.tonnage': 'Суточная производительность (руда)',
  'row.cu': 'Содержание меди',
  'row.mo': 'Содержание молибдена',
  'row.wasteMax': 'Макс. вскрыша',
  'row.kind.target': 'цель',
  'row.kind.limit': 'макс.',

  // Schedule table
  'schedule.empty': 'Выберите период планирования справа, чтобы построить график.',
  'schedule.targets': 'Целевые показатели',
  'schedule.rowHeader': 'Строка',
  'schedule.applyAll': 'Применить ко всем дням',
  'schedule.applyAllTitle': '{row} — все дни',
  'schedule.apply': 'Применить',
  'schedule.resetDefault': 'Сбросить к значению по умолчанию ({value})',
  'schedule.overridden': 'Изменено (по умолчанию {value})',
  'schedule.cellLabel': '{row}, {date}',
  'schedule.daysCount': '{count} дн.',

  // Calendar
  'calendar.range': 'Диапазон дат',
  'calendar.presets': 'Быстрый выбор',
  'calendar.next': 'Следующие {days} дн.',
  'calendar.clear': 'Очистить',
  'calendar.summary': '{days} дн. · {start} – {end}',
  'calendar.none': 'Период не выбран.',
  'calendar.maxDays': 'Не более {days} дн.',

  // Solve
  'solve.calculate': 'Рассчитать график',
  'solve.aimExact': 'Точно в цель',
  'solve.aimExactHelp':
    'Отмечено: каждый день выполняется точно по цели; при нехватке запасов недовыполнение приходится на последние дни. Не отмечено: всё в пределах ±допуска считается выполнением, поэтому нехватка запасов распределяется на большее число дней у границы допуска. Цвета всегда показывают попадание в ±допуск.',
  'solve.cancel': 'Отмена',
  'solve.needBlocks': 'Сначала загрузите блоки.',
  'solve.needRange': 'Сначала выберите период планирования.',
  'solve.phase.loading': 'Загрузка решателя…',
  'solve.phase.building': 'Построение модели…',
  'solve.phase.solving': 'Оптимизация…',
  'solve.phase.rolling': 'Расчёт дня {day} из {days}…',
  'solve.elapsed': '{seconds} с',
  'solve.done': 'График рассчитан за {seconds} с.',
  'solve.cancelled': 'Расчёт отменён.',
  'solve.failed': 'Ошибка расчёта: {error}',
  'solve.status.optimal': 'Оптимально',
  'solve.status.time_limit': 'Лучшее найденное (лимит времени)',
  'solve.status.rolling_horizon': 'По дням',
  'solve.status.error': 'Ошибка',
  'solve.stale': 'Устарел — исходные данные изменены',
  'solve.summary': 'Руда {ore} т · вскрыша {waste} т · использовано блоков: {blocks}',
  'solve.warn.timeLimit': 'Достигнут лимит времени; показано лучшее найденное решение.',
  'solve.warn.timeLimitRolling':
    'Достигнут лимит времени; решение по дням оказалось лучше и показано оно.',
  'solve.warn.fullModelFailed': 'Полная модель вернула «{status}»; выполнен расчёт по дням.',
  'solve.warn.tooLarge':
    'Модель слишком велика для расчёта целиком ({xVars} переменных тоннажа, {binaries} бинарных переменных зависимостей); выполнен расчёт по дням. В этом режиме нельзя спланировать вскрышу родителей из пустой породы с остатком выше порога разблокировки на несколько дней.',

  // Results
  'result.section': 'Результаты',
  'result.achieved': 'Факт: {row}',
  'result.target': 'Цель',
  'result.band': 'Допуск',
  'result.balance': 'ост. {value}',
  'result.allocation': 'Распределение по блокам ({count})',
  'result.info.eq': 'Cu-экв (руда, справочно)',
  'result.info.as': 'As (руда, справочно)',
  'result.info.pb': 'Pb (руда, справочно)',
  'status.ok': 'в пределах допуска',
  'status.warn': 'в пределах допуска, у границы',
  'status.bad': 'вне допуска',
  'status.na': 'н/д',

  // Reasons
  'reason.noOre': 'В этот день руда не запланирована.',
  'reason.notEnoughStock':
    'Доступный незаблокированный запас {available} т меньше нижней границы допуска {min} т.',
  'reason.tradeOffGrades': 'Тоннаж снижен, чтобы удержать содержания в допуске.',
  'reason.tradeOffPriority': 'Уступает показателю с более высоким приоритетом.',
  'reason.gradeTooLow':
    'Наибольшее содержание среди доступных блоков — {id} ({grade} %), ниже нижней границы {min} %.',
  'reason.gradeTooHigh':
    'Наименьшее содержание среди доступных блоков — {id} ({grade} %), выше верхней границы {max} %.',
  'reason.locked': 'Заблокировано зависимостями блоков: {count} (родители: {parents}).',
  'reason.lockedByWaste': 'Руда ожидает вскрыши блоков {parents}.',
  'reason.limitExceeded': '{value} превышает предел {cap}.',

  // Day drawer
  'drawer.title': 'План на день — {date}',
  'drawer.open': 'Открыть план на {date}',
  'drawer.allocation': 'Порядок отработки',
  'drawer.orderHint': 'Родительские блоки отрабатываются раньше зависящих от них.',
  'drawer.tonnes': 'Тонны',
  'drawer.endBalance': 'Остаток после',
  'drawer.total': 'Итого',
  'drawer.cap': 'Предел',

  // Export
  'export.csv': 'Экспорт CSV',
  'export.xlsx': 'Экспорт XLSX',
  'export.failed': 'Ошибка экспорта: {error}',
  'export.staleHint': 'Исходные данные изменились после расчёта графика.',
  'export.row': 'Строка',
  'export.unit': 'Ед.',
  'export.target': 'цель',
  'export.achieved': 'факт',
  'export.deviation': 'отклонение',
  'export.status': 'Статус',
  'export.ok': 'В норме',
  'export.outside': 'Вне допуска',
  'export.block': 'Блок',
  'export.class': 'Класс',
  'export.sheet.summary': 'Сводка',
  'export.sheet.allocation': 'Распределение (т)',
  'export.sheet.balances': 'Остаток на конец (т)',

  // Accept / undo
  'accept.button': 'Утвердить график',
  'accept.confirmTitle': 'Утвердить этот график?',
  'accept.confirm':
    'Из остатков {blocks} блоков будет списано {tonnes} т. Действие можно отменить.',
  'accept.done': 'График утверждён; остатки обновлены для {blocks} блоков.',
  'accept.staleHint': 'Исходные данные изменились после расчёта. Пересчитайте перед утверждением.',
  'accept.error.noSchedule': 'Нет графика для утверждения.',
  'accept.error.stale':
    'Исходные данные изменились после расчёта. Пересчитайте перед утверждением.',
  'accept.error.empty': 'График не содержит отработки.',
  'undo.button': 'Отменить последнее утверждение',
  'undo.confirmTitle': 'Отменить последнее утверждение?',
  'undo.confirm':
    'Остатки {blocks} блоков будут восстановлены к значениям до утверждения периода {start} – {end}.',
  'undo.done': 'Последнее утверждение отменено; остатки восстановлены.',
  'undo.missing': 'Отмена невозможна: этих блоков больше нет: {blocks}.',
  'history.title': 'Утверждённые графики',
  'history.empty': 'Утверждённых графиков пока нет.',
  'history.item': '{start} – {end}',
  'history.detail': 'Утверждён {when} · {tonnes} т из {blocks} блоков',

  // Settings
  'settings.open': 'Настройки',
  'settings.title': 'Настройки',
  'settings.staleNote': 'Изменения применяются сразу и помечают текущий график как устаревший.',
  'settings.section.targets': 'Цели: допуск и приоритет',
  'settings.weightsHelp':
    'Вес вне допуска — штраф за выход за пределы ±допуска (больше = важнее). Вес центра — стремление к точному значению цели. Чтобы целиться точно в цель, а не в границу допуска, используйте флажок «Точно в цель» рядом с кнопкой расчёта.',
  'settings.row.row': 'Строка',
  'settings.row.tolerance': 'Допуск',
  'settings.row.weightOut': 'Вес вне допуска',
  'settings.row.weightIn': 'Вес центра',
  'settings.section.general': 'Классификация и зависимости',
  'settings.oreCutoff': 'Бортовое содержание (Cu-экв)',
  'settings.oreCutoffHelp':
    'Блоки с Cu-экв ниже этого значения — пустая порода: только вскрыша, в добычу не засчитываются.',
  'settings.release': 'Порог разблокировки зависимости',
  'settings.releaseHelp':
    'Зависимый блок можно отрабатывать в день доработки родителя, только если остаток родителя на начало суток был меньше этого значения.',
  'settings.amber': 'Жёлтое предупреждение выше',
  'settings.amberHelp':
    'Значения в пределах допуска, но отклоняющиеся от цели больше чем на эту величину, выделяются жёлтым.',
  'settings.section.solver': 'Решатель',
  'settings.rounding': 'Округлять тоннаж до',
  'settings.roundingHelp': 'Фактические показатели пересчитываются после округления.',
  'settings.timeLimit': 'Лимит времени',
  'settings.mipGap': 'Допустимый разрыв оптимальности',
  'settings.mipGapHelp':
    'Остановить расчёт, когда доказано, что решение не хуже лучшего возможного более чем на этот %.',
  'settings.earlyDays': 'Приоритет первых дней',
  'settings.earlyDaysHelp':
    '0 — все дни равноценны; 0,5 — первый день весит в 1,5 раза больше последнего, поэтому недовыполнение приходится на конец периода.',
  'settings.wasteCost': 'Стоимость вскрыши (за т)',
  'settings.wasteCostHelp':
    'Очень малая стоимость, чтобы вскрыша выполнялась только когда она открывает руду.',
  'settings.rolling': 'Расчёт по дням свыше (переменных)',
  'settings.rollingHelp':
    'Если число переменных «блок×день» больше этого значения, модель решается по одному дню.',
  'settings.reset': 'Сбросить настройки',
  'settings.resetConfirm': 'Сбросить все настройки решателя к значениям по умолчанию?',
  'settings.section.data': 'Данные',
  'settings.clearHelp':
    'Данные хранятся в этом браузере (IndexedDB). Очистка удаляет блоки, введённые данные, историю и настройки.',
  'settings.clear': 'Удалить все данные',
  'settings.clearConfirm': 'Удалить все сохранённые данные в этом браузере? Действие необратимо.',

  // Loading
  'load.loading': 'Загрузка сохранённых данных…',
  'load.errorTitle': 'Не удалось загрузить сохранённые данные',
  'load.error':
    'Приложение запущено с пустыми данными. Подробности: {message}. Копия старых данных сохранена под ключом «{backup}».',
  'load.noBackup': '(создаётся резервная копия)',

  // Actuals (Excel) and site names
  'field.site': 'Участок',
  'import.warn.siteUnparsed':
    'Участок «{site}» не распознан (ожидается, например, location_cn1740_mf_17); использован обычный ID.',
  'blockModal.fileValue': 'в файле: {value}',
  'blockModal.actuals':
    'Фактическая добыча до {date}: списано {tonnes} т; содержания пересчитаны для оставшейся массы.',
  'blockModal.actualsOverrun':
    'Фактическая добыча превысила массу блока на {tonnes} т; проверьте блочную модель.',
  'actuals.button': 'Импорт факта (Excel)',
  'actuals.hint':
    'Файл плана и факта за месяц: читается таблица «Добыча Руды», только фактические строки.',
  'actuals.title': 'Фактическая добыча — {name}',
  'actuals.fileInfo':
    'Лист «{sheet}» · фактических строк: {rows} · смен: {shifts} · {first} – {last}',
  'actuals.before': 'Учитывать фактическую добычу до',
  'actuals.beforeHint':
    'Учтено строк: {used}; строк с этой даты и позже (не учитываются): {after}.',
  'actuals.method':
    'Остаток = масса из файла − добыто. Содержание добытого = Σ(тонны за день × содержание за день) ÷ Σ тонн за день. Содержание остатка = (т в файле × содержание в файле − добыто т × содержание добытого) ÷ остаток т. Рудные строки одного участка делят тоннаж пропорционально своей массе; строки пустой породы не меняются. Повторный импорт пересчитывает от значений файла.',
  'actuals.noSites':
    'В списке блоков нет столбца «Участок», поэтому факт нельзя сопоставить. Загрузите файл блоков со столбцом «Участок».',
  'actuals.overrunWarn': 'Участков, где добыто больше рудной массы: {count}; эти блоки обнулены.',
  'actuals.unstableWarn':
    'Блоков с малым остатком и сильно изменившимся содержанием: {count}; сверьте их с блочной моделью.',
  'actuals.nothingMatched': 'Фактические данные не совпали ни с одним блоком из списка.',
  'actuals.col.name': 'Блок в Excel',
  'actuals.col.status': 'Статус',
  'actuals.col.extracted': 'Добыто, т',
  'actuals.col.avg': 'Средневзвешенное содержание, %',
  'actuals.col.result': 'Результат (остаток · содержание до → после)',
  'actuals.days': 'дн.',
  'actuals.status.applied': 'Применено',
  'actuals.status.overrun': 'Перебор +{tonnes} т',
  'actuals.status.unmatched': 'Нет в списке блоков',
  'actuals.status.noOre': 'Нет рудных строк',
  'actuals.status.ambiguous': 'Неоднозначно: {names}',
  'actuals.unstable': 'проверить',
  'actuals.clamped': '{grades} обнулено',
  'actuals.unmatched': 'Не найдено в списке блоков ({count}): {names}',
  'actuals.apply': 'Применить к блокам: {blocks}',
  'actuals.done': 'Факт применён к {blocks} блокам. Действие можно отменить.',
  'actuals.empty': 'В файле {name} не найдено фактических (Փաստ) строк с тоннажем.',
  'actuals.notFound':
    'Таблица добычи руды не найдена (ожидаются заголовки Ամսաթիվ, Բլոկի №, Հանքաքարի Հանույթ).',
  'undo.buttonActuals': 'Отменить импорт факта',
  'undo.confirmTitleActuals': 'Отменить импорт факта?',
  'undo.confirmActuals':
    'Остатки и содержания {blocks} блоков будут восстановлены к значениям до импорта факта ({start} – {end}).',
  'history.actualsItem': 'Факт {start} – {end}',

  // Units
  'unit.t': 'т',
  'unit.pct': '%',
  'unit.gpt': 'г/т',
  'unit.m3': 'м³',
  'unit.tm3': 'т/м³',
  'unit.m': 'м',
  'unit.s': 'с',

  // Language
  'language.label': 'Язык',

  'common.cancel': 'Отмена',
  'common.close': 'Закрыть',
};
