import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPapelAtual } from '@/lib/papel'
import { getPapeis } from '@/lib/poderes'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import GerenciarPapeis from '@/components/GerenciarPapeis'

export const dynamic = 'force-dynamic'

/** Quantos logins usam cada papel (para não excluir papel em uso). */
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
      <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
          Apenas o Administrador gerencia os papéis.
        </div>
      </div>
    )
  }

  const [papeis, uso] = await Promise.all([getPapeis(true), contarUsoPorPapel()])

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
      <Link href="/dashboard/configuracoes" style={{ color: '#4B7BA6', fontSize: 14, textDecoration: 'none' }}>
        <ArrowLeft size={14} style={{ display: 'inline', marginRight: 6 }} /> Configurações
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A', display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 6px' }}>
        <Users size={22} style={{ color: '#4B7BA6' }} /> Papéis — os cargos do sistema
      </h1>
      <p style={{ fontSize: 13.5, color: '#6B7280', margin: '0 0 8px' }}>
        Cada login tem um papel. Aqui você define <b>o que cada papel pode fazer</b>. Para escolher <b>quais telas</b> cada
        papel enxerga, use <Link href="/dashboard/configuracoes/permissoes" style={{ color: '#4B7BA6' }}>Permissões</Link>.
      </p>
      <p style={{ fontSize: 12.5, color: '#9CA3AF', margin: '0 0 18px' }}>
        Os quatro papéis <b>de fábrica</b> podem ter o nome e a descrição mudados, mas não podem ser excluídos — só
        desativados. Um papel em uso por alguém não pode ser excluído: troque o papel da pessoa antes.
      </p>

      <GerenciarPapeis
        papeis={papeis.map((p) => ({
          codigo: p.codigo,
          nome: p.nome,
          descricao: p.descricao,
          sistema: p.sistema,
          pode_ver_tudo: p.pode_ver_tudo,
          pode_cobrar: p.pode_cobrar,
          ativo: p.ativo,
          emUso: uso[p.codigo] ?? 0,
        }))}
      />
    </div>
  )
}
