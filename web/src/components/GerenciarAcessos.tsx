'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Power, Loader2, KeyRound, Link2, Copy, ChevronDown, Check, X, AlertCircle, type LucideIcon } from 'lucide-react'
import { useConfirmacao } from './Confirmacao'
import { useAvisoPe } from './AvisoPe'
import { tecladoFormulario } from '@/lib/formulario'
import { formatarNome } from '@/lib/utils'

interface UsuarioLinha {
  id: string
  nome: string
  email: string
  role: string
  ativo: boolean
  at_colaborador_id: string | null
  vinculoNome: string | null
  /** Data em que ficou com senha provisória; null = a pessoa já criou a própria. */
  senhaProvisoriaDesde: string | null
}

/** Selo por papel: a cor sempre vem com o nome do papel (Regra 46). */
const SELO: Record<string, string> = {
  ADMIN: 'selo-perigo',
  GESTOR: 'selo-acao',
  SUPERVISOR: 'selo-neutro',
  COLABORADOR: 'selo-sucesso',
}

export default function GerenciarAcessos({
  usuarios,
  atendentes,
  meuId,
  papeis = [],
}: {
  usuarios: UsuarioLinha[]
  atendentes: { id: string; nome: string }[]
  meuId: string
  papeis?: { codigo: string; nome: string }[]
}) {
  const router = useRouter()
  const { confirmar, modal } = useConfirmacao()
  const { avisar } = useAvisoPe()
  const [editando, setEditando] = useState<UsuarioLinha | null>(null)
  const [ocupadoId, setOcupadoId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [gerandoId, setGerandoId] = useState<string | null>(null)
  const [linkReset, setLinkReset] = useState<{ nome: string; link: string } | null>(null)
  const [copiado, setCopiado] = useState(false)
  // Senha provisória: definir para um acesso que já existe (a pessoa troca no 1º acesso).
  const [provAlvo, setProvAlvo] = useState<{ id: string; nome: string } | null>(null)
  const [provSenha, setProvSenha] = useState('')
  const [provSalvando, setProvSalvando] = useState(false)
  const [provErro, setProvErro] = useState<string | null>(null)
  const [provFeita, setProvFeita] = useState<{ nome: string; senha: string } | null>(null)

  const nomePapel = (codigo: string) => papeis.find((p) => p.codigo === codigo)?.nome ?? codigo

  /** Gera uma senha de 10 caracteres sem letras/números que se confundem (0/O, 1/l/I). */
  function gerarSenha(): string {
    const abc = 'abcdefghijkmnpqrstuvwxyz', ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ', num = '23456789'
    const todos = abc + ABC + num
    const r = (s: string) => s[Math.floor(Math.random() * s.length)]
    let s = r(ABC) + r(abc) + r(num)
    for (let i = 0; i < 7; i++) s += r(todos)
    return s.split('').sort(() => Math.random() - 0.5).join('')
  }

  function abrirProvisoria(u: UsuarioLinha) {
    setErro(null); setLinkReset(null); setProvFeita(null); setProvErro(null)
    setProvSenha(gerarSenha())
    setProvAlvo({ id: u.id, nome: formatarNome(u.nome) })
  }

  async function salvarProvisoria() {
    if (!provAlvo) return
    setProvSalvando(true); setProvErro(null)
    try {
      const res = await fetch('/api/usuarios/senha-provisoria', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: provAlvo.id, senha: provSenha }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.erro ?? 'Não foi possível definir a senha provisória. Tente de novo.')
      setProvFeita({ nome: provAlvo.nome, senha: provSenha })
      setProvAlvo(null); setProvSenha('')
      router.refresh()
    } catch (e) {
      setProvErro((e as Error).message)
    } finally {
      setProvSalvando(false)
    }
  }

  async function copiarSenha() {
    if (!provFeita) return
    try {
      await navigator.clipboard.writeText(provFeita.senha)
      setCopiado(true); setTimeout(() => setCopiado(false), 2500)
    } catch {
      setProvErro('Não consegui copiar automaticamente. Selecione a senha e copie com Ctrl+C.')
    }
  }

  async function gerarLinkSenha(u: UsuarioLinha) {
    setGerandoId(u.id); setErro(null); setLinkReset(null); setCopiado(false)
    try {
      const res = await fetch('/api/usuarios/reset-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: u.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.erro ?? 'Não foi possível gerar o link. Tente de novo.')
      setLinkReset({ nome: formatarNome(u.nome), link: data.link })
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setGerandoId(null)
    }
  }

  async function copiar() {
    if (!linkReset) return
    try {
      await navigator.clipboard.writeText(linkReset.link)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setErro('Não consegui copiar automaticamente. Selecione o link e copie com Ctrl+C.')
    }
  }

  /** Chama a API de usuários. Devolve true quando deu certo; o erro fica visível no topo do cartão. */
  async function chamar(method: string, corpo: Record<string, unknown>, id: string): Promise<boolean> {
    setOcupadoId(id); setErro(null)
    try {
      const res = await fetch('/api/usuarios', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.erro ?? 'Não foi possível salvar. Tente de novo.')
      router.refresh()
      return true
    } catch (e) {
      setErro((e as Error).message)
      return false
    } finally {
      setOcupadoId(null)
    }
  }

  /** Ativar/Desativar: SEMPRE com janela de confirmação e o nome da pessoa (Regra 39 item 2). */
  async function alternarAtivo(u: UsuarioLinha) {
    const nome = formatarNome(u.nome)
    const ok = await confirmar(u.ativo
      ? { titulo: `Desativar o acesso de ${nome}?`, mensagem: `${nome} deixa de conseguir entrar no sistema até alguém reativar. Nada é apagado.`, confirmar: 'Desativar acesso', perigo: true }
      : { titulo: `Ativar o acesso de ${nome}?`, mensagem: `${nome} volta a conseguir entrar no sistema com a senha que já tinha.`, confirmar: 'Ativar acesso' })
    if (!ok) return
    const novo = !u.ativo
    if (await chamar('PATCH', { id: u.id, ativo: novo }, u.id)) {
      avisar({
        texto: `Acesso de ${nome} ${novo ? 'ativado' : 'desativado'}.`,
        desfazer: async () => { if (await chamar('PATCH', { id: u.id, ativo: !novo }, u.id)) avisar({ texto: `Acesso de ${nome} voltou a ficar ${novo ? 'desativado' : 'ativo'}.` }) },
      })
    }
  }

  async function excluir(u: UsuarioLinha) {
    const nome = formatarNome(u.nome)
    if (await confirmar({ titulo: `Excluir o acesso de ${nome}?`, mensagem: `O acesso de ${nome} será excluído e a pessoa perde o login no sistema. Isso não pode ser desfeito.`, confirmar: 'Excluir acesso', perigo: true })) {
      if (await chamar('DELETE', { id: u.id }, u.id)) avisar({ texto: `Acesso de ${nome} excluído.` })
    }
  }

  async function salvarEdicao(u: UsuarioLinha, role: string, vinculo: string): Promise<boolean> {
    const antes = { role: u.role, at_colaborador_id: u.at_colaborador_id }
    const ok = await chamar('PATCH', { id: u.id, role, at_colaborador_id: vinculo || null }, u.id)
    if (ok) {
      const nome = formatarNome(u.nome)
      avisar({
        texto: `Acesso de ${nome} salvo.`,
        desfazer: async () => { if (await chamar('PATCH', { id: u.id, ...antes }, u.id)) avisar({ texto: `Acesso de ${nome} voltou ao que era.` }) },
      })
    }
    return ok
  }

  return (
    <section className="cartao" style={{ marginTop: 20 }}>
      {modal}
      {erro && (
        <div className="aviso aviso-perigo" role="alert" style={{ margin: '12px 16px 0' }}>
          <AlertCircle className="icone" aria-hidden="true" focusable="false" />
          <div>{erro}</div>
        </div>
      )}
      {linkReset && (
        <div className="aviso aviso-info" role="status" style={{ margin: '12px 16px 0', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div style={{ fontWeight: 650 }}>Link de senha para {linkReset.nome}: copie e envie para a pessoa (vale por 1 hora).</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input className="entrada" readOnly value={linkReset.link} aria-label={`Link de senha para ${linkReset.nome}`} onFocus={(e) => e.currentTarget.select()} style={{ flex: '1 1 220px', minWidth: 0 }} />
            <button type="button" className="botao botao-principal" onClick={copiar}><Copy className="icone icone-p" aria-hidden="true" focusable="false" /> {copiado ? 'Link copiado' : 'Copiar link'}</button>
            <button type="button" className="botao botao-secundario" onClick={() => setLinkReset(null)}>Fechar</button>
          </div>
        </div>
      )}
      {provAlvo && (
        <div className="aviso aviso-info" role="group" aria-label={`Definir senha provisória para ${provAlvo.nome}`} style={{ margin: '12px 16px 0', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div style={{ fontWeight: 650 }}>Senha provisória para {provAlvo.nome}: a pessoa troca no primeiro acesso.</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="entrada" value={provSenha} onChange={(e) => setProvSenha(e.target.value)} aria-label="Senha provisória" autoComplete="off" spellCheck={false} style={{ flex: '1 1 200px', minWidth: 0, fontFamily: 'ui-monospace, monospace' }} />
            <button type="button" className="botao botao-secundario" onClick={() => setProvSenha(gerarSenha())}>Gerar outra</button>
          </div>
          <span className="ajuda">Pelo menos 8 caracteres. Entregue à pessoa (nenhum e-mail é enviado). No primeiro acesso, ela cria a própria senha.</span>
          {provErro && <div className="aviso aviso-perigo" role="alert" style={{ margin: 0 }}><AlertCircle className="icone" aria-hidden="true" focusable="false" /><div>{provErro}</div></div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="botao botao-principal" onClick={salvarProvisoria} disabled={provSalvando || provSenha.length < 8}>
              {provSalvando ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <KeyRound className="icone icone-p" aria-hidden="true" focusable="false" />} {provSalvando ? 'Definindo…' : 'Definir senha provisória'}
            </button>
            <button type="button" className="botao botao-secundario" onClick={() => { setProvAlvo(null); setProvErro(null) }} disabled={provSalvando}>Cancelar</button>
          </div>
        </div>
      )}
      {provFeita && (
        <div className="aviso aviso-info" role="status" style={{ margin: '12px 16px 0', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div style={{ fontWeight: 650 }}>Senha provisória de {provFeita.nome} definida. Entregue a ela — no primeiro acesso ela cria a própria senha.</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input className="entrada" readOnly value={provFeita.senha} aria-label={`Senha provisória de ${provFeita.nome}`} onFocus={(e) => e.currentTarget.select()} style={{ flex: '1 1 200px', minWidth: 0, fontFamily: 'ui-monospace, monospace' }} />
            <button type="button" className="botao botao-principal" onClick={copiarSenha}><Copy className="icone icone-p" aria-hidden="true" focusable="false" /> {copiado ? 'Senha copiada' : 'Copiar senha'}</button>
            <button type="button" className="botao botao-secundario" onClick={() => setProvFeita(null)}>Fechar</button>
          </div>
        </div>
      )}
      {usuarios.length === 0 ? (
        <div className="vazio">
          <div className="vazio-titulo">Nenhum acesso cadastrado ainda</div>
          <p className="vazio-texto">Use “Cadastrar colaborador”, no alto da página, para criar o primeiro login.</p>
        </div>
      ) : (
        <div className="tabela-caixa">
          <table className="tabela tabela-cartoes">
            <caption className="so-leitor">Acessos ao sistema</caption>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">E-mail</th>
                <th scope="col">Papel</th>
                <th scope="col">Atendente vinculado</th>
                <th scope="col">Situação</th>
                <th scope="col" className="acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const souEu = u.id === meuId
                const nome = formatarNome(u.nome)
                const ocupado = ocupadoId === u.id
                return (
                  <tr key={u.id}>
                    <td className="nome" data-rotulo="Nome" style={{ overflowWrap: 'anywhere' }}>{nome}</td>
                    <td data-rotulo="E-mail" style={{ color: 'var(--tinta-2)', overflowWrap: 'anywhere' }}>{u.email}</td>
                    <td data-rotulo="Papel"><span className={`selo ${SELO[u.role] ?? 'selo-neutro'}`}>{nomePapel(u.role)}</span></td>
                    <td data-rotulo="Atendente vinculado" style={{ color: 'var(--tinta-2)' }}>
                      {u.vinculoNome ? formatarNome(u.vinculoNome) : <span className="selo selo-atencao">Não Vinculado</span>}
                    </td>
                    <td className="situacao" data-rotulo="Situação">
                      <span className={`selo ${u.ativo ? 'selo-sucesso' : 'selo-neutro'}`}>{u.ativo ? 'Ativo' : 'Inativo'}</span>
                      {u.senhaProvisoriaDesde && <span className="selo selo-atencao" style={{ marginLeft: 6 }}>Senha Provisória</span>}
                    </td>
                    <td className="acoes" data-rotulo="Ações">
                      <IconBtn icon={Pencil} dica="Editar papel e vínculo" rotulo={`Editar o acesso de ${nome}`} curto="Editar" disabled={ocupado} onClick={() => { setErro(null); setEditando(u) }} />
                      <IconBtn icon={KeyRound} dica="Definir senha provisória (troca no 1º acesso)" rotulo={`Definir senha provisória para ${nome}`} curto="Senha provisória" disabled={ocupado} onClick={() => abrirProvisoria(u)} />
                      <IconBtn icon={Link2} dica="Gerar link para nova senha" rotulo={`Gerar link de nova senha para ${nome}`} curto="Link de senha" loading={gerandoId === u.id} disabled={ocupado || gerandoId === u.id} onClick={() => gerarLinkSenha(u)} />
                      <IconBtn icon={Power} dica={u.ativo ? 'Desativar acesso' : 'Ativar acesso'} rotulo={`${u.ativo ? 'Desativar' : 'Ativar'} o acesso de ${nome}`} curto={u.ativo ? 'Desativar' : 'Ativar'} classe={u.ativo ? 'inativar' : 'ativar'} loading={ocupado} disabled={ocupado} onClick={() => alternarAtivo(u)} />
                      {!souEu && (
                        <IconBtn icon={Trash2} dica="Excluir acesso" rotulo={`Excluir o acesso de ${nome}`} curto="Excluir" classe="inativar" disabled={ocupado} onClick={() => excluir(u)} />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <JanelaEditarAcesso
          usuario={editando}
          papeis={papeis}
          atendentes={atendentes}
          ocupado={ocupadoId === editando.id}
          confirmar={confirmar}
          aoFechar={() => setEditando(null)}
          aoSalvar={async (role, vinculo) => { if (await salvarEdicao(editando, role, vinculo)) setEditando(null) }}
        />
      )}
    </section>
  )
}

/**
 * Janela "Editar acesso" (auditoria K3: editar numa janela, com "Salvar acesso" escrito;
 * no celular a .janela vira folha que sobe do pé). Esc e Cancelar perguntam se houver alteração (Regras 28/30).
 */
function JanelaEditarAcesso({
  usuario, papeis, atendentes, ocupado, confirmar, aoFechar, aoSalvar,
}: {
  usuario: UsuarioLinha
  papeis: { codigo: string; nome: string }[]
  atendentes: { id: string; nome: string }[]
  ocupado: boolean
  confirmar: ReturnType<typeof useConfirmacao>['confirmar']
  aoFechar: () => void
  aoSalvar: (role: string, vinculo: string) => Promise<void>
}) {
  const [role, setRole] = useState(usuario.role)
  const [vinculo, setVinculo] = useState(usuario.at_colaborador_id ?? '')
  const janela = useRef<HTMLDivElement | null>(null)
  const primeiro = useRef<HTMLSelectElement | null>(null)
  const focoAnterior = useRef<HTMLElement | null>(null)
  const alterado = role !== usuario.role || vinculo !== (usuario.at_colaborador_id ?? '')
  const nome = formatarNome(usuario.nome)

  async function cancelar() {
    if (alterado && !(await confirmar({ titulo: 'Sair sem salvar?', mensagem: `As mudanças no acesso de ${nome} ainda não foram salvas e serão perdidas.`, confirmar: 'Sair sem salvar', cancelar: 'Continuar editando', perigo: true }))) return
    aoFechar()
  }

  // Foco: entra no primeiro campo, fica preso na janela e volta ao botão de origem ao fechar (Regra 43 item 7).
  useEffect(() => {
    focoAnterior.current = document.activeElement as HTMLElement | null
    primeiro.current?.focus()
    return () => { const alvo = focoAnterior.current; if (alvo && typeof alvo.focus === 'function') setTimeout(() => alvo.focus(), 0) }
  }, [])

  const cancelarRef = useRef(cancelar)
  useEffect(() => { cancelarRef.current = cancelar })
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (document.querySelector('.janela-confirma')) return // a confirmação por cima cuida do teclado
      if (e.key === 'Escape') { e.preventDefault(); cancelarRef.current(); return }
      if (e.key === 'Tab' && janela.current) {
        const itens = janela.current.querySelectorAll<HTMLElement>('select, button, input')
        if (itens.length === 0) return
        const a = itens[0], z = itens[itens.length - 1]
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [])

  return (
    <>
      <div className="veu" onMouseDown={cancelar} />
      <div ref={janela} className="janela janela-media" role="dialog" aria-modal="true" aria-labelledby="editar-acesso-titulo">
        <div className="janela-cabeca">
          <div className="textos">
            <h2 className="janela-titulo" id="editar-acesso-titulo">Editar acesso</h2>
            <p className="janela-sub">{nome} · {usuario.email}</p>
          </div>
          <button type="button" className="botao-icone" aria-label="Fechar sem salvar" title="Fechar" onClick={cancelar}><X className="icone" aria-hidden="true" focusable="false" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); aoSalvar(role, vinculo) }} onKeyDown={tecladoFormulario} style={{ display: 'contents' }}>
          <div className="janela-corpo" style={{ display: 'grid', gap: 14 }}>
            <div className="campo">
              <label className="rotulo" htmlFor="editar-acesso-papel">Papel</label>
              <div className="caixa-select">
                <select ref={primeiro} id="editar-acesso-papel" className="entrada" value={role} onChange={(e) => setRole(e.target.value)}>
                  {papeis.map((p) => (<option key={p.codigo} value={p.codigo}>{p.nome}</option>))}
                </select>
                <ChevronDown className="icone" aria-hidden="true" focusable="false" />
              </div>
            </div>
            <div className="campo">
              <label className="rotulo" htmlFor="editar-acesso-vinculo">Atendente no Multi360</label>
              <div className="caixa-select">
                <select id="editar-acesso-vinculo" className="entrada" value={vinculo} onChange={(e) => setVinculo(e.target.value)} aria-describedby="editar-acesso-vinculo-ajuda">
                  <option value="">Não vincular</option>
                  {atendentes.map((a) => (<option key={a.id} value={a.id}>{formatarNome(a.nome)}</option>))}
                </select>
                <ChevronDown className="icone" aria-hidden="true" focusable="false" />
              </div>
              <span className="ajuda" id="editar-acesso-vinculo-ajuda">Liga o login à pessoa que atende no WhatsApp. Quem vê só as próprias conversas precisa deste vínculo.</span>
            </div>
          </div>
          <div className="janela-pe">
            <button type="button" className="botao botao-secundario" onClick={cancelar} disabled={ocupado}>Cancelar</button>
            <button type="submit" className="botao botao-principal" disabled={ocupado}>
              {ocupado ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Check className="icone icone-p" aria-hidden="true" focusable="false" />} {ocupado ? 'Salvando…' : 'Salvar acesso'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

/** Botão de ação só com ícone: dica ao passar o mouse, nome completo para o leitor de tela e rótulo escrito no cartão do celular. */
function IconBtn({ icon: Icon, dica, rotulo, curto, onClick, disabled, loading, classe }: {
  icon: LucideIcon
  dica: string
  rotulo: string
  curto: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  classe?: string
}) {
  return (
    <button type="button" className={`botao-icone ${classe ?? ''}`} data-dica={dica} aria-label={rotulo} onClick={onClick} disabled={disabled}>
      {loading ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Icon className="icone icone-p" aria-hidden="true" focusable="false" />}
      <span className="rotulo-celular">{curto}</span>
    </button>
  )
}
