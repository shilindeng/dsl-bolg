import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
    log: ['info', 'warn', 'error'],
});

async function main() {
    console.log('🔍 正在测试数据库连接...');
    console.log(`📡 URL: ${process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@')}`); // 隐藏密码打印

    try {
        await prisma.$connect();
        console.log('✅ 连接成功！(Connection established)');

        const result = await prisma.$queryRaw`SELECT 1 as result`;
        console.log('✅ 查询成功！(Query executed)');
        console.log('📊 结果:', result);

    } catch (e: any) {
        console.error('❌ 连接失败 (Connection failed):');
        console.error('---------------------------------------------------');
        console.error(e.message);
        console.error('---------------------------------------------------');
        console.error('常见原因:');
        console.error('1. 密码错误 (P1001/P1013)');
        console.error('2. 网络不通 (IP限制/防火墙)');
        console.error('3. 数据库暂停 (Supabase Free Tier)');
        console.error('4. 密码含特殊字符未转义');
    } finally {
        await prisma.$disconnect();
    }
}

main();
