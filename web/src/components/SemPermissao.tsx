import Link from 'next/link'
import { Lock } from 'lucide-react'

/** Tela sem permissão (Regra 45: diz por quê e o caminho; Regra 43 item 5: nada de beco sem saída). */
export default function SemPermissao({ tela }: { tela: string }) {
  return (
    <div className="cartao">
      <div className="vazio">
        <div className="vazio-icone"><Lock className="icone" aria-hidden="true" focusable="false" /></div>
        <div className="vazio-titulo">Você não tem acesso a {tela}</div>
        <div className="vazio-texto">
          O seu papel no sistema não inclui esta tela. Se precisar dela no seu trabalho, peça ao administrador para liberar em
          Configurações › Permissões.
        </div>
        <Link href="/dashboard" className="botao botao-secundario">Voltar ao Início</Link>
      </div>
    </div>
  )
}
