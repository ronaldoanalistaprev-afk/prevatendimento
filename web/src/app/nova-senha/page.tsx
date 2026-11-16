'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

export default function NovaSenhaPage() {
  const router = useRouter()

  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const expirado = 'Este link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".'
    async function preparar() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      if (hash.get('error')) { setErro(expirado); setPronto(true); return }
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        window.history.replaceState(null, '', window.location.pathname)
        setErro(error ? expirado : null); setPronto(true); return
      }
      const { data } = await supabase.auth.getSession()
      if (!data.session) setErro(expirado)
      setPronto(true)
    }
    preparar()
  }, [])

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (senha.length < 8) { setErro('A senha precisa ter pelo menos 8 caracteres.'); return }
    if (senha !== confirmacao) { setErro('As duas senhas não são iguais. Digite de novo.'); return }
    setCarregando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) { setErro('Não foi possível salvar a senha. O link pode ter expirado — peça um novo.'); setCarregando(false); return }
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
          <h1 className="titulo">Criar nova senha</h1>
          <p className="texto-apoio" style={{ marginTop: 4 }}>Escolha uma senha com pelo menos 8 caracteres.</p>

          <form onSubmit={handleSalvar}>
            <label className="campo">
              <span className="rotulo">Nova senha</span>
              <div className="senha-caixa">
                <input className="entrada" type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" required autoFocus />
                <button type="button" className="botao-icone" onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? 'Ocultar a senha' : 'Mostrar a senha'}>
                  {mostrarSenha ? <EyeOff className="icone icone-p" aria-hidden="true" focusable="false" /> : <Eye className="icone icone-p" aria-hidden="true" focusable="false" />}
                </button>
              </div>
            </label>
            <label className="campo">
              <span className="rotulo">Repita a nova senha</span>
              <input className="entrada" type={mostrarSenha ? 'text' : 'password'} value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} placeholder="••••••••" required />
            </label>

            {erro && <div className="aviso aviso-perigo">{erro}</div>}

            <button type="submit" disabled={carregando || !pronto} className="botao botao-principal">
              {carregando ? <><Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> Salvando…</> : 'Salvar nova senha'}
            </button>
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
