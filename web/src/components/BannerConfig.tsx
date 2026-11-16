import { AlertTriangle } from 'lucide-react'

/** Exibido quando o Supabase ainda não foi configurado (.env.local ausente). */
export default function BannerConfig({ erro }: { erro?: string | null }) {
  return (
    <div className="aviso aviso-atencao" style={{ marginBottom: 16 }}>
      <AlertTriangle className="icone" aria-hidden="true" focusable="false" />
      <div>
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
