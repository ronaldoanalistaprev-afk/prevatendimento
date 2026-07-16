import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { getPapelAtual } from '@/lib/papel'
import { getPapeis } from '@/lib/poderes'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import { TELAS } from '@/lib/telas'
import EditorPermissoes from '@/components/EditorPermissoes'

export const dynamic = 'force-dynamic'

export default async function PermissoesPage() {
  const [papel, mapa, todosPapeis] = await Promise.all([getPapelAtual(), getPermissoesMapa(), getPapeis(true)])
  if (!podeAcessar(mapa, 'configuracoes', papel.role)) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Você não tem acesso a esta tela.</div>
      </div>
    )
  }
  const ehAdministrador = papel.role === 'ADMIN'
  const atual = Object.fromEntries(TELAS.map((t) => [t.chave, [...(mapa[t.chave] ?? [])]]))
  // O ADMIN não entra na matriz (vê tudo sempre).
  const colunas = todosPapeis.filter((p) => p.codigo !== 'ADMIN').map((p) => ({ codigo: p.codigo, nome: p.nome }))

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
      <Link href="/dashboard/configuracoes" style={{ color: '#4B7BA6', fontSize: 14, textDecoration: 'none' }}>
        <ArrowLeft size={14} style={{ display: 'inline', marginRight: 6 }} /> Configurações
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A', display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 6px' }}>
        <ShieldCheck size={22} style={{ color: '#4B7BA6' }} /> Permissões — quem vê cada tela
      </h1>
      <p style={{ fontSize: 13.5, color: '#6B7280', margin: '0 0 16px' }}>
        {ehAdministrador
          ? 'Marque quais papéis podem ver cada tela. Ao salvar, o menu de todos passa a respeitar isso na hora.'
          : 'Quais papéis veem cada tela. Só o Administrador pode alterar.'}
        {' '}Para criar papéis ou mudar o que cada um <b>pode fazer</b>, use <Link href="/dashboard/configuracoes/papeis" style={{ color: '#4B7BA6' }}>Papéis</Link>.
      </p>

      {ehAdministrador ? (
        <EditorPermissoes atual={atual} papeis={colunas} />
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 560 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', color: '#6B7280', textAlign: 'left' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Tela</th>
                  {colunas.map((p) => (
                    <th key={p.codigo} style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>{p.nome}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TELAS.map((t) => (
                  <tr key={t.chave} style={{ borderTop: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#1A3C5A' }}>{t.label}</div>
                      <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>{t.descricao}</div>
                    </td>
                    {colunas.map((p) => (
                      <td key={p.codigo} style={{ padding: '12px 14px', textAlign: 'center', color: (atual[t.chave] ?? []).includes(p.codigo) ? '#16A34A' : '#CBD5E1', fontWeight: 700 }}>
                        {(atual[t.chave] ?? []).includes(p.codigo) ? '✓' : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
