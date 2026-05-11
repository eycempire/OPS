// ============================================
// Codes.gs — توليد وإدارة أكواد الدخول
// OPS Passion School
// ============================================

var CodesManager = {

  // ── توليد كود جديد ──
  generateCode: function() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // بدون حروف مشابهة (I,O,1,0)
    var code = CONFIG.CODE_PREFIX + "-";
    for (var i = 0; i < CONFIG.CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  // ── توليد كود فريد (بيتأكد إنه مش موجود) ──
  generateUniqueCode: function() {
    var maxTries = 10;
    for (var i = 0; i < maxTries; i++) {
      var code = this.generateCode();
      if (!SheetsDB.verifyCode(code)) {
        return code; // الكود مش موجود — فريد
      }
    }
    // لو بعد 10 محاولات — نضيف timestamp
    return CONFIG.CODE_PREFIX + "-" + new Date().getTime().toString(36).toUpperCase();
  },

  // ── إنشاء وحفظ كود للطالب ──
  createCodeForStudent: function(studentId) {
    // تأكد إن الطالب مش عنده كود قبل كده
    var student = SheetsDB.getStudent(studentId);
    if (!student) {
      return { success: false, error: "الطالب مش موجود" };
    }

    if (student.parentCode && student.parentCode !== "") {
      return { success: true, code: student.parentCode, existing: true };
    }

    var code = this.generateUniqueCode();
    SheetsDB.saveCode(code, studentId);

    return { success: true, code: code, existing: false };
  },

  // ── التحقق من كود البيرنت ──
  verifyParentCode: function(code) {
    var codeData = SheetsDB.verifyCode(code);
    if (!codeData) {
      return { valid: false, error: "الكود غلط أو منتهي" };
    }

    var student = SheetsDB.getStudent(codeData.studentId);
    if (!student) {
      return { valid: false, error: "مفيش بيانات مرتبطة بالكود ده" };
    }

    return {
      valid: true,
      studentId: codeData.studentId,
      childName: student.childName,
      parentName: student.parentName,
      status: student.status,
      learningPattern: student.learningPattern,
      sessionsCount: student.sessionsCount
    };
  },

  // ── توليد Student ID ──
  generateStudentId: function() {
    var now = new Date();
    var year = now.getFullYear().toString().slice(-2);
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var random = Math.floor(Math.random() * 9000) + 1000;
    return "OPS-" + year + month + "-" + random;
  }

};
