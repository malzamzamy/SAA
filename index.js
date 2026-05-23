import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL || 'your_email@example.com',
    secret: process.env.U_PASS || 'your_password',
    taskGroupId: 81889058,
    depositGroupId: 81889058
};

const MY_INFO = {
    myId: "80055399"
};

const service = new WOLF();

// دالة لتنظيف الرموز لتصبح آمنة داخل Regex
const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

service.on('groupMessage', async (message) => {
    try {
        const content = message.body;
        const isTargetGroup = message.targetGroupId === settings.taskGroupId || message.targetGroupId === settings.depositGroupId;
        if (!isTargetGroup) return;

        // التحقق من أن الرسالة فخ وموجهة للعضوية
        if (content.includes("تحقق") && content.includes(MY_INFO.myId)) {
            
            // 1. استخراج الرموز من التعليمات
            const symbolMatch = content.match(/العلامتين\s*([^\s\w\u0600-\u06FF])\s*و\s*([^\s\w\u0600-\u06FF])/u);

            if (symbolMatch) {
                const sym1 = symbolMatch[1];
                const sym2 = symbolMatch[2];
                console.log(`✅ تم تحديد العلامات: [${sym1}] و [${sym2}]`);

                // 2. البحث عن كل المطابقات في النص كاملاً
                const pattern = new RegExp(`${escapeRegExp(sym1)}(.*?)${escapeRegExp(sym2)}`, 'gu');
                const matches = [...content.matchAll(pattern)];

                // 3. المنطق الذكي: تجاهل المطابقة الأولى (التعليمات) واستخدام الثانية (الإجابة)
                let result;
                if (matches.length > 1) {
                    result = matches[1]; // نأخذ المطابقة الثانية
                    console.log("🔎 تم العثور على مطابقة ثانية، سأعتمدها كإجابة.");
                } else if (matches.length === 1) {
                    result = matches[0]; // إذا لم يجد إلا واحدة، نستخدمها
                    console.log("⚠️ تم العثور على مطابقة واحدة فقط.");
                }

                if (result && result[1]) {
                    const answer = result[1].trim();
                    console.log(`🚀 الإجابة المعتمدة: ${answer}`);
                    
                    setTimeout(async () => {
                        await service.messaging.sendGroupMessage(message.targetGroupId, `#${answer}`);
                    }, 2000);
                } else {
                    console.log("❌ تعذر استخراج النص بين العلامات.");
                }
            }
        }
    } catch (err) {
        console.error("خطأ في معالجة الفخ:", err);
    }
});

// --- قسم المهام الدورية ---
service.on('ready', async () => {
    console.log(`🚀 البوت يعمل: نظام (تجاهل النتيجة الأولى) مفعل.`);
    
    try {
        await service.group.joinById(settings.taskGroupId);
        await service.group.joinById(settings.depositGroupId);

        // المهام الدورية
        setInterval(async () => {
            await service.messaging.sendGroupMessage(settings.taskGroupId, "!مد مهام");
            setTimeout(async () => {
                await service.messaging.sendGroupMessage(settings.depositGroupId, "!مد تحالف ايداع كل");
            }, 2000);
        }, 60000); 

        setInterval(async () => {
            await service.messaging.sendGroupMessage(settings.taskGroupId, "!مد صندوق فتح");
        }, 180000); 

    } catch (e) {
        console.error("خطأ في بدء المهام:", e);
    }
});

service.login(settings.identity, settings.secret);
