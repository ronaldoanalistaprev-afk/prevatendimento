import Link from 'next/link'
import { getPapelAtual } from '@/lib/papel'
import SemPermissao from '@/components/SemPermissao'
import { getPessoas } from '@/lib/dados'
import BannerConfig from '@/components/BannerConfig'
import { formatarCpf, formatarTelefone, formatarDataHora, rotuloEstagio, coresEstagio, rotuloWhatsapp, formatarNome } from '@/lib/utils'
import { Users, Eye } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PessoasPage() {
  // Telas fora do menu, só para quem vê tudo (auditoria P2/X1). O banco já bloqueia os dados para os demais.
  if (!(await getPapelAtual()).verTudo) return <main id="conteudo" className="conteudo" tabIndex={-1}><SemPermissao tela="Pessoas" /></main>

  const pessoas = await getPessoas()
  const configurado = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 1100 }}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo">Pessoas</h1>
          <p className="subtitulo">Identidade única de cada pessoa. Um mesmo cadastro reúne todos os WhatsApps, CPF e demais identificadores, e evolui de Pretenso Cliente a Cliente sem duplicar.</p>
        </div>
      </div>

      {!configurado && <BannerConfig />}

      <section className={`cartao${pessoas.length ? ' lista-cartao' : ''}`}>
        {pessoas.length === 0 ? (
          <div className="vazio">
            <div className="vazio-icone"><Users className="icone" aria-hidden="true" focusable="false" /></div>
            <div className="vazio-titulo">Nenhuma pessoa cadastrada ainda</div>
            <p className="vazio-texto">As pessoas aparecem aqui quando entram em contato pelo WhatsApp próprio do escritório.</p>
          </div>
        ) : (
          <>
            <div className="tabela-caixa">
              <table className="tabela tabela-cartoes">
                <caption className="so-leitor">Pessoas</caption>
                <thead>
                  <tr>
                    <th scope="col">Nome</th>
                    <th scope="col">Estágio</th>
                    <th scope="col">WhatsApp</th>
                    <th scope="col">CPF</th>
                    <th scope="col">Responsável</th>
                    <th scope="col">Última mensagem</th>
                    <th scope="col" className="acoes">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pessoas.map((p) => {
                    const est = coresEstagio(p.estagio)
                    const nome = formatarNome(p.nome)
                    return (
                      <tr key={p.id}>
                        <td className="nome" data-rotulo="Nome" style={{ overflowWrap: 'anywhere' }}>
                          <Link href={`/dashboard/pessoas/${p.id}`} style={{ color: 'var(--tinta)', textDecoration: 'none' }}>{nome}</Link>
                          {p.provisorio && <span className="texto-apoio" style={{ marginLeft: 6, fontWeight: 400 }}>(provisório)</span>}
                        </td>
                        <td className="situacao" data-rotulo="Estágio"><span className={`selo ${est.classe}`}>{rotuloEstagio(p.estagio)}</span></td>
                        <td className="num" data-rotulo="WhatsApp" style={{ color: 'var(--tinta-2)' }}>{p.telefone ? formatarTelefone(p.telefone) : rotuloWhatsapp(p.whatsapp_principal)}</td>
                        <td className="num" data-rotulo="CPF" style={{ color: 'var(--tinta-2)' }}>{p.cpf ? formatarCpf(p.cpf) : '—'}</td>
                        <td data-rotulo="Responsável" style={{ color: 'var(--tinta-2)' }}>{p.responsavel_nome ? formatarNome(p.responsavel_nome) : '—'}</td>
                        <td data-rotulo="Última mensagem" style={{ color: 'var(--tinta-2)' }}>{formatarDataHora(p.data_ultima_msg)}</td>
                        <td className="acoes" data-rotulo="Ações">
                          <Link href={`/dashboard/pessoas/${p.id}`} className="botao-icone" aria-label={`Detalhar ${nome}`} data-dica="Detalhar">
                            <Eye className="icone" aria-hidden="true" focusable="false" /><span className="rotulo-celular">Detalhar</span>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="tabela-pe"><span>{pessoas.length} {pessoas.length === 1 ? 'pessoa' : 'pessoas'}</span></div>
          </>
        )}
      </section>
    </main>
  )
}
