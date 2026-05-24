import wolfjs from 'wolf.js';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import Jimp from 'jimp';

const { WOLF } = wolfjs;
const service = new WOLF();

async function solveCaptcha(imageUrl) {
    try {
        console.log("🛠 جاري تحسين جودة الصورة...");
        
        // 1. تحميل الصورة
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const image = await Jimp.read(response.data);

        // 2. معالجة الصورة (رمادي + تباين عالي لجعل النص واضحاً)
        const buffer = await image
            .greyscale()      // تحويل لرمادي
            .contrast(1)      // زيادة التباين لأقصى حد
            .getBufferAsync(Jimp.MIME_JPEG);

        console.log("🔍 جاري القراءة بعد التحسين...");

        // 3. قراءة النص من الصورة المحسنة
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
            tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
        });

        const cleanText = text.replace(/[^a-zA-Z0-9]/g, '');
        return cleanText.trim();
    } catch (err) {
        console.error("❌ خطأ في المعالجة:", err.message);
        return null;
    }
}

service.on('groupMessage', async (message) => {
    if (message.targetGroupId !== 81889058) return;

    let imageUrl = null;
    if (message.body && message.body.startsWith('http')) imageUrl = message.body;
    else if (message.attachments && message.attachments.length > 0) imageUrl = message.attachments[0].link;

    if (imageUrl) {
        console.log(`✅ صورة مكتشفة، جاري التحسين والحل...`);
        const solution = await solveCaptcha(imageUrl);
        
        if (solution) {
            console.log(`🔑 الحل المقترح: ${solution}`);
            await service.messaging.sendGroupMessage(message.targetGroupId, `#${solution}`);
        } else {
            console.log("⚠️ فشل في القراءة. الصورة معقدة جداً.");
        }
    }
});

service.login(process.env.U_MAIL, process.env.U_PASS);
