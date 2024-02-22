import type { Telegraf } from "telegraf";
import type { DB } from "./repo";

export async function addAdminCommands(bot: Telegraf, db: DB) {
  bot.use(async (ctx, next) => {
    if (db.data.banned.indexOf(ctx.from?.id ?? -1) == -1) {
      await next()
    }
  })

  bot.command('setup', async (ctx) => {
    if (db.data.admins.length == 0) {
      db.data.admins.push(ctx.from.id)
      await db.write()
      ctx.reply("You are admin now!")
    } else {
      ctx.reply("Setup is already complete")
    }
  })
  bot.command('user_id', (ctx) => {
    ctx.reply(`${ctx.from.id}`)
  })
  bot.command('add_admin', async (ctx) => {
    if (db.data.admins.indexOf(ctx.from.id) != -1 && ctx.args.length > 0) {
      const newAdminId = Number(ctx.args[0])
      db.data.admins.push(newAdminId)
      await db.write()
      ctx.reply(`New admin ${newAdminId} added`)
    }
  })
  bot.command('ban', async (ctx) => {
    if (db.data.admins.indexOf(ctx.from.id) != -1 && ctx.args.length > 0) {
      const bannedUser = Number(ctx.args[0])
      db.data.banned.push(bannedUser)
      await db.write()
      ctx.reply(`User ${bannedUser} banned`)
    }
  })
}