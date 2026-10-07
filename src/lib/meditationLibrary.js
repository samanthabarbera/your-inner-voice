import { supabase } from './supabase'

const LIBRARY_STORAGE_KEY = 'your-inner-voice-library'

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

  // Never save a meditation without its audio — an entry you can't play is worse
  // than a clear "couldn't save, try again".
  if (!audioBlob || audioBlob.size === 0) {
    throw new Error('The audio isn\'t ready yet. Please try saving again in a moment.')
  }

  const { error: uploadError } = await supabase.storage
    .from('meditation-audio')
    .upload(`${user.id}/${id}.mp3`, audioBlob, { contentType: 'audio/mpeg' })

  if (uploadError) {
    console.error('[save] audio upload failed:', uploadError)
    throw new Error('We couldn\'t upload the audio. Please try saving again.')
  }

  const { data: urlData } = supabase.storage
    .from('meditation-audio')
    .getPublicUrl(`${user.id}/${id}.mp3`)
  const audioUrl = urlData.publicUrl

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

  if (error) {
    // Don't leave an orphaned audio file behind if the row couldn't be written.
    await supabase.storage.from('meditation-audio').remove([`${user.id}/${id}.mp3`])
    throw error
  }
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
