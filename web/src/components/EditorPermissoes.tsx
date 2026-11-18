'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, RotateCcw, AlertCircle, TriangleAlert } from 'lucide-react'
import { TELAS } from '@/lib/telas'
import { useConfirmacao } from './Confirmacao'
import { useAvisoPe } from './AvisoPe'

export interface PapelColuna {
  codigo: string
  nome: string
}

type Matriz = Record<string, Record<string, boolean>>

function montar(atual: Record<string, string[]>, papeis: PapelColuna[]): Matriz {
  const m: Matriz = {}
  for (const t of TELAS) {
    m[t.chave] = {}
    for (const p of papeis) m[t.chave][p.codigo] = (atual[t.chave] ?? []).includes(p.codigo)
  }
  return m
}

function contarDiferencas(a: Matriz, b: Matriz, papeis: PapelColuna[]): number {
  let n = 0
  for (const t of TELAS) for (const p of papeis) if (Boolean(a[t.chave]?.[p.codigo]) !== Boolean(b[t.chave]?.[p.codigo])) n++
  return n
}

/**
 * Editor da matriz de permissões (papel × tela). Só o Admin usa.
 * As colunas são os papéis vindos de Configurações → Papéis (o ADMIN fica de fora: vê tudo sempre).
 *
 * Documento Mestre: Regra 27 ("Desfazer alterações" na edição), Regra 30 (aviso de dados não salvos
 * ao sair), Regra 43 item 2 / Regra 50 (aviso de sucesso com Desfazer), Regras 46/47 (toque de 44 px,
 * tabela que vira cartão no celular).
 */
export default function EditorPermissoes({ atual, papeis }: { atual: Record<string, string[]>; papeis: PapelColuna[] }) {
  const router = useRouter()
  const { confirmar, modal } = useConfirmacao()
  const { avisar } = useAvisoPe()
  const [salvo, setSalvo] = useState<Matriz>(() => montar(atual, papeis))
  const [matriz, setMatriz] = useState<Matriz>(() => montar(atual, papeis))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const mudancas = useMemo(() => contarDiferencas(matriz, salvo, papeis), [matriz, salvo, papeis])
  const sujo = mudancas > 0

  function alternar(tela: string, papel: string) {
    setMatriz((m) => ({ ...m, [tela]: { ...m[tela], [papel]: !m[tela][papel] } }))
    setErro(null)
  }

  // Sair com mudanças não salvas pergunta antes (fechar a aba, recarregar ou clicar num link do sistema).
  useEffect(() => {
    if (!sujo) return
    function antesDeSair(e: BeforeUnloadEvent) { e.preventDefault(); e.returnValue = '' }
    function aoClicar(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return
      e.preventDefault()
      e.stopPropagation()
      confirmar({
        titulo: 'Sair sem salvar as permissões?',
        mensagem: `Há ${mudancas} ${mudancas === 1 ? 'mudança' : 'mudanças'} na tabela que ainda não ${mudancas === 1 ? 'foi salva' : 'foram salvas'}. Se sair agora, elas se perdem.`,
        confirmar: 'Sair sem salvar',
        cancelar: 'Continuar aqui',
        perigo: true,
      }).then((ok) => { if (ok) router.push(url.pathname + url.search + url.hash) })
    }
    window.addEventListener('beforeunload', antesDeSair)
    document.addEventListener('click', aoClicar, true)
    return () => {
      window.removeEventListener('beforeunload', antesDeSair)
      document.removeEventListener('click', aoClicar, true)
    }
  }, [sujo, mudancas, confirmar, router])

  async function gravar(m: Matriz): Promise<boolean> {
    const itens: { tela: string; role: string; permitido: boolean }[] = []
    for (const t of TELAS) for (const p of papeis) itens.push({ tela: t.chave, role: p.codigo, permitido: Boolean(m[t.chave]?.[p.codigo]) })
    const res = await fetch('/api/permissoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itens }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.erro ?? 'Não foi possível salvar as permissões. Tente de novo.')
    return true
  }

  async function salvar() {
    if (!sujo) return
    setSalvando(true)
    setErro(null)
    const anterior = salvo
    const novo = matriz
    try {
      await gravar(novo)
      setSalvo(novo)
      router.refresh()
      avisar({
        texto: 'Permissões salvas. O menu de cada papel já mudou.',
        desfazer: async () => {
          try {
            await gravar(anterior)
            setSalvo(anterior); setMatriz(anterior)
            router.refresh()
            avisar({ texto: 'Permissões voltaram ao que eram.' })
          } catch (e) {
            setErro((e as Error).message)
          }
        },
      })
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  async function desfazerAlteracoes() {
    if (!(await confirmar({ titulo: 'Desfazer as alterações?', mensagem: `A tabela volta a ficar como está salva (${mudancas} ${mudancas === 1 ? 'mudança será descartada' : 'mudanças serão descartadas'}).`, confirmar: 'Desfazer alterações', cancelar: 'Manter', perigo: true }))) return
    setMatriz(salvo)
    setErro(null)
  }

  if (papeis.length === 0) {
    return (
      <div className="cartao"><div className="vazio">
        <div className="vazio-titulo">Nada para configurar ainda</div>
        <p className="vazio-texto">Só existe o papel Administrador, que vê tudo sempre. Crie outros papéis em Configurações › Papéis e eles aparecem aqui.</p>
      </div></div>
    )
  }

  return (
    <>
      {modal}
      <section className="cartao" aria-labelledby="perm-legenda">
        <p id="perm-legenda" className="texto-apoio" style={{ padding: '12px 16px 4px' }}>O Administrador sempre vê tudo e por isso não aparece na tabela.</p>
        <div className="tabela-caixa">
          <table className="tabela tabela-cartoes">
            <caption className="so-leitor">Marque quais papéis veem cada tela</caption>
            <thead>
              <tr>
                <th scope="col">Tela</th>
                {papeis.map((p) => (<th key={p.codigo} scope="col" style={{ textAlign: 'center' }}>{p.nome}</th>))}
              </tr>
            </thead>
            <tbody>
              {TELAS.map((t) => (
                <tr key={t.chave}>
                  <td className="nome" data-rotulo="Tela">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--tinta)' }}>{t.label}</div>
                      <div className="texto-apoio" style={{ fontWeight: 400 }}>{t.descricao}</div>
                    </div>
                  </td>
                  {papeis.map((p) => {
                    const marcado = matriz[t.chave]?.[p.codigo] ?? false
                    const mudou = marcado !== (salvo[t.chave]?.[p.codigo] ?? false)
                    return (
                      <td key={p.codigo} data-rotulo={p.nome} style={{ textAlign: 'center', background: mudou ? 'var(--atencao-suave)' : undefined }}>
                        {/* Alvo de toque de 44 px em volta da caixa (Regra 46; auditoria T3). */}
                        <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44, cursor: 'pointer', borderRadius: 'var(--raio-p)' }}>
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={() => alternar(t.chave, p.codigo)}
                            aria-label={`${p.nome} vê ${t.label}`}
                            style={{ width: 20, height: 20, margin: 0, cursor: 'pointer', accentColor: 'var(--acao)' }}
                          />
                          {mudou && <span className="so-leitor"> (alterado, ainda não salvo)</span>}
                        </label>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {erro && (
        <div className="aviso aviso-perigo" role="alert" style={{ marginTop: 12 }}>
          <AlertCircle className="icone" aria-hidden="true" focusable="false" />
          <div>{erro}</div>
        </div>
      )}

      {/* Barra de ações presa no pé (peça .barra-acoes da referência; auditoria G2). */}
      <div className="barra-acoes">
        <span role="status" className="texto-apoio" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {sujo
            ? <><TriangleAlert className="icone icone-p" style={{ color: 'var(--atencao)' }} aria-hidden="true" focusable="false" />{mudancas} {mudancas === 1 ? 'mudança não salva' : 'mudanças não salvas'}</>
            : 'Tudo salvo.'}
        </span>
        <div className="direita">
          <button type="button" className="botao botao-secundario" onClick={desfazerAlteracoes} disabled={!sujo || salvando}>
            <RotateCcw className="icone icone-p" aria-hidden="true" focusable="false" /> Desfazer alterações
          </button>
          <button type="button" className="botao botao-principal" onClick={salvar} disabled={!sujo || salvando}>
            {salvando ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Check className="icone icone-p" aria-hidden="true" focusable="false" />} {salvando ? 'Salvando…' : 'Salvar permissões'}
          </button>
        </div>
      </div>
    </>
  )
}
