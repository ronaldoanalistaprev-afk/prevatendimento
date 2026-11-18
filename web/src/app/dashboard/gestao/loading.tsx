/** Carregando no formato desta tela (Regra 45; auditoria L1/L2). */
import Esqueleto from '@/app/dashboard/configuracoes/_esqueleto'

export default function Carregando() {
  return <Esqueleto titulo="Gestão de Pendências" forma="tabela" linhas={6} largura={1100} />
}
