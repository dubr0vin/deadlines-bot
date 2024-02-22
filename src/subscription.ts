import { Telegraf } from "telegraf";
import { openDB, type Data, type DB } from "./repo";
import { addTriggersFactory } from "./triggers";
import { DateTime } from "luxon";

export async function addSubscribsionsCommands(bot: Telegraf, db: DB) {
  addTriggersFactory((data) => {
    return data.subscriptions.map(sub => {
      return data.deadlines.map(deadline => {
        return [{
          at: deadline.at * 1000 - sub.before * 60 * 1000,
          func: ()=>{
            bot.telegram.sendMessage(sub.chatID, `Через ${sub.before} наступит дедлайн ${deadline.text}`)
          }
        }]
      })
    }).flat(2)
  })

  bot.command('subscribe', async (ctx) => {
    if (ctx.args.length < 1) {
      ctx.reply("Отправь время за которое нужно предупреждать в минутах, например /subscribe 120")
      return
    }
    db.data.subscriptions.push({
      chatID: ctx.chat.id,
      before: Number(ctx.args[0])
    })
    await db.write()
    ctx.reply("Готово!")
  })
  bot.command('unsubscribe', async (ctx) => {
    while (true) {
      const idx = db.data.subscriptions.findIndex(s => s.chatID == ctx.chat.id)
      if (idx == -1) {
        break
      }
      db.data.subscriptions.splice(idx, 1)
    }
    await db.write()
    ctx.reply("Готово!")
  })
  bot.command('subscriptions', async (ctx) => {
    const text = db.data.subscriptions
      .filter(s => s.chatID == ctx.chat.id)
      .map(s => `- За ${s.before} минут`)
      .join("\n")

    ctx.reply("Ваши подписки:\n" + text)
  })

}