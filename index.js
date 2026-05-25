import 'dotenv/config';
import wolfjs from 'wolf.js';
import JimpModule from 'jimp';
import PixelmatchModule from 'pixelmatch';
import { PNG } from 'pngjs';

const { WOLF } = wolfjs;
const Jimp = JimpModule.default || JimpModule;
const pixelmatch = PixelmatchModule.default || PixelmatchModule;

const client = new WOLF();

// الإعدادات
const TARGET_USER_ID = "51660277";
const CHANNEL_ID = 81889058;

client.on('ready', async () => {
    console.log("🚀 البوت متصل الآن!");
    await client.group.joinById(CHANNEL_ID);
    console.log(`✅ تم الانضمام للقناة: ${CHANNEL_ID}`);
});

client.on('groupMessage', async (message) => {
    // التحقق: هل الرسالة من المستخدم المحدد وفي القناة المطلوبة؟
    if (message.sourceSubscriberId == TARGET_USER_ID && message.targetGroupId == CHANNEL_ID) {
        
        // التحقق من وجود صورة
        if (message.attachments && message.attachments.length > 0) {
            const imgUrl = message.attachments[0].link;
            console.log("📸 تم استلام صورة.. جاري التحقق...");
            
            try {
                const isMatch = await compareImages(imgUrl, 'reference.png');
                if (isMatch) {
                    console.log("✅ النتيجة: الصورة مطابقة (90%+)");
                } else {
                    console.log("❌ النتيجة: الصورة غير مطابقة");
                }
            } catch (err) {
                console.error("خطأ أثناء المعالجة:", err.message);
            }
        }
    }
});

async function compareImages(imageUrl, refPath) {
    // قراءة الصور
    const img1 = await Jimp.read(imageUrl);
    const img2 = await Jimp.read(refPath);

    // توحيد الأبعاد (هذا ضروري جداً لـ pixelmatch)
    const width = 300;
    const height = 150;
    img1.resize(width, height);
    img2.resize(width, height);

    const diff = new PNG({ width, height });

    // المقارنة
    const numDiffPixels = pixelmatch(
        img1.bitmap.data,
        img2.bitmap.data,
        diff.data,
        width,
        height,
        { threshold: 0.1 } // نسبة التسامح (يمكنك زيادتها لـ 0.2 إذا فشل التطابق)
    );

    const totalPixels = width * height;
    const similarity = 1 - (numDiffPixels / totalPixels);
    
    console.log(`📊 نسبة التطابق: ${(similarity * 100).toFixed(2)}%`);
    
    return similarity >= 0.90;
}

// تسجيل الدخول باستخدام المتغيرات البيئية
client.login(process.env.U_MAIL, process.env.U_PASS);
