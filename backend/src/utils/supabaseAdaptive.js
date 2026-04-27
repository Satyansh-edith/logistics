import { supabase } from '../config/supabase.js'

function getMissingColumn(error) {
  const message = error?.message || ''
  const match = message.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i)
  return match ? match[1] : null
}

export async function insertSingleAdaptive(table, payload) {
  const safePayload = { ...payload }

  for (let i = 0; i <= Object.keys(payload).length; i += 1) {
    const { data, error } = await supabase.from(table).insert(safePayload).select().single()

    if (!error) return { data, error: null }

    const missingColumn = getMissingColumn(error)
    if (!missingColumn || !(missingColumn in safePayload)) {
      return { data: null, error }
    }

    delete safePayload[missingColumn]
  }

  return { data: null, error: new Error(`Failed adaptive insert for table ${table}`) }
}

export async function updateSingleAdaptive(table, id, payload) {
  const safePayload = { ...payload }

  for (let i = 0; i <= Object.keys(payload).length; i += 1) {
    const { data, error } = await supabase
      .from(table)
      .update(safePayload)
      .eq('id', id)
      .select()
      .single()

    if (!error) return { data, error: null }

    const missingColumn = getMissingColumn(error)
    if (!missingColumn || !(missingColumn in safePayload)) {
      return { data: null, error }
    }

    delete safePayload[missingColumn]
  }

  return { data: null, error: new Error(`Failed adaptive update for table ${table}`) }
}
