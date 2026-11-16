'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Check, X, Power, Loader2, KeyRound, Copy } from 'lucide-react'

interface UsuarioLinha {
  id: string
  nome: string
  email: string
  role: string
  ativo: boolean
  at_colaborador_id: string | null
  vinculoNome: string | null
}

/** Cores dos papéis de fábrica; papéis criados pelo admin usam o cinza padrão. */
const CORES: Record<string, { bg: string; fg: string }> = {
  ADMIN: { bg: '#FEE2E2', fg: '#B91C1C' },
  GESTOR: { bg: '#DBEAFE', fg: '#1D4ED8' },
  SUPERVISOR: { bg: '#F3E8FF', fg: '#7E22CE' },
  COLABORADOR: { bg: '#DCFCE7', fg: '#15803D' },
}
const COR_PADRAO = { bg: '#F1F5F9', fg: '#475569' }

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
  const [editId, setEditId] = useState<string | null>(null)
  const [role, setRole] = useState('COLABORADOR')
  const [vinculo, setVinculo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [gerandoId, setGerandoId] = useState<string | null>(null)
  const [linkReset, setLinkReset] = useState<{ nome: string; link: string } | null>(null)
  const [copiado, setCopiado] = useState(false)

  async function gerarLinkSenha(u: UsuarioLinha) {
    setGerandoId(u.id)
    setErro(null)
    setLinkReset(null)
    setCopiado(false)
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
    setEditId(u.id)
    setRole(u.role)
    setVinculo(u.at_colaborador_id ?? '')
    setErro(null)
  }

  async function chamar(method: string, corpo: Record<string, unknown>) {
    setOcupado(true)
    setErro(null)
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

  const selStyle: React.CSSProperties = { height: 34, padding: '0 8px', borderRadius: 8, border: '1px solid #DCE6EF', fontSize: 13, background: '#fff' }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', overflow: 'hidden', marginTop: 20 }}>
      {erro && <div style={{ background: '#FEF2F2', color: '#B91C1C', fontSize: 13, padding: '10px 20px' }}>{erro}</div>}
      {linkReset && (
        <div style={{ background: '#F0FDF4', borderBottom: '1px solid #BBF7D0', padding: '14px 20px' }}>
          <div style={{ fontSize: 13.5, color: '#15803D', fontWeight: 700, marginBottom: 8 }}>
            Link de senha para {linkReset.nome} — copie e envie para a pessoa (vale por 1 hora):
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              readOnly
              value={linkReset.link}
              onFocus={(e) => e.currentTarget.select()}
              style={{ flex: 1, minWidth: 240, height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #BBF7D0', background: '#fff', fontSize: 12.5, color: '#374151' }}
            />
            <button onClick={copiar} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 8, border: 'none', background: '#16A34A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Copy size={14} /> {copiado ? 'Copiado!' : 'Copiar'}
            </button>
            <button onClick={() => setLinkReset(null)} style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #DCE6EF', background: '#fff', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>
              Fechar
            </button>
          </div>
        </div>
      )}
      {usuarios.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Nenhum acesso cadastrado ainda.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 720 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', color: '#6B7280', textAlign: 'left' }}>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Nome</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>E-mail</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Papel</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Atendente vinculado</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const c = CORES[u.role] ?? COR_PADRAO
                const rotulo = papeis.find((p) => p.codigo === u.role)?.nome ?? u.role
                const editando = editId === u.id
                const souEu = u.id === meuId
                return (
                  <tr key={u.id} style={{ borderTop: '1px solid #F1F5F9', background: editando ? '#F8FAFC' : '#fff' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: '#1A3C5A' }}>{u.nome}</td>
                    <td style={{ padding: '12px 20px', color: '#374151' }}>{u.email}</td>
                    <td style={{ padding: '12px 20px' }}>
                      {editando ? (
                        <select value={role} onChange={(e) => setRole(e.target.value)} style={selStyle}>
                          {papeis.map((p) => (
                            <option key={p.codigo} value={p.codigo}>
                              {p.nome}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: c.bg, color: c.fg }}>{rotulo}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 20px', color: '#374151', fontSize: 12.5 }}>
                      {editando ? (
                        <select value={vinculo} onChange={(e) => setVinculo(e.target.value)} style={selStyle}>
                          <option value="">— não vincular —</option>
                          {atendentes.map((a) => (
                            <option key={a.id} value={a.id}>{a.nome}</option>
                          ))}
                        </select>
                      ) : (
                        u.vinculoNome ?? <span style={{ color: '#C2410C' }}>— não vinculado —</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 20px', color: u.ativo ? '#15803D' : '#9CA3AF' }}>{u.ativo ? 'Ativo' : 'Inativo'}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {editando ? (
                          <>
                            <IconBtn icon={Check} title="Salvar alterações" cor="#15803D" borderCor="#BBF7D0" loading={ocupado} disabled={ocupado} onClick={() => chamar('PATCH', { id: u.id, role, at_colaborador_id: vinculo || null })} />
                            <IconBtn icon={X} title="Cancelar" cor="#6B7280" disabled={ocupado} onClick={() => setEditId(null)} />
                          </>
                        ) : (
                          <>
                            <IconBtn icon={Pencil} title="Editar papel e vínculo" cor="#1A3C5A" disabled={ocupado} onClick={() => abrirEdicao(u)} />
                            <IconBtn icon={KeyRound} title="Redefinir senha — gera um link para a pessoa criar uma nova senha" cor="#4B7BA6" loading={gerandoId === u.id} disabled={ocupado || gerandoId === u.id} onClick={() => gerarLinkSenha(u)} />
                            <IconBtn icon={Power} title={u.ativo ? 'Desativar acesso' : 'Ativar acesso'} cor={u.ativo ? '#B45309' : '#15803D'} disabled={ocupado} onClick={() => chamar('PATCH', { id: u.id, ativo: !u.ativo })} />
                            {!souEu && (
                              <IconBtn icon={Trash2} title="Excluir acesso" cor="#B91C1C" borderCor="#FECACA" disabled={ocupado} onClick={() => { if (confirm(`Excluir o acesso de ${u.nome}?`)) chamar('DELETE', { id: u.id }) }} />
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
    </div>
  )
}

/** Botão de ação compacto (só ícone, com dica ao passar o mouse). Deixa a coluna alinhada. */
function IconBtn({
  icon: Icon,
  title,
  cor,
  borderCor = '#DCE6EF',
  onClick,
  disabled,
  loading,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  cor: string
  borderCor?: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        border: `1px solid ${borderCor}`,
        background: '#fff',
        color: cor,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'wait' : 'pointer',
        flexShrink: 0,
        transition: 'background 0.12s',
      }}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />}
    </button>
  )
}
