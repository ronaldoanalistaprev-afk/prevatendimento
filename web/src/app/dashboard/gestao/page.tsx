import Link from 'next/link'
import { getPapelAtual } from '@/lib/papel'
import SemPermissao from '@/components/SemPermissao'
import { createClient } from '@/lib/supabase/server'
import BannerConfig from '@/components/BannerConfig'
import { formatarNome } from '@/lib/utils'
import { Users, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface StatColaborador {
  id: string
  nome: string
  email: string
  total_conversas: number
  conversas_abertas: number
  conversas_pendentes: number
  tempo_medio_resposta: number | null
}

async function getStats(): Promise<{ itens: StatColaborador[]; configurado: boolean; erro: string | null }> {
  const configurado = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  if (!configurado) return { itens: [], configurado: false, erro: null }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('v_stats_colaboradores').select('*')
    if (error) return { itens: [], configurado: true, erro: error.message }
    return { itens: (data ?? []) as StatColaborador[], configurado: true, erro: null }
  } catch (e) {
    return { itens: [], configurado: true, erro: (e as Error).message }
  }
}

const numero = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('pt-BR'))

/**
 * Gestão de Pendências — rota antiga, fora do menu (os mesmos números estão em Desempenho).
 * Convertida para a Apple Design em 18/11/2026 (auditoria X1): tabela que vira cartão no celular,
 * selos com texto, nomes pela Regra 24, erro em linguagem simples.
 */
export default async function GestaoPage() {
  // Telas fora do menu, só para quem vê tudo (auditoria P2/X1). O banco já bloqueia os dados para os demais.
  if (!(await getPapelAtual()).verTudo) return <main id="conteudo" className="conteudo" tabIndex={-1}><SemPermissao tela="a Gestão de Pendências" /></main>

  const { itens, configurado, erro } = await getStats()

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 1100 }}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo">Gestão de Pendências</h1>
          <p className="subtitulo">Carga e tempo de resposta por colaborador: quem tem mais conversas paradas. Os mesmos números, mais completos, estão em <Link href="/dashboard/desempenho">Desempenho</Link>.</p>
        </div>
      </div>

      {!configurado && <BannerConfig />}
      {configurado && erro && (
        <div className="aviso aviso-perigo" role="alert" style={{ marginBottom: 16 }}>
          <AlertCircle className="icone" aria-hidden="true" focusable="false" />
          <div>Não foi possível carregar os números agora. Recarregue a página; se continuar, avise o responsável técnico.</div>
        </div>
      )}

      <section className={`cartao${itens.length ? ' lista-cartao' : ''}`}>
        {itens.length === 0 ? (
          <div className="vazio">
            <div className="vazio-icone"><Users className="icone" aria-hidden="true" focusable="false" /></div>
            <div className="vazio-titulo">Sem dados de colaboradores ainda</div>
            <p className="vazio-texto">Os números aparecem aqui quando houver conversas atribuídas a alguém da equipe.</p>
          </div>
        ) : (
          <div className="tabela-caixa">
            <table className="tabela tabela-cartoes">
              <caption className="so-leitor">Carga por colaborador</caption>
              <thead>
                <tr>
                  <th scope="col">Atendente</th>
                  <th scope="col">Pendentes</th>
                  <th scope="col">Conversas</th>
                  <th scope="col">Abertas</th>
                  <th scope="col">Tempo médio de resposta</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((s) => (
                  <tr key={s.id}>
                    <td className="nome" data-rotulo="Atendente" style={{ overflowWrap: 'anywhere' }}>{formatarNome(s.nome)}</td>
                    <td className="situacao" data-rotulo="Pendentes">
                      <span className={`selo ${s.conversas_pendentes > 0 ? 'selo-atencao' : 'selo-sucesso'}`}>
                        {s.conversas_pendentes > 0 ? `${numero(s.conversas_pendentes)} ${s.conversas_pendentes === 1 ? 'pendente' : 'pendentes'}` : 'Em Dia'}
                      </span>
                    </td>
                    <td className="num" data-rotulo="Conversas">{numero(s.total_conversas)}</td>
                    <td className="num" data-rotulo="Abertas">{numero(s.conversas_abertas)}</td>
                    <td className="num" data-rotulo="Tempo médio de resposta">{s.tempo_medio_resposta == null ? '—' : `${s.tempo_medio_resposta.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
