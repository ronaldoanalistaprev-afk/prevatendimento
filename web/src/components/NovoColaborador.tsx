'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Loader2, Eye, EyeOff, ChevronDown, Check, AlertCircle, Eraser } from 'lucide-react'
import { tecladoFormulario } from '@/lib/formulario'
import { formatarNome } from '@/lib/utils'
import { useConfirmacao } from './Confirmacao'
import { useAvisoPe } from './AvisoPe'

export interface PapelOpcao {
  codigo: string
  nome: string
  /** Vê só as próprias conversas: para esses, vincular o atendente é importante. */
  soAsSuas: boolean
}

/** Mesma regra de senha de Nova senha e Minha conta (auditoria K1). */
const SENHA_MINIMA = 8
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Campo = 'nome' | 'email' | 'senha'

function validar(campo: Campo, valor: string): string | null {
  const v = valor.trim()
  if (campo === 'nome') return v ? null : 'Informe o nome completo.'
  if (campo === 'email') {
    if (!v) return 'Informe o e-mail que a pessoa vai usar para entrar.'
    return EMAIL_OK.test(v) ? null : 'E-mail incompleto. Confira se tem o @ e o domínio (ex.: nome@escritorio.com.br).'
  }
  if (!valor) return 'Crie uma senha inicial.'
  return valor.length >= SENHA_MINIMA ? null : `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres (faltam ${SENHA_MINIMA - valor.length}).`
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
  const { confirmar, modal } = useConfirmacao()
  const { avisar } = useAvisoPe()
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [role, setRole] = useState('COLABORADOR')
  const [atColaboradorId, setAtColaboradorId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [tocado, setTocado] = useState<Record<Campo, boolean>>({ nome: false, email: false, senha: false })
  const refs = { nome: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), senha: useRef<HTMLInputElement>(null) }

  const valores: Record<Campo, string> = { nome, email, senha }
  const erros: Record<Campo, string | null> = { nome: validar('nome', nome), email: validar('email', email), senha: validar('senha', senha) }
  const mostrar = (c: Campo) => (tocado[c] ? erros[c] : null)
  const preenchido = Boolean(nome.trim() || email.trim() || senha || atColaboradorId || role !== 'COLABORADOR')

  function limpar() {
    setNome(''); setEmail(''); setSenha(''); setRole('COLABORADOR'); setAtColaboradorId('')
    setTocado({ nome: false, email: false, senha: false }); setErro(null)
  }

  async function cancelar() {
    if (preenchido && !(await confirmar({ titulo: 'Descartar o cadastro?', mensagem: 'O que você preencheu ainda não foi salvo e será perdido.', confirmar: 'Descartar', cancelar: 'Continuar preenchendo', perigo: true }))) return
    limpar(); setAberto(false)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setTocado({ nome: true, email: true, senha: true })
    const primeiroErro = (['nome', 'email', 'senha'] as Campo[]).find((c) => erros[c])
    if (primeiroErro) { refs[primeiroErro].current?.focus(); return }
    setSalvando(true)
    setErro(null)
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), email: email.trim(), senha, role, at_colaborador_id: atColaboradorId || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.erro ?? 'Não foi possível cadastrar. Tente de novo.')
      avisar({ texto: `${formatarNome(nome)} cadastrado. Já pode entrar com o e-mail e a senha criados.` })
      limpar()
      setAberto(false)
      router.refresh()
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  if (!aberto) {
    return (
      <>
        <button type="button" onClick={() => setAberto(true)} disabled={desabilitado} className="botao botao-principal" aria-describedby={desabilitado ? 'cadastro-desligado' : undefined}>
          <UserPlus className="icone icone-p" aria-hidden="true" focusable="false" /> Cadastrar colaborador
        </button>
        {desabilitado && <p id="cadastro-desligado" className="ajuda" style={{ marginTop: 6 }}>O cadastro de logins ainda não está liberado (veja o aviso acima).</p>}
      </>
    )
  }

  const soAsSuas = papeis.find((p) => p.codigo === role)?.soAsSuas

  /** Campo de texto com nome visível, erro junto do campo e aria-invalid (Regras 10, 18, 19 e 51). */
  const campoTexto = (c: Campo, rotulo: string, extra: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="campo">
      <label className="rotulo" htmlFor={`novo-colab-${c}`}>{rotulo} <span className="obrig" aria-hidden="true">*</span></label>
      <input
        ref={refs[c]}
        id={`novo-colab-${c}`}
        className="entrada"
        value={valores[c]}
        aria-required="true"
        aria-invalid={Boolean(mostrar(c))}
        aria-describedby={mostrar(c) ? `novo-colab-${c}-erro` : undefined}
        onBlur={() => setTocado((t) => ({ ...t, [c]: true }))}
        {...extra}
      />
      {mostrar(c) && <span className="erro-campo" id={`novo-colab-${c}-erro`}><AlertCircle className="icone" aria-hidden="true" focusable="false" />{mostrar(c)}</span>}
    </div>
  )

  return (
    <form onSubmit={salvar} onKeyDown={tecladoFormulario} noValidate className="cartao" style={{ padding: 20 }} aria-labelledby="novo-colab-titulo">
      {modal}
      <h2 className="cartao-titulo" id="novo-colab-titulo" style={{ marginBottom: 4 }}>Cadastrar colaborador</h2>
      <p className="ajuda" style={{ marginBottom: 14 }}>Campos com <span className="obrig" style={{ color: 'var(--perigo)', fontWeight: 700 }}>*</span> são obrigatórios.</p>
      <div className="grade-campos">
        {campoTexto('nome', 'Nome completo', { autoComplete: 'off', onChange: (e) => setNome(e.target.value) })}
        {campoTexto('email', 'E-mail', { type: 'email', inputMode: 'email', autoComplete: 'off', onChange: (e) => setEmail(e.target.value) })}
        <div className="campo">
          <label className="rotulo" htmlFor="novo-colab-senha">Senha inicial <span className="obrig" aria-hidden="true">*</span></label>
          <div className="senha-caixa">
            <input
              ref={refs.senha}
              id="novo-colab-senha"
              className="entrada"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="new-password"
              value={senha}
              aria-required="true"
              aria-invalid={Boolean(mostrar('senha'))}
              aria-describedby={mostrar('senha') ? 'novo-colab-senha-erro' : 'novo-colab-senha-ajuda'}
              onChange={(e) => setSenha(e.target.value)}
              onBlur={() => setTocado((t) => ({ ...t, senha: true }))}
            />
            <button type="button" className="botao-icone" onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? 'Ocultar a senha' : 'Mostrar a senha'} title={mostrarSenha ? 'Ocultar a senha' : 'Mostrar a senha'}>
              {mostrarSenha ? <EyeOff className="icone icone-p" aria-hidden="true" focusable="false" /> : <Eye className="icone icone-p" aria-hidden="true" focusable="false" />}
            </button>
          </div>
          {mostrar('senha')
            ? <span className="erro-campo" id="novo-colab-senha-erro"><AlertCircle className="icone" aria-hidden="true" focusable="false" />{mostrar('senha')}</span>
            : <span className="ajuda" id="novo-colab-senha-ajuda">Pelo menos {SENHA_MINIMA} caracteres. A pessoa pode trocar depois em Minha conta.</span>}
        </div>
        <div className="campo">
          <label className="rotulo" htmlFor="novo-colab-papel">Papel <span className="obrig" aria-hidden="true">*</span></label>
          <div className="caixa-select">
            <select id="novo-colab-papel" className="entrada" value={role} onChange={(e) => setRole(e.target.value)}>
              {papeis.map((p) => (<option key={p.codigo} value={p.codigo}>{p.nome}</option>))}
            </select>
            <ChevronDown className="icone" aria-hidden="true" focusable="false" />
          </div>
        </div>
        <div className="campo inteiro">
          <label className="rotulo" htmlFor="novo-colab-atendente">Atendente no Multi360 <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>{soAsSuas ? '(recomendado)' : '(opcional)'}</span></label>
          <div className="caixa-select">
            <select
              id="novo-colab-atendente"
              className="entrada"
              value={atColaboradorId}
              onChange={(e) => {
                const id = e.target.value
                setAtColaboradorId(id)
                const at = atendentes.find((a) => a.id === id)
                if (at && !nome.trim()) setNome(formatarNome(at.nome))
              }}
            >
              <option value="">Não vincular</option>
              {atendentes.map((a) => (<option key={a.id} value={a.id}>{formatarNome(a.nome)}</option>))}
            </select>
            <ChevronDown className="icone" aria-hidden="true" focusable="false" />
          </div>
        </div>

        {erro && (
          <div className="aviso aviso-perigo inteiro" role="alert">
            <AlertCircle className="icone" aria-hidden="true" focusable="false" />
            <div>{erro}</div>
          </div>
        )}

        <div className="inteiro" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="submit" disabled={salvando} className="botao botao-principal">
            {salvando ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Check className="icone icone-p" aria-hidden="true" focusable="false" />} {salvando ? 'Salvando…' : 'Salvar colaborador'}
          </button>
          <button type="button" className="botao botao-secundario" onClick={cancelar} disabled={salvando}>Cancelar</button>
          <button type="button" className="botao botao-discreto" onClick={limpar} disabled={salvando || !preenchido}><Eraser className="icone icone-p" aria-hidden="true" focusable="false" /> Limpar</button>
        </div>
      </div>
    </form>
  )
}
