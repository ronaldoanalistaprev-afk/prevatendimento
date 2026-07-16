import { AlertTriangle } from 'lucide-react'

/** Exibido quando o Supabase ainda não foi configurado (.env.local ausente). */
export default function BannerConfig({ erro }: { erro?: string | null }) {
  return (
    <div
      style={{
        background: '#FEF9C3',
        border: '1px solid #FDE68A',
        color: '#A16207',
        borderRadius: 14,
        padding: '14px 18px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        marginBottom: 20,
      }}
    >
      <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
        <strong>Banco de dados ainda não conectado.</strong>{' '}
        {erro ? (
          <>Erro: <code>{erro}</code>. </>
        ) : (
          <>
            Preencha <code>web/.env.local</code> com as chaves do Supabase e rode{' '}
            <code>sql/schema.sql</code> no SQL Editor.{' '}
          </>
        )}
        Enquanto isso, a interface aparece com dados zerados.
      </div>
    </div>
  )
}
