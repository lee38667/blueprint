import Layout from '../components/Layout'
import Card from '../components/Card'
import Toggle from '../components/Toggle'
import { useStore, themes, type ThemeName } from '../lib/store'
import { useCalendar } from '../hooks/useCalendar'
import { useEffect, useState } from 'react'
import { useProfile, type ProfilePayload } from '../hooks/useProfile'
import { useMfa } from '../hooks/useMfa'
import Button from '../components/Button'

const DASHBOARD_ZONES = ['briefing', 'metrics', 'body', 'gym', 'motivation', 'ai']
const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const COACHING_TONES: ProfilePayload['coaching_tone'][] = ['direct', 'gentle', 'analytical', 'encouraging']

const splitList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean)
const joinList = (value: string[]) => value.join(', ')

export default function SettingsPage() {
  const theme = useStore((state) => state.theme)
  const setTheme = useStore((state) => state.setTheme)
  const animations = useStore((state) => state.animationsEnabled)
  const setAnimations = useStore((state) => state.setAnimationsEnabled)
  const fontSize = useStore((state) => state.baseFontSize)
  const setFontSize = useStore((state) => state.setBaseFontSize)
  const sessionTimeout = useStore((state) => state.sessionTimeoutMinutes)
  const setSessionTimeout = useStore((state) => state.setSessionTimeoutMinutes)
  const highContrastMode = useStore((state) => state.highContrastMode)
  const setHighContrastMode = useStore((state) => state.setHighContrastMode)
  const { connected, loading, connect, disconnect } = useCalendar()
  const { currentProfile, loading: profileLoading, saving: profileSaving, error: profileError, saveProfile } = useProfile()
  const mfa = useMfa()
  const [profileForm, setProfileForm] = useState<ProfilePayload>(currentProfile)
  const [mfaCode, setMfaCode] = useState('')

  useEffect(() => {
    setProfileForm(currentProfile)
  }, [currentProfile])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('calendar_connected') || params.get('calendar_error')) {
      if (params.get('calendar_error')) {
        console.error('Calendar connection error:', params.get('calendar_error'))
      }
      window.history.replaceState({}, '', '/settings')
    }
  }, [])

  const themeEntries = Object.entries(themes) as [ThemeName, typeof themes[ThemeName]][]

  const updateProfileField = <K extends keyof ProfilePayload>(key: K, value: ProfilePayload[K]) => {
    setProfileForm((current) => ({ ...current, [key]: value }))
  }

  const toggleDashboardZone = (zone: string) => {
    setProfileForm((current) => ({
      ...current,
      default_dashboard_zones: current.default_dashboard_zones.includes(zone)
        ? current.default_dashboard_zones.filter((item) => item !== zone)
        : [...current.default_dashboard_zones, zone],
    }))
  }

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await saveProfile(profileForm)
  }

  const verifyMfa = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!mfaCode.trim()) return
    await mfa.verifyEnrollment(mfaCode.trim())
    setMfaCode('')
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6 py-4">
        <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--theme-text)' }}>
          Settings
        </h1>

        <Card title="Profile" subtitle="Identity, planning defaults, and coaching context.">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Display Name</label>
                <input value={profileForm.display_name ?? ''} onChange={(event) => updateProfileField('display_name', event.target.value)} className="input-base w-full" disabled={profileLoading} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Avatar URL</label>
                <input value={profileForm.avatar_url ?? ''} onChange={(event) => updateProfileField('avatar_url', event.target.value)} className="input-base w-full" disabled={profileLoading} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Timezone</label>
                <input value={profileForm.timezone} onChange={(event) => updateProfileField('timezone', event.target.value)} className="input-base w-full" disabled={profileLoading} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Preferred Currency</label>
                <input value={profileForm.preferred_currency} onChange={(event) => updateProfileField('preferred_currency', event.target.value.toUpperCase().slice(0, 3))} className="input-base w-full" maxLength={3} disabled={profileLoading} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Weekly Planning Day</label>
                <select value={profileForm.weekly_planning_day} onChange={(event) => updateProfileField('weekly_planning_day', event.target.value)} className="input-base w-full" disabled={profileLoading}>
                  {WEEK_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Coaching Tone</label>
                <select value={profileForm.coaching_tone} onChange={(event) => updateProfileField('coaching_tone', event.target.value as ProfilePayload['coaching_tone'])} className="input-base w-full" disabled={profileLoading}>
                  {COACHING_TONES.map((tone) => <option key={tone} value={tone}>{tone}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Life Season</label>
              <input value={profileForm.life_season ?? ''} onChange={(event) => updateProfileField('life_season', event.target.value)} className="input-base w-full" disabled={profileLoading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Primary Roles</label>
                <input value={joinList(profileForm.primary_roles)} onChange={(event) => updateProfileField('primary_roles', splitList(event.target.value))} className="input-base w-full" placeholder="Founder, student, athlete" disabled={profileLoading} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Core Values</label>
                <input value={joinList(profileForm.core_values)} onChange={(event) => updateProfileField('core_values', splitList(event.target.value))} className="input-base w-full" placeholder="Discipline, faith, health" disabled={profileLoading} />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>Focus Statement</label>
              <textarea value={profileForm.focus_statement ?? ''} onChange={(event) => updateProfileField('focus_statement', event.target.value)} rows={3} className="input-base w-full" disabled={profileLoading} />
            </div>

            <div>
              <div className="text-xs mb-2" style={{ color: 'var(--theme-text-muted)' }}>Default Dashboard Zones</div>
              <div className="flex flex-wrap gap-2">
                {DASHBOARD_ZONES.map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => toggleDashboardZone(zone)}
                    className="px-3 py-1.5 rounded-lg text-xs capitalize"
                    style={{
                      background: profileForm.default_dashboard_zones.includes(zone) ? 'var(--theme-accent)' : 'var(--theme-surface)',
                      color: profileForm.default_dashboard_zones.includes(zone) ? 'var(--theme-accent-text)' : 'var(--theme-text-dim)',
                      border: '1px solid var(--theme-border)',
                    }}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            </div>

            {profileError && <p className="text-xs text-red-400">{profileError}</p>}
            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={profileSaving} disabled={profileLoading}>Save Profile</Button>
            </div>
          </form>
        </Card>

        <Card title="Theme">
          <div className="space-y-6">
            <div>
              <div className="text-sm mb-3" style={{ color: 'var(--theme-text-muted)' }}>App Theme</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {themeEntries.map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className="relative p-4 rounded-xl transition-all duration-200 text-left group"
                    style={{
                      background: config.cardBg,
                      border: theme === key ? `2px solid ${config.accent}` : '2px solid transparent',
                      boxShadow: theme === key ? `0 0 20px ${config.accent}33` : 'none',
                    }}
                  >
                    <div className="flex gap-1.5 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: config.accent }} />
                      <div className="w-3 h-3 rounded-full" style={{ background: config.bg }} />
                      <div className="w-3 h-3 rounded-full" style={{ background: config.surface }} />
                    </div>
                    <div className="text-sm font-medium" style={{ color: config.text }}>
                      {config.label}
                    </div>
                    {theme === key && (
                      <div
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                        style={{ background: config.accent, color: config.accentText }}
                      >
                        ?
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Toggle
              checked={highContrastMode}
              onChange={setHighContrastMode}
              label="High Contrast"
              description="Boost contrast for priority colors, surfaces, and badges."
            />

            <Toggle
              checked={animations}
              onChange={setAnimations}
              label="Animations"
              description="Toggle micro-interactions and transitions."
            />

            <div>
              <div className="text-sm mb-2" style={{ color: 'var(--theme-text-dim)' }}>
                Base Typography Size
              </div>
              <input
                type="range"
                min={14}
                max={18}
                value={fontSize}
                onChange={(event) => setFontSize(parseInt(event.target.value, 10))}
                className="w-full accent-[var(--theme-accent)]"
                style={{ accentColor: 'var(--theme-accent)' }}
              />
              <div className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                {fontSize}px
              </div>
            </div>
          </div>
        </Card>

        <Card title="Integrations">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm" style={{ color: 'var(--theme-text-dim)' }}>Google Calendar</div>
                <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  {connected ? 'Connected - AI can see your schedule' : 'Connect to let AI know about your schedule'}
                </div>
              </div>
              {loading ? (
                <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Loading...</div>
              ) : connected ? (
                <button
                  onClick={disconnect}
                  className="px-4 py-2 rounded text-sm border border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  Disconnect
                </button>
              ) : (
                <button onClick={connect} className="btn-accent px-4 py-2 rounded text-sm">
                  Connect Calendar
                </button>
              )}
            </div>
          </div>
        </Card>

        <Card title="Security">
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-sm" style={{ color: 'var(--theme-text-dim)' }}>Two-Factor Authentication</div>
                  <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    {mfa.loading ? 'Checking MFA status...' : mfa.enabled ? 'Enabled with authenticator app verification.' : 'Not enabled. Add an authenticator app for stronger account protection.'}
                  </div>
                </div>
                {!mfa.loading && !mfa.enabled && !mfa.enrollment && (
                  <Button variant="primary" loading={mfa.working} onClick={mfa.startEnrollment}>Enable MFA</Button>
                )}
                {!mfa.loading && mfa.enabled && (
                  <Button variant="danger" loading={mfa.working} onClick={() => mfa.unenrollFactor(mfa.factors[0].id)}>Disable MFA</Button>
                )}
              </div>

              {mfa.enrollment && (
                <form onSubmit={verifyMfa} className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4">
                    <div className="rounded-lg bg-white p-2">
                      <img src={mfa.enrollment.qrCode} alt="Authenticator QR code" className="w-full h-auto" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm" style={{ color: 'var(--theme-text-dim)' }}>Scan the QR code, then enter the 6-digit code from your authenticator app.</p>
                      <div className="text-xs break-all rounded-lg p-3" style={{ background: 'var(--theme-card-bg)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
                        Secret: {mfa.enrollment.secret}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className="input-base" inputMode="numeric" placeholder="000000" />
                        <Button type="submit" variant="primary" loading={mfa.working} disabled={mfaCode.length < 6}>Verify</Button>
                        <Button type="button" variant="outline" onClick={mfa.cancelEnrollment}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                </form>
              )}
              {mfa.error && <p className="text-xs text-red-400 mt-3">{mfa.error}</p>}
            </div>
            <div>
              <div className="text-sm mb-2" style={{ color: 'var(--theme-text-dim)' }}>
                Session Timeout (minutes)
              </div>
              <input
                type="number"
                min={5}
                max={120}
                value={sessionTimeout}
                onChange={(event) => setSessionTimeout(parseInt(event.target.value, 10) || 15)}
                className="input-base w-32"
              />
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
