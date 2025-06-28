// Google Apps Script Code
// คัดลอกโค้ดนี้ไปสร้าง Google Apps Script เพื่อรับข้อมูลจากเว็บแอป
// และบันทึกลง Google Sheets

function doPost(e) {
  try {
    // ข้อมูลที่ส่งมาจากเว็บแอป
    const data = JSON.parse(e.postData.contents);
    
    // ID ของ Google Sheets ที่ต้องการบันทึกข้อมูล
    const SPREADSHEET_ID = '1vBcVGNC0BsoBQsnwGT8-fvQIXWuuWRGeVgzlt_SPYOQ';
    
    // เปิด Google Sheets
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    
    // ตรวจสอบว่ามี header หรือยัง
    if (sheet.getLastRow() === 0) {
      createHeaders(sheet);
    }
    
    // ตรวจสอบข้อมูลซ้ำ (ใช้ชื่อ-นามสกุลแทนหมายเลขบัตรประชาชน)
    const isDuplicate = checkDuplicateEntry(sheet, data.fullName, data.sessionId);
    if (isDuplicate) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'พบข้อมูลการเช็คชื่อของท่านในการอบรมนี้แล้ว'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // เพิ่มข้อมูลใหม่
    const newRow = [
      new Date(data.timestamp),  // เวลาเช็คชื่อ
      data.sessionId,            // รหัสการอบรม
      data.sessionName,          // ชื่อการอบรม
      data.sessionDate,          // วันที่อบรม
      data.sessionTime,          // เวลาอบรม
      data.location,             // สถานที่
      data.instructor,           // ผู้สอน
      data.fullName,             // ชื่อ-นามสกุล
      data.nickname              // ชื่อเล่น
    ];
    
    sheet.appendRow(newRow);
    
    // ส่งผลลัพธ์กลับ
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'บันทึกข้อมูลสำเร็จ',
      rowAdded: sheet.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // สำหรับทดสอบการเชื่อมต่อ
  return ContentService.createTextOutput(JSON.stringify({
    status: 'Google Apps Script is working',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function createHeaders(sheet) {
  const headers = [
    'เวลาเช็คชื่อ',
    'รหัสการอบรม', 
    'ชื่อการอบรม',
    'วันที่อบรม',
    'เวลาอบรม',
    'สถานที่',
    'ผู้สอน',
    'ชื่อ-นามสกุล',
    'ชื่อเล่น'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // จัดรูปแบบ header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
}

function checkDuplicateEntry(sheet, fullName, sessionId) {
  const data = sheet.getDataRange().getValues();
  
  // ข้าม header row (index 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowSessionId = row[1]; // column B (รหัสการอบรม)
    const rowFullName = row[7];  // column H (ชื่อ-นามสกุล)
    
    if (rowSessionId === sessionId && rowFullName === fullName) {
      return true;
    }
  }
  
  return false;
}

// ฟังก์ชันสำหรับดูข้อมูลการเช็คชื่อ (สำหรับผู้สอน)
function getCheckInData(sessionId) {
  try {
    const SPREADSHEET_ID = '1vBcVGNC0BsoBQsnwGT8-fvQIXWuuWRGeVgzlt_SPYOQ';
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    const checkInData = [];
    
    // ข้าม header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1] === sessionId) { // ตรวจสอบ sessionId
        checkInData.push({
          timestamp: row[0],
          sessionId: row[1],
          sessionName: row[2],
          sessionDate: row[3],
          sessionTime: row[4],
          location: row[5],
          instructor: row[6],
          fullName: row[7],
          nickname: row[8]
        });
      }
    }
    
    return {
      success: true,
      data: checkInData,
      total: checkInData.length
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ฟังก์ชันสำหรับสร้างรายงานการเช็คชื่อ
function generateReport(sessionId) {
  try {
    const result = getCheckInData(sessionId);
    
    if (!result.success) {
      return result;
    }
    
    const data = result.data;
    
    if (data.length === 0) {
      return {
        success: false,
        error: 'ไม่พบข้อมูลการเช็คชื่อสำหรับการอบรมนี้'
      };
    }
    
    // สร้างรายงานสรุป
    const report = {
      sessionInfo: {
        sessionId: data[0].sessionId,
        sessionName: data[0].sessionName,
        sessionDate: data[0].sessionDate,
        sessionTime: data[0].sessionTime,
        location: data[0].location,
        instructor: data[0].instructor
      },
      statistics: {
        totalParticipants: data.length,
        firstCheckIn: data[0].timestamp,
        lastCheckIn: data[data.length - 1].timestamp
      },
      participants: data.map(participant => ({
        checkInTime: participant.timestamp,
        fullName: participant.fullName,
        nickname: participant.nickname
      }))
    };
    
    return {
      success: true,
      report: report
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}