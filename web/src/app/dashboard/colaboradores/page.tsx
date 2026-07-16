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
  const configurado = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const temServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!configurado) return { usuarios: [], atendentes: [], ehAdmin: false, meuId: '', configurado: false, temServiceRole }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

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

/** Iniciais para o avatar. */
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
      <div style={{ padding: '28px 32px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
          Você não tem acesso a esta tela.
        </div>
      </div>
    )
  }
  const [{ usuarios, atendentes, ehAdmin, meuId, configurado, temServiceRole }, painel, papeis] = await Promise.all([
    carregar(),
    getPainelGestor(),
    getPapeis(), // só os ativos: papel desativado não deve ser atribuído a ninguém
  ])
  const opcoesPapel = papeis.map((p) => ({ codigo: p.codigo, nome: p.nome, soAsSuas: !p.pode_ver_tudo }))

  // Equipe do WhatsApp: já vem ordenada (quem tem mais gente esperando +24h primeiro).
  const equipe = painel.ranking

  // "sem atendente" não é uma pessoa: é a conversa que ficou sem responsável no Multi360.
  // Sai da lista de gente e ganha um aviso próprio.
  const ehSemAtendente = (nome: string) => nome.trim().toLowerCase() === 'sem atendente'
  const semDono = equipe.find((c) => ehSemAtendente(c.atendente)) ?? null
  const pessoas = equipe.filter((c) => !ehSemAtendente(c.atendente))

  // Ativos = quem tem conversa aberta; os demais só têm conversas já encerradas.
  const ativos = pessoas.filter((c) => c.abertas > 0)
  const semConversaAberta = pessoas.filter((c) => c.abertas === 0)

  // Totais continuam contando tudo (inclusive o que está sem responsável) — é a realidade da caixa.
  const totalAbertas = equipe.reduce((s, c) => s + c.abertas, 0)
  const totalEsperando24 = equipe.reduce((s, c) => s + c.esperando24, 0)

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A', display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserCog size={22} style={{ color: '#16A34A' }} /> Colaboradores
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
          A equipe que atende no WhatsApp (Multi360) e quem tem acesso ao sistema.
        </p>
      </div>

      {!configurado && <BannerConfig />}

      {/* ===== Cadastro de colaborador (só ADMIN) — no alto, mas recolhido ===== */}
      {ehAdmin && !temServiceRole && (
        <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', color: '#A16207', borderRadius: 14, padding: '12px 16px', fontSize: 13.5, marginBottom: 16 }}>
          <b>O sistema ainda não está liberado para criar logins.</b> Avise o responsável técnico para habilitar o cadastro de acessos.
        </div>
      )}

      {ehAdmin && (
        <div style={{ marginBottom: 22 }}>
          <NovoColaborador desabilitado={!temServiceRole} atendentes={atendentes} papeis={opcoesPapel} />
        </div>
      )}

      {/* ===== Equipe do WhatsApp (Multi360) ===== */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A3C5A' }}>Equipe ativa no WhatsApp</h2>
        <span style={{ fontSize: 12.5, color: '#9CA3AF' }}>
          {ativos.length} atendentes com conversa aberta · {totalAbertas} abertas · {totalEsperando24} sem resposta há +24h
          <span style={{ color: '#CBD5E1' }}> — quem tem mais gente esperando aparece primeiro</span>
        </span>
      </div>

      {ativos.length === 0 ? (
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #EEF2F7',
            padding: '40px 20px',
            textAlign: 'center',
            color: '#9CA3AF',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {equipe.length === 0 ? (
            <>
              Ainda não há atendentes lidos do Multi360.<br />
              Rode o leitor com o token configurado e a equipe aparece aqui.
            </>
          ) : (
            <>Nenhum atendente tem conversa em aberto agora.</>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 14,
          }}
        >
          {ativos.map((c) => {
            const alerta = c.esperando24 > 0
            return (
              <div
                key={c.atendente}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  border: '1px solid #EEF2F7',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  padding: '16px 18px',
                  borderLeft: alerta ? '4px solid #F59E0B' : '4px solid #16A34A',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #16A34A, #1A3C5A)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {iniciais(c.atendente)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#1A3C5A', fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formatarNome(c.atendente)}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>Atendente WhatsApp</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                  <Metrica icone={MessageSquare} valor={c.abertas} label="abertas" cor="#1A3C5A" />
                  <Metrica icone={AlarmClock} valor={c.esperando24} label="sem resposta +24h" cor={alerta ? '#C2410C' : '#16A34A'} />
                  <Metrica icone={CheckCircle2} valor={c.finalizadas} label="finalizadas" cor="#15803D" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Conversas que ficaram sem ninguém responsável (não é uma pessoa) */}
      {semDono && (
        <div
          style={{
            marginTop: 16,
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <UserX size={20} style={{ color: '#A16207', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#A16207' }}>Conversas sem atendente responsável</div>
            <div style={{ fontSize: 12.5, color: '#92400E', marginTop: 2, lineHeight: 1.5 }}>
              Isto não é uma pessoa: são conversas em que o Multi360 não registrou quem atendeu.
              {semDono.abertas > 0
                ? ' Há conversas em aberto sem ninguém responsável — vale distribuir.'
                : ' Nenhuma delas está em aberto agora.'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Selo valor={semDono.abertas} label="em aberto" bg={semDono.abertas > 0 ? '#FEE2E2' : '#F1F5F9'} cor={semDono.abertas > 0 ? '#B91C1C' : '#9CA3AF'} />
            <Selo valor={semDono.esperando24} label="sem resposta +24h" bg={semDono.esperando24 > 0 ? '#FEE2E2' : '#F1F5F9'} cor={semDono.esperando24 > 0 ? '#B91C1C' : '#9CA3AF'} />
            <Selo valor={semDono.finalizadas} label="encerradas" bg="#DCFCE7" cor="#15803D" />
          </div>
        </div>
      )}

      {/* Atendentes sem nenhuma conversa em aberto (só encerradas) */}
      <AtendentesSemConversaAberta
        lista={semConversaAberta.map((c) => ({ atendente: c.atendente, finalizadas: c.finalizadas }))}
      />

      {/* ===== Acesso ao sistema ===== */}
      <div style={{ marginTop: 34, marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A3C5A' }}>Acesso ao sistema</h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
          Quem faz login neste painel. Apenas administradores podem cadastrar (botão no alto da página).
        </p>
      </div>

      {ehAdmin ? (
        <GerenciarAcessos
          usuarios={usuarios.map((u) => ({
            id: u.id,
            nome: u.nome,
            email: u.email,
            role: u.role,
            ativo: u.ativo,
            at_colaborador_id: u.at_colaborador_id,
            vinculoNome: nomeVinculo(u),
          }))}
          atendentes={atendentes}
          meuId={meuId}
          papeis={opcoesPapel.map((p) => ({ codigo: p.codigo, nome: p.nome }))}
        />
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', padding: '20px', marginTop: 20, fontSize: 13.5, color: '#6B7280' }}>
          Apenas o administrador gerencia os acessos.
        </div>
      )}
    </div>
  )
}

/** Selo compacto usado no aviso de conversas sem responsável. */
function Selo({ valor, label, bg, cor }: { valor: number; label: string; bg: string; cor: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, background: bg, color: cor, borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 700 }}>
      <b style={{ fontSize: 14 }}>{valor}</b> {label}
    </span>
  )
}

function Metrica({
  icone: Icone,
  valor,
  label,
  cor,
}: {
  icone: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  valor: number | string
  label: string
  cor: string
}) {
  return (
    <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 4px' }}>
      <Icone size={14} style={{ color: cor, marginBottom: 2 }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: cor, lineHeight: 1.1 }}>{valor}</div>
      <div style={{ fontSize: 10.5, color: '#9CA3AF' }}>{label}</div>
    </div>
  )
}
