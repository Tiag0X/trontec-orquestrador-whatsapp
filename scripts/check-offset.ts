
import axios from 'axios';
import { prisma } from '../lib/prisma';

async function main() {
    const settings = await prisma.settings.findFirst();
    if (!settings) return;

    const jid = "555191751921-1452255324@g.us";
    const url = `${settings.whatsappApiUrl.replace(/\/$/, '')}/message/find`;

    console.log(`📡 Checking offset 100 for group: ${jid}...`);
    try {
        const response = await axios.post(
          url,
          {
            chatid: jid,
            limit: 100,
            offset: 100
          },
          {
            headers: { token: settings.whatsappToken },
          }
        );
        
        const messages = response.data?.messages || [];
        console.log(`Received with offset 100: ${messages.length}`);
        
        if (messages.length > 0) {
            messages.forEach((m: any, i: number) => {
                const ts = m.messageTimestamp || m.MessageTimestamp || m.timestamp;
                const date = new Date(ts > 1e12 ? ts : ts * 1000);
                console.log(`[${i}] Date: ${date.toISOString()}`);
            });
        }

    } catch (e: any) {
        console.error("❌ Error:", e.response?.data || e.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
