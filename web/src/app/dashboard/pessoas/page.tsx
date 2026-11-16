import Link from 'next/link'
import { getPessoas } from '@/lib/dados'
import BannerConfig from '@/components/BannerConfig'
import { formatarCpf, formatarTelefone, formatarDataHora, rotuloEstagio, coresEstagio, rotuloWhatsapp, formatarNome } from '@/lib/utils'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PessoasPage() {
  const pessoas = await getPessoas()
  const configurado = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 1100 }}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Users className="icone icone-g" style={{ color: 'var(--acao)' }} aria-hidden="true" focusable="false" /> Pessoas</h1>
          <p className="subtitulo">Identidade única de cada pessoa. Um mesmo cadastro reúne todos os WhatsApps, CPF e demais identificadores — e evolui de Pretenso Cliente a Cliente sem duplicar.</p>
        </div>
      </div>

      {!configurado && <BannerConfig />}

      <section className="cartao" style={{ overflow: 'hidden' }}>
        {pessoas.length === 0 ? (
          <div className="vazio" style={{ alignItems: 'center', textAlign: 'center' }}>
            <Users className="icone" style={{ width: 32, height: 32, color: 'var(--tinta-3)' }} aria-hidden="true" focusable="false" />
            <p className="vazio-texto" style={{ maxWidth: 'none' }}>Nenhuma pessoa cadastrada ainda.</p>
          </div>
        ) : (
          <div className="tabela-caixa" style={{ overflowX: 'auto' }}>
            <table className="tabela" style={{ minWidth: 640 }}>
              <thead>
                <tr><th>Nome</th><th>Estágio</th><th>WhatsApp</th><th>CPF</th><th>Responsável</th><th>Última msg</th></tr>
              </thead>
              <tbody>
                {pessoas.map((p) => {
                  const est = coresEstagio(p.estagio)
                  return (
                    <tr key={p.id}>
                      <td className="nome">
                        <Link href={`/dashboard/pessoas/${p.id}`} style={{ color: 'var(--tinta)', textDecoration: 'none' }}>{formatarNome(p.nome)}</Link>
                        {p.provisorio && <span className="texto-apoio" style={{ marginLeft: 6 }}>(provisório)</span>}
                      </td>
                      <td><span className="selo" style={{ background: est.bg, color: est.fg }}>{rotuloEstagio(p.estagio)}</span></td>
                      <td style={{ color: 'var(--tinta-2)' }}>{p.telefone ? formatarTelefone(p.telefone) : rotuloWhatsapp(p.whatsapp_principal)}</td>
                      <td style={{ color: 'var(--tinta-2)' }}>{formatarCpf(p.cpf)}</td>
                      <td style={{ color: 'var(--tinta-2)' }}>{p.responsavel_nome ? formatarNome(p.responsavel_nome) : '—'}</td>
                      <td style={{ color: 'var(--tinta-3)' }}>{formatarDataHora(p.data_ultima_msg)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
