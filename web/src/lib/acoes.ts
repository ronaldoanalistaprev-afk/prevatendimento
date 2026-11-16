import { createClient } from '@/lib/supabase/server'
import { bancoConfigurado, STATUS_ABERTAS } from '@/lib/dados'
import { formatarNome, formatarTelefone } from '@/lib/utils'

/**
 * "Ações necessárias" — situações que o sistema detecta sozinho para a equipe corrigir.
 * É um PAINEL DE CARDS: cada card é um TIPO de ação (com sua contagem); ao abrir,
 * mostra a lista. Modular: para somar uma ação nova, crie um detector e adicione
 * uma seção no fim de getAcoes(). Respeita o papel (RLS): colaborador vê só as suas.
 */

export interface ItemAcao {
  id: string
  /** Linha principal (ex.: o nome, ou "(sem nome)"). */
  titulo: string
  /** Linha secundária (ex.: telefone · responsável). */
  subtitulo: string
  /** Protocolo para abrir a conversa (link). */
  protocolo_id: string | null
  /** Destaca em vermelho (ex.: cadastro totalmente vazio). */
  alerta?: boolean
}

export interface SecaoAcao {
  chave: string
  titulo: string
  descricao: string
  /** Chave do ícone (resolvida na página). */
  icone: string
  itens: ItemAcao[]
}

/** Nome ausente, ou só um nome (sem sobrenome), ou que na verdade é um número. */
export function nomeIncompleto(nome: string | null | undefined, telefone?: string | null): boolean {
  const n = (nome ?? '').trim()
  if (!n) return true
  const soDig = n.replace(/\D/g, '')
  if (soDig.length >= 8 && n.replace(/[\s()+\-.]/g, '').length === soDig.length) return true
  if (telefone && soDig && soDig === (telefone ?? '').replace(/\D/g, '')) return true
  const palavras = n.split(/\s+/).filter((w) => w.length > 0)
  return palavras.length < 2
}

type ProtoRow = {
  id: string
  cliente_id: string | null
  atendente_nome: string | null
  at_clientes: { nome: string | null; telefone: string | null } | { nome: string | null; telefone: string | null }[] | null
}

function subtitulo(telefone: string | null, atendente: string | null): string {
  const resp = atendente ? formatarNome(atendente) : 'sem atendente'
  return `${formatarTelefone(telefone)} · Responsável: ${resp}`
}

/** Todas as ações necessárias (cada uma vira um card). */
export async function getAcoes(): Promise<SecaoAcao[]> {
  const semNome: ItemAcao[] = []

  if (bancoConfigurado()) {
    try {
      const supabase = await createClient()
      // Base: conversas abertas + cliente aninhado (RLS escopa por papel). Uma consulta
      // serve a todos os detectores baseados em conversa aberta.
      const { data } = await supabase
        .from('at_protocolos')
        .select('id, cliente_id, atendente_nome, ultima_mensagem_em, status_multi360, at_clientes(nome, telefone)')
        .in('status_multi360', STATUS_ABERTAS)
        .order('ultima_mensagem_em', { ascending: false, nullsFirst: false })
        .limit(4000)
      const rows = (data ?? []) as ProtoRow[]

      // Detector 1: contatos sem nome e sobrenome (1 por cliente, o mais recente).
      const vistos = new Set<string>()
      for (const r of rows) {
        if (!r.cliente_id || vistos.has(r.cliente_id)) continue
        const cli = Array.isArray(r.at_clientes) ? r.at_clientes[0] : r.at_clientes
        const nome = cli?.nome ?? null
        const telefone = cli?.telefone ?? null
        if (nomeIncompleto(nome, telefone)) {
          vistos.add(r.cliente_id)
          semNome.push({
            id: r.cliente_id,
            titulo: nome ? formatarNome(nome) : '(sem nome)',
            subtitulo: subtitulo(telefone, r.atendente_nome),
            protocolo_id: r.id,
            alerta: !nome,
          })
        }
      }
    } catch {
      /* segue com listas vazias */
    }
  }

  return [
    {
      chave: 'sem-nome',
      titulo: 'Contatos sem nome e sobrenome',
      descricao: 'O cadastro está sem nome completo. Corrija o nome do contato no Multi360 para o atendimento ficar identificado.',
      icone: 'user-x',
      itens: semNome,
    },
    // 👉 Próximas ações entram aqui: crie o detector acima e adicione outra seção.
  ]
}

/** Total de itens em todas as ações (para o badge do menu). Respeita o papel (RLS). */
export async function contarAcoes(): Promise<number> {
  const secoes = await getAcoes()
  return secoes.reduce((n, s) => n + s.itens.length, 0)
}
