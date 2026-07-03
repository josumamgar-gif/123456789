import { APP_VERSION } from '../version'

export default function AppVersion() {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0 4px', color: 'var(--text3)', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>
      Patrimonio v{APP_VERSION}
    </div>
  )
}
