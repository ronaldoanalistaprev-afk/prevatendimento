'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { tecladoFormulario } from '@/lib/formulario'
import { Eye, EyeOff, Loader2, KeyRound, CheckCircle2 } from 'lucide-react'

/** Minha conta — a pessoa já logada troca a própria senha, sem depender de e-mail. */
export default function ContaPage() {
  const router = useRouter()

  const [email, setEmail] = useState<string | null>(null)
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null); setOk(false)
    if (senha.length < 8) { setErro('A senha precisa ter pelo menos 8 caracteres.'); return }
    if (senha !== confirmacao) { setErro('As duas senhas não são iguais. Digite de novo.'); return }
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
    setSenha(''); setConfirmacao(''); setOk(true); router.refresh()
  }

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 520 }}>
      <h1 className="titulo" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 4px' }}>
        <KeyRound className="icone icone-g" style={{ color: 'var(--acao)' }} aria-hidden="true" focusable="false" /> Minha conta
      </h1>
      <p className="subtitulo" style={{ marginBottom: 22 }}>
        Troque a sua senha aqui, na hora — sem precisar de e-mail.
        {email ? <> Você está logado como <b style={{ color: 'var(--tinta)' }}>{email}</b>.</> : null}
      </p>

      <form onSubmit={handleSalvar} onKeyDown={tecladoFormulario} className="cartao" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label className="campo">
          <span className="rotulo">Nova senha</span>
          <div className="senha-caixa">
            <input className="entrada" type={mostrar ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Pelo menos 8 caracteres" autoComplete="new-password" required />
            <button type="button" className="botao-icone" onClick={() => setMostrar((v) => !v)} aria-label={mostrar ? 'Ocultar a senha' : 'Mostrar a senha'} title={mostrar ? 'Ocultar a senha' : 'Mostrar a senha'}>
              {mostrar ? <EyeOff className="icone icone-p" aria-hidden="true" focusable="false" /> : <Eye className="icone icone-p" aria-hidden="true" focusable="false" />}
            </button>
          </div>
        </label>

        <label className="campo">
          <span className="rotulo">Repita a nova senha</span>
          <div className="senha-caixa">
            <input className="entrada" type={mostrar ? 'text' : 'password'} value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} placeholder="Digite a mesma senha" autoComplete="new-password" required />
            <button type="button" className="botao-icone" onClick={() => setMostrar((v) => !v)} aria-label={mostrar ? 'Ocultar a senha' : 'Mostrar a senha'} title={mostrar ? 'Ocultar a senha' : 'Mostrar a senha'}>
              {mostrar ? <EyeOff className="icone icone-p" aria-hidden="true" focusable="false" /> : <Eye className="icone icone-p" aria-hidden="true" focusable="false" />}
            </button>
          </div>
        </label>

        {erro && <div className="aviso aviso-perigo">{erro}</div>}
        {ok && <div className="aviso aviso-info"><CheckCircle2 className="icone" aria-hidden="true" focusable="false" /><div>Senha trocada com sucesso. Use a nova senha no próximo acesso.</div></div>}

        <button type="submit" disabled={salvando} className="botao botao-principal" style={{ minHeight: 48 }}>
          {salvando ? <><Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> Salvando…</> : 'Salvar nova senha'}
        </button>
      </form>
    </main>
  )
}
