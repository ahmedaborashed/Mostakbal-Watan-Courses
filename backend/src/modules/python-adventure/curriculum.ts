// backend/src/modules/python-adventure/curriculum.ts

export const ACHIEVEMENTS_LIST = {
  first_code: {
    id: "first_code",
    title: "أول سطر بايثون",
    description: "قمت بتشغيل وإكمال أول برنامج بلغة بايثون في مغامرتك.",
    icon: "🐍"
  },
  loop_master: {
    id: "loop_master",
    title: "سيد حلقات التكرار",
    description: "أكملت جميع تحديات غابة التكرار (Loop Forest).",
    icon: "🔁"
  },
  bug_hunter: {
    id: "bug_hunter",
    title: "صياد الأخطاء البرمجية",
    description: "نجحت في حل 3 مهام تصحيح أخطاء (Debugging).",
    icon: "🐞"
  },
  boss_slayer: {
    id: "boss_slayer",
    title: "قاهر الزعماء",
    description: "هزمت زعيم أحد العوالم واجتزت التحدي الأسطوري.",
    icon: "👑"
  },
  python_hero: {
    id: "python_hero",
    title: "بطل بايثون الأسطوري",
    description: "أنهيت المشروع الختامي وأتممت مسار مغامرة بايثون كاملاً!",
    icon: "🏆"
  }
};

export const WORLDS_CONFIG = [
  { id: "world-1", number: 1, title: "قرية بايثون", icon: "🏠", concept: "الطباعة والعمليات الحسابية" },
  { id: "world-2", number: 2, title: "وادي المتغيرات", icon: "🔢", concept: "المتغيرات والأنواع والإدخال" },
  { id: "world-3", number: 3, title: "كهف الشروط", icon: "🔀", concept: "الشروط والمنطق if/elif/else" },
  { id: "world-4", number: 4, title: "غابة التكرار", icon: "🔁", concept: "حلقات التكرار for و while" },
  { id: "world-5", number: 5, title: "مدينة القوائم", icon: "📦", concept: "القوائم والبيانات ومصفوفاتها" },
  { id: "world-6", number: 6, title: "مصنع الدوال", icon: "⚙️", concept: "بناء الدوال واستدعاؤها def" },
  { id: "world-7", number: 7, title: "قلعة الكائنات", icon: "🧱", concept: "البرمجة الكائنية OOP Classes" },
  { id: "world-8", number: 8, title: "حلبة الأبطال", icon: "🏆", concept: "المشروع الختامي الشامل" }
];

export const PYTHON_ADVENTURE_CHALLENGES: Record<string, any> = {
  // WORLD 1: PYTHON VILLAGE
  "world-1-level-1": {
    id: "world-1-level-1",
    worldId: "world-1",
    levelNumber: 1,
    title: "أهلاً بك في بايثون",
    subtitle: "المهمة الأولى: إضاءة لافتة القرية",
    difficulty: "easy",
    type: "write_code",
    baseXp: 50,
    skills: ["print", "strings"],
    story: "أهلاً بك في قرية بايثون (Python Village)! لافتة القرية بحاجة إلى إضاءة ترحيبية بالقادمين الجدد. استخدم أمر print لإرسال رسالة ترحيبية إلى الشاشة.",
    microLesson: {
      title: "أمر الطباعة print()",
      content: "في لغة بايثون، نستخدم الدالة print() لطباعة وعرض أي نصوص أو أرقام على الشاشة.\nنضع النصوص بين علامات تنصيص '...' أو \"...\".",
      exampleCode: 'print("مرحباً بك!")\nprint(100)'
    },
    starterCode: '# اكتب كود الطباعة أدناه\n',
    requirements: [
      "استخدم أمر print()",
      "اطبع العبارة: Hello Python أو مرحباً بايثون"
    ],
    outputIncludes: ["Python"],
    hints: [
      "فكر في الدالة المستخدمة لإخراج النصوص إلى الشاشة.",
      "استخدم print('...')",
      "تأكد من وضع النص بين علامتي تنصيص.",
      "ابدأ بكتابة: print('Hello Python')"
    ],
    nextChallengeId: "world-1-level-2"
  },
  "world-1-level-2": {
    id: "world-1-level-2",
    worldId: "world-1",
    levelNumber: 2,
    title: "حساب غنائم القرية",
    subtitle: "العمليات الحسابية المباشرة",
    difficulty: "easy",
    type: "write_code",
    baseXp: 60,
    skills: ["arithmetic", "numbers"],
    story: "عثر حراس القرية على 3 صناديق ذهب في كل صندوق 25 عملة، ثم حصلوا على مكافأة إضافية قدرها 15 عملة. احسب إجمالي العملات واطبعه.",
    microLesson: {
      title: "الحساب في بايثون",
      content: "تستطيع بايثون إجراء العمليات الحسابية مباشرة كآلة حاسبة ذكية:\n+ للجمع، - للطرح، * للضرب، / للقسمة.",
      exampleCode: 'print(5 + 3)\nprint(10 * 2)'
    },
    starterCode: '# احسب واطبع الناتج المباشر: (3 * 25) + 15\n',
    requirements: [
      "احسب: (3 * 25) + 15",
      "اطبع الناتج مباشرة بدون نصوص إضافية (الناتج هو 90)"
    ],
    expectedOutput: "90",
    hints: [
      "الضرب يكتب بعلامة النجمة * والجمع بعلامة +",
      "اكتب التعبير الرياضي مباشرة داخل print",
      "print(3 * 25 + 15)"
    ],
    nextChallengeId: "world-1-level-3"
  },
  "world-1-level-3": {
    id: "world-1-level-3",
    worldId: "world-1",
    levelNumber: 3,
    title: "إصلاح لافتة الحارس",
    subtitle: "صائد الأخطاء: خطأ في صياغة الكود SyntaxError",
    difficulty: "easy",
    type: "fix_code",
    baseXp: 70,
    skills: ["debugging", "syntax"],
    story: "كتب أحد المبتدئين كود لافتة الحارس لكنه وقع في خطأ صياغة بسيط يمنع الكود من العمل! مهمتك هي اكتشاف الخطأ وإصلاحه لتعمل اللافتة.",
    microLesson: {
      title: "أخطاء الصياغة (Syntax Errors)",
      content: "بايثون لغة دقيقة! كل قوس مفتوح ( يجب أن يغلق بمثله )، وكل علامة تنصيص يجب أن تقفل.",
      exampleCode: '# خطأ: print("مرحبا\n# صحيح: print("مرحبا")'
    },
    starterCode: 'print("Village Gate is Open"\n',
    requirements: [
      "أصلح القوس المفقود في سطر الطباعة",
      "تأكد أن الكود يطبع: Village Gate is Open"
    ],
    expectedOutput: "Village Gate is Open",
    hints: [
      "انظر إلى نهاية السطر، هل نسيت إغلاق القوس؟",
      "أضف قوس الإغلاق ) في نهاية السطر."
    ],
    nextChallengeId: "world-1-level-4"
  },
  "world-1-level-4": {
    id: "world-1-level-4",
    worldId: "world-1",
    levelNumber: 4,
    title: "👑 حارس بوابة القرية",
    subtitle: "تحدي الزعيم: امتحان اجتياز قرية بايثون",
    difficulty: "boss",
    type: "boss",
    baseXp: 150,
    skills: ["print", "arithmetic", "integration"],
    story: "يقف حارس بوابة القرية العملاق! لن يفتح البوابة إلى وادي المتغيرات إلا إذا قمت بطباعة سطرين: السطر الأول 'Welcome to Python World' والسطر الثاني ناتج حساب (100 - 25 * 2). أظهر له براعتك!",
    microLesson: {
      title: "تحدي الزعيم",
      content: "اجمع ما تعلمته: الطباعة في سطرين مختلفين والعمليات الحسابية مع مراعاة أولويات العمليات (الضرب قبل الطرح).",
      exampleCode: 'print("Line 1")\nprint(10 + 5)'
    },
    starterCode: '# اطبع السطر الأول: Welcome to Python World\n# اطبع السطر الثاني: ناتج حساب (100 - 25 * 2)\n',
    requirements: [
      "اطبع في السطر الأول: Welcome to Python World",
      "اطبع في السطر الثاني ناتج الحساب (الناتج هو 50)"
    ],
    expectedOutput: "Welcome to Python World\n50",
    hints: [
      "استخدم أمرين print منفصلين.",
      "السطر الأول: print('Welcome to Python World')",
      "السطر الثاني: print(100 - 25 * 2)"
    ],
    unlocksWorldId: "world-2",
    nextChallengeId: "world-2-level-1"
  },

  // WORLD 2: VARIABLES VALLEY
  "world-2-level-1": {
    id: "world-2-level-1",
    worldId: "world-2",
    levelNumber: 1,
    title: "صندوق كنوز الوادي",
    subtitle: "تعريف واستخدام المتغيرات",
    difficulty: "easy",
    type: "write_code",
    baseXp: 80,
    skills: ["variables", "integers", "strings"],
    story: "في وادي المتغيرات (Variables Valley)، نحفظ البيانات في صناديق تسمى متغيرات (Variables). قم بتعريف متغير اسمه gold بقيمة 50، ومتغير اسمه hero_name بقيمة 'Ahmed' أو اسمك، ثم اطبع قيمة gold.",
    microLesson: {
      title: "المتغيرات في بايثون",
      content: "المتغير هو مساحة في الذاكرة لتخزين قيمة باسم يسهل الرجوع إليه:\nx = 10\nname = 'Sarah'\nprint(x)",
      exampleCode: "coins = 100\nprint(coins)"
    },
    starterCode: '# عرف المتغير gold والمتغير hero_name\n',
    requirements: [
      "عرف متغير باسم gold بقيمة عددية",
      "اطبع قيمة gold"
    ],
    requiredPatterns: [
      { regex: "gold\\s*=", messageAr: "يجب تعريف متغير باسم gold." },
      { regex: "print\\s*\\(.*gold.*\\)", messageAr: "يجب طباعة المتغير gold." }
    ],
    hints: [
      "اكتب: gold = 50",
      "ثم في السطر التالي: print(gold)"
    ],
    nextChallengeId: "world-2-level-2"
  },
  "world-2-level-2": {
    id: "world-2-level-2",
    worldId: "world-2",
    levelNumber: 2,
    title: "محول العملات السحرية",
    subtitle: "التحويل بين الأنواع وعمليات الجمع",
    difficulty: "medium",
    type: "write_code",
    baseXp: 90,
    skills: ["type_casting", "math"],
    story: "تصلك كمية الذهب كنص '150' وتريد مضاعفتها بالضرب في 2. حول النص إلى رقم صحيح باستخدام int() ثم اطبع الناتج المضاعف.",
    microLesson: {
      title: "تحويل الأنواع Type Casting",
      content: "النصوص لا يمكن إجراء ضرب حسابي حقيقي عليها إلا بعد تحويلها إلى رقم صحيح باستخدام int() أو رقم عشري باستخدام float().",
      exampleCode: "str_num = '25'\nreal_num = int(str_num)\nprint(real_num * 2)  # 50"
    },
    starterCode: "gold_str = '150'\n# حول gold_str إلى رقم واطبع ناتج ضربه في 2\n",
    requirements: [
      "استخدم int(gold_str) للتحويل",
      "اطبع الناتج المضاعف (300)"
    ],
    expectedOutput: "300",
    hints: [
      "gold_num = int(gold_str)",
      "print(gold_num * 2)"
    ],
    nextChallengeId: "world-2-level-3"
  },
  "world-2-level-3": {
    id: "world-2-level-3",
    worldId: "world-2",
    levelNumber: 3,
    title: "إكمال فاتورة التاجر",
    subtitle: "إكمال الكود: صيغة f-string الأنيقة",
    difficulty: "medium",
    type: "complete_code",
    baseXp: 90,
    skills: ["f-strings", "formatting"],
    story: "تاجر الوادي يريد طباعة فاتورة بالصيغة: 'Total: 250 Coins'. أكمل الفراغ في f-string لطباعة القيمة الصحيحة.",
    microLesson: {
      title: "سلاسل f-string المنسقة",
      content: "نضع حرف f قبل علامة التنصيص ونكتب المتغير داخل أقواس معقوفة {variable}:\nprice = 100\nprint(f'Price: {price}')",
      exampleCode: "name = 'Ali'\nprint(f'Hello {name}')"
    },
    starterCode: "total = 250\n# أكمل الكود التالي لطباعة: Total: 250 Coins\nprint(f'Total: {_____} Coins')\n",
    requirements: [
      "ضع اسم المتغير total داخل الأقواس المعقوفة",
      "اطبع العبارة: Total: 250 Coins"
    ],
    expectedOutput: "Total: 250 Coins",
    hints: [
      "استبدل _____ باسم المتغير total",
      "print(f'Total: {total} Coins')"
    ],
    nextChallengeId: "world-2-level-4"
  },
  "world-2-level-4": {
    id: "world-2-level-4",
    worldId: "world-2",
    levelNumber: 4,
    title: "👑 تاجر الوادي العظيم",
    subtitle: "تحدي الزعيم: نظام محاسبة الوادي",
    difficulty: "boss",
    type: "boss",
    baseXp: 180,
    skills: ["variables", "arithmetic", "f-strings"],
    story: "التاجر العظيم يطلب منك حساب السعر النهائي لشحنة دروع: سعر السلعة price = 400، ونسبة الضريبة tax = 50، والخصم discount = 30. احسب final_price = price + tax - discount واطبع النتيجة بالصيغة: 'Final Price: 420'",
    microLesson: {
      title: "تحدي الزعيم",
      content: "عرف المتغيرات الثلاثة، احسب الناتج النهائي وخزنه في متغير، ثم اطبعه باستخدام f-string أو دمج النصوص.",
      exampleCode: "a = 10\nb = 2\nc = a + b\nprint(f'Result: {c}')"
    },
    starterCode: "price = 400\ntax = 50\ndiscount = 30\n# احسب final_price واطبع: Final Price: 420\n",
    requirements: [
      "احسب final_price = price + tax - discount",
      "اطبع النتيجة مطابقة تماماً: Final Price: 420"
    ],
    expectedOutput: "Final Price: 420",
    hints: [
      "final_price = price + tax - discount",
      "print(f'Final Price: {final_price}')"
    ],
    unlocksWorldId: "world-3",
    nextChallengeId: "world-3-level-1"
  },

  // WORLD 3: CONDITIONS CAVE
  "world-3-level-1": {
    id: "world-3-level-1",
    worldId: "world-3",
    levelNumber: 1,
    title: "بوابة فحص السن",
    subtitle: "استخدام الجملة الشرطية if",
    difficulty: "easy",
    type: "write_code",
    baseXp: 80,
    skills: ["conditions", "if"],
    story: "وصلت إلى كهف الشروط (Conditions Cave). بوابة الكهف تفحص عمر المغامر age = 20. إذا كان العمر 18 أو أكثر، اطبع 'Access Granted'.",
    microLesson: {
      title: "الجملة الشرطية if",
      content: "تتيح لك if تنفيذ أوامر معينة فقط إذا تحقق شرط معين:\nif age >= 18:\n    print('مسموح')",
      exampleCode: "x = 10\nif x > 5:\n    print('Greater than 5')"
    },
    starterCode: "age = 20\n# اكتب شرط if لفحص إذا كان age >= 18 اطبع Access Granted\n",
    requirements: [
      "استخدم if age >= 18:",
      "اطبع: Access Granted"
    ],
    expectedOutput: "Access Granted",
    hints: [
      "تذكر وضع النقطتين : في نهاية سطر if",
      "اجعل سطر print مائلاً بمسافة بادئة (4 مسافات)"
    ],
    nextChallengeId: "world-3-level-2"
  },
  "world-3-level-2": {
    id: "world-3-level-2",
    worldId: "world-3",
    levelNumber: 2,
    title: "رتبة المغامر السحرية",
    subtitle: "تعدد الشروط if / elif / else",
    difficulty: "medium",
    type: "write_code",
    baseXp: 90,
    skills: ["elif", "else"],
    story: "يحدد الكهف رتبتك حسب النقاط score = 85:\nإذا كانت النقاط >= 90 اطبع 'Diamond'\nإذا كانت النقاط >= 80 اطبع 'Gold'\nغير ذلك اطبع 'Silver'",
    microLesson: {
      title: "تعدد الشروط elif",
      content: "عند وجود أكثر من احتمال نستخدم elif، وفي النهاية نضع else للحالات المتبقية:\nif x > 90: ...\nelif x > 80: ...\nelse: ...",
      exampleCode: "score = 75\nif score >= 90:\n    print('A')\nelif score >= 70:\n    print('B')\nelse:\n    print('C')"
    },
    starterCode: "score = 85\n# اكتب الشروط الثلاثة\n",
    requirements: [
      "افحص قيمة score",
      "الناتج لدرجة 85 يجب أن يطبع: Gold"
    ],
    expectedOutput: "Gold",
    hints: [
      "if score >= 90: print('Diamond')",
      "elif score >= 80: print('Gold')",
      "else: print('Silver')"
    ],
    nextChallengeId: "world-3-level-3"
  },
  "world-3-level-3": {
    id: "world-3-level-3",
    worldId: "world-3",
    levelNumber: 3,
    title: "فخ علامة المساواة",
    subtitle: "صائد الأخطاء: الفرق بين = و ==",
    difficulty: "medium",
    type: "fix_code",
    baseXp: 85,
    skills: ["debugging", "comparison"],
    story: "وقع مبرمج الكهف في أشهر خطأ في بايثون! استخدم = (إسناد قيمة) بدلاً من == (مقارنة الشرط). أصلح الكود ليعمل بنجاح.",
    microLesson: {
      title: "= مقابل ==",
      content: "= تستخدم لتعيين قيمة لمتغير: x = 5\nبينما == تستخدم للمقارنة وفحص التساوي: if x == 5:",
      exampleCode: "x = 5\nif x == 5:\n    print('Equal')"
    },
    starterCode: "magic_number = 7\n# أصلح الخطأ في السطر التالي:\nif magic_number = 7:\n    print('Unlocked')\n",
    requirements: [
      "استبدل = بـ == في سطر الشرط",
      "اطبع: Unlocked"
    ],
    expectedOutput: "Unlocked",
    hints: [
      "في سطر if، يجب أن تكون المقارنة بـ == وليس ="
    ],
    nextChallengeId: "world-3-level-4"
  },
  "world-3-level-4": {
    id: "world-3-level-4",
    worldId: "world-3",
    levelNumber: 4,
    title: "👑 لغز حكيم الكهف",
    subtitle: "تحدي الزعيم: فك شفرة الكهف المعقدة",
    difficulty: "boss",
    type: "boss",
    baseXp: 200,
    skills: ["logical_operators", "nested_conditions"],
    story: "يقف حكيم الكهف أمام الممر المؤدي لغابة التكرار! ولديك مفتاحان: has_key = True و energy = 80. افتح البوابة إذا كان لديك المفتاح و الطاقة أكبر من أو تساوي 50 بطباعة: 'Cave Master Defeated'",
    microLesson: {
      title: "العوامل المنطقية and و or",
      content: "نستخدم and للتأكد من تحقق الشرطين معاً:\nif has_pass and score > 50:\n    print('Passed')",
      exampleCode: "x = 10\ny = 20\nif x > 5 and y > 15:\n    print('Both True')"
    },
    starterCode: "has_key = True\nenergy = 80\n# افحص الشرطين معاً باستخدام and\n",
    requirements: [
      "استخدم if مع and للتحقق من has_key و energy >= 50",
      "اطبع العبارة: Cave Master Defeated"
    ],
    expectedOutput: "Cave Master Defeated",
    hints: [
      "if has_key and energy >= 50:",
      "    print('Cave Master Defeated')"
    ],
    unlocksWorldId: "world-4",
    nextChallengeId: "world-4-level-1"
  },

  // WORLD 4: LOOP FOREST
  "world-4-level-1": {
    id: "world-4-level-1",
    worldId: "world-4",
    levelNumber: 1,
    title: "فتح البوابات الخمس",
    subtitle: "التكرار باستخدام for و range",
    difficulty: "easy",
    type: "write_code",
    baseXp: 90,
    skills: ["for_loop", "range"],
    story: "غابة التكرار (Loop Forest) تحتاج مساعدتك! هناك 5 بوابات يجب فتحها مرقمة من 0 إلى 4. استخدم loop بدل تكرار الكود لطباعة أرقام البوابات.",
    microLesson: {
      title: "حلقة التكرار for loop",
      content: "تستخدم for لتكرار تنفيذ مجموعة من الأوامر لعدد محدد من المرات باستخدام range(n):\nfor i in range(5):\n    print(i)",
      exampleCode: "for i in range(3):\n    print('Hello')"
    },
    starterCode: '# استخدم for مع range(5) لطباعة الأرقام من 0 إلى 4\n',
    requirements: [
      "استخدم for loop",
      "استخدم range(5)",
      "اطبع الأرقام من 0 إلى 4 كل رقم في سطر"
    ],
    requiredPatterns: [
      { regex: "for\\s+\\w+\\s+in\\s+range\\s*\\(\\s*5\\s*\\)", messageAr: "يجب استخدام for مع range(5)." }
    ],
    expectedOutput: "0\n1\n2\n3\n4",
    hints: [
      "ابدأ بـ: for i in range(5):",
      "داخل الحلقة: print(i)"
    ],
    nextChallengeId: "world-4-level-2"
  },
  "world-4-level-2": {
    id: "world-4-level-2",
    worldId: "world-4",
    levelNumber: 2,
    title: "جمع ثمار الغابة",
    subtitle: "نمط التراكم والتجميع Accumulator Pattern",
    difficulty: "medium",
    type: "write_code",
    baseXp: 100,
    skills: ["accumulation", "for_loop"],
    story: "اجمع ثمار الغابة! اكتب برنامجاً يحسب مجموع الأعداد من 1 إلى 5 باستخدام for loop واطبع الناتج النهائي فقط (15).",
    microLesson: {
      title: "تجميع القيم في حلقة التكرار",
      content: "نعرف متغيراً للمجموع قبل الحلقة بقيمة صفر، ثم نضيف له في كل دورة:\ntotal = 0\nfor i in range(1, 4):\n    total += i\nprint(total)",
      exampleCode: "s = 0\nfor x in [1, 2, 3]:\n    s += x\nprint(s)"
    },
    starterCode: "total = 0\n# استخدم for loop لإضافة الأعداد من 1 إلى 5 إلى total\n# ثم اطبع total خارج الحلقة\n",
    requirements: [
      "استخدم for loop مع range(1, 6)",
      "اجمع الأعداد في المتغير total",
      "اطبع الناتج النهائي فقط: 15"
    ],
    requiredPatterns: [
      { regex: "for\\s+", messageAr: "يجب استخدام حلقة التكرار for." }
    ],
    expectedOutput: "15",
    hints: [
      "range(1, 6) يعطيك الأعداد 1، 2، 3، 4، 5",
      "داخل الحلقة: total += i أو total = total + i",
      "تأكد أن print(total) ليست داخل الحلقة بل بعدها بدون مسافة بادئة"
    ],
    nextChallengeId: "world-4-level-3"
  },
  "world-4-level-3": {
    id: "world-4-level-3",
    worldId: "world-4",
    levelNumber: 3,
    title: "فخ الحلقة اللانهائية",
    subtitle: "صائد الأخطاء: حلقة while لا تتوقف!",
    difficulty: "medium",
    type: "fix_code",
    baseXp: 95,
    skills: ["while_loop", "debugging"],
    story: "عالقون في دوامة زمنية بغابة التكرار! كود حلقة while نسي زيادة العداد count مما تسبب في حلقة لا نهائية. أصلح الكود بطباعة count من 1 إلى 3 وتحديث العداد.",
    microLesson: {
      title: "حلقات while وتفادي التكرار اللانهائي",
      content: "حلقة while تستمر طالما الشرط True. لذلك يجب تعديل المتغير في كل دورة حتى يتوقف الشرط:\ncount = 1\nwhile count <= 3:\n    print(count)\n    count += 1",
      exampleCode: "i = 0\nwhile i < 2:\n    print(i)\n    i += 1"
    },
    starterCode: "count = 1\nwhile count <= 3:\n    print(count)\n    # أضف السطر الناقص لزيادة count هنا\n",
    requirements: [
      "أضف زيادة للعداد: count += 1 أو count = count + 1",
      "تأكد أن الكود يطبع: 1 ثم 2 ثم 3 ويتوقف"
    ],
    expectedOutput: "1\n2\n3",
    hints: [
      "داخل الحلقة، أضف السطر: count += 1"
    ],
    nextChallengeId: "world-4-level-4"
  },
  "world-4-level-4": {
    id: "world-4-level-4",
    worldId: "world-4",
    levelNumber: 4,
    title: "👑 وحش شجرة السنديان العتيقة",
    subtitle: "تحدي الزعيم: العد التنازلي لهزيمة الوحش",
    difficulty: "boss",
    type: "boss",
    baseXp: 220,
    skills: ["loops", "reverse_range", "integration"],
    story: "وحش السنديان العملاق يهدد الغابة! عليك إطلاق تعويذة عد تنازلي من 3 إلى 1 ثم طباعة 'Monster Defeated!'. استخدم حلقة تكرار لطباعة 3 ثم 2 ثم 1 ثم اطبع عبارة النصر.",
    microLesson: {
      title: "العد التنازلي",
      content: "يمكنك العد تنازلياً باستخدام range(3, 0, -1) أو باستخدام حلقة while تنقص 1 في كل مرة.",
      exampleCode: "for i in range(3, 0, -1):\n    print(i)\nprint('Go!')"
    },
    starterCode: '# اطبع 3 ثم 2 ثم 1 باستخدام loop، ثم اطبع Monster Defeated!\n',
    requirements: [
      "استخدم loop للعد التنازلي 3, 2, 1",
      "اطبع في النهاية: Monster Defeated!"
    ],
    expectedOutput: "3\n2\n1\nMonster Defeated!",
    hints: [
      "for i in [3, 2, 1]: print(i)",
      "أو for i in range(3, 0, -1): print(i)",
      "ثم print('Monster Defeated!')"
    ],
    unlocksWorldId: "world-5",
    nextChallengeId: "world-5-level-1"
  },

  // WORLD 5: LISTS CITY
  "world-5-level-1": {
    id: "world-5-level-1",
    worldId: "world-5",
    levelNumber: 1,
    title: "حقيبة أدوات المدينة",
    subtitle: "إنشاء القوائم والفهرسة Indexing",
    difficulty: "easy",
    type: "write_code",
    baseXp: 90,
    skills: ["lists", "indexing"],
    story: "مرحباً بك في مدينة القوائم (Lists City)! أنشئ قائمة باسم items تحتوي على العناصر الثلاثة: 'sword', 'shield', 'potion'. ثم اطبع العنصر الأول باستخدام الفهرس [0].",
    microLesson: {
      title: "القوائم Lists والفهرسة",
      content: "القوائم تحفظ عدة عناصر بين أقواس مربعة []، ويبدأ ترقيم العناصر من الصفر 0:\nmy_list = ['A', 'B', 'C']\nprint(my_list[0])  # 'A'",
      exampleCode: "heroes = ['Omar', 'Sara']\nprint(heroes[0])"
    },
    starterCode: '# أنشئ قائمة items واطبع العنصر الأول sword\n',
    requirements: [
      "أنشئ items = ['sword', 'shield', 'potion']",
      "اطبع items[0] فقط (sword)"
    ],
    expectedOutput: "sword",
    hints: [
      "items = ['sword', 'shield', 'potion']",
      "print(items[0])"
    ],
    nextChallengeId: "world-5-level-2"
  },
  "world-5-level-2": {
    id: "world-5-level-2",
    worldId: "world-5",
    levelNumber: 2,
    title: "إضافة أداة سحرية للقائمة",
    subtitle: "دالة الإضافة append ودالة الطول len",
    difficulty: "medium",
    type: "write_code",
    baseXp: 95,
    skills: ["append", "len"],
    story: "لديك قائمة spells = ['fire', 'ice']. أضف إليها العنصر 'thunder' باستخدام append() ثم اطبع عدد عناصر القائمة باستخدام len().",
    microLesson: {
      title: "تعديل القوائم",
      content: "نستخدم .append() لإضافة عنصر في نهاية القائمة، ونستخدم len() لمعرفة عدد عناصرها:\nnums = [1, 2]\nnums.append(3)\nprint(len(nums))  # 3",
      exampleCode: "colors = ['red']\ncolors.append('blue')\nprint(len(colors))"
    },
    starterCode: "spells = ['fire', 'ice']\n# أضف 'thunder' ثم اطبع طول القائمة\n",
    requirements: [
      "استخدم spells.append('thunder')",
      "اطبع len(spells) (الناتج هو 3)"
    ],
    expectedOutput: "3",
    hints: [
      "spells.append('thunder')",
      "print(len(spells))"
    ],
    nextChallengeId: "world-5-level-3"
  },
  "world-5-level-3": {
    id: "world-5-level-3",
    worldId: "world-5",
    levelNumber: 3,
    title: "فهرس خارج النطاق IndexError",
    subtitle: "صائد الأخطاء: طلب عنصر غير موجود",
    difficulty: "medium",
    type: "fix_code",
    baseXp: 90,
    skills: ["debugging", "index_error"],
    story: "حاول أحد المبرمجين طباعة العنصر الأخير من قائمة بها 3 عناصر فقط، فكتب index 3 وتسبب في خطأ IndexError! أصلح الفهرس ليطبع العنصر الأخير الصحيح 'Gold'.",
    microLesson: {
      title: "IndexError",
      content: "إذا كانت القائمة تحتوي 3 عناصر، فإن الفهارس المتاحة هي 0 و 1 و 2 فقط. العنصر الأخير يكون دائماً عند الفهرس len - 1 أو الفهرس السالب [-1]!",
      exampleCode: "lst = ['A', 'B']\n# lst[2] يسبب خطأ\n# lst[1] أو lst[-1] صحيح"
    },
    starterCode: "rewards = ['Bronze', 'Silver', 'Gold']\n# أصلح الفهرس في السطر التالي لطباعة Gold\nprint(rewards[3])\n",
    requirements: [
      "أصلح الفهرس ليكون 2 أو -1",
      "تأكد أن الكود يطبع: Gold"
    ],
    expectedOutput: "Gold",
    hints: [
      "استبدل 3 بـ 2 أو بـ -1"
    ],
    nextChallengeId: "world-5-level-4"
  },
  "world-5-level-4": {
    id: "world-5-level-4",
    worldId: "world-5",
    levelNumber: 4,
    title: "👑 حاكم مدينة القوائم",
    subtitle: "تحدي الزعيم: تصفية وحساب القيم الفائزة",
    difficulty: "boss",
    type: "boss",
    baseXp: 240,
    skills: ["lists", "loops", "filters"],
    story: "حاكم المدينة يختبر قدرتك على معالجة البيانات الضخمة! لديك قائمة درجات scores = [45, 80, 95, 30, 88]. احسب عدد الدرجات الناجحة (التي تكون >= 50) واطبع هذا العدد.",
    microLesson: {
      title: "المرور على القوائم مع الشروط",
      content: "نمر على القائمة بحلقة for، ونفحص كل عنصر بجملة if، ونزيد عداد الناجحين:\npass_count = 0\nfor s in scores:\n    if s >= 50:\n        pass_count += 1\nprint(pass_count)",
      exampleCode: "nums = [1, 10, 3, 20]\nbig = 0\nfor n in nums:\n    if n > 5:\n        big += 1\nprint(big)"
    },
    starterCode: "scores = [45, 80, 95, 30, 88]\npass_count = 0\n# مر على الدرجات وزد pass_count للدرجات >= 50 ثم اطبعه\n",
    requirements: [
      "مر على القائمة وافحص الدرجات >= 50",
      "اطبع عدد الدرجات الناجحة فقط (3)"
    ],
    expectedOutput: "3",
    hints: [
      "for s in scores:",
      "    if s >= 50: pass_count += 1",
      "print(pass_count)"
    ],
    unlocksWorldId: "world-6",
    nextChallengeId: "world-6-level-1"
  },

  // WORLD 6: FUNCTIONS FACTORY
  "world-6-level-1": {
    id: "world-6-level-1",
    worldId: "world-6",
    levelNumber: 1,
    title: "آلة الترحيب الذاتي",
    subtitle: "تعريف واستدعاء الدوال def",
    difficulty: "easy",
    type: "write_code",
    baseXp: 95,
    skills: ["functions", "def"],
    story: "وصلت إلى مصنع الدوال (Functions Factory)! هنا نقوم ببناء آلات برمجية يعاد استخدامها. عرف دالة باسم greet تأخذ معاملاً name وتطبع f'Hello {name}'، ثم استدعها بالاسم 'Hero'.",
    microLesson: {
      title: "بناء الدوال def",
      content: "الدالة هي كتلة برمجية يعاد استخدامها وتأخذ مدخلات وتنفذ مهمة محددة:\ndef say_hi(name):\n    print(f'Hi {name}')\nsay_hi('Ali')",
      exampleCode: "def add_one(x):\n    print(x + 1)\nadd_one(5)"
    },
    starterCode: '# عرف دالة greet(name) واستدعها بـ Hero\n',
    requirements: [
      "عرف دالة: def greet(name):",
      "استدعها: greet('Hero')",
      "يجب أن يطبع: Hello Hero"
    ],
    expectedOutput: "Hello Hero",
    hints: [
      "def greet(name):",
      "    print(f'Hello {name}')",
      "greet('Hero')"
    ],
    nextChallengeId: "world-6-level-2"
  },
  "world-6-level-2": {
    id: "world-6-level-2",
    worldId: "world-6",
    levelNumber: 2,
    title: "محرك حساب المساحات",
    subtitle: "إرجاع القيم باستخدام return",
    difficulty: "medium",
    type: "write_code",
    baseXp: 100,
    skills: ["return", "functions"],
    story: "عرف دالة اسمها calculate_area تأخذ العرض width والطول height وترجع (return) مساحة المستطيل width * height. ثم اطبع ناتج استدعائها بالقيم 5 و 4.",
    microLesson: {
      title: "الفرق بين print و return",
      content: "print تعرض النتيجة على الشاشة فقط، أما return فتعيد القيمة المحسوبة لاستخدامها في حسابات أخرى:\ndef square(n):\n    return n * n\nresult = square(4)\nprint(result)",
      exampleCode: "def mult(a, b):\n    return a * b\nprint(mult(3, 4))"
    },
    starterCode: '# عرف calculate_area واجعلها ترجع width * height ثم اطبع ناتج 5 و 4\n',
    requirements: [
      "استخدم كلمة return",
      "اطبع الناتج: 20"
    ],
    expectedOutput: "20",
    hints: [
      "def calculate_area(w, h): return w * h",
      "print(calculate_area(5, 4))"
    ],
    nextChallengeId: "world-6-level-3"
  },
  "world-6-level-3": {
    id: "world-6-level-3",
    worldId: "world-6",
    levelNumber: 3,
    title: "صائد الأخطاء: return المنسية",
    subtitle: "صائد الأخطاء: الدالة تعيد None!",
    difficulty: "medium",
    type: "fix_code",
    baseXp: 95,
    skills: ["debugging", "return_none"],
    story: "الدالة التالية تحسب ضعف الرقم، لكن المبرمج نسي كلمة return فصارت ترجع None! أصلح الدالة لترجع القيمة الصحيحة ليطبع 100.",
    microLesson: {
      title: "لماذا تظهر None؟",
      content: "إذا لم تستخدم كلمة return داخل الدالة في بايثون، فإن الدالة ترجع القيمة الخاصة None تلقائياً!",
      exampleCode: "def bad():\n    x = 10\n# bad() تعيد None\ndef good():\n    return 10"
    },
    starterCode: "def double_number(x):\n    # أصلح السطر التالي بإرجاع القيمة بدلاً من طباعتها\n    result = x * 2\n\nval = double_number(50)\nprint(val)\n",
    requirements: [
      "أضف return result داخل الدالة",
      "تأكد أن الناتج المطبوع هو 100"
    ],
    expectedOutput: "100",
    hints: [
      "ضع return result داخل الدالة double_number"
    ],
    nextChallengeId: "world-6-level-4"
  },
  "world-6-level-4": {
    id: "world-6-level-4",
    worldId: "world-6",
    levelNumber: 4,
    title: "👑 كبير مهندسي المصنع",
    subtitle: "تحدي الزعيم: دالة فاحص الأرقام الزوجية",
    difficulty: "boss",
    type: "boss",
    baseXp: 260,
    skills: ["functions", "modulo", "booleans"],
    story: "كبير مهندسي المصنع يتحداك لبناء دالة ذكية is_even(n) ترجع True إذا كان الرقم زوجياً و False إذا كان فردياً (باستخدام n % 2 == 0). ثم اطبع ناتج استدعائها للرقم 10 ثم للرقم 7 في سطرين.",
    microLesson: {
      title: "عامل باقي القسمة Modulo %",
      content: "الرقم الزوجي يقبل القسمة على 2 بدون باقٍ، أي n % 2 == 0:\ndef is_even(n):\n    return n % 2 == 0",
      exampleCode: "print(4 % 2 == 0) # True\nprint(5 % 2 == 0) # False"
    },
    starterCode: "# عرف الدالة is_even واطبع نتيجة 10 ثم 7\n",
    requirements: [
      "عرف دالة is_even(n)",
      "اطبع نتيجة is_even(10) في سطر (True)",
      "اطبع نتيجة is_even(7) في سطر (False)"
    ],
    expectedOutput: "True\nFalse",
    hints: [
      "def is_even(n): return n % 2 == 0",
      "print(is_even(10))",
      "print(is_even(7))"
    ],
    unlocksWorldId: "world-7",
    nextChallengeId: "world-7-level-1"
  },

  // WORLD 7: OOP CASTLE
  "world-7-level-1": {
    id: "world-7-level-1",
    worldId: "world-7",
    levelNumber: 1,
    title: "درع الفارس",
    subtitle: "بناء أول كائن وفئة Class & Object",
    difficulty: "medium",
    type: "write_code",
    baseXp: 110,
    skills: ["classes", "objects", "init"],
    story: "أهلاً بك في قلعة الكائنات (OOP Castle)! أنشئ فئة (Class) باسم Player تمتلك دالة بناء __init__ تأخذ name و health. أنشئ كائناً باسم p1 بالاسم 'Knight' والصحة 100 واطبع p1.name.",
    microLesson: {
      title: "الفئات والكائنات Classes & Objects",
      content: "الفئة هي قالب لبناء كائنات ذات خصائص محددة:\nclass Cat:\n    def __init__(self, name):\n        self.name = name\nc = Cat('Kitty')\nprint(c.name)",
      exampleCode: "class Car:\n    def __init__(self, model):\n        self.model = model\nmy_car = Car('Toyota')\nprint(my_car.model)"
    },
    starterCode: '# أنشئ class Player واطبع اسم اللاعب Knight\n',
    requirements: [
      "عرف class Player:",
      "عرف def __init__(self, name, health):",
      "أنشئ p1 = Player('Knight', 100)",
      "اطبع p1.name"
    ],
    expectedOutput: "Knight",
    hints: [
      "class Player:",
      "    def __init__(self, name, health):",
      "        self.name = name",
      "        self.health = health",
      "p1 = Player('Knight', 100)",
      "print(p1.name)"
    ],
    nextChallengeId: "world-7-level-2"
  },
  "world-7-level-2": {
    id: "world-7-level-2",
    worldId: "world-7",
    levelNumber: 2,
    title: "مهارة الهجوم السحري",
    subtitle: "إضافة دوال للفئة Methods",
    difficulty: "medium",
    type: "write_code",
    baseXp: 120,
    skills: ["methods", "self"],
    story: "أضف دالة اسمها attack داخل فئة Player تطبع f'{self.name} attacks!'. أنشئ كائناً بالاسم 'Wizard' واستدعِ دالة attack الخاصة به.",
    microLesson: {
      title: "دوال الكائنات Methods",
      content: "الدوال داخل الفئات تسمى Methods ويجب أن يكون معامِلها الأول دائماً هو self للإشارة للكائن الحالي:\nclass Dog:\n    def bark(self):\n        print('Woof!')",
      exampleCode: "class Bot:\n    def ping(self):\n        print('Pong')\nb = Bot()\nb.ping()"
    },
    starterCode: "class Player:\n    def __init__(self, name):\n        self.name = name\n    # أضف دالة attack(self)\n\np = Player('Wizard')\np.attack()\n",
    requirements: [
      "أضف دالة attack تطبع: Wizard attacks!",
      "تأكد من استخدام self.name داخل النص"
    ],
    expectedOutput: "Wizard attacks!",
    hints: [
      "def attack(self):",
      "    print(f'{self.name} attacks!')"
    ],
    nextChallengeId: "world-7-level-3"
  },
  "world-7-level-3": {
    id: "world-7-level-3",
    worldId: "world-7",
    levelNumber: 3,
    title: "صائد الأخطاء: سحر self المفقود",
    subtitle: "صائد الأخطاء: نسيان self في دالة البناء",
    difficulty: "hard",
    type: "fix_code",
    baseXp: 120,
    skills: ["debugging", "self_scope"],
    story: "نسي المبرمج ربط الخاصية بالكائن باستخدام self.power، فتسبب في عدم حفظ الخاصية! أصلح الكود ليتم تخزين self.power = power ويطبع القوة 50.",
    microLesson: {
      title: "أهمية self.",
      content: "المتغيرات داخل __init__ تكون محلية وتنتهي عند انتهاء الدالة، ما لم نربطها بالكائن باستخدام self.property = value!",
      exampleCode: "def __init__(self, x):\n    # خطأ: x = x\n    # صحيح:\n    self.x = x"
    },
    starterCode: "class Weapon:\n    def __init__(self, power):\n        # أصلح السطر التالي ليربط الخاصية بـ self\n        power = power\n\nw = Weapon(50)\n# الكود التالي يجب أن يطبع 50 بعد الإصلاح\nprint(w.power)\n",
    requirements: [
      "استبدل power = power بـ self.power = power",
      "تأكد أن الكود يطبع: 50"
    ],
    expectedOutput: "50",
    hints: [
      "غير power = power إلى self.power = power"
    ],
    nextChallengeId: "world-7-level-4"
  },
  "world-7-level-4": {
    id: "world-7-level-4",
    worldId: "world-7",
    levelNumber: 4,
    title: "👑 تنين البرمجة الكائنية الأسطوري",
    subtitle: "تحدي الزعيم: معركة الفئات التفاعلية",
    difficulty: "boss",
    type: "boss",
    baseXp: 300,
    skills: ["oop", "methods", "state_mutation"],
    story: "تنين القلعة يختبر فهمك الكامل! أنشئ فئة Dragon لها خاصية health = 100، ودالة take_damage(self, amount) تنقص مقدار الضرر من الصحة وتطبع الصحة المتبقية f'Dragon Health: {self.health}'. أنشئ التنين وسبب له ضرراً بقيمة 30!",
    microLesson: {
      title: "تعديل حالة الكائن",
      content: "تستطيع دوال الكائنات تعديل خصائص الكائن نفسه:\ndef take_damage(self, amount):\n    self.health -= amount",
      exampleCode: "class Account:\n    def __init__(self, bal):\n        self.bal = bal\n    def withdraw(self, m):\n        self.bal -= m"
    },
    starterCode: "# أنشئ class Dragon ونفذ المعركة\n",
    requirements: [
      "عرف class Dragon مع health = 100",
      "أضف دالة take_damage(self, amount) تنقص الصحة وتطبع: Dragon Health: 70",
      "أنشئ التنين واستدعِ take_damage(30)"
    ],
    expectedOutput: "Dragon Health: 70",
    hints: [
      "class Dragon:",
      "    def __init__(self): self.health = 100",
      "    def take_damage(self, amount):",
      "        self.health -= amount",
      "        print(f'Dragon Health: {self.health}')",
      "d = Dragon()",
      "d.take_damage(30)"
    ],
    unlocksWorldId: "world-8",
    nextChallengeId: "world-8-level-1"
  },

  // WORLD 8: FINAL ARENA
  "world-8-level-1": {
    id: "world-8-level-1",
    worldId: "world-8",
    levelNumber: 1,
    title: "محلل درجات الطلاب الذكي",
    subtitle: "مشروع مصغر: دمج القوائم وحساب المتوسطات",
    difficulty: "hard",
    type: "write_code",
    baseXp: 200,
    skills: ["integration", "math", "loops", "lists"],
    story: "أهلاً بك في حلبة الأبطال (Final Arena)! لديك قائمة درجات طلاب grades = [70, 85, 90, 75]. احسب متوسط الدرجات (مجموع الدرجات مقسوماً على عددها len) واطبع بالصيغة: f'Average: {avg}' مع العلم أن الناتج هو 80.0.",
    microLesson: {
      title: "المشروع الختامي - الجزء 1",
      content: "تطبيق عملي يجمع القوائم وحساب المجموع sum أو التكرار مع القسمة لإخراج المتوسط الإحصائي.",
      exampleCode: "nums = [10, 20]\navg = sum(nums) / len(nums)\nprint(f'Average: {avg}')"
    },
    starterCode: "grades = [70, 85, 90, 75]\n# احسب واطبع Average: 80.0\n",
    requirements: [
      "احسب المتوسط = مجموع grades / عدد grades",
      "اطبع: Average: 80.0"
    ],
    expectedOutput: "Average: 80.0",
    hints: [
      "avg = sum(grades) / len(grades)",
      "print(f'Average: {avg}')"
    ],
    nextChallengeId: "world-8-level-2"
  },
  "world-8-level-2": {
    id: "world-8-level-2",
    worldId: "world-8",
    levelNumber: 2,
    title: "نظام إدارة المهام البرمجية",
    subtitle: "مشروع مصغر: دوال إدارة المهام والتكرار",
    difficulty: "hard",
    type: "write_code",
    baseXp: 250,
    skills: ["lists", "functions", "formatting"],
    story: "اكتب برنامجاً يدير مهام اليوم: عرف دالة display_tasks(tasks) تمر على القائمة وتطبع كل مهمة مسبوقة برقمها الترتيبي بدءاً من 1: f'{index}. {task}'. استدعها بقائمة ['Study', 'Code', 'Play'].",
    microLesson: {
      title: "ترقيم العناصر",
      content: "يمكنك استخدام عداد أو enumerate(tasks, 1) لترقيم العناصر من 1:\nfor i, task in enumerate(tasks, 1):\n    print(f'{i}. {task}')",
      exampleCode: "items = ['A', 'B']\nfor idx, val in enumerate(items, 1):\n    print(f'{idx}. {val}')"
    },
    starterCode: "# عرف دالة display_tasks واستدعها بقائمة المهام\n",
    requirements: [
      "اطبع كل مهمة في سطر:",
      "1. Study",
      "2. Code",
      "3. Play"
    ],
    expectedOutput: "1. Study\n2. Code\n3. Play",
    hints: [
      "def display_tasks(tasks):",
      "    for i, t in enumerate(tasks, 1):",
      "        print(f'{i}. {t}')",
      "display_tasks(['Study', 'Code', 'Play'])"
    ],
    nextChallengeId: "world-8-level-3"
  },
  "world-8-level-3": {
    id: "world-8-level-3",
    worldId: "world-8",
    levelNumber: 3,
    title: "🏆 بطل بايثون الأسطوري",
    subtitle: "تحدي التخرج النهائي: محرك معركة أبطال بايثون",
    difficulty: "boss",
    type: "boss",
    baseXp: 500,
    skills: ["mastery", "oop", "algorithms", "final_project"],
    story: "المعركة الختامية لمغامرة بايثون! اكتب برنامجاً متكاملاً يعرف class Hero بالاسم hero_name والصحة health. يمتلك دالة heal(amount) تزيد الصحة، ودالة status() تطبع f'{self.hero_name} - HP: {self.health}'. أنشئ بطلاً بالاسم 'Python Hero' وصحة 80، ثم عالجه بـ 20 نقطة، ثم اطبع حالته status()!",
    microLesson: {
      title: "تتويج بطل بايثون",
      content: "لقد أتقنت المتغيرات، والشروط، والحلقات، والقوائم، والدوال، والكائنات البرمجية! اجمع كل مهاراتك لاجتياز التحدي الأخير وتتويجك بلقب Python Hero.",
      exampleCode: "class Hero:\n    # بناء الفئة والدوال واستدعاؤها"
    },
    starterCode: "# ابنِ فئة Hero ونفذ متطلبات المعركة الختامية\n",
    requirements: [
      "عرف class Hero مع دالة __init__ ودالة heal ودالة status",
      "أنشئ بطلاً بالاسم 'Python Hero' وصحة 80",
      "استدعِ heal(20)",
      "استدعِ status() ليطبع: Python Hero - HP: 100"
    ],
    expectedOutput: "Python Hero - HP: 100",
    hints: [
      "class Hero:",
      "    def __init__(self, name, health):",
      "        self.name = name",
      "        self.health = health",
      "    def heal(self, amount):",
      "        self.health += amount",
      "    def status(self):",
      "        print(f'{self.name} - HP: {self.health}')",
      "h = Hero('Python Hero', 80)",
      "h.heal(20)",
      "h.status()"
    ],
    nextChallengeId: null
  }
};
