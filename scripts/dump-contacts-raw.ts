
import { prisma } from '../lib/prisma';
import axios from 'axios';
import * as fs from 'fs';

async function main() {
    const settings = await prisma.settings.findFirst();
    if (!settings) return;

    const baseUrl = settings.whatsappApiUrl.replace(/\/$/, '');
    const headers = { token: settings.whatsappToken };

    console.log("Dumping /contacts (GET)...");
    try {
        const resGet = await axios.get(`${baseUrl}/contacts`, { headers });
        fs.writeFileSync('debug_get_contacts.json', JSON.stringify(resGet.data, null, 2));
        console.log("Saved debug_get_contacts.json");
    } catch (e: any) {
        console.error("Error GET /contacts:", e.message);
    }

    console.log("Dumping /contacts/list (POST)...");
    try {
        const resPost = await axios.post(`${baseUrl}/contacts/list`, { page: 1, pageSize: 1000, force: true }, { headers });
        fs.writeFileSync('debug_post_contacts_list.json', JSON.stringify(resPost.data, null, 2));
        console.log("Saved debug_post_contacts_list.json");
    } catch (e: any) {
        console.error("Error POST /contacts/list:", e.message);
    }
}

main().catch(console.error);
