import 'dotenv/config';
import wolfjs from 'wolf.js';
import Jimp from 'jimp';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';

const { WOLF } = wolfjs;
const client = new WOLF();

const TARGET_USER_ID = "51660277";
const CHANNEL_ID = 81889058;

client.on('ready', async () => {
    console.log("🚀 البوت يعمل ويراقب القناة...");
    await client.group.joinById(CHANNEL_ID);
});

client.on('groupMessage', async (message) => {
    // التأكد أن الرسالة من المستخدم المحدد وفي القناة المحددة
    if (message.sourceSubscriberId == TARGET_USER_ID && message.targetGroupId == CHANNEL_ID) {
        
        // التحقق من وجود صورة
        if (message.hasAttachments) {
            const imgUrl = message.attachments[0].link;
            console.log("📸 تم استلام صورة من المستخدم، جاري التحقق...");
            
            try {
                const isMatch = await compareImages(imgUrl, 'reference.png');
                if (isMatch) {
                    console.log("✅ النتيجة: الصورة مطابقة (90%+)");
                } else {
                    console.log("❌ النتيجة: الصورة غير مطابقة");
                }
            } catch (err) {
                console.error("خطأ أثناء معالجة الصورة:", err);
            }
        }
    }
});

// دالة مقارنة الصور
async function compareImages(imageUrl, refPath) {
    const img1 = await Jimp.read(imageUrl);
    const img2 = await Jimp.read(refPath);

    // توحيد حجم الصورتين للمقارنة
    img1.resize(300, 150); // اجعل الحجم مطابقاً لأبعاد الكابتشا في مثالك
    img2.resize(300, 150);

    const width = 300;
    const height = 150;
    const diff = new PNG({ width, height });

    const numDiffPixels = pixelmatch(
        img1.bitmap.data,
        img2.bitmap.data,
        diff.data,
        width,
        height,
        { threshold: 0.1 } // يمكنك تقليل هذه القيمة لزيادة الدقة
    );

    const totalPixels = width * height;
    const similarity = 1 - (numDiffPixels / totalPixels);
    
    console.log(`نسبة التطابق: ${(similarity * 100).toFixed(2)}%`);
    
    return similarity >= 0.90; // نسبة 90%
}

client.login(process.env.U_MAIL, process.env.U_PASS);
