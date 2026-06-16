import { Award, ExternalLink, Unlink, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { cn } from '@shared/lib/utils'
import type { LinkedCertification } from '@shared/types/ipc.types'
import { useSkillHubStore } from '../../store/skill-hub.store'

interface Props {
  skillId: string
  certifications: LinkedCertification[]
  isLoading: boolean
}

const STATUS_STYLES: Record<string, { cls: string; label: string }> = {
  earned:      { cls: 'bg-green-500/10 text-green-400',  label: 'Earned' },
  'in-progress': { cls: 'bg-blue-500/10 text-blue-400',  label: 'In Progress' },
  planned:     { cls: 'bg-zinc-500/10 text-zinc-400',    label: 'Planned' },
  expired:     { cls: 'bg-amber-500/10 text-amber-400',  label: 'Expired' },
  revoked:     { cls: 'bg-red-500/10 text-red-400',      label: 'Revoked' },
}

function CertCard({ cert, skillId }: { cert: LinkedCertification; skillId: string }) {
  const { unlinkCertification } = useSkillHubStore()
  const statusInfo = STATUS_STYLES[cert.status] ?? { cls: 'bg-zinc-500/10 text-zinc-400', label: cert.status }

  const now = new Date()
  const expiry = cert.expiry_date ? new Date(cert.expiry_date) : null
  const daysUntilExpiry = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

  return (
    <div className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:border-zinc-600 transition-colors">
      <div className="rounded-md p-2 bg-amber-500/10 shrink-0">
        <Award className="h-4 w-4 text-amber-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{cert.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{cert.issuer}</p>
          </div>
          <Button
            variant="ghost" size="icon-sm"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => void unlinkCertification(skillId, cert.id)}
          >
            <Unlink className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={cn('text-xs px-1.5 py-0.5 rounded-sm font-medium', statusInfo.cls)}>
            {statusInfo.label}
          </span>
          {cert.issue_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              {new Date(cert.issue_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {expiry && (
            <span className={cn('text-xs flex items-center gap-1', daysUntilExpiry !== null && daysUntilExpiry < 90 ? 'text-amber-400' : 'text-muted-foreground')}>
              <Clock className="h-3 w-3" />
              {daysUntilExpiry !== null && daysUntilExpiry > 0
                ? `Expires in ${daysUntilExpiry}d`
                : 'Expired'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function CertificationsTab({ skillId, certifications, isLoading }: Props) {
  if (isLoading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading certifications…</div>

  const earned = certifications.filter(c => c.status === 'earned').length

  return (
    <div className="space-y-4">
      {certifications.length > 0 && (
        <p className="text-xs text-muted-foreground">{earned}/{certifications.length} earned</p>
      )}

      {certifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-border p-4 mb-4">
            <Award className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">No certifications linked</p>
          <p className="text-xs text-muted-foreground mb-4">
            Link relevant certifications to track your credential progress for this skill.
          </p>
          <Button variant="outline" size="sm" onClick={() => { window.location.hash = '#/certifications' }}>
            <ExternalLink className="h-3.5 w-3.5 mr-2" /> Go to Certifications
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {certifications.map(c => <CertCard key={c.id} cert={c} skillId={skillId} />)}
        </div>
      )}
    </div>
  )
}
