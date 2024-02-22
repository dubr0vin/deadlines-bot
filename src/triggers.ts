import { openDB, type Data, type DB } from "./repo"

export type Trigger = {
  at: number,
  func: () => void
}
export type TriggerFactory = (db: Data) => Trigger[]

const factories: TriggerFactory[] = []

export function addTriggersFactory(factory: TriggerFactory) {
  factories.push(factory)
}

export async function setupTriggers(db: DB) {
  setInterval(() => {
    const curTime = new Date().getTime()
    factories
      .map((it) => it(db.data))
      .reduce((a, b) => { a.push(...b); return a }, [])
      .filter((trigger) => db.data.lastUpdate <= trigger.at && trigger.at < curTime)
      .forEach((trigger) => trigger.func());
    db.data.lastUpdate = curTime
    db.write()
  }, 2000)
}

