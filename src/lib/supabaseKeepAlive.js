import { supabase } from './supabase'

// Ping Supabase every 3 days to prevent the project from pausing due to inactivity.
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

export function startKeepAlive() {
  const ping = async () => {
    try {
      await supabase.from('profiles').select('id').limit(1)
    } catch (_) {}
  }
  ping()
  setInterval(ping, THREE_DAYS_MS)
}
