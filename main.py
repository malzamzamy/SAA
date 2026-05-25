import asyncio
import os
from dotenv import load_dotenv
from wolf import WOLF

# تحميل الإعدادات (الايميل والباسورد فقط من ملف .env)
load_dotenv()
IDENTITY = os.getenv('U_MAIL')
SECRET = os.getenv('U_PASS')

# وضع رقم القناة مباشرة هنا
GROUP_ID = 81889058

client = WOLF()

async def task_loop():
    """حلقة تكرار لإرسال المهمة كل دقيقة"""
    await client.group.join_by_id(GROUP_ID)
    print(f"✅ تم الانضمام للمجموعة {GROUP_ID}")
    
    while True:
        try:
            await client.messaging.send_group_message(GROUP_ID, "!مد مهام")
            print("🚀 تم إرسال: !مد مهام")
        except Exception as e:
            print(f"❌ خطأ أثناء الإرسال: {e}")
        
        await asyncio.sleep(60) # الانتظار لمدة 60 ثانية

@client.on('ready')
async def on_ready(event):
    print("🚀 البوت متصل وجاهز.")
    # تشغيل المهمة الدورية
    asyncio.create_task(task_loop())

if __name__ == "__main__":
    client.login(IDENTITY, SECRET)
