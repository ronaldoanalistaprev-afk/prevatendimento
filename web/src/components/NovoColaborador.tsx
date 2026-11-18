'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Loader2, Eye, EyeOff, ChevronDown, Check } from 'lucide-react'
import { tecladoFormulario } from '@/lib/formulario'

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
  const [mostrarSenha, setMostrarSenha] = useState(false)
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
      setNome(''); setEmail(''); setSenha(''); setRole('COLABORADOR'); setAtColaboradorId('')
      router.refresh()
    } catch (err) {
      setMsg({ tipo: 'erro', texto: (err as Error).message })
    } finally {
      setSalvando(false)
    }
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} disabled={desabilitado} className="botao botao-principal" aria-disabled={desabilitado}>
        <UserPlus className="icone icone-p" aria-hidden="true" focusable="false" /> Cadastrar colaborador
      </button>
    )
  }

  const soAsSuas = papeis.find((p) => p.codigo === role)?.soAsSuas

  return (
    <form onSubmit={salvar} onKeyDown={tecladoFormulario} className="cartao" style={{ padding: 20 }}>
      <div className="cartao-titulo" style={{ marginBottom: 14 }}>Cadastrar colaborador</div>
      <div className="grade-campos">
        <label className="campo">
          <span className="rotulo">Nome completo</span>
          <input className="entrada" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>
        <label className="campo">
          <span className="rotulo">E-mail</span>
          <input className="entrada" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="campo">
          <span className="rotulo">Senha <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>(mín. 6)</span></span>
          <div className="senha-caixa">
            <input className="entrada" type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} required />
            <button type="button" className="botao-icone" onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? 'Ocultar a senha' : 'Mostrar a senha'} title={mostrarSenha ? 'Ocultar a senha' : 'Mostrar a senha'}>
              {mostrarSenha ? <EyeOff className="icone icone-p" aria-hidden="true" focusable="false" /> : <Eye className="icone icone-p" aria-hidden="true" focusable="false" />}
            </button>
          </div>
        </label>
        <label className="campo">
          <span className="rotulo">Papel</span>
          <div className="caixa-select">
            <select className="entrada" value={role} onChange={(e) => setRole(e.target.value)}>
              {papeis.map((p) => (<option key={p.codigo} value={p.codigo}>{p.nome}</option>))}
            </select>
            <ChevronDown className="icone" aria-hidden="true" focusable="false" />
          </div>
        </label>
        <label className="campo inteiro">
          <span className="rotulo">Atendente no Multi360 <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>{soAsSuas ? '(recomendado)' : '(opcional)'}</span></span>
          <div className="caixa-select">
            <select
              className="entrada"
              value={atColaboradorId}
              onChange={(e) => {
                const id = e.target.value
                setAtColaboradorId(id)
                const at = atendentes.find((a) => a.id === id)
                if (at && !nome.trim()) setNome(at.nome)
              }}
            >
              <option value="">— não vincular —</option>
              {atendentes.map((a) => (<option key={a.id} value={a.id}>{a.nome}</option>))}
            </select>
            <ChevronDown className="icone" aria-hidden="true" focusable="false" />
          </div>
        </label>

        {msg && (
          <div className={`aviso ${msg.tipo === 'ok' ? 'aviso-info' : 'aviso-perigo'} inteiro`} style={{ gridColumn: '1 / -1' }}>
            {msg.tipo === 'ok' && <Check className="icone" aria-hidden="true" focusable="false" />}
            <div>{msg.texto}</div>
          </div>
        )}

        <div className="inteiro" style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
          <button type="submit" disabled={salvando} className="botao botao-principal">
            {salvando ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Check className="icone icone-p" aria-hidden="true" focusable="false" />} Salvar colaborador
          </button>
          <button type="button" className="botao botao-secundario" onClick={() => { setAberto(false); setMsg(null) }}>Cancelar</button>
        </div>
      </div>
    </form>
  )
}
