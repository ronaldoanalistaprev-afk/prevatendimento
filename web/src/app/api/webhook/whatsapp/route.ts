import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apenasDigitos } from '@/lib/utils'
import { resolverEmpresaId } from '@/lib/identidade'

/**
 * Ingestão de mensagens recebidas (ADAPTADOR DE CANAL).
 *
 * Hoje: o whatsapp-service (Baileys) faz POST aqui a cada mensagem recebida.
 * Amanhã: a WhatsApp Cloud API (Meta) pode fazer POST no MESMO formato.
 *
 * Toda a lógica (resolver Pessoa + conversa + mensagem + eventos) roda numa
 * ÚNICA função no banco (`ingerir_mensagem_whatsapp`), de forma ATÔMICA e à
 * prova de corrida — evita cadastros/conversas duplicados quando várias
 * mensagens chegam simultaneamente (ex.: no momento em que o WhatsApp conecta).
 *
 * Protegido por header `x-ingest-secret` (env INGEST_SECRET).
 */
export async function POST(req: Request) {
  const segredo = req.headers.get('x-ingest-secret')
  if (!process.env.INGEST_SECRET || segredo !== process.env.INGEST_SECRET) {
    return NextResponse.json({ erro: 'não autorizado' }, { status: 401 })
  }

  let body: {
    instancia?: string
    de?: string
    jid?: string
    telefone?: string
    nome_perfil?: string
    conteudo?: string
    tipo?: string
    external_message_id?: string
    timestamp?: number
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }

  const de = apenasDigitos(body.de)
  const conteudo = (body.conteudo ?? '').trim()
  if (!de || !conteudo) {
    return NextResponse.json({ erro: 'campos "de" e "conteudo" são obrigatórios' }, { status: 400 })
  }

  const instancia = apenasDigitos(body.instancia) || null
  const tipo = ['texto', 'imagem', 'arquivo', 'video', 'audio'].includes(body.tipo ?? '')
    ? body.tipo!
    : 'texto'
  const ocorrido = new Date().toISOString()

  const db = createAdminClient()

  const empresaId = await resolverEmpresaId(db)
  if (!empresaId) {
    return NextResponse.json({ erro: 'nenhuma empresa (tenant) configurada' }, { status: 500 })
  }

  const { data, error } = await db.rpc('ingerir_mensagem_whatsapp', {
    p_empresa: empresaId,
    p_valor: de,
    p_nome: body.nome_perfil ?? '',
    p_instancia: instancia,
    p_conteudo: conteudo,
    p_tipo: tipo,
    p_external_id: body.external_message_id ?? null,
    p_ocorrido: ocorrido,
    p_jid: body.jid ?? null,
    p_telefone: body.telefone ?? null,
  })

  if (error) {
    return NextResponse.json({ erro: `falha na ingestão: ${error.message}` }, { status: 500 })
  }

  const linha = Array.isArray(data) ? data[0] : data
  return NextResponse.json({
    ok: true,
    pessoa_id: linha?.pessoa_id ?? null,
    conversa_id: linha?.conversa_id ?? null,
    mensagem_id: linha?.mensagem_id ?? null,
    pessoa_criada: linha?.pessoa_criada ?? false,
  })
}
