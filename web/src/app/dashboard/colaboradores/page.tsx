import { createClient } from '@/lib/supabase/server'
import BannerConfig from '@/components/BannerConfig'
import NovoColaborador from '@/components/NovoColaborador'
import GerenciarAcessos from '@/components/GerenciarAcessos'
import { getPainelGestor } from '@/lib/gestao'
import { getPapelAtual } from '@/lib/papel'
import { getPapeis } from '@/lib/poderes'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import AtendentesSemConversaAberta from '@/components/AtendentesSemConversaAberta'
import { formatarNome } from '@/lib/utils'
import type { Usuario } from '@/lib/tipos'
import { UserCog, MessageSquare, AlarmClock, CheckCircle2, UserX } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface UsuarioComVinculo extends Usuario {
  at_colaboradores?: { nome?: string } | { nome?: string }[] | null
}

async function carregar(): Promise<{
  usuarios: UsuarioComVinculo[]
  atendentes: { id: string; nome: string }[]
  ehAdmin: boolean
  meuId: string
  configurado: boolean
  temServiceRole: boolean
}> {
  const configurado = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const temServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!configurado) return { usuarios: [], atendentes: [], ehAdmin: false, meuId: '', configurado: false, temServiceRole }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: lista }, { data: meu }, { data: ats }] = await Promise.all([
      supabase.from('usuarios').select('*, at_colaboradores(nome)').order('created_at', { ascending: true }),
      user ? supabase.from('usuarios').select('role').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from('at_colaboradores').select('id, nome').order('nome'),
    ])
    return {
      usuarios: (lista ?? []) as UsuarioComVinculo[],
      atendentes: (ats ?? []) as { id: string; nome: string }[],
      ehAdmin: (meu as { role?: string } | null)?.role === 'ADMIN',
      meuId: user?.id ?? '',
      configurado: true,
      temServiceRole,
    }
  } catch {
    return { usuarios: [], atendentes: [], ehAdmin: false, meuId: '', configurado: true, temServiceRole }
  }
}

function nomeVinculo(u: UsuarioComVinculo): string | null {
  const rel = u.at_colaboradores
  if (!rel) return null
  return Array.isArray(rel) ? rel[0]?.nome ?? null : rel.nome ?? null
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  const a = partes[0]?.[0] ?? ''
  const b = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (a + b).toUpperCase()
}

export default async function ColaboradoresPage() {
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'colaboradores', papel.role)) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <div className="cartao" style={{ marginTop: 8 }}><div className="vazio"><p className="vazio-texto">Você não tem acesso a esta tela.</p></div></div>
      </main>
    )
  }
  const [{ usuarios, atendentes, ehAdmin, meuId, configurado, temServiceRole }, painel, papeis] = await Promise.all([
    carregar(),
    getPainelGestor(),
    getPapeis(),
  ])
  const opcoesPapel = papeis.map((p) => ({ codigo: p.codigo, nome: p.nome, soAsSuas: !p.pode_ver_tudo }))

  const equipe = painel.ranking
  const ehSemAtendente = (nome: string) => nome.trim().toLowerCase() === 'sem atendente'
  const semDono = equipe.find((c) => ehSemAtendente(c.atendente)) ?? null
  const pessoas = equipe.filter((c) => !ehSemAtendente(c.atendente))
  const ativos = pessoas.filter((c) => c.abertas > 0)
  const semConversaAberta = pessoas.filter((c) => c.abertas === 0)
  const totalAbertas = equipe.reduce((s, c) => s + c.abertas, 0)
  const totalEsperando24 = equipe.reduce((s, c) => s + c.esperando24, 0)

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserCog className="icone icone-g" style={{ color: 'var(--acao)' }} aria-hidden="true" focusable="false" /> Colaboradores
          </h1>
          <p className="subtitulo">A equipe que atende no WhatsApp (Multi360) e quem tem acesso ao sistema.</p>
        </div>
      </div>

      {!configurado && <BannerConfig />}

      {ehAdmin && !temServiceRole && (
        <div className="aviso aviso-atencao" style={{ marginBottom: 16 }}>
          <div><b>O sistema ainda não está liberado para criar logins.</b> Avise o responsável técnico para habilitar o cadastro de acessos.</div>
        </div>
      )}

      {ehAdmin && (
        <div style={{ marginBottom: 22 }}>
          <NovoColaborador desabilitado={!temServiceRole} atendentes={atendentes} papeis={opcoesPapel} />
        </div>
      )}

      {/* Equipe do WhatsApp */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h2 className="ini-secao-titulo">Equipe ativa no WhatsApp</h2>
        <span className="texto-apoio">
          {ativos.length} atendentes com conversa aberta · {totalAbertas} abertas · {totalEsperando24} sem resposta há +24h
          <span style={{ color: 'var(--tinta-3)' }}> — quem tem mais gente esperando aparece primeiro</span>
        </span>
      </div>

      {ativos.length === 0 ? (
        <div className="cartao"><div className="vazio"><p className="vazio-texto">
          {equipe.length === 0 ? 'Ainda não há atendentes lidos do Multi360. Rode o leitor com o token configurado e a equipe aparece aqui.' : 'Nenhum atendente tem conversa em aberto agora.'}
        </p></div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {ativos.map((c) => {
            const alerta = c.esperando24 > 0
            return (
              <section key={c.atendente} className="cartao" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: alerta ? 'var(--atencao-suave)' : 'var(--acao-suave)', color: alerta ? 'var(--atencao)' : 'var(--acao)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{iniciais(c.atendente)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 650, color: 'var(--tinta)', fontSize: 15, overflowWrap: 'anywhere' }}>{formatarNome(c.atendente)}</div>
                    <div className="texto-apoio">Atendente WhatsApp</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                  <Metrica icone={MessageSquare} valor={c.abertas} label="abertas" cor="var(--tinta)" />
                  <Metrica icone={AlarmClock} valor={c.esperando24} label="sem resposta +24h" cor={alerta ? 'var(--perigo)' : 'var(--sucesso)'} />
                  <Metrica icone={CheckCircle2} valor={c.finalizadas} label="finalizadas" cor="var(--sucesso)" />
                </div>
              </section>
            )
          })}
        </div>
      )}

      {semDono && (
        <div className="aviso aviso-atencao" style={{ marginTop: 16, alignItems: 'flex-start' }}>
          <UserX className="icone" aria-hidden="true" focusable="false" />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 15, fontWeight: 650 }}>Conversas sem atendente responsável</div>
            <div style={{ fontSize: 13.5, marginTop: 2, lineHeight: 1.5 }}>
              Isto não é uma pessoa: são conversas em que o Multi360 não registrou quem atendeu.
              {semDono.abertas > 0 ? ' Há conversas em aberto sem ninguém responsável — vale distribuir.' : ' Nenhuma delas está em aberto agora.'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <span className={`selo ${semDono.abertas > 0 ? 'selo-perigo' : 'selo-neutro'}`}>{semDono.abertas} em aberto</span>
              <span className={`selo ${semDono.esperando24 > 0 ? 'selo-perigo' : 'selo-neutro'}`}>{semDono.esperando24} sem resposta +24h</span>
              <span className="selo selo-sucesso">{semDono.finalizadas} encerradas</span>
            </div>
          </div>
        </div>
      )}

      <AtendentesSemConversaAberta lista={semConversaAberta.map((c) => ({ atendente: c.atendente, finalizadas: c.finalizadas }))} />

      {/* Acesso ao sistema */}
      <div style={{ marginTop: 34, marginBottom: 12 }}>
        <h2 className="ini-secao-titulo">Acesso ao sistema</h2>
        <p className="ini-secao-sub">Quem faz login neste painel. Apenas administradores podem cadastrar (botão no alto da página).</p>
      </div>

      {ehAdmin ? (
        <GerenciarAcessos
          usuarios={usuarios.map((u) => ({ id: u.id, nome: u.nome, email: u.email, role: u.role, ativo: u.ativo, at_colaborador_id: u.at_colaborador_id, vinculoNome: nomeVinculo(u) }))}
          atendentes={atendentes}
          meuId={meuId}
          papeis={opcoesPapel.map((p) => ({ codigo: p.codigo, nome: p.nome }))}
        />
      ) : (
        <div className="cartao" style={{ marginTop: 20 }}><div className="cartao-corpo" style={{ paddingTop: 15, color: 'var(--tinta-2)', fontSize: 14 }}>Apenas o administrador gerencia os acessos.</div></div>
      )}
    </main>
  )
}

function Metrica({ icone: Icone, valor, label, cor }: { icone: typeof MessageSquare; valor: number | string; label: string; cor: string }) {
  return (
    <div style={{ background: 'var(--recuo)', borderRadius: 10, padding: '8px 4px' }}>
      <Icone className="icone icone-p" style={{ color: cor, marginBottom: 2 }} aria-hidden="true" focusable="false" />
      <div style={{ fontSize: 18, fontWeight: 650, color: cor, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{valor}</div>
      <div style={{ fontSize: 11, color: 'var(--tinta-3)' }}>{label}</div>
    </div>
  )
}
