import { db } from "./db";
export const notify = (orgId: string, type: string, message: string) => db.notification.create({ data: { orgId, type, message: message.slice(0, 500) } });
