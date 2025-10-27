import { supabase } from '../lib/supabaseClient'

const TABLE = 'room_requests'

export const createRoomRequest = async (request) => {
  const payload = {
    requester_id: request.requester_id,
    requester_name: request.requester_name,
    requester_email: request.requester_email,
    room_number: request.room_number,
    building_code: request.building_code,
    base_date: request.base_date,
    start_hour: request.start_hour,
    end_hour: request.end_hour,
    week_count: request.week_count,
    course_name: request.course_name || null,
    booked_by: request.booked_by || null,
    notes: request.notes || null,
    status: 'pending'
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .maybeSingle()

  return { data, error }
}

export const fetchRoomRequests = async ({ status, limit = 50 } = {}) => {
  let query = supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  return { data: data || [], error }
}

export const updateRoomRequestStatus = async ({
  id,
  status,
  reviewer_id,
  reviewer_name,
  rejection_reason
}) => {
  const payload = {
    status,
    reviewer_id,
    reviewer_name,
    reviewed_at: new Date().toISOString(),
    rejection_reason: rejection_reason || null
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .maybeSingle()

  return { data, error }
}
