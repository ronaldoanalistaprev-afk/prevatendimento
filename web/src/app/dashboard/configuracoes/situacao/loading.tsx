/** Carregando no formato desta tela (Regra 45; auditoria L1/L2). */
import Esqueleto from '@/app/dashboard/configuracoes/_esqueleto'

export default function Carregando() {
  return <Esqueleto titulo="Situação do sistema" voltar="Configurações" subtitulo={false} forma="lista" linhas={3} largura={820} />
}
