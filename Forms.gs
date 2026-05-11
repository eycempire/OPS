// ============================================
// Forms.gs — استقبال بيانات الفورمات
// OPS Passion School
// ============================================

var FormsHandler = {

  // ============================================
  // ── PI FORM — بيانات التسجيل الأولي ──
  // ============================================

  handlePI: function(data) {
    try {
      // التحقق من البيانات الأساسية
      var validation = this._validatePIData(data);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // لو في أكتر من طفل — نعالج كل طفل لوحده
      var results = [];
      var children = data.children || [data]; // دعم طفل واحد أو قايمة

      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var result = this._registerSingleChild(data, child);
        results.push(result);
      }

      return {
        success: true,
        message: "تم استلام طلب التسجيل بنجاح",
        registrations: results
      };

    } catch (e) {
      Logger.log("ERROR in handlePI: " + e.toString());
      return { success: false, error: "حصل خطأ أثناء معالجة البيانات" };
    }
  },

  // تسجيل طفل واحد
  _registerSingleChild: function(parentData, childData) {
    var studentId = CodesManager.generateStudentId();

    var studentRecord = {
      studentId:      studentId,
      parentName:     parentData.parentName,
      parentPhone:    parentData.parentPhone,
      parentWhatsapp: parentData.parentWhatsapp,
      childName:      childData.childName,
      childAge:       childData.childAge,
      childGrade:     childData.childGrade,
      childHobbies:   Array.isArray(childData.hobbies)
                        ? childData.hobbies.join(", ")
                        : (childData.hobbies || ""),
      childNotes:     childData.notes || ""
    };

    var saved = SheetsDB.addStudent(studentRecord);

    if (!saved) {
      return { success: false, childName: childData.childName, error: "مفيش مساحة في الشيت" };
    }

    // إشعار المساعدين بالطلب الجديد
    this._notifyAssistants(studentRecord);

    Logger.log("✅ تم تسجيل: " + childData.childName + " — ID: " + studentId);

    return {
      success:   true,
      studentId: studentId,
      childName: childData.childName
    };
  },

  // ============================================
  // ── PSCE FORM — بيانات اجتماع البيرنت ──
  // ============================================

  handlePSCE: function(data) {
    try {
      if (!data.studentId) {
        return { success: false, error: "كود الطالب مش موجود" };
      }

      var psceData = {
        sceId:          data.sceId,
        meetingDate:    data.meetingDate,
        parentBehavior: data.parentBehavior || "",
        expectations:   data.expectations || "",
        concerns:       data.concerns || "",
        homeEnvironment: data.homeEnvironment || "",
        notes:          data.notes || "",
        recordedAt:     new Date()
      };

      // حفظ البيانات في الطالب
      SheetsDB.updateStudentField(
        data.studentId,
        CONFIG.STUDENT_COLS.PSCE_DATA,
        JSON.stringify(psceData)
      );

      // تحديث الحالة
      SheetsDB.updateStudentStatus(data.studentId, CONFIG.STUDENT_STATUS.PSCE_DONE);

      return { success: true, message: "تم حفظ بيانات PSCE" };

    } catch (e) {
      Logger.log("ERROR in handlePSCE: " + e.toString());
      return { success: false, error: "حصل خطأ أثناء حفظ البيانات" };
    }
  },

  // ============================================
  // ── SCE FORM — نتائج جلسة الطفل ──
  // ============================================

  handleSCE: function(data) {
    try {
      if (!data.studentId) {
        return { success: false, error: "كود الطالب مش موجود" };
      }

      var sceData = {
        sceId:            data.sceId,
        sessionDate:      data.sessionDate,
        engagement:       data.engagement || "",       // مستوى التفاعل
        dominantPattern:  data.dominantPattern || "",  // النمط الظاهر
        strongSubjects:   data.strongSubjects || "",   // المواد القوية
        weakSubjects:     data.weakSubjects || "",     // المواد الضعيفة
        behaviorNotes:    data.behaviorNotes || "",    // ملاحظات السلوك
        passionIndicators: data.passionIndicators || "", // مؤشرات الشغف
        notes:            data.notes || "",
        recordedAt:       new Date()
      };

      // حفظ البيانات
      SheetsDB.updateStudentField(
        data.studentId,
        CONFIG.STUDENT_COLS.SCE_DATA,
        JSON.stringify(sceData)
      );

      // تحديث الحالة
      SheetsDB.updateStudentStatus(data.studentId, CONFIG.STUDENT_STATUS.SCE_DONE);

      return { success: true, message: "تم حفظ نتائج جلسة SCE" };

    } catch (e) {
      Logger.log("ERROR in handleSCE: " + e.toString());
      return { success: false, error: "حصل خطأ أثناء حفظ البيانات" };
    }
  },

  // ============================================
  // ── SESSION FORM — تسجيل سيشن ──
  // ============================================

  handleSession: function(data) {
    try {
      if (!data.studentId || !data.teacherId) {
        return { success: false, error: "بيانات ناقصة" };
      }

      var sessionId = SheetsDB.addSession({
        studentId: data.studentId,
        teacherId: data.teacherId,
        date:      data.date || new Date(),
        duration:  data.duration || 60,
        notes:     data.notes || ""
      });

      return { success: true, sessionId: sessionId };

    } catch (e) {
      Logger.log("ERROR in handleSession: " + e.toString());
      return { success: false, error: "حصل خطأ أثناء تسجيل السيشن" };
    }
  },

  // ============================================
  // ── HELPERS ──
  // ============================================

  _validatePIData: function(data) {
    if (!data.parentName || data.parentName.trim() === "") {
      return { valid: false, error: "اسم الوالد مطلوب" };
    }
    if (!data.parentWhatsapp || data.parentWhatsapp.trim() === "") {
      return { valid: false, error: "رقم الواتس آب مطلوب" };
    }

    var children = data.children || [data];
    for (var i = 0; i < children.length; i++) {
      if (!children[i].childName || children[i].childName.trim() === "") {
        return { valid: false, error: "اسم الطفل مطلوب" };
      }
    }

    return { valid: true };
  },

  // إشعار المساعدين بطلب جديد (جوه المنصة)
  _notifyAssistants: function(studentRecord) {
    // دي هتتربط بنظام الإشعارات الداخلي
    // في المرحلة دي بنحفظ الإشعار في الـ Sheet
    Logger.log("🔔 إشعار جديد: طلب تسجيل من " + studentRecord.parentName +
               " — الطفل: " + studentRecord.childName);
  }

};
