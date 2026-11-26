import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BannerConfig from '@/components/BannerConfig'
import NovoColaborador from '@/components/NovoColaborador'
import GerenciarAcessos from '@/components/GerenciarAcessos'
import { getPapelAtual } from '@/lib/papel'
import { getPapeis } from '@/lib/poderes'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import type { Usuario } from '@/lib/tipos'
import SemPermissao from '@/components/SemPermissao'
import { BarChart3, Lock } from 'lucide-react'

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

export default async function ColaboradoresPage() {
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'colaboradores', papel.role)) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <div className="cabeca"><div className="cabeca-texto"><h1 className="titulo">Colaboradores</h1></div></div>
        <SemPermissao tela="Colaboradores" />
      </main>
    )
  }
  const [{ usuarios, atendentes, ehAdmin, meuId, configurado, temServiceRole }, papeis] = await Promise.all([
    carregar(),
    getPapeis(),
  ])
  const opcoesPapel = papeis.map((p) => ({ codigo: p.codigo, nome: p.nome, soAsSuas: !p.pode_ver_tudo }))
  const podeDesempenho = podeAcessar(mapa, 'desempenho', papel.role)

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 1100 }}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo">Colaboradores</h1>
          <p className="subtitulo">As pessoas da equipe e quem tem acesso ao sistema.</p>
          {podeDesempenho && (
            <p className="texto-apoio" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              Os números de atendimento de cada atendente ficam em{' '}
              <Link href="/dashboard/desempenho" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--acento)', textDecoration: 'none', fontWeight: 600 }}>
                <BarChart3 className="icone icone-p" aria-hidden="true" focusable="false" />Desempenho
              </Link>.
            </p>
          )}
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

      {/* Acesso ao sistema */}
      <div style={{ marginBottom: 12 }}>
        <h2 className="ini-secao-titulo">Acesso ao sistema</h2>
        <p className="ini-secao-sub">Quem faz login neste painel.{ehAdmin ? ' Cadastre novos acessos com o botão “Cadastrar colaborador”, no alto da página.' : ''}</p>
      </div>

      {ehAdmin ? (
        <GerenciarAcessos
          usuarios={usuarios.map((u) => ({ id: u.id, nome: u.nome, email: u.email, role: u.role, ativo: u.ativo, at_colaborador_id: u.at_colaborador_id, vinculoNome: nomeVinculo(u), senhaProvisoriaDesde: (u as { senha_provisoria_desde?: string | null }).senha_provisoria_desde ?? null }))}
          atendentes={atendentes}
          meuId={meuId}
          papeis={opcoesPapel.map((p) => ({ codigo: p.codigo, nome: p.nome }))}
        />
      ) : (
        <div className="cartao" style={{ marginTop: 20 }}><div className="vazio-curto" style={{ padding: '14px 16px' }}>
          <Lock className="icone" aria-hidden="true" focusable="false" />
          <span>Só o administrador cadastra, edita e desativa acessos. Se precisar de um login novo, peça a ele.</span>
        </div></div>
      )}
    </main>
  )
}
