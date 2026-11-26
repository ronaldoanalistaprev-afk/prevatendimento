'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, LinkIcon } from 'lucide-react'
import { tecladoFormulario } from '@/lib/formulario'

const MINIMO = 8
const faltam = (n: number) => (n === 1 ? 'Falta 1 caractere.' : `Faltam ${n} caracteres.`)

export default function NovaSenhaPage() {
  const router = useRouter()

  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pronto, setPronto] = useState(false)
  const [expirado, setExpirado] = useState(false)
  const [provisoria, setProvisoria] = useState(false)
  const [tocado, setTocado] = useState<{ senha?: boolean; confirmacao?: boolean }>({})

  useEffect(() => {
    const supabase = createClient()
    async function preparar() {
      // Primeiro acesso com senha provisória: a casca do painel manda para cá com ?provisoria=1.
      setProvisoria(new URLSearchParams(window.location.search).get('provisoria') === '1')
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      if (hash.get('error')) { setExpirado(true); setPronto(true); return }
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        window.history.replaceState(null, '', window.location.pathname)
        setExpirado(Boolean(error)); setPronto(true); return
      }
      const { data } = await supabase.auth.getSession()
      if (!data.session) setExpirado(true)
      setPronto(true)
    }
    preparar()
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
      document.getElementById(erroSenha ? 'nova-senha' : 'nova-senha-repetir')?.focus()
      return
    }
    setCarregando(true)
    if (provisoria) {
      // Primeiro acesso: o servidor troca a senha E apaga a marca de provisória, numa coisa só
      // (não dá para liberar o acesso sem trocar a senha de verdade).
      try {
        const res = await fetch('/api/conta/definir-minha-senha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha }) })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) { setErro(data?.erro ?? 'Não foi possível salvar a senha. Tente de novo.'); setCarregando(false); return }
      } catch {
        setErro('Não foi possível salvar a senha. Verifique a conexão e tente de novo.'); setCarregando(false); return
      }
    } else {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: senha })
      if (error) { setErro('Não foi possível salvar a senha. O link pode ter expirado — peça um novo na tela de entrar.'); setCarregando(false); return }
    }
    // O aviso do pé é mostrado pelo painel, logo que ele abrir (a tela de nova senha fica fora dele).
    try { sessionStorage.setItem('avisoPePendente', 'Nova senha salva. Use-a no próximo acesso.') } catch { /* segue sem o aviso */ }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div className="pagina-entrar">
      <main className="entrar">
        <div className="entrar-marca">
          <span className="marca-p" aria-hidden="true">A</span>
          <span><span className="marca-nome">PrevAtendimento</span><span className="marca-sub">Central de Atendimento — Aposentar</span></span>
        </div>

        {expirado ? (
          <div className="entrar-cartao">
            <div className="vazio" style={{ padding: 0 }}>
              <div className="vazio-icone"><LinkIcon className="icone" aria-hidden="true" focusable="false" /></div>
              <h1 className="titulo">Link expirado</h1>
              <p className="vazio-texto" role="alert">
                Este link para criar a senha venceu ou já foi usado. Por segurança, cada link vale uma vez só e por pouco tempo.
                Na tela de entrar, digite o seu e-mail e clique em &quot;Esqueci minha senha&quot; para receber um novo.
              </p>
              <Link href="/login" className="botao botao-principal" style={{ width: '100%' }}>Pedir um novo link</Link>
            </div>
          </div>
        ) : (
          <div className="entrar-cartao">
            <h1 className="titulo">{provisoria ? 'Crie a sua senha' : 'Criar nova senha'}</h1>
            <p className="texto-apoio" style={{ marginTop: 4 }}>
              {provisoria
                ? `Primeiro acesso: por segurança, defina a sua própria senha (pelo menos ${MINIMO} caracteres) para continuar.`
                : `Escolha uma senha com pelo menos ${MINIMO} caracteres.`}
            </p>

            <form onSubmit={handleSalvar} onKeyDown={tecladoFormulario} noValidate>
              <div className="campo">
                <label className="rotulo" htmlFor="nova-senha">Nova senha</label>
                <div className="senha-caixa">
                  <input
                    id="nova-senha" className="entrada" type={mostrarSenha ? 'text' : 'password'} autoComplete="new-password"
                    value={senha} onChange={(e) => setSenha(e.target.value)} onBlur={() => setTocado((t) => ({ ...t, senha: true }))} autoFocus
                    aria-invalid={mostrarErroSenha ? true : undefined} aria-describedby="nova-senha-ajuda"
                  />
                  <button type="button" className="botao-icone" onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? 'Ocultar a senha' : 'Mostrar a senha'} aria-pressed={mostrarSenha} title={mostrarSenha ? 'Ocultar a senha' : 'Mostrar a senha'}>
                    {mostrarSenha ? <EyeOff className="icone icone-p" aria-hidden="true" focusable="false" /> : <Eye className="icone icone-p" aria-hidden="true" focusable="false" />}
                  </button>
                </div>
                {mostrarErroSenha
                  ? <p className="erro-campo" id="nova-senha-ajuda"><AlertCircle className="icone" aria-hidden="true" focusable="false" />{erroSenha}</p>
                  : <p className="ajuda" id="nova-senha-ajuda">{senha.length >= MINIMO ? 'Tamanho certo.' : senha.length > 0 ? faltam(MINIMO - senha.length) : `Pelo menos ${MINIMO} caracteres.`}</p>}
              </div>
              <div className="campo">
                <label className="rotulo" htmlFor="nova-senha-repetir">Repita a nova senha</label>
                <input
                  id="nova-senha-repetir" className="entrada" type={mostrarSenha ? 'text' : 'password'} autoComplete="new-password"
                  value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} onBlur={() => setTocado((t) => ({ ...t, confirmacao: true }))}
                  aria-invalid={mostrarErroConfirmacao ? true : undefined} aria-describedby={mostrarErroConfirmacao ? 'nova-senha-repetir-erro' : undefined}
                />
                {mostrarErroConfirmacao && <p className="erro-campo" id="nova-senha-repetir-erro"><AlertCircle className="icone" aria-hidden="true" focusable="false" />{erroConfirmacao}</p>}
              </div>

              {erro && <div className="aviso aviso-perigo" role="alert"><AlertCircle className="icone" aria-hidden="true" focusable="false" /><div>{erro}</div></div>}

              <button type="submit" disabled={carregando || !pronto} className="botao botao-principal">
                {carregando
                  ? <><Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> Salvando…</>
                  : !pronto
                    ? <><Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> Conferindo o link…</>
                    : 'Salvar nova senha'}
              </button>
            </form>
          </div>
        )}

        <p className="ajuda" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18 }}>
          <ShieldCheck className="icone icone-p" aria-hidden="true" focusable="false" />
          © 2026 SIAP — Acesso restrito e monitorado
        </p>
      </main>
    </div>
  )
}
