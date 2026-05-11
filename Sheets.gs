// ============================================
// Sheets.gs — كل عمليات Read/Write
// OPS Passion School
// ============================================

var SheetsDB = {

  // ── الحصول على الـ Spreadsheet ──
  getDB: function() {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  },

  // ── الحصول على ورقة معينة ──
  getSheet: function(sheetName) {
    var db = this.getDB();
    var sheet = db.getSheetByName(sheetName);
    if (!sheet) {
      sheet = db.insertSheet(sheetName);
    }
    return sheet;
  },

  // ============================================
  // ── INDEX OPERATIONS ──
  // ============================================

  // إضافة طالب جديد للـ Index
  addToIndex: function(studentId, studentName, sheetNumber, rowNumber, status) {
    var sheet = this.getSheet(CONFIG.SHEETS.INDEX);
    var cols = CONFIG.INDEX_COLS;
    var now = new Date();

    // لو الهيدر مش موجود نضيفه
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["كود الطالب", "اسم الطالب", "رقم الشيت", "رقم الصف", "الحالة", "تاريخ التسجيل"]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#0A2540").setFontColor("#FFFFFF");
    }

    sheet.appendRow([studentId, studentName, sheetNumber, rowNumber, status, now]);
    return true;
  },

  // البحث عن طالب في الـ Index
  findStudentInIndex: function(studentId) {
    var sheet = this.getSheet(CONFIG.SHEETS.INDEX);
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(studentId)) {
        return {
          studentId:   data[i][0],
          studentName: data[i][1],
          sheetNumber: data[i][2],
          rowNumber:   data[i][3],
          status:      data[i][4],
          createdAt:   data[i][5],
          indexRow:    i + 1
        };
      }
    }
    return null;
  },

  // تحديث حالة الطالب في الـ Index
  updateStudentStatus: function(studentId, newStatus) {
    var indexData = this.findStudentInIndex(studentId);
    if (!indexData) return false;

    var indexSheet = this.getSheet(CONFIG.SHEETS.INDEX);
    indexSheet.getRange(indexData.indexRow, CONFIG.INDEX_COLS.STATUS).setValue(newStatus);

    // تحديث الـ Status في الشيت الفرعي كمان
    var studentSheetName = CONFIG.SHEETS["STUDENTS_" + indexData.sheetNumber];
    var studentSheet = this.getSheet(studentSheetName);
    studentSheet.getRange(indexData.rowNumber, CONFIG.STUDENT_COLS.STATUS).setValue(newStatus);

    return true;
  },

  // ============================================
  // ── STUDENTS OPERATIONS ──
  // ============================================

  // تحديد الشيت المناسب للطالب الجديد
  getNextStudentSheet: function() {
    for (var i = 1; i <= 5; i++) {
      var sheetName = CONFIG.SHEETS["STUDENTS_" + i];
      var sheet = this.getSheet(sheetName);
      var count = sheet.getLastRow();
      // الهيدر بياخد صف، فالطلاب = lastRow - 1
      var studentCount = count <= 1 ? 0 : count - 1;
      if (studentCount < CONFIG.STUDENTS_PER_SHEET) {
        return { sheetName: sheetName, sheetNumber: i };
      }
    }
    return null; // كل الشيتات امتلأت
  },

  // إضافة طالب جديد
  addStudent: function(studentData) {
    var sheetInfo = this.getNextStudentSheet();
    if (!sheetInfo) {
      Logger.log("ERROR: كل شيتات الطلاب امتلأت!");
      return null;
    }

    var sheet = this.getSheet(sheetInfo.sheetName);
    var cols = CONFIG.STUDENT_COLS;
    var now = new Date();

    // إضافة الهيدر لو مش موجود
    if (sheet.getLastRow() === 0) {
      this._addStudentSheetHeader(sheet);
    }

    var newRow = sheet.getLastRow() + 1;

    sheet.appendRow([
      studentData.studentId,           // A - كود الطالب
      CONFIG.STUDENT_STATUS.NEW,       // B - الحالة
      now,                             // C - تاريخ التسجيل
      studentData.parentName,          // D - اسم الوالد
      studentData.parentPhone,         // E - رقم الاتصال
      studentData.parentWhatsapp,      // F - واتس آب
      studentData.childName,           // G - اسم الطفل
      studentData.childAge,            // H - السن
      studentData.childGrade,          // I - المرحلة الدراسية
      studentData.childHobbies || "",  // J - الهوايات
      studentData.childNotes || "",    // K - ملاحظات
      "", "", "", "",                  // L,M,N,O - بيانات التقييم (فاضية)
      "", "0", "0",                    // P,Q,R - بيانات الكورس
      "false", "",                     // S,T - PFP
      ""                               // U - الكود
    ]);

    // إضافة للـ Index
    this.addToIndex(
      studentData.studentId,
      studentData.childName,
      sheetInfo.sheetNumber,
      newRow,
      CONFIG.STUDENT_STATUS.NEW
    );

    return {
      sheetNumber: sheetInfo.sheetNumber,
      rowNumber: newRow
    };
  },

  // جلب بيانات طالب كاملة
  getStudent: function(studentId) {
    var indexData = this.findStudentInIndex(studentId);
    if (!indexData) return null;

    var sheetName = CONFIG.SHEETS["STUDENTS_" + indexData.sheetNumber];
    var sheet = this.getSheet(sheetName);
    var row = sheet.getRange(indexData.rowNumber, 1, 1, 21).getValues()[0];
    var cols = CONFIG.STUDENT_COLS;

    return {
      studentId:          row[cols.STUDENT_ID - 1],
      status:             row[cols.STATUS - 1],
      createdAt:          row[cols.CREATED_AT - 1],
      parentName:         row[cols.PARENT_NAME - 1],
      parentPhone:        row[cols.PARENT_PHONE - 1],
      parentWhatsapp:     row[cols.PARENT_WHATSAPP - 1],
      childName:          row[cols.CHILD_NAME - 1],
      childAge:           row[cols.CHILD_AGE - 1],
      childGrade:         row[cols.CHILD_GRADE - 1],
      childHobbies:       row[cols.CHILD_HOBBIES - 1],
      childNotes:         row[cols.CHILD_NOTES - 1],
      psceData:           row[cols.PSCE_DATA - 1],
      sceData:            row[cols.SCE_DATA - 1],
      geminiResult:       row[cols.GEMINI_RESULT - 1],
      learningPattern:    row[cols.LEARNING_PATTERN - 1],
      teacherId:          row[cols.TEACHER_ID - 1],
      sessionsCount:      row[cols.SESSIONS_COUNT - 1],
      sessionsWithTeacher: row[cols.SESSIONS_WITH_TEACHER - 1],
      pfpActive:          row[cols.PFP_ACTIVE - 1],
      pfpSchedule:        row[cols.PFP_SCHEDULE - 1],
      parentCode:         row[cols.PARENT_CODE - 1],
      sheetNumber:        indexData.sheetNumber,
      rowNumber:          indexData.rowNumber
    };
  },

  // تحديث حقل معين في بيانات الطالب
  updateStudentField: function(studentId, colNumber, value) {
    var indexData = this.findStudentInIndex(studentId);
    if (!indexData) return false;

    var sheetName = CONFIG.SHEETS["STUDENTS_" + indexData.sheetNumber];
    var sheet = this.getSheet(sheetName);
    sheet.getRange(indexData.rowNumber, colNumber).setValue(value);
    return true;
  },

  // جلب كل الطلاب الجدد (للمساعدين)
  getNewStudents: function() {
    return this._getStudentsByStatus(CONFIG.STUDENT_STATUS.NEW);
  },

  // جلب كل الطلاب حسب الحالة
  _getStudentsByStatus: function(status) {
    var results = [];
    for (var i = 1; i <= 5; i++) {
      var sheetName = CONFIG.SHEETS["STUDENTS_" + i];
      var sheet = this.getSheet(sheetName);
      if (sheet.getLastRow() <= 1) continue;

      var data = sheet.getDataRange().getValues();
      for (var j = 1; j < data.length; j++) {
        if (data[j][CONFIG.STUDENT_COLS.STATUS - 1] === status) {
          results.push({
            studentId:   data[j][0],
            status:      data[j][1],
            createdAt:   data[j][2],
            parentName:  data[j][3],
            parentPhone: data[j][4],
            childName:   data[j][6],
            childAge:    data[j][7],
            childGrade:  data[j][8]
          });
        }
      }
    }
    return results;
  },

  // جلب طلاب تيتشر معين
  getTeacherStudents: function(teacherId) {
    var results = [];
    for (var i = 1; i <= 5; i++) {
      var sheetName = CONFIG.SHEETS["STUDENTS_" + i];
      var sheet = this.getSheet(sheetName);
      if (sheet.getLastRow() <= 1) continue;

      var data = sheet.getDataRange().getValues();
      for (var j = 1; j < data.length; j++) {
        if (String(data[j][CONFIG.STUDENT_COLS.TEACHER_ID - 1]) === String(teacherId)) {
          results.push({
            studentId:       data[j][0],
            childName:       data[j][6],
            childAge:        data[j][7],
            learningPattern: data[j][14],
            sessionsCount:   data[j][16],
            status:          data[j][1]
          });
        }
      }
    }
    return results;
  },

  // ============================================
  // ── STAFF OPERATIONS ──
  // ============================================

  // جلب موظف بالـ ID
  getStaff: function(staffId) {
    var sheet = this.getSheet(CONFIG.SHEETS.STAFF);
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(staffId)) {
        return {
          staffId:   data[i][0],
          name:      data[i][1],
          role:      data[i][2],
          phone:     data[i][3],
          whatsapp:  data[i][4],
          email:     data[i][5],
          password:  data[i][6],
          active:    data[i][7],
          createdAt: data[i][8]
        };
      }
    }
    return null;
  },

  // التحقق من تسجيل الدخول
  verifyStaffLogin: function(staffId, password) {
    var staff = this.getStaff(staffId);
    if (!staff) return null;
    if (!staff.active) return null;
    // مقارنة بسيطة — في الإنتاج نستخدم hashing
    if (staff.password !== password) return null;
    return staff;
  },

  // جلب كل الفريق حسب الدور
  getStaffByRole: function(role) {
    var sheet = this.getSheet(CONFIG.SHEETS.STAFF);
    var data = sheet.getDataRange().getValues();
    var results = [];

    for (var i = 1; i < data.length; i++) {
      if (data[i][2] === role && data[i][7] === true) {
        results.push({
          staffId:  data[i][0],
          name:     data[i][1],
          role:     data[i][2],
          whatsapp: data[i][4]
        });
      }
    }
    return results;
  },

  // ============================================
  // ── SESSIONS OPERATIONS ──
  // ============================================

  // إضافة سيشن جديدة
  addSession: function(sessionData) {
    var sheet = this.getSheet(CONFIG.SHEETS.SESSIONS);
    var now = new Date();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["كود السيشن", "كود الطالب", "كود التيتشر", "التاريخ", "المدة (دقايق)", "ملاحظات", "تاريخ الإضافة"]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#0A2540").setFontColor("#FFFFFF");
    }

    var sessionId = "SES-" + now.getTime();
    sheet.appendRow([
      sessionId,
      sessionData.studentId,
      sessionData.teacherId,
      sessionData.date || now,
      sessionData.duration || 60,
      sessionData.notes || "",
      now
    ]);

    // تحديث عداد السيشنز للطالب
    var student = this.getStudent(sessionData.studentId);
    if (student) {
      var totalSessions = (parseInt(student.sessionsCount) || 0) + 1;
      var withTeacher = (parseInt(student.sessionsWithTeacher) || 0) + 1;

      this.updateStudentField(sessionData.studentId, CONFIG.STUDENT_COLS.SESSIONS_COUNT, totalSessions);
      this.updateStudentField(sessionData.studentId, CONFIG.STUDENT_COLS.SESSIONS_WITH_TEACHER, withTeacher);
    }

    return sessionId;
  },

  // جلب سيشنات طالب معين
  getStudentSessions: function(studentId) {
    var sheet = this.getSheet(CONFIG.SHEETS.SESSIONS);
    var data = sheet.getDataRange().getValues();
    var results = [];

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(studentId)) {
        results.push({
          sessionId: data[i][0],
          teacherId: data[i][2],
          date:      data[i][3],
          duration:  data[i][4],
          notes:     data[i][5]
        });
      }
    }
    return results;
  },

  // ============================================
  // ── CODES OPERATIONS ──
  // ============================================

  // حفظ كود البيرنت
  saveCode: function(code, studentId) {
    var sheet = this.getSheet(CONFIG.SHEETS.CODES);
    var now = new Date();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["الكود", "كود الطالب", "تاريخ الإنشاء", "الحالة"]);
      sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#0A2540").setFontColor("#FFFFFF");
    }

    sheet.appendRow([code, studentId, now, "active"]);

    // حفظ الكود في بيانات الطالب كمان
    this.updateStudentField(studentId, CONFIG.STUDENT_COLS.PARENT_CODE, code);
    return true;
  },

  // التحقق من الكود
  verifyCode: function(code) {
    var sheet = this.getSheet(CONFIG.SHEETS.CODES);
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(code) && data[i][3] === "active") {
        return {
          code:      data[i][0],
          studentId: data[i][1],
          createdAt: data[i][2]
        };
      }
    }
    return null;
  },

  // ============================================
  // ── HELPER FUNCTIONS ──
  // ============================================

  _addStudentSheetHeader: function(sheet) {
    var headers = [
      "كود الطالب", "الحالة", "تاريخ التسجيل",
      "اسم الوالد", "رقم الاتصال", "واتس آب",
      "اسم الطفل", "السن", "المرحلة الدراسية", "الهوايات", "ملاحظات",
      "بيانات PSCE", "بيانات SCE", "نتيجة Gemini", "نمط التعلم",
      "ID التيتشر", "عدد السيشنز الكلي", "سيشنز مع التيتشر الحالي",
      "PFP مفعّل", "جدول PFP", "كود الوالد"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#0A2540")
      .setFontColor("#FFFFFF");
  },

  // إعداد الشيت كاملاً (بيتنفذ مرة واحدة)
  setupAllSheets: function() {
    Logger.log("بدء إعداد الشيتات...");

    // Index
    var indexSheet = this.getSheet(CONFIG.SHEETS.INDEX);
    if (indexSheet.getLastRow() === 0) {
      indexSheet.appendRow(["كود الطالب", "اسم الطالب", "رقم الشيت", "رقم الصف", "الحالة", "تاريخ التسجيل"]);
      indexSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#0A2540").setFontColor("#FFFFFF");
    }

    // Students 1-5
    for (var i = 1; i <= 5; i++) {
      var sheet = this.getSheet(CONFIG.SHEETS["STUDENTS_" + i]);
      if (sheet.getLastRow() === 0) {
        this._addStudentSheetHeader(sheet);
      }
    }

    // Staff
    var staffSheet = this.getSheet(CONFIG.SHEETS.STAFF);
    if (staffSheet.getLastRow() === 0) {
      staffSheet.appendRow(["كود الموظف", "الاسم", "الدور", "رقم الاتصال", "واتس آب", "الإيميل", "كلمة السر", "نشط", "تاريخ الإضافة"]);
      staffSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#0A2540").setFontColor("#FFFFFF");

      // إضافة Admin افتراضي
      staffSheet.appendRow(["STAFF-001", "رئيس الأكاديمية", "admin", "", "", "", "admin123", true, new Date()]);
    }

    // Sessions
    var sessionsSheet = this.getSheet(CONFIG.SHEETS.SESSIONS);
    if (sessionsSheet.getLastRow() === 0) {
      sessionsSheet.appendRow(["كود السيشن", "كود الطالب", "كود التيتشر", "التاريخ", "المدة (دقايق)", "ملاحظات", "تاريخ الإضافة"]);
      sessionsSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#0A2540").setFontColor("#FFFFFF");
    }

    // Codes
    var codesSheet = this.getSheet(CONFIG.SHEETS.CODES);
    if (codesSheet.getLastRow() === 0) {
      codesSheet.appendRow(["الكود", "كود الطالب", "تاريخ الإنشاء", "الحالة"]);
      codesSheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#0A2540").setFontColor("#FFFFFF");
    }

    Logger.log("✅ تم إعداد كل الشيتات بنجاح!");
    return "تم الإعداد بنجاح";
  }
};
