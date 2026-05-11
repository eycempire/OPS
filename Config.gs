// ============================================
// Config.gs — الإعدادات والثوابت المركزية
// OPS Passion School
// ============================================

var CONFIG = {

  // ── Google Sheet ──
  SPREADSHEET_ID: "1KGdH2q-ZTGANCQ_keVzA0nky5L0HgB7yGgOOrNOCVgw",

  // ── أسماء الأوراق ──
  SHEETS: {
    INDEX:      "Index",
    STUDENTS_1: "Students-1",
    STUDENTS_2: "Students-2",
    STUDENTS_3: "Students-3",
    STUDENTS_4: "Students-4",
    STUDENTS_5: "Students-5",
    STAFF:      "Staff",
    SESSIONS:   "Sessions",
    CODES:      "Codes"
  },

  // ── حد الطلاب في كل ورقة ──
  STUDENTS_PER_SHEET: 100,

  // ── حالات الطالب ──
  STUDENT_STATUS: {
    NEW:        "جديد",        // تسجيل جديد — لسه ما اتراجعش
    REVIEWING:  "قيد المراجعة", // المساعد بيراجعه
    ACCEPTED:   "مقبول",       // اتقبل — في انتظار PSCE
    PSCE_DONE:  "PSCE مكتمل",  // اجتماع البيرنت اتعمل
    SCE_DONE:   "SCE مكتمل",   // جلسة الطفل اتعملت
    ANALYZED:   "تم التحليل",  // Gemini حلل البيانات
    ENROLLED:   "ملتحق",       // بدأ الكورس فعلاً
    INACTIVE:   "غير نشط"      // متوقف
  },

  // ── صلاحيات الفريق ──
  ROLES: {
    ADMIN:     "admin",
    SCE:       "sce",
    ASSISTANT: "assistant",
    TEACHER:   "teacher"
  },

  // ── أعمدة ورقة Index ──
  INDEX_COLS: {
    STUDENT_ID:   1,  // A — كود الطالب
    STUDENT_NAME: 2,  // B — اسم الطالب
    SHEET_NUMBER: 3,  // C — رقم الشيت (1-5)
    ROW_NUMBER:   4,  // D — رقم الصف جوه الشيت
    STATUS:       5,  // E — الحالة الحالية
    CREATED_AT:   6   // F — تاريخ التسجيل
  },

  // ── أعمدة Students ──
  STUDENT_COLS: {
    STUDENT_ID:        1,   // A
    STATUS:            2,   // B
    CREATED_AT:        3,   // C
    // بيانات الوالد
    PARENT_NAME:       4,   // D
    PARENT_PHONE:      5,   // E
    PARENT_WHATSAPP:   6,   // F
    // بيانات الطفل
    CHILD_NAME:        7,   // G
    CHILD_AGE:         8,   // H
    CHILD_GRADE:       9,   // I
    CHILD_HOBBIES:     10,  // J
    CHILD_NOTES:       11,  // K
    // نتائج التقييم
    PSCE_DATA:         12,  // L — بيانات اجتماع البيرنت (JSON)
    SCE_DATA:          13,  // M — بيانات جلسة الطفل (JSON)
    GEMINI_RESULT:     14,  // N — نتيجة Gemini (JSON)
    LEARNING_PATTERN:  15,  // O — النمط المحدد
    // بيانات الكورس
    TEACHER_ID:        16,  // P — ID التيتشر الحالي
    SESSIONS_COUNT:    17,  // Q — عدد السيشنز الكلي
    SESSIONS_WITH_TEACHER: 18, // R — عدد السيشنز مع التيتشر الحالي
    PFP_ACTIVE:        19,  // S — هل PFP مفعّل؟
    PFP_SCHEDULE:      20,  // T — جدول PFP
    PARENT_CODE:       21   // U — كود دخول البيرنت
  },

  // ── أعمدة Staff ──
  STAFF_COLS: {
    STAFF_ID:    1,  // A
    NAME:        2,  // B
    ROLE:        3,  // C — admin/sce/assistant/teacher
    PHONE:       4,  // D
    WHATSAPP:    5,  // E
    EMAIL:       6,  // F
    PASSWORD:    7,  // G — hashed
    ACTIVE:      8,  // H — true/false
    CREATED_AT:  9   // I
  },

  // ── أعمدة Sessions ──
  SESSION_COLS: {
    SESSION_ID:  1,  // A
    STUDENT_ID:  2,  // B
    TEACHER_ID:  3,  // C
    DATE:        4,  // D
    DURATION:    5,  // E — بالدقايق
    NOTES:       6,  // F
    CREATED_AT:  7   // G
  },

  // ── أعمدة Codes ──
  CODE_COLS: {
    CODE:        1,  // A — الكود نفسه
    STUDENT_ID:  2,  // B
    CREATED_AT:  3,  // C
    STATUS:      4   // D — active/used/expired
  },

  // ── إعدادات الكود ──
  CODE_LENGTH: 8,
  CODE_PREFIX: "OPS",

  // ── رسائل الواتس آب ──
  MESSAGES: {
    WELCOME: "أهلاً *{parentName}* 🌟\nشكراً لتسجيلك في *OPS Passion School*\nفريقنا هيتواصل معك خلال 24 ساعة لتحديد موعد جلسة اكتشاف شغف *{childName}* 🎯",
    CODE_READY: "أهلاً *{parentName}* 🎉\nكود دخولك لمتابعة تقدم *{childName}*:\n\n🔑 *{code}*\n\nادخل على المنصة واستخدم الكود ده عشان تشوف كل حاجة!"
  }

};
