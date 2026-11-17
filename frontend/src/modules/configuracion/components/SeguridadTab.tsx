import { useState } from 'react'
import { ShieldCheck, ShieldOff, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button, Card, FormField, Input, QRCode } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import {
  useStartTwoFactor,
  useConfirmTwoFactor,
  useDisableTwoFactor,
} from '../hooks/useConfiguracion'

export default function SeguridadTab() {
  const usuario = useAuthStore((estado) => estado.user)
  const startMutation = useStartTwoFactor()
  const confirmMutation = useConfirmTwoFactor()
  const disableMutation = useDisableTwoFactor()

  const [qrData, setQrData] = useState<{ secret: string; otpauthUrl: string } | null>(null)
  const [codigo, setCodigo] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [desactivarAbierto, setDesactivarAbierto] = useState(false)
  const [password, setPassword] = useState('')

  const actualizarEstado2fa = (habilitado: boolean) => {
    const actual = useAuthStore.getState().user
    if (actual)
      useAuthStore.getState().actualizarUsuario({ ...actual, twoFactorEnabled: habilitado })
  }

  const activar = async () => {
    const res = await startMutation.mutateAsync()
    if (res?.data) {
      setQrData(res.data)
      setBackupCodes(null)
      setCodigo('')
    }
  }

  const confirmar = async () => {
    if (codigo.length !== 6) return
    const res = await confirmMutation.mutateAsync(codigo)
    if (res?.data?.backupCodes) {
      setBackupCodes(res.data.backupCodes)
      setQrData(null)
      setCodigo('')
      actualizarEstado2fa(true)
    }
  }

  const desactivar = async () => {
    if (!password) return
    await disableMutation.mutateAsync(password)
    setDesactivarAbierto(false)
    setPassword('')
    actualizarEstado2fa(false)
  }

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                usuario?.twoFactorEnabled
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'bg-surface-muted text-muted'
              }`}
            >
              {usuario?.twoFactorEnabled ? (
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ShieldOff className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Autenticación en dos pasos</h3>
              <p className="mt-1 max-w-xl text-sm text-muted">
                {usuario?.twoFactorEnabled
                  ? 'Tu cuenta está protegida con un código adicional al iniciar sesión.'
                  : 'Añade una capa extra de seguridad: además de tu contraseña, necesitarás un código de tu aplicación autenticadora.'}
              </p>
            </div>
          </div>

          {usuario?.twoFactorEnabled ? (
            <Button
              variant="secondary"
              onClick={() => setDesactivarAbierto(true)}
              disabled={disableMutation.isPending}
            >
              Desactivar
            </Button>
          ) : (
            <Button onClick={activar} loading={startMutation.isPending}>
              Activar 2FA
            </Button>
          )}
        </div>

        {desactivarAbierto && (
          <div className="mt-6 rounded-xl border border-border-subtle bg-surface-muted/60 p-4">
            <FormField label="Confirma tu contraseña para desactivar" required>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña actual"
                className="max-w-sm"
              />
            </FormField>
            <div className="mt-3 flex items-center gap-3">
              <Button variant="danger" onClick={desactivar} loading={disableMutation.isPending}>
                Confirmar desactivación
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setDesactivarAbierto(false)
                  setPassword('')
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Card>

      {qrData && (
        <Card padding="lg">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Escanea el código QR</h3>
              <p className="mt-1 text-sm text-muted">
                Abre tu aplicación autenticadora (Google Authenticator, Authy, Microsoft
                Authenticator) y escanea este código.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <QRCode
              value={qrData.otpauthUrl}
              size={180}
              className="rounded-xl border border-border"
            />
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Clave manual
                </p>
                <p className="mt-1 break-all font-mono text-sm text-foreground">{qrData.secret}</p>
              </div>
              <FormField label="Código de verificación" required>
                <Input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                  className="max-w-[180px]"
                />
              </FormField>
              <Button
                onClick={confirmar}
                loading={confirmMutation.isPending}
                disabled={codigo.length !== 6}
              >
                Verificar y activar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {backupCodes && (
        <Card padding="lg">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">2FA activado</h3>
              <p className="mt-1 text-sm text-muted">
                Guarda estos códigos de respaldo en un lugar seguro. Te permiten acceder si pierdes
                tu aplicación autenticadora.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {backupCodes.map((codigo) => (
              <div
                key={codigo}
                className="rounded-lg border border-border bg-surface-muted/60 px-3 py-2 text-center font-mono text-sm text-foreground"
              >
                {codigo}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="text-xs">
              Estos códigos solo se muestran una vez. No los compartas con nadie.
            </p>
          </div>

          <div className="mt-4">
            <Button onClick={() => setBackupCodes(null)}>Entendido</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
