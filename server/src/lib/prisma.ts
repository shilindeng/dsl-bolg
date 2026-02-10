import { PrismaClient } from '@prisma/client';

// 全局单例，避免每个路由文件各自创建实例
const prisma = new PrismaClient();

export default prisma;
