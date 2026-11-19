'use client'

/*
 * VITRINE — telas reais com dados fictícios, SEM login (Documento Mestre / método PrevSystem).
 * Serve para o Ronaldo ver e aprovar a aparência (Regra 54) e para fotografar em 390/1440/320 px,
 * sem precisar entrar no sistema. NÃO usa banco: tudo aqui é inventado. Rota liberada no proxy.
 */

import { Suspense, useState } from 'react'
import { Radar, Clock, Users, AlertTriangle, CheckCircle2, Filter } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import BlocoProtocolo from '@/components/BlocoProtocolo'
import SeletorMultiplo from '@/components/SeletorMultiplo'
import { AvisoPeProvider, useAvisoPe } from '@/components/AvisoPe'
import { useConfirmacao } from '@/components/Confirmacao'
import type { HistoricoProtocolo } from '@/lib/dados'

const AGORA = '2026-11-19T13:40:00-03:00'
function msg(id: string, tipo: 'cliente' | 'colaborador' | 'bot', nome: string, texto: string, quando: string) {
  return { id, remetente_tipo: tipo, remetente_nome: nome, texto, tem_anexo: false, enviado_em: quando }
}
function proto(x: Partial<HistoricoProtocolo> & { numero_protocolo: string }): HistoricoProtocolo {
  return {
    status_multi360: 'ATIVO', ultima_mensagem_direcao: 'cliente', departamento: 'Atendimento',
    atendente_nome: 'Maria Aparecida de Souza', participantes: null, mensagens: [], ...x,
  } as unknown as HistoricoProtocolo
}

const PROTOCOLOS: { p: HistoricoProtocolo; espera?: string }[] = [
  {
    espera: '2 horas e 10 minutos',
    p: proto({
      numero_protocolo: '2026-10482', departamento: 'Benefícios', atendente_nome: 'Maria Aparecida de Souza',
      ultima_mensagem_direcao: 'cliente',
      participantes: [{ nome: 'MARIA APARECIDA DE SOUZA', principal: true }, { nome: 'joão carlos pereira', principal: false }],
      mensagens: [
        msg('m1', 'cliente', 'José Antônio da Silva', 'Bom dia, consegui o documento que vocês pediram. Quando sai a resposta do meu benefício?', '2026-11-19T11:30:00-03:00'),
        msg('m2', 'colaborador', 'MARIA APARECIDA DE SOUZA', 'Oi, Seu José! Recebi aqui. Vou protocolar hoje e já te aviso.', '2026-11-19T09:12:00-03:00'),
        msg('m3', 'cliente', 'José Antônio da Silva', 'Obrigado!', '2026-11-19T09:05:00-03:00'),
      ],
    }),
  },
  {
    p: proto({
      numero_protocolo: '2026-10477', departamento: 'Financeiro', atendente_nome: 'carlos eduardo lima',
      ultima_mensagem_direcao: 'colaborador',
      participantes: [{ nome: 'CARLOS EDUARDO LIMA', principal: true }],
      mensagens: [
        msg('n1', 'colaborador', 'CARLOS EDUARDO LIMA', 'Prontinho, o boleto foi enviado para o seu e-mail. Qualquer dúvida é só chamar.', '2026-11-19T12:50:00-03:00'),
        msg('n2', 'cliente', 'Ana Beatriz Rodrigues', 'Perfeito, muito obrigada pela atenção.', '2026-11-19T12:40:00-03:00'),
      ],
    }),
  },
  {
    espera: '3 dias',
    p: proto({
      numero_protocolo: '2026-10390', departamento: 'Benefícios', atendente_nome: 'Maria Aparecida de Souza',
      ultima_mensagem_direcao: 'cliente',
      participantes: [{ nome: 'MARIA APARECIDA DE SOUZA', principal: true }],
      mensagens: [
        msg('o1', 'cliente', 'Sebastião Ferreira dos Santos', 'Oi, tem alguma novidade do meu processo?', '2026-11-16T14:20:00-03:00'),
      ],
    }),
  },
  {
    p: proto({
      numero_protocolo: '2026-10120', status_multi360: 'FINALIZADO', departamento: 'Atendimento', atendente_nome: 'carlos eduardo lima',
      ultima_mensagem_direcao: 'colaborador',
      participantes: [{ nome: 'CARLOS EDUARDO LIMA', principal: true }],
      mensagens: [
        msg('p1', 'colaborador', 'CARLOS EDUARDO LIMA', 'Benefício concedido! Parabéns. Encerro por aqui, qualquer coisa é só abrir uma nova conversa.', '2026-11-10T16:00:00-03:00'),
        msg('p2', 'cliente', 'Terezinha de Jesus Oliveira', 'Que alegria! Deus abençoe vocês.', '2026-11-10T15:58:00-03:00'),
      ],
    }),
  },
]

const SETORES = [
  { valor: 'Benefícios', grupo: 'Com conversa aberta' },
  { valor: 'Financeiro', grupo: 'Com conversa aberta' },
  { valor: 'Atendimento', grupo: 'Com conversa aberta' },
  { valor: 'Jurídico', grupo: 'Sem conversa aberta' },
]

function Numeros() {
  const itens = [
    { rot: 'Conversas abertas', val: '12', icone: Radar, cor: '' },
    { rot: 'Esperando a equipe', val: '7', icone: Clock, cor: 'atencao' },
    { rot: 'A equipe respondeu', val: '5', icone: CheckCircle2, cor: 'acao' },
    { rot: 'Paradas há +24h', val: '3', icone: AlertTriangle, cor: 'perigo' },
  ]
  return (
    <dl className="grade-numeros" style={{ marginBottom: 16 }}>
      {itens.map((i) => {
        const Ic = i.icone
        return (
          <div key={i.rot} className={`mon-num ${i.cor}`}>
            <dt><Ic className="icone" aria-hidden="true" focusable="false" /> {i.rot}</dt>
            <dd>{i.val}</dd>
          </div>
        )
      })}
    </dl>
  )
}

function Conteudo() {
  const { confirmar, modal } = useConfirmacao()
  const { avisar } = useAvisoPe()
  const [situacao, setSituacao] = useState<'abertas' | 'esperando' | 'todas'>('esperando')

  async function demoConfirmar() {
    const ok = await confirmar({
      titulo: 'Encerrar esta conversa?',
      mensagem: 'A conversa sai da lista de abertas. Você pode reabri-la depois, se o cliente voltar a falar.',
      confirmar: 'Encerrar', cancelar: 'Continuar aqui',
    })
    avisar(ok ? { texto: 'Conversa encerrada.', desfazer: async () => {} } : { texto: 'Nada foi alterado.' })
  }

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 820 }}>
      {modal}
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo">Monitor Diário</h1>
          <p className="subtitulo">Vitrine com dados fictícios — serve só para ver a aparência. Toque nos botões e nos filtros para sentir o movimento.</p>
        </div>
      </div>

      <Numeros />

      <div className="filtros" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <div className="chips" role="group" aria-label="Situação">
          {([['esperando', 'Esperando a equipe'], ['abertas', 'Todas as abertas'], ['todas', 'Tudo']] as const).map(([k, r]) => (
            <button key={k} type="button" className="chip" aria-pressed={situacao === k} onClick={() => setSituacao(k)}>{r}</button>
          ))}
        </div>
        <Suspense fallback={null}>
          <SeletorMultiplo nome="dep" rotulo="Setor" opcoes={SETORES} rotuloVazio="todos" />
        </Suspense>
        <button type="button" className="botao botao-secundario" onClick={demoConfirmar} style={{ marginLeft: 'auto' }}>
          <Filter className="icone icone-p" aria-hidden="true" focusable="false" /> Ver a janela de confirmação
        </button>
        <button type="button" className="botao botao-principal" onClick={() => avisar({ texto: 'Cobrança enviada a Maria Aparecida de Souza.', desfazer: async () => {} })}>
          Mostrar um aviso
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {PROTOCOLOS.map(({ p, espera }) => (
          <BlocoProtocolo key={p.numero_protocolo} p={p} atual={false} espera={espera} />
        ))}
      </div>
    </main>
  )
}

export default function VitrinePage() {
  return (
    <Suspense fallback={null}>
      <AvisoPeProvider>
        <a className="pular" href="#conteudo">Pular para o conteúdo</a>
        <div className="casca">
          <Sidebar
            role="ADMIN"
            telasPermitidas={['inicio', 'monitor', 'acoes', 'marcozero', 'cobrancas', 'auditoria', 'desempenho', 'colaboradores', 'configuracoes', 'laboratorio']}
            contadores={{ acoes: 3, abertas: 12, finalizadas: 40 }}
            nome="Ronaldo (vitrine)"
          />
          <div className="principal"><Conteudo /></div>
        </div>
      </AvisoPeProvider>
    </Suspense>
  )
}
