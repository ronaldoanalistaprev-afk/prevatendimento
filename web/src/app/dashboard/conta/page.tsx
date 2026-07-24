'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
    setErro(null)
    setOk(false)

    if (senha.length < 8) {
      setErro('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmacao) {
      setErro('As duas senhas não são iguais. Digite de novo.')
      return
    }

    setSalvando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvando(false)

    if (error) {
      const m = (error.message || '').toLowerCase()
      if (m.includes('should be different') || m.includes('same')) {
        setErro('A nova senha precisa ser diferente da atual.')
      } else if (m.includes('weak') || m.includes('pwned') || m.includes('leaked')) {
        setErro('Essa senha é fácil de adivinhar ou já apareceu em vazamentos. Escolha outra.')
      } else if (m.includes('at least') || m.includes('length')) {
        setErro('A senha é curta demais. Use pelo menos 8 caracteres.')
      } else {
        setErro('Não foi possível trocar a senha agora. Tente de novo em instantes.')
      }
      return
    }

    setSenha('')
    setConfirmacao('')
    setOk(true)
    router.refresh()
  }

  const campo: React.CSSProperties = {
    height: 48, width: '100%', padding: '0 44px 0 16px', borderRadius: 14,
    border: '2px solid #DCE6EF', background: '#F8FAFC', color: '#1A3C5A', fontSize: 14, outline: 'none',
  }
  const olho: React.CSSProperties = {
    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
    background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', display: 'flex',
  }

  return (
    <div style={{ padding: '28px 24px', maxWidth: 520, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A', display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 4px' }}>
        <KeyRound size={22} style={{ color: '#4B7BA6' }} /> Minha conta
      </h1>
      <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 22px' }}>
        Troque a sua senha aqui, na hora — sem precisar de e-mail.
        {email ? <> Você está logado como <b style={{ color: '#1A3C5A' }}>{email}</b>.</> : null}
      </p>

      <form
        onSubmit={handleSalvar}
        style={{ background: '#fff', border: '1px solid #EEF2F7', borderRadius: 16, padding: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 18 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13.5, fontWeight: 600, color: '#1A3C5A' }}>Nova senha</label>
          <div style={{ position: 'relative' }}>
            <input
              type={mostrar ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Pelo menos 8 caracteres"
              autoComplete="new-password"
              required
              style={campo}
            />
            <button type="button" onClick={() => setMostrar((v) => !v)} aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'} style={olho}>
              {mostrar ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13.5, fontWeight: 600, color: '#1A3C5A' }}>Repita a nova senha</label>
          <div style={{ position: 'relative' }}>
            <input
              type={mostrar ? 'text' : 'password'}
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              placeholder="Digite a mesma senha"
              autoComplete="new-password"
              required
              style={campo}
            />
            <button type="button" onClick={() => setMostrar((v) => !v)} aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'} style={olho}>
              {mostrar ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {erro && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, borderRadius: 12, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
            <span>⚠</span><span>{erro}</span>
          </div>
        )}
        {ok && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, borderRadius: 12, padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }}>
            <CheckCircle2 size={16} /><span>Senha trocada com sucesso. Use a nova senha no próximo acesso.</span>
          </div>
        )}

        <button
          type="submit"
          disabled={salvando}
          style={{
            height: 48, borderRadius: 14, color: '#fff', fontWeight: 700, fontSize: 14, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: salvando ? '#6B7280' : 'linear-gradient(135deg, #1A3C5A, #16A34A)',
            cursor: salvando ? 'not-allowed' : 'pointer',
          }}
        >
          {salvando ? (<><Loader2 size={16} className="animate-spin" /> Salvando...</>) : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  )
}
