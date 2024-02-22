import type { Low } from 'lowdb'
import { JSONFilePreset } from 'lowdb/node'

export type Deadline = {
  id: string,
  text: string,
  repeated: boolean,
  at: number,
}

type Subscription = {
  chatID: number,
  before: number,
}

export type Data = {
  admins: number[],
  banned: number[],
  deadlines: Deadline[],
  subscriptions: Subscription[]
  lastUpdate: number
}

const defaultData: Data = {
  admins: [],
  banned: [],
  deadlines: [],
  subscriptions: [],
  lastUpdate: 0
}

export type DB = Low<Data>

export async function openDB(): Promise<DB> {
  return await JSONFilePreset('./db.json', defaultData)
}
