// src/features/python-adventure/python-adventure-data.js

export const WORLDS_DATA = [
  {
    id: "world-1",
    number: 1,
    title: "قرية بايثون",
    englishTitle: "Python Village",
    icon: "🏠",
    concept: "الطباعة والعمليات الحسابية",
    description: "بداية رحلتك البرمجية: تعلم طباعة النصوص والعمليات الحسابية وصياغة الكود الأول.",
    color: "#10b981",
    levelsCount: 4,
    requiredWorldId: null
  },
  {
    id: "world-2",
    number: 2,
    title: "وادي المتغيرات",
    englishTitle: "Variables Valley",
    icon: "🔢",
    concept: "المتغيرات والأنواع وتنسيق f-strings",
    description: "اكتشف كيفية تخزين البيانات في الذاكرة والتحويل بين النصوص والأرقام.",
    color: "#3b82f6",
    levelsCount: 4,
    requiredWorldId: "world-1"
  },
  {
    id: "world-3",
    number: 3,
    title: "كهف الشروط",
    englishTitle: "Conditions Cave",
    icon: "🔀",
    concept: "صنع القرارات if و elif و else",
    description: "اجعل برامجك ذكية تتخذ قرارات منطقية بناءً على شروط متعددة ومقارنات دقيقة.",
    color: "#8b5cf6",
    levelsCount: 4,
    requiredWorldId: "world-2"
  },
  {
    id: "world-4",
    number: 4,
    title: "غابة التكرار",
    englishTitle: "Loop Forest",
    icon: "🔁",
    concept: "حلقات التكرار for و while و range",
    description: "أتقن تكرار الأوامر الذكي بدون تكرار الكود، وتجنب فخ الحلقات اللانهائية.",
    color: "#f59e0b",
    levelsCount: 4,
    requiredWorldId: "world-3"
  },
  {
    id: "world-5",
    number: 5,
    title: "مدينة القوائم",
    englishTitle: "Lists City",
    icon: "📦",
    concept: "القوائم ومصفوفات البيانات والفهرسة",
    description: "تعلم تنظيم وتخزين مجموعات البيانات في قوائم ومعالجتها بالمرور والتصفية.",
    color: "#ec4899",
    levelsCount: 4,
    requiredWorldId: "world-4"
  },
  {
    id: "world-6",
    number: 6,
    title: "مصنع الدوال",
    englishTitle: "Functions Factory",
    icon: "⚙️",
    concept: "بناء الدوال def والقيم المرجعة return",
    description: "ابنِ آلات برمجية قابلة لإعادة الاستخدام تمرر لها مدخلات وتعيد نتائج حسابية.",
    color: "#06b6d4",
    levelsCount: 4,
    requiredWorldId: "world-5"
  },
  {
    id: "world-7",
    number: 7,
    title: "قلعة الكائنات",
    englishTitle: "OOP Castle",
    icon: "🧱",
    concept: "البرمجة كائنية التوجه Classes & Objects",
    description: "المستوى المتقدم: تصميم الفئات، دوال البناء __init__، وتفاعل الكائنات البرمجية.",
    color: "#ef4444",
    levelsCount: 4,
    requiredWorldId: "world-6"
  },
  {
    id: "world-8",
    number: 8,
    title: "حلبة الأبطال",
    englishTitle: "Final Arena",
    icon: "🏆",
    concept: "المشروع الختامي الشامل وتتويج بطل بايثون",
    description: "التحدي النهائي: دمج كل ما تعلمته لبناء أنظمة برمجية مصغرة متكاملة.",
    color: "#eab308",
    levelsCount: 3,
    requiredWorldId: "world-7"
  }
];

export const ACHIEVEMENTS_DATA = [
  {
    id: "first_code",
    title: "أول سطر بايثون 🐍",
    description: "تشغيل وإكمال أول برنامج صحيح في قرية بايثون.",
    icon: "🐍",
    rewardXp: 50
  },
  {
    id: "loop_master",
    title: "سيد حلقات التكرار 🔁",
    description: "إكمال جميع مهمات غابة التكرار الأربعة.",
    icon: "🔁",
    rewardXp: 150
  },
  {
    id: "bug_hunter",
    title: "صياد الأخطاء 🐞",
    description: "حل 3 مهام تصحيح أخطاء برمجية بنجاح.",
    icon: "🐞",
    rewardXp: 100
  },
  {
    id: "boss_slayer",
    title: "قاهر الزعماء 👑",
    description: "هزيمة زعيم أحد العوالم واجتياز التحدي المركب.",
    icon: "👑",
    rewardXp: 200
  },
  {
    id: "streak_warrior",
    title: "شعلة الالتزام 🔥",
    description: "الحفاظ على تتابع تدريب يومي لمدة 3 أيام أو أكثر.",
    icon: "🔥",
    rewardXp: 100
  },
  {
    id: "python_hero",
    title: "بطل بايثون الأسطوري 🏆",
    description: "اجتياز جميع العوالم والمشروع الختامي كاملاً.",
    icon: "🏆",
    rewardXp: 500
  }
];

export const CHALLENGES_CLIENT_DATA = {
  // WORLD 1
  "world-1-level-1": {
    id: "world-1-level-1",
    worldId: "world-1",
    worldTitle: "قرية بايثون",
    levelNumber: 1,
    title: "أهلاً بك في بايثون",
    subtitle: "المهمة الأولى: إضاءة لافتة القرية",
    difficulty: "easy",
    type: "write_code",
    baseXp: 50,
    skills: ["print", "strings"],
    story: "أهلاً بك في قرية بايثون! لافتة بوابة القرية بحاجة إلى إضاءة ترحيبية بالقادمين الجدد. اكتب أمراً برمجياً يطبع على الشاشة عبارة ترحيبية تحتوي على كلمة Python.",
    microLesson: {
      concept: "أمر الطباعة print()",
      summary: "في لغة بايثون، نستخدم الدالة print() لعرض النصوص والأرقام على الشاشة.\nنكتب النصوص دائماً بين علامتي تنصيص '...' أو \"...\".",
      exampleCode: 'print("مرحباً بك!")\nprint(100)'
    },
    starterCode: '# اكتب كود الطباعة أدناه\nprint("Hello Python")\n',
    requirements: [
      "استخدم أمر print()",
      "اطبع عبارة تحتوي على كلمة Python (مثال: Hello Python)"
    ],
    expectedOutput: "Hello Python",
    outputIncludes: ["Python"],
    hints: [
      "فكر في الدالة المخصصة لإخراج البيانات إلى الشاشة.",
      "استخدم الدالة print('...')",
      "ضع النص المراد طباعته بين علامتي تنصيص.",
      "اكتب الكود التالي: print('Hello Python')"
    ],
    nextChallengeId: "world-1-level-2"
  },
  "world-1-level-2": {
    id: "world-1-level-2",
    worldId: "world-1",
    worldTitle: "قرية بايثون",
    levelNumber: 2,
    title: "حساب غنائم القرية",
    subtitle: "العمليات الحسابية المباشرة",
    difficulty: "easy",
    type: "write_code",
    baseXp: 60,
    skills: ["arithmetic", "numbers"],
    story: "عثر حراس القرية على 3 صناديق ذهب، في كل صندوق 25 عملة، ثم حصلوا على مكافأة إضافية قدرها 15 عملة. احسب إجمالي العملات واطبعه.",
    microLesson: {
      concept: "العمليات الحسابية في بايثون",
      summary: "بايثون آلة حاسبة فائقة الذكاء:\n+ للجمع، - للطرح، * للضرب، / للقسمة.\nالأولوية دائماً للأقواس ثم الضرب والقسمة قبل الجمع والطرح.",
      exampleCode: 'print(5 + 3)\nprint(10 * 2)'
    },
    starterCode: '# احسب واطبع الناتج المباشر: (3 * 25) + 15\nprint(3 * 25 + 15)\n',
    requirements: [
      "احسب التعبير الرياضي: (3 * 25) + 15",
      "اطبع الناتج مباشرة (الناتج هو 90)"
    ],
    expectedOutput: "90",
    hints: [
      "استخدم علامة النجمة * للضرب وعلامة + للجمع.",
      "اكتب الحساب مباشرة داخل الدالة print.",
      "اكتب: print(3 * 25 + 15)"
    ],
    nextChallengeId: "world-1-level-3"
  },
  "world-1-level-3": {
    id: "world-1-level-3",
    worldId: "world-1",
    worldTitle: "قرية بايثون",
    levelNumber: 3,
    title: "إصلاح لافتة الحارس",
    subtitle: "صائد الأخطاء: خطأ في صياغة الكود SyntaxError",
    difficulty: "easy",
    type: "fix_code",
    baseXp: 70,
    skills: ["debugging", "syntax"],
    story: "كتب أحد المبتدئين كود لافتة الحارس لكنه وقع في خطأ صياغة بسيط يمنع الكود من العمل! مهمتك هي اكتشاف الخطأ وإصلاحه لتعمل اللافتة.",
    microLesson: {
      concept: "أخطاء الصياغة Syntax Errors",
      summary: "بايثون لغة دقيقة للغاية! كل قوس مفتوح ( يجب أن يقابله قوس إغلاق )، وكل علامة تنصيص يجب إغلاقها بدقة.",
      exampleCode: '# خطأ:\n# print("مرحباً\n# صحيح:\nprint("مرحباً")'
    },
    starterCode: 'print("Village Gate is Open"\n',
    requirements: [
      "أصلح القوس المفقود في نهاية سطر الطباعة",
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
    worldTitle: "قرية بايثون",
    levelNumber: 4,
    title: "👑 حارس بوابة القرية",
    subtitle: "تحدي الزعيم: امتحان اجتياز قرية بايثون",
    difficulty: "boss",
    type: "boss",
    baseXp: 150,
    skills: ["print", "arithmetic", "integration"],
    story: "يقف حارس بوابة القرية العملاق! لن يفتح البوابة إلى وادي المتغيرات إلا إذا قمت بطباعة سطرين: السطر الأول 'Welcome to Python World' والسطر الثاني ناتج حساب (100 - 25 * 2). أظهر له براعتك!",
    microLesson: {
      concept: "تحدي الزعيم: دمج المهارات",
      summary: "اجمع ما تعلمته: استخدم أمرين print منفصلين، مع مراعاة أولويات الحساب الرياضي (الضرب قبل الطرح).",
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

  // WORLD 2
  "world-2-level-1": {
    id: "world-2-level-1",
    worldId: "world-2",
    worldTitle: "وادي المتغيرات",
    levelNumber: 1,
    title: "صندوق كنوز الوادي",
    subtitle: "تعريف واستخدام المتغيرات",
    difficulty: "easy",
    type: "write_code",
    baseXp: 80,
    skills: ["variables", "integers", "strings"],
    story: "في وادي المتغيرات، نحفظ البيانات في صناديق تسمى متغيرات (Variables). قم بتعريف متغير اسمه gold بقيمة 50 ثم اطبع قيمة gold على الشاشة.",
    microLesson: {
      concept: "المتغيرات في بايثون",
      summary: "المتغير مساحة في الذاكرة لتخزين قيمة باسم رمزي يسهل الرجوع إليه وتعديله في أي وقت:\nx = 10\nprint(x)",
      exampleCode: "coins = 100\nprint(coins)"
    },
    starterCode: '# عرف المتغير gold واطبعه\ngold = 50\nprint(gold)\n',
    requirements: [
      "عرف متغير باسم gold بقيمة 50",
      "اطبع قيمة المتغير gold"
    ],
    expectedOutput: "50",
    hints: [
      "اكتب: gold = 50",
      "ثم في السطر التالي: print(gold)"
    ],
    nextChallengeId: "world-2-level-2"
  },
  "world-2-level-2": {
    id: "world-2-level-2",
    worldId: "world-2",
    worldTitle: "وادي المتغيرات",
    levelNumber: 2,
    title: "محول العملات السحرية",
    subtitle: "التحويل بين الأنواع وعمليات الجمع",
    difficulty: "medium",
    type: "write_code",
    baseXp: 90,
    skills: ["type_casting", "math"],
    story: "تصلك كمية الذهب كنص '150' وتريد مضاعفتها بالضرب في 2. حول النص إلى رقم صحيح باستخدام int() ثم اطبع الناتج المضاعف.",
    microLesson: {
      concept: "تحويل الأنواع Type Casting",
      summary: "النصوص (Strings) لا تقبل الضرب الحسابي الحقيقي إلا بعد تحويلها إلى رقم صحيح int() أو رقم عشري float().",
      exampleCode: "s = '25'\nn = int(s)\nprint(n * 2)"
    },
    starterCode: "gold_str = '150'\n# حول gold_str إلى رقم واطبع ناتج ضربه في 2\n",
    requirements: [
      "استخدم int(gold_str) لتحويل القيمة إلى رقم",
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
    worldTitle: "وادي المتغيرات",
    levelNumber: 3,
    title: "إكمال فاتورة التاجر",
    subtitle: "إكمال الكود: صيغة f-string الأنيقة",
    difficulty: "medium",
    type: "complete_code",
    baseXp: 90,
    skills: ["f-strings", "formatting"],
    story: "تاجر الوادي يريد طباعة فاتورة بالصيغة: 'Total: 250 Coins'. أكمل الفراغ في f-string لطباعة القيمة الصحيحة.",
    microLesson: {
      concept: "سلاسل f-string المنسقة",
      summary: "نضع حرف f قبل علامة التنصيص ونضع اسم المتغير داخل أقواس معقوفة {variable}:\nprice = 100\nprint(f'Price: {price}')",
      exampleCode: "name = 'Ali'\nprint(f'Hello {name}')"
    },
    starterCode: "total = 250\n# استبدل _____ بالمتغير total\nprint(f'Total: {total} Coins')\n",
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
    worldTitle: "وادي المتغيرات",
    levelNumber: 4,
    title: "👑 تاجر الوادي العظيم",
    subtitle: "تحدي الزعيم: نظام محاسبة الوادي",
    difficulty: "boss",
    type: "boss",
    baseXp: 180,
    skills: ["variables", "arithmetic", "f-strings"],
    story: "التاجر العظيم يطلب منك حساب السعر النهائي لشحنة دروع: سعر السلعة price = 400، ونسبة الضريبة tax = 50، والخصم discount = 30. احسب final_price = price + tax - discount واطبع النتيجة بالصيغة: 'Final Price: 420'",
    microLesson: {
      concept: "تحدي الزعيم",
      summary: "عرف المتغيرات الثلاثة، احسب الناتج النهائي وخزنه في متغير، ثم اطبعه باستخدام f-string أو دمج النصوص.",
      exampleCode: "a = 10\nb = 2\nc = a + b\nprint(f'Result: {c}')"
    },
    starterCode: "price = 400\ntax = 50\ndiscount = 30\n# احسب final_price واطبع النتيجة:\n",
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

  // WORLD 3
  "world-3-level-1": {
    id: "world-3-level-1",
    worldId: "world-3",
    worldTitle: "كهف الشروط",
    levelNumber: 1,
    title: "بوابة فحص السن",
    subtitle: "استخدام الجملة الشرطية if",
    difficulty: "easy",
    type: "write_code",
    baseXp: 80,
    skills: ["conditions", "if"],
    story: "وصلت إلى كهف الشروط. بوابة الكهف تفحص عمر المغامر age = 20. إذا كان العمر 18 أو أكثر، اطبع 'Access Granted'.",
    microLesson: {
      concept: "الجملة الشرطية if",
      summary: "تتيح لك if تنفيذ أوامر معينة فقط إذا تحقق شرط معين. لاحظ وضع : في نهاية السطر والمسافة البادئة للسطر التالي.",
      exampleCode: "x = 10\nif x > 5:\n    print('Greater than 5')"
    },
    starterCode: "age = 20\n# اكتب شرط if لفحص السن واطبع Access Granted\nif age >= 18:\n    print('Access Granted')\n",
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
    worldTitle: "كهف الشروط",
    levelNumber: 2,
    title: "رتبة المغامر السحرية",
    subtitle: "تعدد الشروط if / elif / else",
    difficulty: "medium",
    type: "write_code",
    baseXp: 90,
    skills: ["elif", "else"],
    story: "يحدد الكهف رتبتك حسب النقاط score = 85:\nإذا كانت النقاط >= 90 اطبع 'Diamond'\nإذا كانت النقاط >= 80 اطبع 'Gold'\nغير ذلك اطبع 'Silver'",
    microLesson: {
      concept: "تعدد الشروط elif",
      summary: "عند وجود أكثر من احتمال نستخدم elif، وفي النهاية نضع else للحالات المتبقية.",
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
    worldTitle: "كهف الشروط",
    levelNumber: 3,
    title: "فخ علامة المساواة",
    subtitle: "صائد الأخطاء: الفرق بين = و ==",
    difficulty: "medium",
    type: "fix_code",
    baseXp: 85,
    skills: ["debugging", "comparison"],
    story: "وقع مبرمج الكهف في أشهر خطأ في بايثون! استخدم = (إسناد قيمة) بدلاً من == (مقارنة الشرط). أصلح الكود ليطبع Unlocked بنجاح.",
    microLesson: {
      concept: "= مقابل ==",
      summary: "= تستخدم لتعيين قيمة لمتغير: x = 5\nبينما == تستخدم للمقارنة وفحص التساوي: if x == 5:",
      exampleCode: "x = 5\nif x == 5:\n    print('Equal')"
    },
    starterCode: "magic_number = 7\n# أصلح الخطأ في السطر التالي:\nif magic_number == 7:\n    print('Unlocked')\n",
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
    worldTitle: "كهف الشروط",
    levelNumber: 4,
    title: "👑 لغز حكيم الكهف",
    subtitle: "تحدي الزعيم: فك شفرة الكهف المعقدة",
    difficulty: "boss",
    type: "boss",
    baseXp: 200,
    skills: ["logical_operators", "nested_conditions"],
    story: "يقف حكيم الكهف أمام الممر المؤدي لغابة التكرار! ولديك مفتاحان: has_key = True و energy = 80. افتح البوابة إذا كان لديك المفتاح و الطاقة أكبر من أو تساوي 50 بطباعة: 'Cave Master Defeated'",
    microLesson: {
      concept: "العوامل المنطقية and و or",
      summary: "نستخدم and للتأكد من تحقق الشرطين معاً، ونستخدم or إذا كان يكفي تحقق أحدهما.",
      exampleCode: "if has_pass and score > 50:\n    print('Passed')"
    },
    starterCode: "has_key = True\nenergy = 80\n# افحص الشرطين معاً واطبع Cave Master Defeated\n",
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

  // WORLD 4
  "world-4-level-1": {
    id: "world-4-level-1",
    worldId: "world-4",
    worldTitle: "غابة التكرار",
    levelNumber: 1,
    title: "فتح البوابات الخمس",
    subtitle: "التكرار باستخدام for و range",
    difficulty: "easy",
    type: "write_code",
    baseXp: 90,
    skills: ["for_loop", "range"],
    story: "غابة التكرار (Loop Forest) تحتاج مساعدتك! هناك 5 بوابات يجب فتحها مرقمة من 0 إلى 4. استخدم for loop مع range(5) لطباعة أرقام البوابات.",
    microLesson: {
      concept: "حلقة التكرار for loop",
      summary: "تستخدم for لتكرار تنفيذ مجموعة من الأوامر لعدد محدد من المرات باستخدام range(n):\nfor i in range(5):\n    print(i)",
      exampleCode: "for i in range(3):\n    print('Hello')"
    },
    starterCode: '# استخدم for مع range(5) لطباعة الأرقام 0 إلى 4\nfor i in range(5):\n    print(i)\n',
    requirements: [
      "استخدم for loop",
      "استخدم range(5)",
      "اطبع الأرقام من 0 إلى 4 كل رقم في سطر"
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
    worldTitle: "غابة التكرار",
    levelNumber: 2,
    title: "جمع ثمار الغابة",
    subtitle: "نمط التراكم والتجميع Accumulator Pattern",
    difficulty: "medium",
    type: "write_code",
    baseXp: 100,
    skills: ["accumulation", "for_loop"],
    story: "اجمع ثمار الغابة! اكتب برنامجاً يحسب مجموع الأعداد من 1 إلى 5 باستخدام for loop واطبع الناتج النهائي فقط (15).",
    microLesson: {
      concept: "تجميع القيم في حلقة التكرار",
      summary: "نعرف متغيراً للمجموع قبل الحلقة بقيمة صفر، ثم نضيف له في كل دورة:\ntotal = 0\nfor i in range(1, 6):\n    total += i\nprint(total)",
      exampleCode: "s = 0\nfor x in [1, 2, 3]:\n    s += x\nprint(s)"
    },
    starterCode: "total = 0\n# استخدم for loop لإضافة الأعداد من 1 إلى 5 إلى total\n# ثم اطبع total خارج الحلقة\n",
    requirements: [
      "استخدم for loop مع range(1, 6)",
      "اجمع الأعداد في المتغير total",
      "اطبع الناتج النهائي فقط: 15"
    ],
    expectedOutput: "15",
    hints: [
      "range(1, 6) يعطيك الأعداد 1، 2، 3، 4، 5",
      "داخل الحلقة: total += i",
      "تأكد أن print(total) ليست داخل الحلقة بل بعدها"
    ],
    nextChallengeId: "world-4-level-3"
  },
  "world-4-level-3": {
    id: "world-4-level-3",
    worldId: "world-4",
    worldTitle: "غابة التكرار",
    levelNumber: 3,
    title: "فخ الحلقة اللانهائية",
    subtitle: "صائد الأخطاء: حلقة while لا تتوقف!",
    difficulty: "medium",
    type: "fix_code",
    baseXp: 95,
    skills: ["while_loop", "debugging"],
    story: "عالقون في دوامة زمنية بغابة التكرار! كود حلقة while نسي زيادة العداد count مما تسبب في حلقة لا نهائية. أصلح الكود بطباعة count من 1 إلى 3 وتحديث العداد.",
    microLesson: {
      concept: "حلقات while وتفادي التكرار اللانهائي",
      summary: "حلقة while تستمر طالما الشرط True. لذلك يجب تعديل المتغير في كل دورة حتى يتوقف الشرط.",
      exampleCode: "i = 0\nwhile i < 2:\n    print(i)\n    i += 1"
    },
    starterCode: "count = 1\nwhile count <= 3:\n    print(count)\n    count += 1\n",
    requirements: [
      "أضف زيادة للعداد: count += 1",
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
    worldTitle: "غابة التكرار",
    levelNumber: 4,
    title: "👑 وحش شجرة السنديان العتيقة",
    subtitle: "تحدي الزعيم: العد التنازلي لهزيمة الوحش",
    difficulty: "boss",
    type: "boss",
    baseXp: 220,
    skills: ["loops", "reverse_range", "integration"],
    story: "وحش السنديان العملاق يهدد الغابة! عليك إطلاق تعويذة عد تنازلي من 3 إلى 1 ثم طباعة 'Monster Defeated!'. استخدم حلقة تكرار لطباعة 3 ثم 2 ثم 1 ثم اطبع عبارة النصر.",
    microLesson: {
      concept: "العد التنازلي",
      summary: "يمكنك العد تنازلياً باستخدام range(3, 0, -1) أو باستخدام حلقة while تنقص 1 في كل مرة.",
      exampleCode: "for i in range(3, 0, -1):\n    print(i)\nprint('Go!')"
    },
    starterCode: "for i in [3, 2, 1]:\n    print(i)\nprint('Monster Defeated!')\n",
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

  // WORLD 5
  "world-5-level-1": {
    id: "world-5-level-1",
    worldId: "world-5",
    worldTitle: "مدينة القوائم",
    levelNumber: 1,
    title: "حقيبة أدوات المدينة",
    subtitle: "إنشاء القوائم والفهرسة Indexing",
    difficulty: "easy",
    type: "write_code",
    baseXp: 90,
    skills: ["lists", "indexing"],
    story: "مرحباً بك في مدينة القوائم! أنشئ قائمة باسم items تحتوي على العناصر الثلاثة: 'sword', 'shield', 'potion'. ثم اطبع العنصر الأول باستخدام الفهرس [0].",
    microLesson: {
      concept: "القوائم Lists والفهرسة",
      summary: "القوائم تحفظ عدة عناصر بين أقواس مربعة []، ويبدأ ترقيم العناصر دائماً من الصفر 0:\nmy_list = ['A', 'B', 'C']\nprint(my_list[0])  # 'A'",
      exampleCode: "heroes = ['Omar', 'Sara']\nprint(heroes[0])"
    },
    starterCode: "items = ['sword', 'shield', 'potion']\nprint(items[0])\n",
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
    worldTitle: "مدينة القوائم",
    levelNumber: 2,
    title: "إضافة أداة سحرية للقائمة",
    subtitle: "دالة الإضافة append ودالة الطول len",
    difficulty: "medium",
    type: "write_code",
    baseXp: 95,
    skills: ["append", "len"],
    story: "لديك قائمة spells = ['fire', 'ice']. أضف إليها العنصر 'thunder' باستخدام append() ثم اطبع عدد عناصر القائمة باستخدام len().",
    microLesson: {
      concept: "تعديل القوائم",
      summary: "نستخدم .append() لإضافة عنصر جديد في نهاية القائمة، ونستخدم len() لمعرفة عدد عناصرها الإجمالي.",
      exampleCode: "nums = [1, 2]\nnums.append(3)\nprint(len(nums))"
    },
    starterCode: "spells = ['fire', 'ice']\nspells.append('thunder')\nprint(len(spells))\n",
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
    worldTitle: "مدينة القوائم",
    levelNumber: 3,
    title: "فهرس خارج النطاق IndexError",
    subtitle: "صائد الأخطاء: طلب عنصر غير موجود",
    difficulty: "medium",
    type: "fix_code",
    baseXp: 90,
    skills: ["debugging", "index_error"],
    story: "حاول أحد المبرمجين طباعة العنصر الأخير من قائمة بها 3 عناصر فقط، فكتب index 3 وتسبب في خطأ IndexError! أصلح الفهرس ليطبع العنصر الأخير الصحيح 'Gold'.",
    microLesson: {
      concept: "IndexError",
      summary: "إذا كانت القائمة تحتوي 3 عناصر، فإن الفهارس المتاحة هي 0 و 1 و 2 فقط. العنصر الأخير يكون دائماً عند الفهرس 2 أو [-1]!",
      exampleCode: "lst = ['A', 'B']\n# lst[2] يسبب خطأ\n# lst[1] أو lst[-1] صحيح"
    },
    starterCode: "rewards = ['Bronze', 'Silver', 'Gold']\nprint(rewards[2])\n",
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
    worldTitle: "مدينة القوائم",
    levelNumber: 4,
    title: "👑 حاكم مدينة القوائم",
    subtitle: "تحدي الزعيم: تصفية وحساب القيم الفائزة",
    difficulty: "boss",
    type: "boss",
    baseXp: 240,
    skills: ["lists", "loops", "filters"],
    story: "حاكم المدينة يختبر قدرتك على معالجة البيانات الضخمة! لديك قائمة درجات scores = [45, 80, 95, 30, 88]. احسب عدد الدرجات الناجحة (التي تكون >= 50) واطبع هذا العدد.",
    microLesson: {
      concept: "المرور على القوائم مع الشروط",
      summary: "نمر على القائمة بحلقة for، ونفحص كل عنصر بجملة if، ونزيد عداد الناجحين.",
      exampleCode: "nums = [1, 10, 3, 20]\nbig = 0\nfor n in nums:\n    if n > 5:\n        big += 1\nprint(big)"
    },
    starterCode: "scores = [45, 80, 95, 30, 88]\npass_count = 0\nfor s in scores:\n    if s >= 50:\n        pass_count += 1\nprint(pass_count)\n",
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

  // WORLD 6
  "world-6-level-1": {
    id: "world-6-level-1",
    worldId: "world-6",
    worldTitle: "مصنع الدوال",
    levelNumber: 1,
    title: "آلة الترحيب الذاتي",
    subtitle: "تعريف واستدعاء الدوال def",
    difficulty: "easy",
    type: "write_code",
    baseXp: 95,
    skills: ["functions", "def"],
    story: "وصلت إلى مصنع الدوال! هنا نقوم ببناء آلات برمجية يعاد استخدامها. عرف دالة باسم greet تأخذ معاملاً name وتطبع f'Hello {name}'، ثم استدعها بالاسم 'Hero'.",
    microLesson: {
      concept: "بناء الدوال def",
      summary: "الدالة هي كتلة برمجية يعاد استخدامها تأخذ مدخلات وتنفذ مهمة محددة:\ndef say_hi(name):\n    print(f'Hi {name}')\nsay_hi('Ali')",
      exampleCode: "def add_one(x):\n    print(x + 1)\nadd_one(5)"
    },
    starterCode: "def greet(name):\n    print(f'Hello {name}')\n\ngreet('Hero')\n",
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
    worldTitle: "مصنع الدوال",
    levelNumber: 2,
    title: "محرك حساب المساحات",
    subtitle: "إرجاع القيم باستخدام return",
    difficulty: "medium",
    type: "write_code",
    baseXp: 100,
    skills: ["return", "functions"],
    story: "عرف دالة اسمها calculate_area تأخذ العرض width والطول height وترجع (return) مساحة المستطيل width * height. ثم اطبع ناتج استدعائها بالقيم 5 و 4.",
    microLesson: {
      concept: "الفرق بين print و return",
      summary: "print تعرض النتيجة على الشاشة فقط، أما return فتعيد القيمة المحسوبة لاستخدامها في حسابات أو متغيرات أخرى.",
      exampleCode: "def mult(a, b):\n    return a * b\nprint(mult(3, 4))"
    },
    starterCode: "def calculate_area(width, height):\n    return width * height\n\nprint(calculate_area(5, 4))\n",
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
    worldTitle: "مصنع الدوال",
    levelNumber: 3,
    title: "صائد الأخطاء: return المنسية",
    subtitle: "صائد الأخطاء: الدالة تعيد None!",
    difficulty: "medium",
    type: "fix_code",
    baseXp: 95,
    skills: ["debugging", "return_none"],
    story: "الدالة التالية تحسب ضعف الرقم، لكن المبرمج نسي كلمة return فصارت ترجع None! أصلح الدالة لترجع القيمة الصحيحة ليطبع 100.",
    microLesson: {
      concept: "لماذا تظهر None؟",
      summary: "إذا لم تستخدم كلمة return داخل الدالة في بايثون، فإن الدالة ترجع القيمة الخاصة None تلقائياً!",
      exampleCode: "def good():\n    return 10"
    },
    starterCode: "def double_number(x):\n    return x * 2\n\nval = double_number(50)\nprint(val)\n",
    requirements: [
      "أضف return x * 2 داخل الدالة",
      "تأكد أن الناتج المطبوع هو 100"
    ],
    expectedOutput: "100",
    hints: [
      "استبدل result = x * 2 بـ return x * 2"
    ],
    nextChallengeId: "world-6-level-4"
  },
  "world-6-level-4": {
    id: "world-6-level-4",
    worldId: "world-6",
    worldTitle: "مصنع الدوال",
    levelNumber: 4,
    title: "👑 كبير مهندسي المصنع",
    subtitle: "تحدي الزعيم: دالة فاحص الأرقام الزوجية",
    difficulty: "boss",
    type: "boss",
    baseXp: 260,
    skills: ["functions", "modulo", "booleans"],
    story: "كبير مهندسي المصنع يتحداك لبناء دالة ذكية is_even(n) ترجع True إذا كان الرقم زوجياً و False إذا كان فردياً (باستخدام n % 2 == 0). ثم اطبع ناتج استدعائها للرقم 10 ثم للرقم 7 في سطرين.",
    microLesson: {
      concept: "عامل باقي القسمة Modulo %",
      summary: "الرقم الزوجي يقبل القسمة على 2 بدون باقٍ، أي n % 2 == 0:\ndef is_even(n):\n    return n % 2 == 0",
      exampleCode: "print(4 % 2 == 0) # True\nprint(5 % 2 == 0) # False"
    },
    starterCode: "def is_even(n):\n    return n % 2 == 0\n\nprint(is_even(10))\nprint(is_even(7))\n",
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

  // WORLD 7
  "world-7-level-1": {
    id: "world-7-level-1",
    worldId: "world-7",
    worldTitle: "قلعة الكائنات",
    levelNumber: 1,
    title: "درع الفارس",
    subtitle: "بناء أول كائن وفئة Class & Object",
    difficulty: "medium",
    type: "write_code",
    baseXp: 110,
    skills: ["classes", "objects", "init"],
    story: "أهلاً بك في قلعة الكائنات! أنشئ فئة (Class) باسم Player تمتلك دالة بناء __init__ تأخذ name و health. أنشئ كائناً باسم p1 بالاسم 'Knight' والصحة 100 واطبع p1.name.",
    microLesson: {
      concept: "الفئات والكائنات Classes & Objects",
      summary: "الفئة هي قالب لبناء كائنات ذات خصائص محددة:\nclass Cat:\n    def __init__(self, name):\n        self.name = name\nc = Cat('Kitty')\nprint(c.name)",
      exampleCode: "class Car:\n    def __init__(self, model):\n        self.model = model\nmy_car = Car('Toyota')\nprint(my_car.model)"
    },
    starterCode: "class Player:\n    def __init__(self, name, health):\n        self.name = name\n        self.health = health\n\np1 = Player('Knight', 100)\nprint(p1.name)\n",
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
    worldTitle: "قلعة الكائنات",
    levelNumber: 2,
    title: "مهارة الهجوم السحري",
    subtitle: "إضافة دوال للفئة Methods",
    difficulty: "medium",
    type: "write_code",
    baseXp: 120,
    skills: ["methods", "self"],
    story: "أضف دالة اسمها attack داخل فئة Player تطبع f'{self.name} attacks!'. أنشئ كائناً بالاسم 'Wizard' واستدعِ دالة attack الخاصة به.",
    microLesson: {
      concept: "دوال الكائنات Methods",
      summary: "الدوال داخل الفئات تسمى Methods ويجب أن يكون معامِلها الأول دائماً هو self للإشارة للكائن الحالي:\nclass Dog:\n    def bark(self):\n        print('Woof!')",
      exampleCode: "class Bot:\n    def ping(self):\n        print('Pong')\nb = Bot()\nb.ping()"
    },
    starterCode: "class Player:\n    def __init__(self, name):\n        self.name = name\n    def attack(self):\n        print(f'{self.name} attacks!')\n\np = Player('Wizard')\np.attack()\n",
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
    worldTitle: "قلعة الكائنات",
    levelNumber: 3,
    title: "صائد الأخطاء: سحر self المفقود",
    subtitle: "صائد الأخطاء: نسيان self في دالة البناء",
    difficulty: "hard",
    type: "fix_code",
    baseXp: 120,
    skills: ["debugging", "self_scope"],
    story: "نسي المبرمج ربط الخاصية بالكائن باستخدام self.power، فتسبب في عدم حفظ الخاصية! أصلح الكود ليتم تخزين self.power = power ويطبع القوة 50.",
    microLesson: {
      concept: "أهمية self.",
      summary: "المتغيرات داخل __init__ تكون محلية وتنتهي عند انتهاء الدالة، ما لم نربطها بالكائن باستخدام self.property = value!",
      exampleCode: "def __init__(self, x):\n    # خطأ: x = x\n    # صحيح:\n    self.x = x"
    },
    starterCode: "class Weapon:\n    def __init__(self, power):\n        self.power = power\n\nw = Weapon(50)\nprint(w.power)\n",
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
    worldTitle: "قلعة الكائنات",
    levelNumber: 4,
    title: "👑 تنين البرمجة الكائنية الأسطوري",
    subtitle: "تحدي الزعيم: معركة الفئات التفاعلية",
    difficulty: "boss",
    type: "boss",
    baseXp: 300,
    skills: ["oop", "methods", "state_mutation"],
    story: "تنين القلعة يختبر فهمك الكامل! أنشئ فئة Dragon لها خاصية health = 100، ودالة take_damage(self, amount) تنقص مقدار الضرر من الصحة وتطبع الصحة المتبقية f'Dragon Health: {self.health}'. أنشئ التنين وسبب له ضرراً بقيمة 30!",
    microLesson: {
      concept: "تعديل حالة الكائن",
      summary: "تستطيع دوال الكائنات تعديل خصائص الكائن نفسه:\ndef take_damage(self, amount):\n    self.health -= amount",
      exampleCode: "class Account:\n    def __init__(self, bal):\n        self.bal = bal\n    def withdraw(self, m):\n        self.bal -= m"
    },
    starterCode: "class Dragon:\n    def __init__(self):\n        self.health = 100\n    def take_damage(self, amount):\n        self.health -= amount\n        print(f'Dragon Health: {self.health}')\n\nd = Dragon()\nd.take_damage(30)\n",
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

  // WORLD 8
  "world-8-level-1": {
    id: "world-8-level-1",
    worldId: "world-8",
    worldTitle: "حلبة الأبطال",
    levelNumber: 1,
    title: "محلل درجات الطلاب الذكي",
    subtitle: "مشروع مصغر: دمج القوائم وحساب المتوسطات",
    difficulty: "hard",
    type: "write_code",
    baseXp: 200,
    skills: ["integration", "math", "loops", "lists"],
    story: "أهلاً بك في حلبة الأبطال! لديك قائمة درجات طلاب grades = [70, 85, 90, 75]. احسب متوسط الدرجات (مجموع الدرجات مقسوماً على عددها len) واطبع بالصيغة: f'Average: {avg}' مع العلم أن الناتج هو 80.0.",
    microLesson: {
      concept: "المشروع الختامي - الجزء 1",
      summary: "تطبيق عملي يجمع القوائم وحساب المجموع sum أو التكرار مع القسمة لإخراج المتوسط الإحصائي بدقة.",
      exampleCode: "nums = [10, 20]\navg = sum(nums) / len(nums)\nprint(f'Average: {avg}')"
    },
    starterCode: "grades = [70, 85, 90, 75]\navg = sum(grades) / len(grades)\nprint(f'Average: {avg}')\n",
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
    worldTitle: "حلبة الأبطال",
    levelNumber: 2,
    title: "نظام إدارة المهام البرمجية",
    subtitle: "مشروع مصغر: دوال إدارة المهام والتكرار",
    difficulty: "hard",
    type: "write_code",
    baseXp: 250,
    skills: ["lists", "functions", "formatting"],
    story: "اكتب برنامجاً يدير مهام اليوم: عرف دالة display_tasks(tasks) تمر على القائمة وتطبع كل مهمة مسبوقة برقمها الترتيبي بدءاً من 1: f'{index}. {task}'. استدعها بقائمة ['Study', 'Code', 'Play'].",
    microLesson: {
      concept: "ترقيم العناصر بالدوال",
      summary: "يمكنك استخدام عداد يبدأ من 1 أو enumerate(tasks, 1) لترقيم العناصر أثناء الدوران:",
      exampleCode: "items = ['A', 'B']\nfor idx, val in enumerate(items, 1):\n    print(f'{idx}. {val}')"
    },
    starterCode: "def display_tasks(tasks):\n    for i, t in enumerate(tasks, 1):\n        print(f'{i}. {t}')\n\ndisplay_tasks(['Study', 'Code', 'Play'])\n",
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
    worldTitle: "حلبة الأبطال",
    levelNumber: 3,
    title: "🏆 بطل بايثون الأسطوري",
    subtitle: "تحدي التخرج النهائي: محرك معركة أبطال بايثون",
    difficulty: "boss",
    type: "boss",
    baseXp: 500,
    skills: ["mastery", "oop", "algorithms", "final_project"],
    story: "المعركة الختامية لمغامرة بايثون! اكتب برنامجاً متكاملاً يعرف class Hero بالاسم hero_name والصحة health. يمتلك دالة heal(amount) تزيد الصحة، ودالة status() تطبع f'{self.hero_name} - HP: {self.health}'. أنشئ بطلاً بالاسم 'Python Hero' وصحة 80، ثم عالجه بـ 20 نقطة، ثم اطبع حالته status()!",
    microLesson: {
      concept: "تتويج بطل بايثون",
      summary: "لقد أتقنت المتغيرات، والشروط، والحلقات، والقوائم، والدوال، والكائنات البرمجية! اجمع كل مهاراتك لاجتياز التحدي الأخير وتتويجك بلقب Python Hero.",
      exampleCode: "class Hero:\n    # بناء الفئة والدوال واستدعاؤها"
    },
    starterCode: "class Hero:\n    def __init__(self, name, health):\n        self.name = name\n        self.health = health\n    def heal(self, amount):\n        self.health += amount\n    def status(self):\n        print(f'{self.name} - HP: {self.health}')\n\nh = Hero('Python Hero', 80)\nh.heal(20)\nh.status()\n",
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
