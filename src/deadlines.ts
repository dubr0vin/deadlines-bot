import type { Telegraf } from "telegraf";
import { openDB, type Data, type DB } from "./repo";
import { addTriggersFactory } from "./triggers";
import { DateTime } from "luxon";

const DEADLINES_HELP = `
Справочник команд редактора дедлайнов
/add TIME Any text here - добавляет дедлайн с указаным временем и текстом
/set_repeating ID - делает дедлайн c ID не повторяющимся (будет пинговать каждую неделю)
/set_nonrepeating ID - делает дедлайн c ID не повторяющимся (не будет пинговать каждую неделю)
/edit ID TIME Any text here - изменяет дедлайн с указаным ID
/del ID - удаляет дедлайн с указаным ID
/json_deadlines

TIME - время дедлайна указывается в формате день.месяц час:минута (например /add 31.01 23:59 Super cool deadline)
ID - id дедлайна, состоит из букв и цифр можно узнать из команды /json_deadlines или при создании дедлайна
`
export async function addDeadlinesCommands(bot: Telegraf, db: DB) {
  addTriggersFactory((data) => {
    return data
      .deadlines
      .map(deadline => {
        return {
          at: (deadline.at + 60) * 1000, // Через минуту после наступления дедлайна
          func: () => {
            if (deadline.repeated) {
              deadline.at += 7 * 24 * 60 * 60  // Добавляем неделю
            } else {
              data.deadlines.splice(data.deadlines.findIndex(d => d.id == deadline.id), 1)
            }
          }
        }
      })
  })

  bot.command('help_editor', (ctx) => {
    ctx.reply(DEADLINES_HELP)
  })

  bot.command('json_deadlines', (ctx) => {
    ctx.reply(`<pre><code class="language-json">${JSON.stringify(db.data.deadlines, undefined, 2)}</code></pre>`,
      { parse_mode: "HTML" })
  })

  bot.command('add', async (ctx) => {
    if (ctx.args.length < 3) {
      ctx.reply(DEADLINES_HELP)
      return
    }
    const ts = DateTime.fromFormat(ctx.args[0] + " " + ctx.args[1], "dd.MM HH:mm", {
      zone: "Europe/Moscow"
    }).toSeconds()
    const text = ctx.args.slice(2).join(" ")
    const id = Math.random().toString(16).slice(2);
    db.data.deadlines.push({
      at: ts,
      text: text,
      repeated: false,
      id: id
    })
    await db.write()
    ctx.reply(`Готово! 
ID дедлайна: <pre><code>${id}</code></pre>`, {
      parse_mode: "HTML"
    })
  })

  bot.command('del', async (ctx) => {
    if (ctx.args.length < 1) {
      ctx.reply(DEADLINES_HELP)
      return
    }

    const idx = db.data.deadlines.findIndex((deadline) => deadline.id == ctx.args[0])
    if (idx != -1) {
      db.data.deadlines.splice(idx, 1)
      await db.write()
      ctx.reply("Готово!")
    } else {
      ctx.reply("404")
    }
  })

  bot.command('set_repeating', async (ctx) => {
    if (ctx.args.length < 1) {
      ctx.reply(DEADLINES_HELP)
      return
    }

    const deadline = db.data.deadlines.find((deadline) => deadline.id == ctx.args[0])
    if (deadline !== undefined) {
      deadline.repeated = true
      await db.write()
      ctx.reply("Готово!")
    } else {
      ctx.reply("404")
    }
  })

  bot.command('set_nonrepeating', async (ctx) => {
    if (ctx.args.length < 1) {
      ctx.reply(DEADLINES_HELP)
      return
    }

    const deadline = db.data.deadlines.find((deadline) => deadline.id == ctx.args[0])
    if (deadline !== undefined) {
      deadline.repeated = false
      await db.write()
      ctx.reply("Готово!")
    } else {
      ctx.reply("404")
    }
  })

  bot.command('edit', async (ctx) => {
    if (ctx.args.length < 4) {
      ctx.reply(DEADLINES_HELP)
      return
    }

    const deadline = db.data.deadlines.find((deadline) => deadline.id == ctx.args[0])
    if (deadline === undefined) {
      ctx.reply("404")
      return
    }

    const ts = DateTime.fromFormat(ctx.args[1] + " " + ctx.args[2], "dd.MM HH:mm", {
      zone: "Europe/Moscow"
    }).toSeconds()
    const text = ctx.args.slice(2).join(" ")

    deadline.at = ts;
    deadline.text = text
    await db.write()
    ctx.reply("Готово!")
  })

  bot.command("deadlines", (ctx) => {
    ctx.reply("Дедлайны:\n" +
      db.data.deadlines.map(deadline => {
        return `- ${DateTime.fromSeconds(deadline.at).setLocale('ru-RU').toLocaleString(DateTime.DATETIME_FULL)} <b>${deadline.text}</b>`
      }).join("\n"),
      {
        parse_mode: "HTML"
      }
    )
  })
}