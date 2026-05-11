// ============================================
// Main.gs — العقل المركزي والـ Router
// OPS Passion School
// ============================================

// ── نقطة دخول GET ──
function doGet(e) {
  var action = e.parameter.action || "";
  var params = e.parameter;

  try {
    switch (action) {

      // التحقق من كود البيرنت
      case "verifyCode":
        var result = CodesManager.verifyParentCode(params.code);
        return _jsonResponse(result);

      // جلب بيانات الطالب (للبيرنت)
      case "getStudentProgress":
        return _handleGetStudentProgress(params);

      // ping للتأكد إن السكريبت شغال
      case "ping":
        return _jsonResponse({ status: "ok", message: "OPS Apps Script يعمل ✅" });

      // ── Admin Dashboard ──
      case "getOverview":    return _handleGetOverview(params);
      case "getNewStudents": return _handleGetNewStudents(params);
      case "getAllStudents":  return _handleGetAllStudents(params);
      case "getStaff":       return _handleGetStaff(params);
      case "getSessions":    return _handleGetSessions(params);

      default:
        return _jsonResponse({ success: false, error: "action مش معروف" });
    }
  } catch (err) {
    Logger.log("ERROR in doGet: " + err.toString());
    return _jsonResponse({ success: false, error: "خطأ في السيرفر" });
  }
}

// ── نقطة دخول POST ──
function doPost(e) {
  var action = "";
  var data = {};

  try {
    // استخراج البيانات من الـ request
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
      action = data.action || "";
    } else {
      action = e.parameter.action || "";
      data = e.parameter;
    }

    switch (action) {

      // ── استقبال فورم التسجيل (PI) ──
      case "submitPI":
        var piResult = FormsHandler.handlePI(data);
        return _jsonResponse(piResult);

      // ── استقبال بيانات اجتماع البيرنت (PSCE) ──
      case "submitPSCE":
        var psceResult = FormsHandler.handlePSCE(data);
        return _jsonResponse(psceResult);

      // ── استقبال نتائج جلسة الطفل (SCE) ──
      case "submitSCE":
        var sceResult = FormsHandler.handleSCE(data);
        return _jsonResponse(sceResult);

      // ── تسجيل سيشن ──
      case "addSession":
        var sessionResult = FormsHandler.handleSession(data);
        return _jsonResponse(sessionResult);

      // ── قبول طلب طالب (من المساعد) ──
      case "acceptStudent":
        return _handleAcceptStudent(data);

      // ── تعيين تيتشر للطالب ──
      case "assignTeacher":
        return _handleAssignTeacher(data);

      // ── إنشاء كود للبيرنت ──
      case "createParentCode":
        return _handleCreateParentCode(data);

      // ── تسجيل دخول الفريق ──
      case "staffLogin":
        return _handleStaffLogin(data);

      // ── إضافة موظف جديد ──
      case "addStaff":
        return _handleAddStaff(data);

      default:
        return _jsonResponse({ success: false, error: "action مش معروف: " + action });
    }

  } catch (err) {
    Logger.log("ERROR in doPost: " + err.toString());
    return _jsonResponse({ success: false, error: "خطأ في السيرفر: " + err.toString() });
  }
}

// ============================================
// ── HANDLERS ──
// ============================================

function _handleGetStudentProgress(params) {
  if (!params.code) {
    return _jsonResponse({ success: false, error: "الكود مطلوب" });
  }

  var codeData = CodesManager.verifyParentCode(params.code);
  if (!codeData.valid) {
    return _jsonResponse({ success: false, error: codeData.error });
  }

  var student = SheetsDB.getStudent(codeData.studentId);
  if (!student) {
    return _jsonResponse({ success: false, error: "مفيش بيانات" });
  }

  var sessions = SheetsDB.getStudentSessions(codeData.studentId);

  return _jsonResponse({
    success: true,
    student: {
      childName:       student.childName,
      childAge:        student.childAge,
      status:          student.status,
      learningPattern: student.learningPattern,
      sessionsCount:   student.sessionsCount,
      pfpActive:       student.pfpActive
    },
    sessions: sessions
  });
}

function _handleAcceptStudent(data) {
  if (!data.studentId || !data.staffId) {
    return _jsonResponse({ success: false, error: "بيانات ناقصة" });
  }

  // التحقق من صلاحية الموظف
  var staff = SheetsDB.getStaff(data.staffId);
  if (!staff) return _jsonResponse({ success: false, error: "الموظف مش موجود" });

  var allowedRoles = [CONFIG.ROLES.ADMIN, CONFIG.ROLES.ASSISTANT];
  if (allowedRoles.indexOf(staff.role) === -1) {
    return _jsonResponse({ success: false, error: "مش عندك صلاحية" });
  }

  SheetsDB.updateStudentStatus(data.studentId, CONFIG.STUDENT_STATUS.ACCEPTED);

  Logger.log("✅ تم قبول الطالب: " + data.studentId + " بواسطة: " + staff.name);
  return _jsonResponse({ success: true, message: "تم قبول الطالب" });
}

function _handleAssignTeacher(data) {
  if (!data.studentId || !data.teacherId || !data.staffId) {
    return _jsonResponse({ success: false, error: "بيانات ناقصة" });
  }

  // التحقق من الصلاحية
  var staff = SheetsDB.getStaff(data.staffId);
  if (!staff) return _jsonResponse({ success: false, error: "الموظف مش موجود" });

  var allowedRoles = [CONFIG.ROLES.ADMIN, CONFIG.ROLES.ASSISTANT];
  if (allowedRoles.indexOf(staff.role) === -1) {
    return _jsonResponse({ success: false, error: "مش عندك صلاحية" });
  }

  // تعيين التيتشر وريسيت العداد
  SheetsDB.updateStudentField(data.studentId, CONFIG.STUDENT_COLS.TEACHER_ID, data.teacherId);
  SheetsDB.updateStudentField(data.studentId, CONFIG.STUDENT_COLS.SESSIONS_WITH_TEACHER, 0);

  Logger.log("✅ تم تعيين التيتشر: " + data.teacherId + " للطالب: " + data.studentId);
  return _jsonResponse({ success: true, message: "تم تعيين التيتشر" });
}

function _handleCreateParentCode(data) {
  if (!data.studentId || !data.staffId) {
    return _jsonResponse({ success: false, error: "بيانات ناقصة" });
  }

  // التحقق من الصلاحية
  var staff = SheetsDB.getStaff(data.staffId);
  if (!staff) return _jsonResponse({ success: false, error: "الموظف مش موجود" });

  var allowedRoles = [CONFIG.ROLES.ADMIN, CONFIG.ROLES.ASSISTANT];
  if (allowedRoles.indexOf(staff.role) === -1) {
    return _jsonResponse({ success: false, error: "مش عندك صلاحية" });
  }

  var result = CodesManager.createCodeForStudent(data.studentId);
  return _jsonResponse(result);
}

function _handleStaffLogin(data) {
  if (!data.staffId || !data.password) {
    return _jsonResponse({ success: false, error: "بيانات ناقصة" });
  }

  var staff = SheetsDB.verifyStaffLogin(data.staffId, data.password);
  if (!staff) {
    return _jsonResponse({ success: false, error: "كود الموظف أو كلمة السر غلط" });
  }

  return _jsonResponse({
    success: true,
    staff: {
      staffId: staff.staffId,
      name:    staff.name,
      role:    staff.role
    }
  });
}

// ============================================
// ── ADMIN DASHBOARD HANDLERS ──
// ============================================

function _handleGetOverview(params) {
  // التحقق من الصلاحية
  var staff = SheetsDB.getStaff(params.staffId || "");
  if (!staff) return _jsonResponse({ success: false, error: "غير مصرح" });

  try {
    // عد الطلاب في كل الشيتات
    var total = 0, newCount = 0, enrolled = 0;
    for (var i = 1; i <= 5; i++) {
      var sheet = SheetsDB.getSheet(CONFIG.SHEETS["STUDENTS_" + i]);
      var data = sheet.getDataRange().getValues();
      for (var j = 1; j < data.length; j++) {
        if (!data[j][0]) continue;
        total++;
        var status = data[j][CONFIG.STUDENT_COLS.STATUS - 1];
        if (status === CONFIG.STUDENT_STATUS.NEW)      newCount++;
        if (status === CONFIG.STUDENT_STATUS.ENROLLED) enrolled++;
      }
    }

    // عد الموظفين النشطين
    var staffSheet = SheetsDB.getSheet(CONFIG.SHEETS.STAFF);
    var staffData  = staffSheet.getDataRange().getValues();
    var staffCount = 0;
    for (var k = 1; k < staffData.length; k++) {
      if (staffData[k][CONFIG.STAFF_COLS.ACTIVE - 1] === true) staffCount++;
    }

    return _jsonResponse({
      success:    true,
      total:      total,
      newCount:   newCount,
      enrolled:   enrolled,
      staffCount: staffCount
    });

  } catch (e) {
    Logger.log("ERROR _handleGetOverview: " + e.toString());
    return _jsonResponse({ success: false, error: e.toString() });
  }
}

function _handleGetNewStudents(params) {
  var staff = SheetsDB.getStaff(params.staffId || "");
  if (!staff) return _jsonResponse({ success: false, error: "غير مصرح" });

  try {
    var students = SheetsDB.getNewStudents();
    return _jsonResponse({ success: true, students: students });
  } catch (e) {
    Logger.log("ERROR _handleGetNewStudents: " + e.toString());
    return _jsonResponse({ success: false, error: e.toString() });
  }
}

function _handleGetAllStudents(params) {
  var staff = SheetsDB.getStaff(params.staffId || "");
  if (!staff) return _jsonResponse({ success: false, error: "غير مصرح" });

  try {
    var results = [];
    for (var i = 1; i <= 5; i++) {
      var sheet = SheetsDB.getSheet(CONFIG.SHEETS["STUDENTS_" + i]);
      var data  = sheet.getDataRange().getValues();
      var cols  = CONFIG.STUDENT_COLS;

      for (var j = 1; j < data.length; j++) {
        if (!data[j][0]) continue;
        results.push({
          studentId:       data[j][cols.STUDENT_ID - 1],
          status:          data[j][cols.STATUS - 1],
          createdAt:       data[j][cols.CREATED_AT - 1],
          parentName:      data[j][cols.PARENT_NAME - 1],
          parentWhatsapp:  data[j][cols.PARENT_WHATSAPP - 1],
          childName:       data[j][cols.CHILD_NAME - 1],
          childAge:        data[j][cols.CHILD_AGE - 1],
          childGrade:      data[j][cols.CHILD_GRADE - 1],
          learningPattern: data[j][cols.LEARNING_PATTERN - 1],
          teacherId:       data[j][cols.TEACHER_ID - 1],
          sessionsCount:   data[j][cols.SESSIONS_COUNT - 1]
        });
      }
    }
    return _jsonResponse({ success: true, students: results });
  } catch (e) {
    Logger.log("ERROR _handleGetAllStudents: " + e.toString());
    return _jsonResponse({ success: false, error: e.toString() });
  }
}

function _handleGetStaff(params) {
  var staff = SheetsDB.getStaff(params.staffId || "");
  if (!staff) return _jsonResponse({ success: false, error: "غير مصرح" });

  // الأدمن بس يشوف الفريق كامل
  if (staff.role !== CONFIG.ROLES.ADMIN) {
    return _jsonResponse({ success: false, error: "مش عندك صلاحية" });
  }

  try {
    var sheet  = SheetsDB.getSheet(CONFIG.SHEETS.STAFF);
    var data   = sheet.getDataRange().getValues();
    var cols   = CONFIG.STAFF_COLS;
    var results = [];

    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      results.push({
        staffId:  data[i][cols.STAFF_ID - 1],
        name:     data[i][cols.NAME - 1],
        role:     data[i][cols.ROLE - 1],
        phone:    data[i][cols.PHONE - 1],
        whatsapp: data[i][cols.WHATSAPP - 1],
        email:    data[i][cols.EMAIL - 1],
        active:   data[i][cols.ACTIVE - 1]
      });
    }
    return _jsonResponse({ success: true, staff: results });
  } catch (e) {
    Logger.log("ERROR _handleGetStaff: " + e.toString());
    return _jsonResponse({ success: false, error: e.toString() });
  }
}

function _handleGetSessions(params) {
  var staff = SheetsDB.getStaff(params.staffId || "");
  if (!staff) return _jsonResponse({ success: false, error: "غير مصرح" });

  try {
    var sheet  = SheetsDB.getSheet(CONFIG.SHEETS.SESSIONS);
    var data   = sheet.getDataRange().getValues();
    var cols   = CONFIG.SESSION_COLS;
    var results = [];

    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      results.push({
        sessionId: data[i][cols.SESSION_ID - 1],
        studentId: data[i][cols.STUDENT_ID - 1],
        teacherId: data[i][cols.TEACHER_ID - 1],
        date:      data[i][cols.DATE - 1],
        duration:  data[i][cols.DURATION - 1],
        notes:     data[i][cols.NOTES - 1]
      });
    }
    // ترتيب من الأحدث للأقدم
    results.reverse();
    return _jsonResponse({ success: true, sessions: results });
  } catch (e) {
    Logger.log("ERROR _handleGetSessions: " + e.toString());
    return _jsonResponse({ success: false, error: e.toString() });
  }
}

function _handleAddStaff(data) {
  if (!data.staffId) return _jsonResponse({ success: false, error: "غير مصرح" });

  // الأدمن بس يضيف موظفين
  var requester = SheetsDB.getStaff(data.staffId);
  if (!requester || requester.role !== CONFIG.ROLES.ADMIN) {
    return _jsonResponse({ success: false, error: "مش عندك صلاحية" });
  }

  if (!data.name || !data.password) {
    return _jsonResponse({ success: false, error: "الاسم وكلمة السر مطلوبان" });
  }

  try {
    var sheet = SheetsDB.getSheet(CONFIG.SHEETS.STAFF);
    var now   = new Date();

    // توليد ID جديد
    var lastRow   = sheet.getLastRow();
    var newNumber = lastRow; // الهيدر محسوب
    var newId     = "STAFF-" + String(newNumber).padStart(3, "0");

    sheet.appendRow([
      newId,
      data.name,
      data.role || CONFIG.ROLES.ASSISTANT,
      data.phone    || "",
      data.whatsapp || "",
      data.email    || "",
      data.password,
      true,
      now
    ]);

    Logger.log("✅ تم إضافة موظف جديد: " + newId + " — " + data.name);
    return _jsonResponse({ success: true, staffId: newId, message: "تم إضافة الموظف" });

  } catch (e) {
    Logger.log("ERROR _handleAddStaff: " + e.toString());
    return _jsonResponse({ success: false, error: e.toString() });
  }
}

// ============================================
// ── SETUP FUNCTIONS (بتتشغل مرة واحدة) ──
// ============================================

// شغّلها مرة واحدة بس عشان تجهز كل الشيتات
function setupDatabase() {
  var result = SheetsDB.setupAllSheets();
  Logger.log(result);
  SpreadsheetApp.getUi().alert("✅ " + result);
}

// اختبار الكونيكشن
function testConnection() {
  var db = SheetsDB.getDB();
  Logger.log("✅ اتصلنا بـ: " + db.getName());
  return db.getName();
}

// ============================================
// ── HELPER ──
// ============================================

function _jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
