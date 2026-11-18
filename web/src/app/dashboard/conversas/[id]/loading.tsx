/** Carregando no formato desta tela (Regra 45; auditoria L1/L2). */
import Esqueleto from '@/app/dashboard/configuracoes/_esqueleto'

export default function Carregando() {
  return <Esqueleto titulo={null} voltar="Laboratório WhatsApp" subtitulo={false} forma="conversa" linhas={6} largura={820} />
}
