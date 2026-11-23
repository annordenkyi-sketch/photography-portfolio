import { useEffect, useState } from 'react'
import * as studioProfile from '../services/studioProfileService.js'

// Studio profile (name, contact details, social handles) from Admin →
// Settings, kept live: updates when it changes in this tab or another.
export function useStudioProfile() {
  const [profile, setProfile] = useState(() => studioProfile.getProfile())

  useEffect(() => {
    function refresh() { setProfile(studioProfile.getProfile()) }
    window.addEventListener(studioProfile.CHANGED_EVENT_NAME, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(studioProfile.CHANGED_EVENT_NAME, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return profile
}
