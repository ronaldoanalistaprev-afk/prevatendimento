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

  // O link do e-mail pode trazer a sessão no endereço (#access_token=...).
  // O cliente do Supabase lê isso sozinho; aqui só esperamos ele terminar.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setErro('Este link expirou ou já foi usado. Peça um novo link de recuperação.')
      }
      setPronto(true)
    })
  }, [])

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (senha.length < 8) {
      setErro('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmacao) {
      setErro('As duas senhas não são iguais. Digite de novo.')
      return
    }

    setCarregando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })

    if (error) {
      setErro('Não foi possível salvar a senha. O link pode ter expirado — peça um novo.')
      setCarregando(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f2236 0%, #1A3C5A 50%, #1e4d73 100%)' }}
    >
      <div
        className="absolute top-[-120px] right-[-120px] w-[400px] h-[400px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #16A34A, transparent)' }}
      />
      <div
        className="absolute bottom-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #4B7BA6, transparent)' }}
      />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5"
            style={{
              background: 'linear-gradient(135deg, #16A34A, #1A3C5A)',
              boxShadow: '0 8px 32px rgba(22, 163, 74, 0.4)',
            }}
          >
            <span className="text-white font-bold text-3xl tracking-tight">PA</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">PrevAtendimento</h1>
          <p className="text-blue-200 text-sm mt-2 opacity-80">
            Central de Atendimento Multicanal — Aposentar
          </p>
        </div>

        <div
          className="rounded-3xl p-8"
          style={{
            background: 'rgba(255, 255, 255, 0.97)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.35), 0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          <h2 className="text-xl font-bold mb-1" style={{ color: '#1A3C5A' }}>
            Criar nova senha
          </h2>
          <p className="text-sm text-gray-400 mb-7">
            Escolha uma senha com pelo menos 8 caracteres
          </p>

          <form onSubmit={handleSalvar} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: '#1A3C5A' }}>
                Nova senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-12 w-full px-4 pr-12 rounded-2xl border-2 text-sm outline-none transition-all"
                  style={{ borderColor: '#DCE6EF', background: '#F8FAFC', color: '#1A3C5A' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#16A34A')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#DCE6EF')}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#6B7280' }}
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: '#1A3C5A' }}>
                Repita a nova senha
              </label>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                placeholder="••••••••"
                required
                className="h-12 px-4 rounded-2xl border-2 text-sm outline-none transition-all"
                style={{ borderColor: '#DCE6EF', background: '#F8FAFC', color: '#1A3C5A' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#16A34A')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#DCE6EF')}
              />
            </div>

            {erro && (
              <div
                className="flex items-center gap-2 text-sm rounded-2xl px-4 py-3"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
              >
                <span>⚠</span>
                <span>{erro}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={carregando || !pronto}
              className="h-12 rounded-2xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 mt-1"
              style={{
                background: carregando || !pronto ? '#6B7280' : 'linear-gradient(135deg, #1A3C5A, #16A34A)',
                boxShadow: carregando || !pronto ? 'none' : '0 4px 16px rgba(22, 163, 74, 0.4)',
                cursor: carregando || !pronto ? 'not-allowed' : 'pointer',
              }}
            >
              {carregando ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar nova senha'
              )}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <ShieldCheck size={14} className="text-blue-300 opacity-60" />
          <p className="text-center text-xs text-blue-200 opacity-60">
            © 2026 SIAP — Acesso restrito e monitorado
          </p>
        </div>
      </div>
    </div>
  )
}
