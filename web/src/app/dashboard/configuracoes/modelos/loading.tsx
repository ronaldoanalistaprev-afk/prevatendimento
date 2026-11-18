/** Carregando no formato desta tela (Regra 45; auditoria L1/L2). */
import Esqueleto from '@/app/dashboard/configuracoes/_esqueleto'

export default function Carregando() {
  return <Esqueleto titulo="Modelos de cobrança" voltar="Configurações" forma="lista" linhas={4} largura={900} />
}
