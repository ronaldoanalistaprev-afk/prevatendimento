'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function handleEsqueciSenha() {
    setErro(null); setAviso(null)
    if (!email) {
      setErro('Digite seu e-mail acima e clique de novo em "Esqueci minha senha".')
      return
    }
    setCarregando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?type=recovery` })
    setCarregando(false)
    if (error) { setErro('Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos.'); return }
    setAviso('Enviamos um link para o seu e-mail. Abra e crie a nova senha.')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro(null); setCarregando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) { setErro('E-mail ou senha incorretos. Verifique e tente novamente.'); setCarregando(false); return }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div className="pagina-entrar">
      <div className="entrar">
        <div className="entrar-marca">
          <span className="marca-p" aria-hidden="true">A</span>
          <span><span className="marca-nome">PrevAtendimento</span><span className="marca-sub">Central de Atendimento — Aposentar</span></span>
        </div>
        <div className="entrar-cartao">
          <h1 className="titulo">Acesse sua conta</h1>
          <p className="texto-apoio" style={{ marginTop: 4 }}>Digite suas credenciais para continuar.</p>

          <form onSubmit={handleLogin}>
            <label className="campo">
              <span className="rotulo">E-mail</span>
              <input className="entrada" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required autoFocus />
            </label>

            <label className="campo">
              <span className="rotulo">Senha</span>
              <div className="senha-caixa">
                <input className="entrada" type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" required />
                <button type="button" className="botao-icone" onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? 'Ocultar a senha' : 'Mostrar a senha'} title={mostrarSenha ? 'Ocultar a senha' : 'Mostrar a senha'}>
                  {mostrarSenha ? <EyeOff className="icone icone-p" aria-hidden="true" focusable="false" /> : <Eye className="icone icone-p" aria-hidden="true" focusable="false" />}
                </button>
              </div>
            </label>

            {erro && <div className="aviso aviso-perigo">{erro}</div>}
            {aviso && <div className="aviso aviso-info">{aviso}</div>}

            <button type="submit" disabled={carregando} className="botao botao-principal">
              {carregando ? <><Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> Entrando…</> : 'Entrar no sistema'}
            </button>
            <button type="button" onClick={handleEsqueciSenha} disabled={carregando} className="link-discreto">Esqueci minha senha</button>
          </form>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18 }}>
          <ShieldCheck className="icone icone-p" style={{ color: 'var(--tinta-3)' }} aria-hidden="true" focusable="false" />
          <p style={{ fontSize: 'var(--t-pequeno)', color: 'var(--tinta-3)' }}>© 2026 SIAP — Acesso restrito e monitorado</p>
        </div>
      </div>
    </div>
  )
}
