'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Check, X, Power, Loader2, KeyRound, Copy, ChevronDown } from 'lucide-react'
import { useConfirmacao } from './Confirmacao'

interface UsuarioLinha {
  id: string
  nome: string
  email: string
  role: string
  ativo: boolean
  at_colaborador_id: string | null
  vinculoNome: string | null
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
  const [editId, setEditId] = useState<string | null>(null)
  const [role, setRole] = useState('COLABORADOR')
  const [vinculo, setVinculo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [gerandoId, setGerandoId] = useState<string | null>(null)
  const [linkReset, setLinkReset] = useState<{ nome: string; link: string } | null>(null)
  const [copiado, setCopiado] = useState(false)

  async function gerarLinkSenha(u: UsuarioLinha) {
    setGerandoId(u.id); setErro(null); setLinkReset(null); setCopiado(false)
    try {
      const res = await fetch('/api/usuarios/reset-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: u.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.erro ?? 'Falha ao gerar o link')
      setLinkReset({ nome: u.nome, link: data.link })
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

  function abrirEdicao(u: UsuarioLinha) {
    setEditId(u.id); setRole(u.role); setVinculo(u.at_colaborador_id ?? ''); setErro(null)
  }

  async function chamar(method: string, corpo: Record<string, unknown>) {
    setOcupado(true); setErro(null)
    try {
      const res = await fetch('/api/usuarios', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.erro ?? 'Falha')
      setEditId(null)
      router.refresh()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <section className="cartao" style={{ marginTop: 20, overflow: 'hidden' }}>
      {modal}
      {erro && <div className="aviso aviso-perigo" style={{ margin: '12px 16px 0' }}>{erro}</div>}
      {linkReset && (
        <div className="aviso aviso-info" style={{ margin: '12px 16px 0', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div style={{ fontWeight: 650 }}>Link de senha para {linkReset.nome} — copie e envie para a pessoa (vale por 1 hora):</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input className="entrada" readOnly value={linkReset.link} onFocus={(e) => e.currentTarget.select()} style={{ flex: 1, minWidth: 240 }} />
            <button className="botao botao-principal" onClick={copiar}><Copy className="icone icone-p" aria-hidden="true" focusable="false" /> {copiado ? 'Copiado!' : 'Copiar'}</button>
            <button className="botao botao-secundario" onClick={() => setLinkReset(null)}>Fechar</button>
          </div>
        </div>
      )}
      {usuarios.length === 0 ? (
        <div className="vazio"><p className="vazio-texto">Nenhum acesso cadastrado ainda.</p></div>
      ) : (
        <div className="tabela-caixa" style={{ overflowX: 'auto' }}>
          <table className="tabela" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
                <th>Atendente vinculado</th>
                <th>Status</th>
                <th className="acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const rotulo = papeis.find((p) => p.codigo === u.role)?.nome ?? u.role
                const editando = editId === u.id
                const souEu = u.id === meuId
                return (
                  <tr key={u.id}>
                    <td className="nome" style={{ color: 'var(--tinta)', overflowWrap: 'anywhere' }}>{u.nome}</td>
                    <td style={{ color: 'var(--tinta-2)' }}>{u.email}</td>
                    <td>
                      {editando ? (
                        <div className="caixa-select"><select className="entrada" value={role} onChange={(e) => setRole(e.target.value)} style={{ minHeight: 34 }}>{papeis.map((p) => (<option key={p.codigo} value={p.codigo}>{p.nome}</option>))}</select><ChevronDown className="icone" aria-hidden="true" focusable="false" /></div>
                      ) : (
                        <span className={`selo ${SELO[u.role] ?? 'selo-neutro'}`}>{rotulo}</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--tinta-2)' }}>
                      {editando ? (
                        <div className="caixa-select"><select className="entrada" value={vinculo} onChange={(e) => setVinculo(e.target.value)} style={{ minHeight: 34 }}><option value="">— não vincular —</option>{atendentes.map((a) => (<option key={a.id} value={a.id}>{a.nome}</option>))}</select><ChevronDown className="icone" aria-hidden="true" focusable="false" /></div>
                      ) : (u.vinculoNome ?? <span style={{ color: 'var(--atencao)' }}>— não vinculado —</span>)}
                    </td>
                    <td style={{ color: u.ativo ? 'var(--sucesso)' : 'var(--tinta-3)' }}>{u.ativo ? 'Ativo' : 'Inativo'}</td>
                    <td className="acoes">
                      <div style={{ display: 'inline-flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {editando ? (
                          <>
                            <IconBtn icon={Check} title="Salvar alterações" loading={ocupado} disabled={ocupado} onClick={() => chamar('PATCH', { id: u.id, role, at_colaborador_id: vinculo || null })} />
                            <IconBtn icon={X} title="Cancelar" disabled={ocupado} onClick={() => setEditId(null)} />
                          </>
                        ) : (
                          <>
                            <IconBtn icon={Pencil} title="Editar papel e vínculo" disabled={ocupado} onClick={() => abrirEdicao(u)} />
                            <IconBtn icon={KeyRound} title="Redefinir senha — gera um link para a pessoa criar uma nova senha" loading={gerandoId === u.id} disabled={ocupado || gerandoId === u.id} onClick={() => gerarLinkSenha(u)} />
                            <IconBtn icon={Power} title={u.ativo ? 'Desativar acesso' : 'Ativar acesso'} classe={u.ativo ? 'inativar' : 'ativar'} disabled={ocupado} onClick={() => chamar('PATCH', { id: u.id, ativo: !u.ativo })} />
                            {!souEu && (
                              <IconBtn icon={Trash2} title="Excluir acesso" classe="inativar" disabled={ocupado} onClick={async () => { if (await confirmar({ titulo: 'Excluir acesso', mensagem: `O acesso de ${u.nome} será excluído e a pessoa perde o login no sistema. Isso não pode ser desfeito.`, confirmar: 'Excluir acesso', perigo: true })) chamar('DELETE', { id: u.id }) }} />
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

/** Botão de ação só com ícone (dica ao passar o mouse e nome para o leitor de tela). */
function IconBtn({ icon: Icon, title, onClick, disabled, loading, classe }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  classe?: string
}) {
  return (
    <button type="button" className={`botao-icone ${classe ?? ''}`} title={title} aria-label={title} onClick={onClick} disabled={disabled}>
      {loading ? <Loader2 className="icone icone-p animate-spin" /> : <Icon className="icone icone-p" />}
    </button>
  )
}
