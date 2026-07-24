import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolverPessoaPorIdentificador, resolverEmpresaId } from '@/lib/identidade'
import { registrarEvento } from '@/lib/eventos'
import { apenasDigitos } from '@/lib/utils'

/** Normaliza para telefone BR com DDI (55). */
function normalizarTelefone(raw: string): string {
  let d = apenasDigitos(raw)
  if (!d) return ''
  if (!d.startsWith('55') && (d.length === 10 || d.length === 11)) d = '55' + d
  return d
}

/** Valida celular BR: 55 + DDD(2) + 9 + 8 dígitos = 13, e não é tudo igual. */
function celularValido(tel13: string): boolean {
  if (!/^55\d{11}$/.test(tel13)) return false
  const ddd = Number(tel13.slice(2, 4))
  if (ddd < 11 || ddd > 99) return false
  if (tel13[4] !== '9') return false // celular começa com 9
  if (/^(\d)\1+$/.test(tel13.slice(2))) return false // 22222222222...
  return true
}

/**
 * Inicia uma conversa (mensagem de saída). Valida o número NO WHATSAPP antes de
 * criar qualquer registro — se o número não existir, nada é criado.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })

  let body: { telefone?: string; nome?: string; conteudo?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }

  const telefone = normalizarTelefone(body.telefone ?? '')
  const conteudo = (body.conteudo ?? '').trim()
  const nome = (body.nome ?? '').trim()

  if (!celularValido(telefone)) {
    return NextResponse.json(
      { erro: 'Telefone inválido. Informe DDD + celular (começando com 9).' },
      { status: 400 }
    )
  }
  if (!conteudo) {
    return NextResponse.json({ erro: 'Escreva a mensagem inicial.' }, { status: 400 })
  }

  const jid = `${telefone}@s.whatsapp.net`

  // 1) VALIDA + ENVIA pelo WhatsApp ANTES de criar qualquer coisa.
  if (!process.env.WHATSAPP_SERVICE_URL) {
    return NextResponse.json({ erro: 'Serviço de WhatsApp não configurado.' }, { status: 503 })
  }
  let externalId: string | null = null
  try {
    const resp = await fetch(`${process.env.WHATSAPP_SERVICE_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-ingest-secret': process.env.INGEST_SECRET ?? '' },
      body: JSON.stringify({ jid, para: telefone, conteudo }),
    })
    if (resp.status === 422) {
      return NextResponse.json(
        { erro: 'Esse número não tem WhatsApp. Confira e tente novamente.' },
        { status: 422 }
      )
    }
    if (resp.status === 503) {
      return NextResponse.json({ erro: 'WhatsApp não está conectado. Suba o whatsapp-service.' }, { status: 503 })
    }
    if (!resp.ok) {
      return NextResponse.json({ erro: 'Falha ao enviar pelo WhatsApp.' }, { status: 502 })
    }
    const j = await resp.json().catch(() => ({}))
    externalId = j?.id ?? null
  } catch {
    return NextResponse.json(
      { erro: 'Não foi possível falar com o WhatsApp. Verifique se o whatsapp-service está rodando.' },
      { status: 503 }
    )
  }

  // 2) Número válido e mensagem enviada → agora persiste tudo.
  const db = createAdminClient()
  const empresaId = await resolverEmpresaId(db)
  if (!empresaId) return NextResponse.json({ erro: 'empresa não configurada' }, { status: 500 })

  const { data: perfil } = await db.from('usuarios').select('id, nome').eq('id', user.id).maybeSingle()
  const nomeColaborador = perfil?.nome ?? user.email ?? 'Atendente'
  const agora = new Date().toISOString()

  const { pessoaId, criada } = await resolverPessoaPorIdentificador(db, {
    empresaId,
    tipo: 'WHATSAPP',
    valor: telefone,
    nomeSugerido: nome || telefone,
    rotulo: 'WhatsApp',
    origem: 'saida',
  })
  await db.from('identificadores').upsert(
    {
      empresa_id: empresaId,
      pessoa_id: pessoaId,
      tipo: 'TELEFONE',
      valor: telefone,
      principal: true,
      origem: 'saida',
      confianca: 100,
    },
    { onConflict: 'empresa_id,tipo,valor', ignoreDuplicates: true }
  )
  if (nome) await db.from('pessoas').update({ nome }).eq('id', pessoaId)

  let conversaId: string
  const { data: aberta } = await db
    .from('conversas')
    .select('id')
    .eq('pessoa_id', pessoaId)
    .neq('status', 'FECHADA')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (aberta) {
    conversaId = aberta.id
    await db.from('conversas').update({ wa_jid: jid }).eq('id', conversaId)
  } else {
    const { data: nova, error } = await db
      .from('conversas')
      .insert({ empresa_id: empresaId, pessoa_id: pessoaId, canal: 'whatsapp', status: 'RESPONDIDA', data_inicio: agora, wa_jid: jid })
      .select('id')
      .single()
    if (error || !nova) {
      return NextResponse.json({ erro: `falha ao criar conversa: ${error?.message}` }, { status: 500 })
    }
    conversaId = nova.id
  }

  const { data: mensagem } = await db
    .from('mensagens')
    .insert({
      empresa_id: empresaId,
      conversa_id: conversaId,
      quem: 'COLABORADOR',
      enviado_por: user.id,
      enviado_por_nome: nomeColaborador,
      conteudo,
      tipo: 'texto',
      external_message_id: externalId,
      external_status: 'sent',
      timestamp_recebido: agora,
    })
    .select('id')
    .single()

  await db
    .from('conversas')
    .update({
      ultima_resposta_quem: 'COLABORADOR',
      ultimo_respondido_por: user.id,
      ultimo_respondido_por_nome: nomeColaborador,
      data_ultima_resposta_colaborador: agora,
      status: 'RESPONDIDA',
      updated_at: agora,
    })
    .eq('id', conversaId)

  if (criada) {
    await registrarEvento(db, {
      empresaId,
      pessoaId,
      tipo: 'contato_criado',
      canal: 'whatsapp',
      titulo: 'Conversa iniciada pela equipe',
      atorTipo: 'COLABORADOR',
      atorId: user.id,
      atorNome: nomeColaborador,
      ocorridoEm: agora,
    })
  }
  await registrarEvento(db, {
    empresaId,
    pessoaId,
    tipo: 'mensagem_enviada',
    canal: 'whatsapp',
    conteudo,
    atorTipo: 'COLABORADOR',
    atorId: user.id,
    atorNome: nomeColaborador,
    conversaId,
    mensagemId: mensagem?.id ?? null,
    ocorridoEm: agora,
  })

  return NextResponse.json({ ok: true, conversa_id: conversaId })
}
