import { prisma } from '../lib/prisma';
async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log("Users:", users.length);
        if (users.length > 0) console.log(users);
        
        // Let's check schema to see what model corresponds to profiles
    } catch (e: any) {
        console.log("Error querying users:", e.message);
    }
}
main().finally(() => prisma.$disconnect());
