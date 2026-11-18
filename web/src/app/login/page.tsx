'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from 'lucide-react'

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  // Validação junto do campo (Regras 10, 18 e 19): aparece ao sair do campo e ao tentar entrar.
  const [tocado, setTocado] = useState<{ email?: boolean; senha?: boolean }>({})

  const erroEmail = !email.trim() ? 'Digite o seu e-mail.' : !EMAIL_OK.test(email.trim()) ? 'Confira o e-mail: falta o @ ou o domínio (ex.: nome@aposentar.com.br).' : null
  const erroSenha = !senha ? 'Digite a sua senha.' : null

  async function handleEsqueciSenha() {
    setErro(null); setAviso(null)
    if (erroEmail) {
      setTocado((t) => ({ ...t, email: true }))
      setErro('Para receber o link, digite o seu e-mail acima e clique de novo em "Esqueci minha senha".')
      return
    }
    setCarregando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?type=recovery` })
    setCarregando(false)
    if (error) { setErro('Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos.'); return }
    setAviso('Enviamos um link para o seu e-mail. Abra e crie a nova senha.')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro(null); setAviso(null)
    setTocado({ email: true, senha: true })
    if (erroEmail || erroSenha) {
      document.getElementById(erroEmail ? 'entrar-email' : 'entrar-senha')?.focus()
      return
    }
    setCarregando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    if (error) { setErro('E-mail ou senha incorretos. Verifique e tente novamente.'); setCarregando(false); return }
    router.push('/dashboard'); router.refresh()
  }

  const mostrarErroEmail = tocado.email && erroEmail
  const mostrarErroSenha = tocado.senha && erroSenha

  return (
    <div className="pagina-entrar">
      <main className="entrar">
        <div className="entrar-marca">
          <span className="marca-p" aria-hidden="true">A</span>
          <span><span className="marca-nome">PrevAtendimento</span><span className="marca-sub">Central de Atendimento — Aposentar</span></span>
        </div>
        <div className="entrar-cartao">
          <h1 className="titulo">Acesse sua conta</h1>
          <p className="texto-apoio" style={{ marginTop: 4 }}>Digite o seu e-mail e a sua senha para continuar.</p>

          <form onSubmit={handleLogin} noValidate>
            <div className="campo">
              <label className="rotulo" htmlFor="entrar-email">E-mail</label>
              <input
                id="entrar-email" className="entrada" type="email" inputMode="email" autoComplete="username"
                value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTocado((t) => ({ ...t, email: true }))}
                placeholder="seu@email.com" autoFocus
                aria-invalid={mostrarErroEmail ? true : undefined} aria-describedby={mostrarErroEmail ? 'entrar-email-erro' : undefined}
              />
              {mostrarErroEmail && <p className="erro-campo" id="entrar-email-erro"><AlertCircle className="icone" aria-hidden="true" focusable="false" />{erroEmail}</p>}
            </div>

            <div className="campo">
              <label className="rotulo" htmlFor="entrar-senha">Senha</label>
              <div className="senha-caixa">
                <input
                  id="entrar-senha" className="entrada" type={mostrarSenha ? 'text' : 'password'} autoComplete="current-password"
                  value={senha} onChange={(e) => setSenha(e.target.value)} onBlur={() => setTocado((t) => ({ ...t, senha: true }))}
                  aria-invalid={mostrarErroSenha ? true : undefined} aria-describedby={mostrarErroSenha ? 'entrar-senha-erro' : undefined}
                />
                <button type="button" className="botao-icone" onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? 'Ocultar a senha' : 'Mostrar a senha'} aria-pressed={mostrarSenha} title={mostrarSenha ? 'Ocultar a senha' : 'Mostrar a senha'}>
                  {mostrarSenha ? <EyeOff className="icone icone-p" aria-hidden="true" focusable="false" /> : <Eye className="icone icone-p" aria-hidden="true" focusable="false" />}
                </button>
              </div>
              {mostrarErroSenha && <p className="erro-campo" id="entrar-senha-erro"><AlertCircle className="icone" aria-hidden="true" focusable="false" />{erroSenha}</p>}
            </div>

            {erro && <div className="aviso aviso-perigo" role="alert"><AlertCircle className="icone" aria-hidden="true" focusable="false" /><div>{erro}</div></div>}
            {aviso && <div className="aviso aviso-info" role="status">{aviso}</div>}

            <button type="submit" disabled={carregando} className="botao botao-principal">
              {carregando ? <><Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> Entrando…</> : 'Entrar no sistema'}
            </button>
            <button type="button" onClick={handleEsqueciSenha} disabled={carregando} className="link-discreto" style={{ background: 'none', border: 0, padding: '0 8px', color: 'var(--acao)', cursor: 'pointer', borderRadius: 8 }}>Esqueci minha senha</button>
          </form>
        </div>

        <p className="ajuda" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18 }}>
          <ShieldCheck className="icone icone-p" aria-hidden="true" focusable="false" />
          © 2026 SIAP — Acesso restrito e monitorado
        </p>
      </main>
    </div>
  )
}
