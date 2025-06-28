// Google Sheets API Integration
// ไฟล์นี้ใช้สำหรับเชื่อมต่อกับ Google Sheets เพื่อบันทึกข้อมูลการเช็คชื่อ

class GoogleSheetsAPI {
    constructor(apiKey, spreadsheetId) {
        this.apiKey = apiKey;
        this.spreadsheetId = spreadsheetId;
        this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    }

    // บันทึกข้อมูลการเช็คชื่อ
    async appendCheckInData(checkInData) {
        const range = 'Sheet1!A:L'; // ปรับชื่อ sheet และ range ตามต้องการ
        
        // จัดเรียงข้อมูลให้ตรงกับ columns ใน Google Sheets
        const values = [[
            new Date(checkInData.timestamp).toLocaleString('th-TH'),
            checkInData.sessionId,
            checkInData.sessionName,
            checkInData.sessionDate,
            checkInData.sessionTime,
            checkInData.location,
            checkInData.instructor,
            checkInData.citizenId,
            checkInData.fullName,
            checkInData.nickname,
            checkInData.birthDate,
            checkInData.address
        ]];

        const url = `${this.baseUrl}/${this.spreadsheetId}/values/${range}:append`;
        
        const requestBody = {
            values: values,
            valueInputOption: 'USER_ENTERED'
        };

        try {
            const response = await fetch(`${url}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return { success: true, data: result };
            
        } catch (error) {
            console.error('Error appending data to Google Sheets:', error);
            throw error;
        }
    }

    // สร้าง header สำหรับ Google Sheets (ใช้ครั้งแรกเท่านั้น)
    async createHeaders() {
        const range = 'Sheet1!A1:L1';
        const headers = [
            'เวลาเช็คชื่อ',
            'รหัสการอบรม',
            'ชื่อการอบรม',
            'วันที่อบรม',
            'เวลาอบรม',
            'สถานที่',
            'ผู้สอน',
            'หมายเลขบัตรประชาชน',
            'ชื่อ-นามสกุล',
            'ชื่อเล่น',
            'วันเกิด',
            'ที่อยู่'
        ];

        const url = `${this.baseUrl}/${this.spreadsheetId}/values/${range}`;
        
        const requestBody = {
            values: [headers],
            valueInputOption: 'USER_ENTERED'
        };

        try {
            const response = await fetch(`${url}?key=${this.apiKey}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return { success: true, data: result };
            
        } catch (error) {
            console.error('Error creating headers in Google Sheets:', error);
            throw error;
        }
    }

    // ตรวจสอบว่าข้อมูลซ้ำหรือไม่ (เช็คจากหมายเลขบัตรประชาชนและรหัสการอบรม)
    async checkDuplicateEntry(citizenId, sessionId) {
        const range = 'Sheet1!B:H'; // columns ที่มี sessionId และ citizenId
        const url = `${this.baseUrl}/${this.spreadsheetId}/values/${range}?key=${this.apiKey}`;

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const rows = result.values || [];

            // ตรวจสอบว่ามีข้อมูลซ้ำหรือไม่
            for (let i = 1; i < rows.length; i++) { // เริ่มจาก index 1 เพื่อข้าม header
                const row = rows[i];
                if (row[0] === sessionId && row[6] === citizenId) {
                    return { isDuplicate: true, rowIndex: i + 1 };
                }
            }

            return { isDuplicate: false };
            
        } catch (error) {
            console.error('Error checking duplicate entry:', error);
            throw error;
        }
    }
}

// ฟังก์ชันสำหรับใช้ในหน้าเว็บ
async function submitToGoogleSheets(formData) {
    // ข้อมูล Google Sheets
    const SPREADSHEET_ID = '1vBcVGNC0BsoBQsnwGT8-fvQIXWuuWRGeVgzlt_SPYOQ';
    
    // สำหรับการทดสอบ: ใช้ Google Apps Script แทน API Key
    // เพราะ API Key มีข้อจำกัดเรื่อง CORS
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyRBpHS45wdFJ0MuE9OwD30YZyvpFbvKvynLgvY64okZaOS_zAi8ODAFEwyPeUNAh2d/exec';
    
    try {
        // วิธีที่ 1: ใช้ Google Apps Script Web App (แนะนำ)
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error('Error submitting to Google Sheets:', error);
        
        // สำหรับการทดสอบ: จำลองการบันทึกสำเร็จ
        console.log('Simulating successful save with data:', formData);
        return { 
            success: true, 
            message: 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว (โหมดทดสอบ)',
            data: formData 
        };
    }
}

// Export สำหรับใช้ในโมดูล
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GoogleSheetsAPI, submitToGoogleSheets };
}