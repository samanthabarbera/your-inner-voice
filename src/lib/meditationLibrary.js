import { supabase } from './supabase'

const LIBRARY_STORAGE_KEY = 'tune-up-meditation-library'

export function saveMeditationToLibrary(meditation) {
  const existing = JSON.parse(
    localStorage.getItem(LIBRARY_STORAGE_KEY) || '[]',
  )

  const entry = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    ...meditation,
  }

  existing.unshift(entry)
  localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(existing))

  return entry
}

export async function saveMeditationToCloud(user, meditation, audioBlob) {
  const id = crypto.randomUUID()

  let audioUrl = null
  if (audioBlob) {
    const { error: uploadError } = await supabase.storage
      .from('meditation-audio')
      .upload(`${user.id}/${id}.mp3`, audioBlob, { contentType: 'audio/mpeg' })

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('meditation-audio')
        .getPublicUrl(`${user.id}/${id}.mp3`)
      audioUrl = urlData.publicUrl
    }
  }

  const { data, error } = await supabase
    .from('meditations')
    .insert({
      id,
      user_id: user.id,
      title: meditation.title,
      theme: meditation.theme,
      length: meditation.length,
      voice: meditation.voice,
      custom_voice_id: meditation.customVoiceId ?? null,
      audio_url: audioUrl,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMeditations() {
  const { data, error } = await supabase
    .from('meditations')
    .select('*')
    .order('saved_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function deleteMeditation(id) {
  const { data: meditation } = await supabase
    .from('meditations')
    .select('audio_url, user_id')
    .eq('id', id)
    .single()

  if (meditation?.audio_url) {
    const path = `${meditation.user_id}/${id}.mp3`
    await supabase.storage.from('meditation-audio').remove([path])
  }

  const { error } = await supabase.from('meditations').delete().eq('id', id)
  if (error) throw error
}

export async function saveVoiceCloneId(userId, voiceId) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, eleven_labs_voice_id: voiceId, updated_at: new Date().toISOString() })
  if (error) throw error
}

export async function getVoiceCloneId(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('eleven_labs_voice_id')
    .eq('id', userId)
    .single()
  return data?.eleven_labs_voice_id ?? null
}
