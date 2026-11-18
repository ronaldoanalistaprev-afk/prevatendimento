'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { tecladoFormulario } from '@/lib/formulario'
import { useAvisoPe } from '@/components/AvisoPe'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

const MINIMO = 8
const faltam = (n: number) => (n === 1 ? 'Falta 1 caractere.' : `Faltam ${n} caracteres.`)

/** Minha conta — a pessoa já logada troca a própria senha, sem depender de e-mail. */
export default function ContaPage() {
  const router = useRouter()
  const { avisar } = useAvisoPe()

  const [email, setEmail] = useState<string | null>(null)
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [tocado, setTocado] = useState<{ senha?: boolean; confirmacao?: boolean }>({})

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  // Validação junto do campo, enquanto digita (Regras 10, 18 e 19).
  const erroSenha = !senha ? 'Digite a nova senha.' : senha.length < MINIMO ? `A senha precisa ter pelo menos ${MINIMO} caracteres. ${faltam(MINIMO - senha.length)}` : null
  const erroConfirmacao = !confirmacao ? 'Repita a nova senha.' : confirmacao !== senha ? 'As duas senhas não são iguais.' : null
  const mostrarErroSenha = tocado.senha && erroSenha
  const mostrarErroConfirmacao = (tocado.confirmacao || (confirmacao.length > 0 && confirmacao.length >= senha.length)) && erroConfirmacao

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setTocado({ senha: true, confirmacao: true })
    if (erroSenha || erroConfirmacao) {
      document.getElementById(erroSenha ? 'conta-senha' : 'conta-senha-repetir')?.focus()
      return
    }
    setSalvando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvando(false)
    if (error) {
      const m = (error.message || '').toLowerCase()
      if (m.includes('should be different') || m.includes('same')) setErro('A nova senha precisa ser diferente da atual.')
      else if (m.includes('weak') || m.includes('pwned') || m.includes('leaked')) setErro('Essa senha é fácil de adivinhar ou já apareceu em vazamentos. Escolha outra.')
      else if (m.includes('at least') || m.includes('length')) setErro('A senha é curta demais. Use pelo menos 8 caracteres.')
      else setErro('Não foi possível trocar a senha agora. Tente de novo em instantes.')
      return
    }
    setSenha(''); setConfirmacao(''); setTocado({})
    avisar({ texto: 'Senha trocada. Use a nova senha no próximo acesso.' })
    router.refresh()
  }

  const botaoOlho = (
    <button type="button" className="botao-icone" onClick={() => setMostrar((v) => !v)} aria-label={mostrar ? 'Ocultar a senha' : 'Mostrar a senha'} aria-pressed={mostrar} title={mostrar ? 'Ocultar a senha' : 'Mostrar a senha'}>
      {mostrar ? <EyeOff className="icone icone-p" aria-hidden="true" focusable="false" /> : <Eye className="icone icone-p" aria-hidden="true" focusable="false" />}
    </button>
  )

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 520 }}>
      <h1 className="titulo" style={{ margin: '4px 0 4px' }}>Minha conta</h1>
      <p className="subtitulo" style={{ marginBottom: 22 }}>
        Troque a sua senha aqui, na hora — sem precisar de e-mail.
        {email ? <> Você está logado como <b style={{ color: 'var(--tinta)' }}>{email}</b>.</> : null}
      </p>

      <form onSubmit={handleSalvar} onKeyDown={tecladoFormulario} noValidate className="cartao" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="campo">
          <label className="rotulo" htmlFor="conta-senha">Nova senha <span className="obrig" aria-hidden="true">*</span></label>
          <div className="senha-caixa">
            <input
              id="conta-senha" className="entrada" type={mostrar ? 'text' : 'password'} value={senha}
              onChange={(e) => setSenha(e.target.value)} onBlur={() => setTocado((t) => ({ ...t, senha: true }))}
              autoComplete="new-password" aria-required="true"
              aria-invalid={mostrarErroSenha ? true : undefined} aria-describedby="conta-senha-ajuda"
            />
            {botaoOlho}
          </div>
          {mostrarErroSenha
            ? <p className="erro-campo" id="conta-senha-ajuda"><AlertCircle className="icone" aria-hidden="true" focusable="false" />{erroSenha}</p>
            : <p className="ajuda" id="conta-senha-ajuda">{senha.length >= MINIMO ? 'Tamanho certo.' : senha.length > 0 ? faltam(MINIMO - senha.length) : `Pelo menos ${MINIMO} caracteres.`}</p>}
        </div>

        <div className="campo">
          <label className="rotulo" htmlFor="conta-senha-repetir">Repita a nova senha <span className="obrig" aria-hidden="true">*</span></label>
          <div className="senha-caixa">
            <input
              id="conta-senha-repetir" className="entrada" type={mostrar ? 'text' : 'password'} value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)} onBlur={() => setTocado((t) => ({ ...t, confirmacao: true }))}
              autoComplete="new-password" aria-required="true"
              aria-invalid={mostrarErroConfirmacao ? true : undefined} aria-describedby={mostrarErroConfirmacao ? 'conta-senha-repetir-erro' : undefined}
            />
            {botaoOlho}
          </div>
          {mostrarErroConfirmacao && <p className="erro-campo" id="conta-senha-repetir-erro"><AlertCircle className="icone" aria-hidden="true" focusable="false" />{erroConfirmacao}</p>}
        </div>

        {erro && <div className="aviso aviso-perigo" role="alert"><AlertCircle className="icone" aria-hidden="true" focusable="false" /><div>{erro}</div></div>}

        <button type="submit" disabled={salvando} className="botao botao-principal">
          {salvando ? <><Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> Salvando…</> : 'Salvar nova senha'}
        </button>
      </form>
    </main>
  )
}
