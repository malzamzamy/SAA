import 'dotenv/config';
import wolfjs from 'wolf.js';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Jimp = require('jimp');

const { WOLF } = wolfjs;
const client = new WOLF();

const TARGET_USER_ID = 51660277;
const CHANNEL_ID = 81889058;

client.on('ready', async () => {
    console.log("✅ البوت متصل ومستعد!");
    await client.group.joinById(CHANNEL_ID);
});

client.on('groupMessage', async (message) => {
    if (message.sourceSubscriberId == TARGET_USER_ID && message.targetGroupId == CHANNEL_ID) {
        const imageUrl = message.body || (message.attachments && message.attachments[0]?.link);

        if (imageUrl && (imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg') || imageUrl.endsWith('.png'))) {
            console.log("📸 اكتشفت صورة! جاري عزل البطاقة المطلوبة...");
            try {
                // معالجة ذكية: عزل البطاقة المطلوبة وقراءتها
                const code = await solveCaptcha(imageUrl);
                console.log("🎯 الرمز المستخرج هو:", code);
                
                // يمكنك تفعيل الرد هنا إذا أردت
                // await client.messaging.sendGroupMessage(CHANNEL_ID, `#${code}`);
            } catch (err) {
                console.error("❌ خطأ:", err.message);
            }
        }
    }
});

async function solveCaptcha(url) {
    // 1. تحميل الصورة الأصلية باستخدام Jimp للتحليل
    const image = await Jimp.read(url);
    const { width, height } = image.bitmap;

    // 2. البحث عن الإطار الأصفر المتقطع (تحديد موقع البطاقة)
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let found = false;

    image.scan(0, 0, width, height, (x, y, idx) => {
        const r = image.bitmap.data[idx + 0];
        const g = image.bitmap.data[idx + 1];
        const b = image.bitmap.data[idx + 2];

        // اكتشاف اللون الأصفر الخاص بالإطار
        if (r > 200 && g > 200 && b < 100) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            found = true;
        }
    });

    if (!found) throw new Error("لم يتم العثور على البطاقة المميزة!");

    // 3. قص المنطقة المحددة بدقة
    const cropWidth = maxX - minX;
    const cropHeight = maxY - minY;
    
    const croppedBuffer = await sharp(await (await fetch(url)).arrayBuffer())
        .extract({ left: minX + 5, top: minY + 5, width: cropWidth - 10, height: cropHeight - 10 })
        .greyscale()
        .threshold(150)
        .toBuffer();

    // 4. قراءة النص من المنطقة المقصوصة فقط
    const worker = await createWorker('eng+ara');
    const { data: { text } } = await worker.recognize(croppedBuffer);
    await worker.terminate();

    return text.replace(/[^a-zA-Z0-9\u0621-\u064A]/g, '').trim();
}

client.login(process.env.U_MAIL, process.env.U_PASS);
