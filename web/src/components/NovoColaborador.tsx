'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Loader2 } from 'lucide-react'

export interface PapelOpcao {
  codigo: string
  nome: string
  /** Vê só as próprias conversas: para esses, vincular o atendente é importante. */
  soAsSuas: boolean
}

export default function NovoColaborador({
  desabilitado,
  atendentes = [],
  papeis = [],
}: {
  desabilitado?: boolean
  atendentes?: { id: string; nome: string }[]
  papeis?: PapelOpcao[]
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState('COLABORADOR')
  const [atColaboradorId, setAtColaboradorId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setMsg(null)
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, role, at_colaborador_id: atColaboradorId || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.erro ?? 'Falha ao cadastrar')
      setMsg({ tipo: 'ok', texto: `${nome} cadastrado com sucesso.` })
      setNome('')
      setEmail('')
      setSenha('')
      setRole('COLABORADOR')
      setAtColaboradorId('')
      router.refresh()
    } catch (err) {
      setMsg({ tipo: 'erro', texto: (err as Error).message })
    } finally {
      setSalvando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    height: 44,
    padding: '0 14px',
    borderRadius: 12,
    border: '1px solid #DCE6EF',
    outline: 'none',
    fontSize: 14,
    background: '#fff',
    width: '100%',
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        disabled={desabilitado}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          height: 44,
          padding: '0 18px',
          borderRadius: 12,
          border: 'none',
          background: desabilitado ? '#9CA3AF' : 'linear-gradient(135deg, #1A3C5A, #16A34A)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 14,
          cursor: desabilitado ? 'not-allowed' : 'pointer',
        }}
      >
        <UserPlus size={18} /> Cadastrar colaborador
      </button>
    )
  }

  return (
    <form
      onSubmit={salvar}
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #EEF2F7',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        padding: 20,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14,
      }}
    >
      <div style={{ gridColumn: '1 / -1', fontWeight: 700, color: '#1A3C5A', fontSize: 15 }}>
        Cadastrar colaborador
      </div>

      <input style={inputStyle} placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} required />
      <input style={inputStyle} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input style={inputStyle} type="password" placeholder="Senha (mín. 6)" value={senha} onChange={(e) => setSenha(e.target.value)} required />
      <select style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)}>
        {papeis.map((p) => (
          <option key={p.codigo} value={p.codigo}>
            {p.nome}
          </option>
        ))}
      </select>

      {/* Vínculo com o atendente do Multi360 (essencial para o Colaborador ver só as dele) */}
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={{ fontSize: 12.5, color: '#6B7280', display: 'block', marginBottom: 4 }}>
          Atendente no Multi360 {papeis.find((p) => p.codigo === role)?.soAsSuas ? '(recomendado)' : '(opcional)'}
        </label>
        <select
          style={inputStyle}
          value={atColaboradorId}
          onChange={(e) => {
            const id = e.target.value
            setAtColaboradorId(id)
            // preenche o nome sozinho com o do atendente escolhido (se ainda vazio)
            const at = atendentes.find((a) => a.id === id)
            if (at && !nome.trim()) setNome(at.nome)
          }}
        >
          <option value="">— não vincular —</option>
          {atendentes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
      </div>

      {msg && (
        <div
          style={{
            gridColumn: '1 / -1',
            fontSize: 13,
            padding: '8px 12px',
            borderRadius: 10,
            background: msg.tipo === 'ok' ? '#DCFCE7' : '#FEF2F2',
            color: msg.tipo === 'ok' ? '#15803D' : '#B91C1C',
          }}
        >
          {msg.texto}
        </div>
      )}

      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
        <button
          type="submit"
          disabled={salvando}
          style={{
            height: 44,
            padding: '0 20px',
            borderRadius: 12,
            border: 'none',
            background: salvando ? '#6B7280' : 'linear-gradient(135deg, #1A3C5A, #16A34A)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: salvando ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {salvando ? <Loader2 size={16} className="animate-spin" /> : null}
          Salvar
        </button>
        <button
          type="button"
          onClick={() => {
            setAberto(false)
            setMsg(null)
          }}
          style={{
            height: 44,
            padding: '0 20px',
            borderRadius: 12,
            border: '1px solid #DCE6EF',
            background: '#fff',
            color: '#6B7280',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
