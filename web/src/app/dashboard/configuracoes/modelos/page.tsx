import Link from 'next/link'
import { ArrowLeft, MessageSquareText } from 'lucide-react'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import { getModelosCobranca } from '@/lib/modelos'
import GerenciarModelos from '@/components/GerenciarModelos'

export const dynamic = 'force-dynamic'

export default async function ModelosPage() {
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'modelos', papel.role)) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
          Você não tem acesso a esta tela.
        </div>
      </div>
    )
  }

  // mostra também os desativados (é a tela de manutenção)
  const modelos = await getModelosCobranca(false)

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
      <Link href="/dashboard/configuracoes" style={{ color: '#4B7BA6', fontSize: 14, textDecoration: 'none' }}>
        <ArrowLeft size={14} style={{ display: 'inline', marginRight: 6 }} /> Configurações
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A', display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 6px' }}>
        <MessageSquareText size={22} style={{ color: '#C2410C' }} /> Modelos de cobrança
      </h1>
      <p style={{ fontSize: 13.5, color: '#6B7280', margin: '0 0 8px' }}>
        Textos prontos para as cobranças que se repetem. Na conversa, ao clicar em <b>Cobrar atendente</b>, eles aparecem
        como botões: um clique preenche o texto (e o prazo, se você definir aqui) — e você ainda pode editar antes de enviar.
      </p>
      <p style={{ fontSize: 12.5, color: '#9CA3AF', margin: '0 0 18px' }}>
        <b>Desativar</b> tira o modelo da lista de cobrar sem apagá-lo. <b>Excluir</b> apaga de vez — as cobranças já
        enviadas com ele continuam como estão.
      </p>

      <GerenciarModelos
        modelos={modelos.map((m) => ({
          id: m.id,
          titulo: m.titulo,
          texto: m.texto,
          prazo_dias: m.prazo_dias,
          ativo: m.ativo,
          vezes_usado: m.vezes_usado,
        }))}
        podeEditar={papel.cobrar}
      />
    </div>
  )
}
