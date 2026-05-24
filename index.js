import wolfjs from 'wolf.js';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import Jimp from 'jimp';

const { WOLF } = wolfjs;
const service = new WOLF();

const CONFIG = {
    MONITOR_GROUP: 81889058, // الروم المستهدف
    RESULT_ROOM: 9969        // روم النتائج
};

// وظيفة تحديد وقراءة البطاقة الأغمق
async function solveCaptcha(imageUrl) {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const image = await Jimp.read(response.data);

        const width = image.bitmap.width;
        const height = image.bitmap.height;
        const blockWidth = Math.floor(width / 6); 

        let darkestBlockIndex = 0;
        let lowestBrightness = 255;

        // البحث عن أغمق بطاقة (الأكثر احتمالاً أنها هي المطلوبة)
        for (let i = 0; i < 6; i++) {
            const currentBlock = image.clone().crop(i * blockWidth, 0, blockWidth, height);
            let currentBrightness = 0;
            currentBlock.scan(0, 0, currentBlock.bitmap.width, currentBlock.bitmap.height, function(x, y, idx) {
                currentBrightness += (this.bitmap.data[idx] + this.bitmap.data[idx+1] + this.bitmap.data[idx+2]) / 3;
            });
            currentBrightness = currentBrightness / (currentBlock.bitmap.width * currentBlock.bitmap.height);

            if (currentBrightness < lowestBrightness) {
                lowestBrightness = currentBrightness;
                darkestBlockIndex = i;
            }
        }

        const finalBlock = image.crop(darkestBlockIndex * blockWidth, 0, blockWidth, height);
        await finalBlock.greyscale().contrast(1).normalize();
        const buffer = await finalBlock.getBufferAsync(Jimp.MIME_PNG);

        const { data: { text } } = await Tesseract.recognize(buffer, 'eng+ara');
        return text.trim();
    } catch (err) {
        console.error("❌ خطأ في المعالجة:", err.message);
        return null;
    }
}

// مراقبة الرسائل (بدون تحديد عضو)
service.on('groupMessage', async (message) => {
    // التحقق من أن الرسالة في الروم المطلوب فقط
    if (message.targetGroupId !== CONFIG.MONITOR_GROUP) return;

    // استكشاف الصورة (سواء كانت مرفق أو رابط في النص)
    let imageUrl = null;
    
    // 1. محاولة التقاطها من المرفقات
    if (message.attachments && message.attachments.length > 0) {
        imageUrl = message.attachments[0].link;
    } 
    // 2. محاولة التقاطها إذا كانت رابطاً مباشراً في النص
    else if (message.body && message.body.match(/\.(jpg|jpeg|png)$/)) {
        imageUrl = message.body;
    }

    if (imageUrl) {
        console.log("📸 تم اكتشاف صورة في الروم من أي عضو، جاري الحل...");
        const result = await solveCaptcha(imageUrl);
        
        if (result && result.length > 0) {
            console.log(`🔑 النتيجة: ${result}`);
            await service.messaging.sendGroupMessage(CONFIG.RESULT_ROOM, `# ${result}`);
        }
    } else {
        // للديـبـق (Debugging): إذا لم يلتقط البوت الصورة، هذا السطر سيخبرك بالسبب
        // console.log("رسالة في الروم لا تحتوي على صورة:", message.body);
    }
});

service.login(process.env.U_MAIL, process.env.U_PASS);
