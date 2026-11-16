import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Check } from 'lucide-react'
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
      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <div className="cartao" style={{ marginTop: 8 }}><div className="vazio"><p className="vazio-texto">Você não tem acesso a esta tela.</p></div></div>
      </main>
    )
  }
  const ehAdministrador = papel.role === 'ADMIN'
  const atual = Object.fromEntries(TELAS.map((t) => [t.chave, [...(mapa[t.chave] ?? [])]]))
  const colunas = todosPapeis.filter((p) => p.codigo !== 'ADMIN').map((p) => ({ codigo: p.codigo, nome: p.nome }))

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 900 }}>
      <Link href="/dashboard/configuracoes" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Configurações</Link>
      <h1 className="titulo" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 6px' }}>
        <ShieldCheck className="icone icone-g" style={{ color: 'var(--acao)' }} aria-hidden="true" focusable="false" /> Permissões — quem vê cada tela
      </h1>
      <p className="subtitulo" style={{ marginBottom: 16 }}>
        {ehAdministrador ? 'Marque quais papéis podem ver cada tela. Ao salvar, o menu de todos passa a respeitar isso na hora.' : 'Quais papéis veem cada tela. Só o Administrador pode alterar.'}
        {' '}Para criar papéis ou mudar o que cada um <b>pode fazer</b>, use <Link href="/dashboard/configuracoes/papeis">Papéis</Link>.
      </p>

      {ehAdministrador ? (
        <EditorPermissoes atual={atual} papeis={colunas} />
      ) : (
        <section className="cartao">
          <div className="tabela-caixa" style={{ overflowX: 'auto' }}>
            <table className="tabela" style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th>Tela</th>
                  {colunas.map((p) => (<th key={p.codigo} style={{ textAlign: 'center' }}>{p.nome}</th>))}
                </tr>
              </thead>
              <tbody>
                {TELAS.map((t) => (
                  <tr key={t.chave}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--tinta)' }}>{t.label}</div>
                      <div className="texto-apoio" style={{ fontSize: 'var(--t-pequeno)' }}>{t.descricao}</div>
                    </td>
                    {colunas.map((p) => {
                      const tem = (atual[t.chave] ?? []).includes(p.codigo)
                      return (
                        <td key={p.codigo} style={{ textAlign: 'center' }}>
                          {tem ? <Check className="icone icone-p" style={{ color: 'var(--sucesso)', display: 'inline-block', verticalAlign: 'middle' }} aria-label="pode ver" /> : <span style={{ color: 'var(--tinta-3)' }} aria-label="não vê">—</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  )
}
