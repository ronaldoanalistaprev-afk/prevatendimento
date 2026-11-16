import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPapelAtual } from '@/lib/papel'
import { getPapeis } from '@/lib/poderes'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import GerenciarPapeis from '@/components/GerenciarPapeis'

export const dynamic = 'force-dynamic'

async function contarUsoPorPapel(): Promise<Record<string, number>> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('usuarios').select('role')
    const contagem: Record<string, number> = {}
    for (const u of (data ?? []) as { role?: string }[]) {
      const r = u.role ?? ''
      if (r) contagem[r] = (contagem[r] ?? 0) + 1
    }
    return contagem
  } catch {
    return {}
  }
}

export default async function PapeisPage() {
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  const ehAdministrador = papel.role === 'ADMIN'
  if (!podeAcessar(mapa, 'configuracoes', papel.role) || !ehAdministrador) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <div className="cartao" style={{ marginTop: 8 }}><div className="vazio"><p className="vazio-texto">Apenas o Administrador gerencia os papéis.</p></div></div>
      </main>
    )
  }

  const [papeis, uso] = await Promise.all([getPapeis(true), contarUsoPorPapel()])

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 900 }}>
      <Link href="/dashboard/configuracoes" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Configurações</Link>
      <h1 className="titulo" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 6px' }}>
        <Users className="icone icone-g" style={{ color: 'var(--acao)' }} aria-hidden="true" focusable="false" /> Papéis — os cargos do sistema
      </h1>
      <p className="subtitulo">Cada login tem um papel. Aqui você define <b>o que cada papel pode fazer</b>. Para escolher <b>quais telas</b> cada papel enxerga, use <Link href="/dashboard/configuracoes/permissoes">Permissões</Link>.</p>
      <p className="ini-secao-sub" style={{ margin: '4px 0 18px' }}>Os quatro papéis <b>de fábrica</b> podem ter o nome e a descrição mudados, mas não podem ser excluídos — só desativados. Um papel em uso por alguém não pode ser excluído: troque o papel da pessoa antes.</p>

      <GerenciarPapeis
        papeis={papeis.map((p) => ({ codigo: p.codigo, nome: p.nome, descricao: p.descricao, sistema: p.sistema, pode_ver_tudo: p.pode_ver_tudo, pode_cobrar: p.pode_cobrar, ativo: p.ativo, emUso: uso[p.codigo] ?? 0 }))}
      />
    </main>
  )
}
