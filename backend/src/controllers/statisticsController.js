import { supabase } from '../config/supabase.js'

export async function getShipmentStatistics(req, res) {
  try {
    const { data, error } = await supabase.from('shipments').select('status')

    if (error) throw error

    const stats = {
      total: data.length,
      pending: data.filter((s) => s.status === 'Pending').length,
      in_transit: data.filter((s) => s.status === 'In Transit').length,
      out_for_delivery: data.filter((s) => s.status === 'Out for Delivery').length,
      delivered: data.filter((s) => s.status === 'Delivered').length,
    }

    res.json({ success: true, data: stats })
  } catch (err) {
    console.error('Error fetching statistics:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}
