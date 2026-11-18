/** Carregando no formato desta tela (Regra 45; auditoria L1/L2). */
import Esqueleto from '@/app/dashboard/configuracoes/_esqueleto'

export default function Carregando() {
  return <Esqueleto titulo="Nova conversa" voltar="Laboratório WhatsApp" forma="formulario" linhas={3} largura={560} />
}
