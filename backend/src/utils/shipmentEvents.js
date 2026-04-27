import { supabase } from '../config/supabase.js'

export async function fetchShipmentEvents(shipmentId) {
  const occurredAtQuery = await supabase
    .from('shipment_events')
    .select('*')
    .eq('shipment_id', shipmentId)
    .order('occurred_at', { ascending: true })

  if (!occurredAtQuery.error) return occurredAtQuery

  const message = occurredAtQuery.error?.message || ''
  const shouldRetryWithTimestamp = /occurred_at/i.test(message) && /does not exist/i.test(message)

  if (!shouldRetryWithTimestamp) return occurredAtQuery

  return supabase
    .from('shipment_events')
    .select('*')
    .eq('shipment_id', shipmentId)
    .order('timestamp', { ascending: true })
}
