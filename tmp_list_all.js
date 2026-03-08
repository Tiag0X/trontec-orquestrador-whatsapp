const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.group.findMany({
    select: { id: true, name: true, jid: true }
}).then(r => {
    console.log('COUNT:' + r.length);
    console.log(JSON.stringify(r, null, 2));
    return p.$disconnect();
}).catch(e => { console.error(e); process.exit(1); });
