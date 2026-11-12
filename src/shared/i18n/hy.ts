import type { I18nKey } from './en';

/** Armenian. Typed against the English keys, so a missing key fails typecheck. */
export const hy: Record<I18nKey, string> = {
  'app.title': 'Pit Flow',
  'app.subtitle': 'Բացահանքի բլոկների արդյունահանման պլանավորում',
  'layout.blocks': 'Բլոկներ',
  'layout.schedule': 'Ժամանակացույց',
  'layout.calendar': 'Պլանավորման ժամանակահատված',

  // Fields
  'field.elevation': 'Բարձրության նիշ',
  'field.group': 'Խումբ',
  'field.material': 'Նյութ',
  'field.volume': 'Ծավալ',
  'field.weight': 'Զանգված',
  'field.cu': 'Cu',
  'field.mo': 'Mo',
  'field.as': 'As',
  'field.pb': 'Pb',
  'field.eq': 'Cu-համարժ.',
  'field.density': 'Խտություն',
  'field.remaining': 'Մնացորդ',

  // Block classes
  'class.ore': 'Հանքաքար',
  'class.waste': 'Դատարկ ապար',
  'class.all': 'Բոլորը',

  // Block list
  'blocks.empty': 'Բլոկներ բեռնված չեն։ Վերբեռնեք CSV կամ Excel ֆայլ։',
  'blocks.noMatch': 'Զտիչներին համապատասխանող բլոկներ չկան։',
  'blocks.search': 'Որոնել բլոկի ID-ով',
  'blocks.materialFilter': 'Նյութ',
  'blocks.sort': 'Դասավորել',
  'blocks.sort.id': 'ID',
  'blocks.sort.remaining': 'Մնացորդ',
  'blocks.sort.cu': 'Cu',
  'blocks.sort.mo': 'Mo',
  'blocks.sort.eq': 'Cu-համարժ.',
  'blocks.elevationGroup': 'Նիշ {elevation} մ',
  'blocks.count': '{shown} / {total} բլոկ',
  'blocks.locked': 'Արգելափակված',
  'blocks.lockedBy': 'Սպասում է՝ {parents}',
  'blocks.exhausted': 'Սպառված',
  'blocks.listLabel': 'Բլոկների ցանկ։ Սլաքներով տեղաշարժվեք, Enter-ով բացեք։',

  // Import
  'import.upload': 'Վերբեռնել բլոկները',
  'import.reading': '{name} ֆայլի ընթերցում…',
  'import.failed': 'Չհաջողվեց կարդալ {name}․ {error}',
  'import.empty': 'Ֆայլը դատարկ է։',
  'import.mapping.title': 'Սյունակների համապատասխանեցում',
  'import.mapping.intro':
    '{name} ֆայլում որոշ պարտադիր սյունակներ չեն ճանաչվել։ Նշեք, թե ֆայլի որ սյունակում է յուրաքանչյուր դաշտը։',
  'import.mapping.field': 'Դաշտ',
  'import.mapping.column': 'Ֆայլի սյունակ',
  'import.mapping.sample': 'Առաջին արժեքը',
  'import.mapping.required': 'պարտադիր',
  'import.mapping.notMapped': '— ֆայլում չկա —',
  'import.mapping.duplicate': '«{column}» սյունակը նշանակված է մեկից ավելի դաշտի։',
  'import.mapping.ok': 'Ներմուծել',
  'import.reimport.title': 'Բլոկներն արդեն բեռնված են',
  'import.reimport.intro':
    'Բեռնված է {existing} բլոկ։ Նոր ֆայլում կա {incoming} վավեր բլոկ։ Ինչպե՞ս միավորել դրանք։',
  'import.reimport.replace': 'Փոխարինել բոլորը',
  'import.reimport.replaceHint':
    'Ջնջել ընթացիկ բլոկները, մնացորդները և կախվածությունները և ամեն ինչ բեռնել ֆայլից։',
  'import.reimport.merge': 'Միավորել ըստ բլոկի ID-ի',
  'import.reimport.mergeHint':
    'Պահպանել մնացորդներն ու կախվածությունները համընկնող ID-ների համար, ավելացնել նոր բլոկները, հեռացնել ֆայլում բացակայող բլոկները։',
  'import.summary.title': 'Ներմուծման արդյունքներ — {name}',
  'import.summary.rows': 'Կարդացված տողեր',
  'import.summary.imported': 'Ներմուծված',
  'import.summary.skipped': 'Բաց թողնված',
  'import.summary.warnings': 'Զգուշացումներ',
  'import.summary.ore': 'Հանքաքարի բլոկներ',
  'import.summary.waste': 'Դատարկ ապարի բլոկներ',
  'import.summary.format': 'Ձևաչափ',
  'import.summary.nothing': 'Վավեր տողեր չեն գտնվել, ընթացիկ բլոկները չեն փոխվել։',
  'import.summary.row': 'Տող',
  'import.summary.level': 'Տեսակ',
  'import.summary.message': 'Մանրամասներ',
  'import.summary.error': 'Բաց թողնված',
  'import.summary.warning': 'Զգուշացում',
  'import.summary.parseErrors': 'Ֆայլի վերլուծության խնդիրներ',
  'import.summary.merge': 'Միավորման արդյունք',
  'import.summary.added': 'Ավելացված',
  'import.summary.updated': 'Պահպանված օգտատիրոջ տվյալներ',
  'import.summary.removed': 'Հեռացված (ֆայլում չկան)',
  'import.summary.droppedDeps': 'Հեռացված կախվածություններ (ծնող բլոկը հեռացված է)',
  'import.summary.clamped': 'Մնացորդը նվազեցված է մինչև նոր զանգվածը',
  'import.summary.ignoredColumns': 'Անտեսված սյունակներ՝ {columns}',

  // Import validation messages
  'import.err.missing': '{field}՝ նշված չէ',
  'import.err.notNumber': '{field}՝ թիվ չէ',
  'import.err.negative': '{field}՝ պետք է լինի ≥ 0',
  'import.err.positive': '{field}՝ պետք է լինի > 0',
  'import.err.gradeMax': '{field}՝ պետք է լինի 100 %-ից փոքր',
  'import.warn.duplicateId': 'Կրկնվող ID {id}․ վերանվանվել է {renamed}',
  'import.warn.density':
    'Ծավալ × խտություն = {expected} տ, տարբերվում է {weight} տ զանգվածից {diff} %-ով',

  // Block modal
  'blockModal.title': 'Բլոկ {id}',
  'blockModal.properties': 'Հատկություններ ֆայլից',
  'blockModal.id': 'Բլոկի ID',
  'blockModal.class': 'Դաս',
  'blockModal.classHint': 'Cu-համարժ. {eq} %, եզրային {cutoff} %',
  'blockModal.sourceRow': 'Ֆայլի տող',
  'blockModal.remaining': 'Մնացորդ (տ)',
  'blockModal.remainingHint': '0-ից մինչև սկզբնական զանգվածը՝ {weight} տ։',
  'blockModal.setFull': 'Ամբողջը',
  'blockModal.setZero': 'Սպառված',
  'blockModal.dependency': 'Կախված է',
  'blockModal.dependencyHint':
    'Այս բլոկը կարելի է արդյունահանել միայն ընտրված բլոկի ամբողջական արդյունահանումից հետո՝ սկսած այն օրվանից, երբ ծնող բլոկն ավարտվում է օրվա սկզբի {threshold} տ-ից պակաս մնացորդից։',
  'blockModal.dependencyNone': 'Կախվածություն չկա',
  'blockModal.cycle': 'Սա կստեղծի շրջանային կախվածություն՝ {chain}',
  'blockModal.self': 'Բլոկը չի կարող կախված լինել ինքն իրենից։',
  'blockModal.children': 'Այս բլոկին սպասող բլոկներ',
  'blockModal.save': 'Պահպանել',
  'blockModal.optionLabel': '{id} · {material} · {remaining} տ',
  'blockModal.lockedNow': 'Այժմ արգելափակված է․ ծնող բլոկում մնացել է {remaining} տ։',

  // Schedule rows
  'row.tonnage': 'Օրական արտադրողականություն (հանքաքար)',
  'row.cu': 'Պղնձի պարունակություն',
  'row.mo': 'Մոլիբդենի պարունակություն',
  'row.wasteMax': 'Առավելագույն մերկացում',
  'row.kind.target': 'նպատակ',
  'row.kind.limit': 'առավ.',

  // Schedule table
  'schedule.empty': 'Ժամանակացույց կազմելու համար աջ կողմում ընտրեք պլանավորման ժամանակահատվածը։',
  'schedule.targets': 'Նպատակային ցուցանիշներ',
  'schedule.rowHeader': 'Տող',
  'schedule.applyAll': 'Կիրառել բոլոր օրերին',
  'schedule.applyAllTitle': '{row} — բոլոր օրերը',
  'schedule.apply': 'Կիրառել',
  'schedule.resetDefault': 'Վերադարձնել լռելյայն արժեքը ({value})',
  'schedule.overridden': 'Փոփոխված (լռելյայն՝ {value})',
  'schedule.cellLabel': '{row}, {date}',
  'schedule.daysCount': '{count} օր',

  // Calendar
  'calendar.range': 'Ամսաթվերի միջակայք',
  'calendar.presets': 'Արագ ընտրություն',
  'calendar.next': 'Հաջորդ {days} օրը',
  'calendar.clear': 'Մաքրել',
  'calendar.summary': '{days} օր · {start} – {end}',
  'calendar.none': 'Ժամանակահատված ընտրված չէ։',
  'calendar.maxDays': 'Առավելագույնը {days} օր։',

  // Solve
  'solve.calculate': 'Հաշվարկել ժամանակացույցը',
  'solve.aimExact': 'Ճշգրիտ նպատակային արժեք',
  'solve.aimExactHelp':
    'Նշված է՝ յուրաքանչյուր օր կատարվում է ճշգրիտ նպատակային արժեքով․ պաշարների պակասի դեպքում թերակատարումն ընկնում է վերջին օրերի վրա։ Նշված չէ՝ ±թույլատրելի շեղման սահմաններում ամեն ինչ համարվում է կատարված, ուստի պաշարների պակասը բաշխվում է ավելի շատ օրերի վրա՝ սահմանի մոտ։ Գույները միշտ ցույց են տալիս ±թույլատրելի շեղումը։',
  'solve.cancel': 'Չեղարկել',
  'solve.needBlocks': 'Նախ բեռնեք բլոկները։',
  'solve.needRange': 'Նախ ընտրեք պլանավորման ժամանակահատվածը։',
  'solve.phase.loading': 'Լուծիչի բեռնում…',
  'solve.phase.building': 'Մոդելի կառուցում…',
  'solve.phase.solving': 'Օպտիմալացում…',
  'solve.phase.rolling': 'Հաշվարկվում է {day}-րդ օրը {days}-ից…',
  'solve.elapsed': '{seconds} վ',
  'solve.done': 'Ժամանակացույցը հաշվարկվեց {seconds} վ-ում։',
  'solve.cancelled': 'Հաշվարկը չեղարկվեց։',
  'solve.failed': 'Հաշվարկի սխալ՝ {error}',
  'solve.status.optimal': 'Օպտիմալ',
  'solve.status.time_limit': 'Լավագույնը գտնվածներից (ժամանակի սահման)',
  'solve.status.rolling_horizon': 'Ըստ օրերի',
  'solve.status.error': 'Սխալ',
  'solve.stale': 'Հնացած է — մուտքային տվյալները փոխվել են',
  'solve.summary': 'Հանքաքար {ore} տ · մերկացում {waste} տ · օգտագործված բլոկներ՝ {blocks}',
  'solve.warn.timeLimit': 'Ժամանակի սահմանը լրացավ․ ցուցադրվում է գտնված լավագույն լուծումը։',
  'solve.warn.timeLimitRolling':
    'Ժամանակի սահմանը լրացավ․ ըստ օրերի լուծումն ավելի լավն էր և ցուցադրվում է այն։',
  'solve.warn.fullModelFailed':
    'Ամբողջական մոդելը վերադարձրեց «{status}»․ հաշվարկը կատարվեց ըստ օրերի։',
  'solve.warn.tooLarge':
    'Մոդելը չափազանց մեծ է ամբողջությամբ լուծելու համար ({xVars} տոննաժի փոփոխական, {binaries} կախվածության երկուական փոփոխական)․ հաշվարկը կատարվեց ըստ օրերի։ Այս ռեժիմում հնարավոր չէ մի քանի օրով պլանավորել այն դատարկ ապարի ծնող բլոկների մերկացումը, որոնց մնացորդը գերազանցում է ապաարգելափակման շեմը։',

  // Results
  'result.section': 'Արդյունքներ',
  'result.achieved': 'Փաստացի՝ {row}',
  'result.target': 'Նպատակ',
  'result.band': 'Թույլատրելի միջակայք',
  'result.balance': 'մն. {value}',
  'result.allocation': 'Բաշխում ըստ բլոկների ({count})',
  'result.info.eq': 'Cu-համարժ. (հանքաքար, տեղեկ.)',
  'result.info.as': 'As (հանքաքար, տեղեկ.)',
  'result.info.pb': 'Pb (հանքաքար, տեղեկ.)',
  'status.ok': 'թույլատրելի միջակայքում',
  'status.warn': 'միջակայքում, սահմանի մոտ',
  'status.bad': 'միջակայքից դուրս',
  'status.na': 'չկա',

  // Reasons
  'reason.noOre': 'Այս օրը հանքաքար պլանավորված չէ։',
  'reason.notEnoughStock':
    'Հասանելի չարգելափակված պաշարը՝ {available} տ, փոքր է միջակայքի նվազագույնից՝ {min} տ։',
  'reason.tradeOffGrades': 'Տոննաժը նվազեցվել է՝ պարունակությունները միջակայքում պահելու համար։',
  'reason.tradeOffPriority': 'Զիջում է ավելի բարձր առաջնահերթությամբ ցուցանիշին։',
  'reason.gradeTooLow':
    'Հասանելի բլոկներից ամենաբարձր պարունակությունն ունի {id}-ը ({grade} %), որը ցածր է միջակայքի նվազագույնից՝ {min} %։',
  'reason.gradeTooHigh':
    'Հասանելի բլոկներից ամենացածր պարունակությունն ունի {id}-ը ({grade} %), որը բարձր է միջակայքի առավելագույնից՝ {max} %։',
  'reason.locked': 'Կախվածությամբ արգելափակված բլոկներ՝ {count} (ծնողներ՝ {parents})։',
  'reason.lockedByWaste': 'Հանքաքարը սպասում է {parents} բլոկների մերկացմանը։',
  'reason.limitExceeded': '{value}-ը գերազանցում է {cap} սահմանը։',

  // Day drawer
  'drawer.title': 'Օրվա պլան — {date}',
  'drawer.open': 'Բացել {date}-ի պլանը',
  'drawer.allocation': 'Արդյունահանման հերթականություն',
  'drawer.orderHint': 'Ծնող բլոկներն արդյունահանվում են իրենցից կախված բլոկներից առաջ։',
  'drawer.tonnes': 'Տոննա',
  'drawer.endBalance': 'Մնացորդը հետո',
  'drawer.total': 'Ընդամենը',
  'drawer.cap': 'Սահման',

  // Export
  'export.csv': 'Արտահանել CSV',
  'export.xlsx': 'Արտահանել XLSX',
  'export.failed': 'Արտահանման սխալ՝ {error}',
  'export.staleHint': 'Մուտքային տվյալները փոխվել են ժամանակացույցի հաշվարկից հետո։',
  'export.row': 'Տող',
  'export.unit': 'Միավոր',
  'export.target': 'նպատակ',
  'export.achieved': 'փաստացի',
  'export.deviation': 'շեղում',
  'export.status': 'Կարգավիճակ',
  'export.ok': 'Կարգին է',
  'export.outside': 'Միջակայքից դուրս',
  'export.block': 'Բլոկ',
  'export.class': 'Դաս',
  'export.sheet.summary': 'Ամփոփում',
  'export.sheet.allocation': 'Բաշխում (տ)',
  'export.sheet.balances': 'Վերջնական մնացորդ (տ)',

  // Accept / undo
  'accept.button': 'Հաստատել ժամանակացույցը',
  'accept.confirmTitle': 'Հաստատե՞լ այս ժամանակացույցը',
  'accept.confirm': '{blocks} բլոկի մնացորդից կհանվի {tonnes} տ։ Գործողությունը կարելի է չեղարկել։',
  'accept.done': 'Ժամանակացույցը հաստատվեց․ մնացորդները թարմացվեցին {blocks} բլոկի համար։',
  'accept.staleHint':
    'Մուտքային տվյալները փոխվել են հաշվարկից հետո։ Հաստատելուց առաջ վերահաշվարկեք։',
  'accept.error.noSchedule': 'Հաստատելու ժամանակացույց չկա։',
  'accept.error.stale':
    'Մուտքային տվյալները փոխվել են հաշվարկից հետո։ Հաստատելուց առաջ վերահաշվարկեք։',
  'accept.error.empty': 'Ժամանակացույցում արդյունահանում չկա։',
  'undo.button': 'Չեղարկել վերջին հաստատումը',
  'undo.confirmTitle': 'Չեղարկե՞լ վերջին հաստատումը',
  'undo.confirm':
    '{blocks} բլոկի մնացորդները կվերադարձվեն {start} – {end} ժամանակահատվածի հաստատումից առաջ եղած արժեքներին։',
  'undo.done': 'Վերջին հաստատումը չեղարկվեց․ մնացորդները վերականգնվեցին։',
  'undo.missing': 'Չեղարկել հնարավոր չէ․ այս բլոկներն այլևս գոյություն չունեն՝ {blocks}։',
  'history.title': 'Հաստատված ժամանակացույցեր',
  'history.empty': 'Հաստատված ժամանակացույցեր դեռ չկան։',
  'history.item': '{start} – {end}',
  'history.detail': 'Հաստատվել է {when} · {tonnes} տ {blocks} բլոկից',

  // Settings
  'settings.open': 'Կարգավորումներ',
  'settings.title': 'Կարգավորումներ',
  'settings.staleNote':
    'Փոփոխությունները կիրառվում են անմիջապես և ընթացիկ ժամանակացույցը նշում են որպես հնացած։',
  'settings.section.targets': 'Նպատակներ՝ թույլատրելի շեղում և առաջնահերթություն',
  'settings.weightsHelp':
    'Միջակայքից դուրս կշիռ՝ տույժ ±թույլատրելի շեղման սահմաններից դուրս գալու համար (մեծ = ավելի կարևոր)։ Կենտրոնի կշիռ՝ ձգտում դեպի ճշգրիտ նպատակային արժեքը։ Միջակայքի սահմանի փոխարեն ճշգրիտ արժեքին ձգտելու համար օգտագործեք «Ճշգրիտ նպատակային արժեք» նշավանդակը հաշվարկի կոճակի կողքին։',
  'settings.row.row': 'Տող',
  'settings.row.tolerance': 'Թույլատրելի շեղում',
  'settings.row.weightOut': 'Միջակայքից դուրս կշիռ',
  'settings.row.weightIn': 'Կենտրոնի կշիռ',
  'settings.section.general': 'Դասակարգում և կախվածություններ',
  'settings.oreCutoff': 'Եզրային պարունակություն (Cu-համարժ.)',
  'settings.oreCutoffHelp':
    'Այս Cu-համարժեքից ցածր բլոկները դատարկ ապար են՝ միայն մերկացվում են և չեն հաշվվում որպես արդյունահանում։',
  'settings.release': 'Կախվածության ապաարգելափակման շեմ',
  'settings.releaseHelp':
    'Կախյալ բլոկը կարելի է արդյունահանել ծնող բլոկի ավարտի օրը միայն այն դեպքում, եթե ծնողի մնացորդն օրվա սկզբին փոքր էր այս արժեքից։',
  'settings.amber': 'Դեղին զգուշացում՝ սկսած',
  'settings.amberHelp':
    'Միջակայքում գտնվող, բայց նպատակից այս չափից ավելի շեղված արժեքները նշվում են դեղինով։',
  'settings.section.solver': 'Լուծիչ',
  'settings.rounding': 'Կլորացնել տոննաժը մինչև',
  'settings.roundingHelp': 'Փաստացի ցուցանիշները վերահաշվարկվում են կլորացումից հետո։',
  'settings.timeLimit': 'Ժամանակի սահման',
  'settings.mipGap': 'Օպտիմալության թույլատրելի խզում',
  'settings.mipGapHelp':
    'Կանգնեցնել, երբ ապացուցված է, որ լուծումը լավագույն հնարավորից վատ չէ այս %-ից ավելի։',
  'settings.earlyDays': 'Առաջին օրերի առաջնահերթություն',
  'settings.earlyDaysHelp':
    '0՝ բոլոր օրերը հավասար են․ 0,5՝ առաջին օրը 1,5 անգամ ավելի կարևոր է վերջինից, ուստի թերակատարումն ընկնում է ժամանակահատվածի վերջի վրա։',
  'settings.wasteCost': 'Մերկացման արժեք (1 տ-ի համար)',
  'settings.wasteCostHelp':
    'Շատ փոքր արժեք, որպեսզի մերկացում կատարվի միայն այն դեպքում, երբ այն բացում է հանքաքար։',
  'settings.rolling': 'Հաշվարկ ըստ օրերի՝ սկսած (փոփոխական)',
  'settings.rollingHelp':
    'Եթե «բլոկ×օր» փոփոխականների թիվը գերազանցում է այս արժեքը, մոդելը լուծվում է օր առ օր։',
  'settings.reset': 'Վերականգնել լռելյայն կարգավորումները',
  'settings.resetConfirm': 'Վերականգնե՞լ լուծիչի բոլոր կարգավորումների լռելյայն արժեքները',
  'settings.section.data': 'Տվյալներ',
  'settings.clearHelp':
    'Տվյալները պահվում են այս դիտարկիչում (IndexedDB)։ Մաքրումը ջնջում է բլոկները, մուտքագրված տվյալները, պատմությունը և կարգավորումները։',
  'settings.clear': 'Ջնջել բոլոր տվյալները',
  'settings.clearConfirm':
    'Ջնջե՞լ այս դիտարկիչում պահված բոլոր տվյալները։ Գործողությունն անդառնալի է։',

  // Loading
  'load.loading': 'Պահված տվյալների բեռնում…',
  'load.errorTitle': 'Չհաջողվեց բեռնել պահված տվյալները',
  'load.error':
    'Հավելվածը գործարկվեց դատարկ տվյալներով։ Մանրամասներ՝ {message}։ Հին տվյալների պատճենը պահվել է «{backup}» բանալու ներքո։',
  'load.noBackup': '(պահուստային պատճենը ստեղծվում է)',

  // Units
  'unit.t': 'տ',
  'unit.pct': '%',
  'unit.gpt': 'գ/տ',
  'unit.m3': 'մ³',
  'unit.tm3': 'տ/մ³',
  'unit.m': 'մ',
  'unit.s': 'վ',

  // Language
  'language.label': 'Լեզու',

  'common.cancel': 'Չեղարկել',
  'common.close': 'Փակել',
};
