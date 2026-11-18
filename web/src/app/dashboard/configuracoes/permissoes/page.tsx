import Link from 'next/link'
import { ArrowLeft, Check, Minus } from 'lucide-react'
import SemPermissao from '@/components/SemPermissao'
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
        <div className="cabeca"><div className="cabeca-texto"><h1 className="titulo">Permissões</h1></div></div>
        <SemPermissao tela="Permissões" />
      </main>
    )
  }
  const ehAdministrador = papel.role === 'ADMIN'
  const atual = Object.fromEntries(TELAS.map((t) => [t.chave, [...(mapa[t.chave] ?? [])]]))
  const colunas = todosPapeis.filter((p) => p.codigo !== 'ADMIN').map((p) => ({ codigo: p.codigo, nome: p.nome }))

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 900 }}>
      <Link href="/dashboard/configuracoes" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Configurações</Link>
      <h1 className="titulo" style={{ margin: '12px 0 6px' }}>Permissões — quem vê cada tela</h1>
      <p className="subtitulo" style={{ marginBottom: 16 }}>
        {ehAdministrador ? 'Marque quais papéis podem ver cada tela. Ao salvar, o menu de todos passa a respeitar isso na hora.' : 'Quais papéis veem cada tela. Só o Administrador pode alterar.'}
        {' '}Para criar papéis ou mudar o que cada um <b>pode fazer</b>, use <Link href="/dashboard/configuracoes/papeis">Papéis</Link>.
      </p>

      {ehAdministrador ? (
        <EditorPermissoes atual={atual} papeis={colunas} />
      ) : (
        <section className="cartao">
          <div className="tabela-caixa">
            <table className="tabela tabela-cartoes">
              <caption className="so-leitor">Quais papéis veem cada tela</caption>
              <thead>
                <tr>
                  <th scope="col">Tela</th>
                  {colunas.map((p) => (<th key={p.codigo} scope="col" style={{ textAlign: 'center' }}>{p.nome}</th>))}
                </tr>
              </thead>
              <tbody>
                {TELAS.map((t) => (
                  <tr key={t.chave}>
                    <td className="nome" data-rotulo="Tela">
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--tinta)' }}>{t.label}</div>
                        <div className="texto-apoio" style={{ fontWeight: 400 }}>{t.descricao}</div>
                      </div>
                    </td>
                    {colunas.map((p) => {
                      const tem = (atual[t.chave] ?? []).includes(p.codigo)
                      return (
                        <td key={p.codigo} data-rotulo={p.nome} style={{ textAlign: 'center' }}>
                          {tem
                            ? <span className="selo selo-sucesso"><Check className="icone" aria-hidden="true" focusable="false" />Vê</span>
                            : <span className="selo selo-neutro"><Minus className="icone" aria-hidden="true" focusable="false" />Não vê</span>}
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
