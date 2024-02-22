import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { openDB } from './repo'
import { addAdminCommands } from './admin'
import { addDeadlinesCommands } from './deadlines'
import { setupTriggers } from './triggers'
import { addSubscribsionsCommands } from './subscription'


async function main() {
  if (process.env.BOT_TOKEN == undefined) {
    console.log("Put bot token to BOT_TOKEN env")
    process.exit(1)
  }

  const bot = new Telegraf(process.env.BOT_TOKEN)
  const db = await openDB();
  addAdminCommands(bot, db)
  addDeadlinesCommands(bot, db)
  addSubscribsionsCommands(bot, db)
  setupTriggers(db)

  const help_message = `
Привет!
Это бот для отслеживания дедлайнов.
Чтобы подписаться на дедлайны отправь /subscribe 120, где 120 - кол-во минут перед дедлайном, когда надо прислать сообщение.
Чтобы добавить дедлайн прочитай /help_editor
  `
  bot.start(Telegraf.reply(help_message))
  bot.help(Telegraf.reply(help_message))

  bot.launch()


  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'))
}
main()