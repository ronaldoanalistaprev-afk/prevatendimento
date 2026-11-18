import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SemPermissao from '@/components/SemPermissao'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import { getModelosCobranca } from '@/lib/modelos'
import GerenciarModelos from '@/components/GerenciarModelos'

export const dynamic = 'force-dynamic'

export default async function ModelosPage() {
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'modelos', papel.role)) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <div className="cabeca"><div className="cabeca-texto"><h1 className="titulo">Modelos de cobrança</h1></div></div>
        <SemPermissao tela="Modelos de cobrança" />
      </main>
    )
  }

  const modelos = await getModelosCobranca(false)

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 900 }}>
      <Link href="/dashboard/configuracoes" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Configurações</Link>
      <h1 className="titulo" style={{ margin: '12px 0 6px' }}>Modelos de cobrança</h1>

      <p className="subtitulo">Textos prontos para as cobranças que se repetem. Na conversa, ao clicar em <b>Cobrar atendente</b>, eles aparecem como botões: um clique preenche o texto (e o prazo, se você definir aqui) — e você ainda pode editar antes de enviar.</p>
      <p className="ini-secao-sub" style={{ margin: '4px 0 18px' }}><b>Desativar</b> tira o modelo da lista de cobrar sem apagá-lo. <b>Excluir</b> apaga de vez — as cobranças já enviadas com ele continuam como estão.</p>

      <GerenciarModelos
        modelos={modelos.map((m) => ({ id: m.id, titulo: m.titulo, texto: m.texto, prazo_dias: m.prazo_dias, ativo: m.ativo, vezes_usado: m.vezes_usado }))}
        podeEditar={papel.cobrar}
      />
    </main>
  )
}
