import type { KeyboardEvent } from 'react'

/**
 * Teclado padrão dos formulários de cadastro/edição (Documento Mestre — Regra 55).
 *
 * Em cadastro/edição o Enter AVANÇA de campo e NÃO salva (evita salvar sem querer):
 *   - Enter num campo de texto  → vai para o próximo campo; no último, leva ao botão Salvar.
 *   - Enter num campo único      → executa (só um campo focável no formulário).
 *   - Ctrl+Enter (ou Cmd+Enter)  → salva de qualquer campo.
 *   - Enter numa textarea        → quebra linha (comportamento nativo).
 *   - Enter num botão/select     → comportamento nativo (o botão Salvar salva).
 *
 * NÃO use na tela de entrar nem em campo de busca: lá o Enter executa (comportamento nativo).
 * Uso: <form onSubmit={...} onKeyDown={tecladoFormulario}>.
 */
export function tecladoFormulario(e: KeyboardEvent<HTMLFormElement>): void {
  if (e.key !== 'Enter') return
  const alvo = e.target as HTMLElement
  const tag = alvo.tagName

  // Ctrl+Enter / Cmd+Enter: salva de qualquer campo.
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    e.currentTarget.requestSubmit()
    return
  }

  if (tag === 'TEXTAREA') return // Enter quebra linha
  if (tag !== 'INPUT') return    // botão, select etc.: comportamento nativo

  const tipo = (alvo as HTMLInputElement).type
  // Em marcar/desmarcar, botão: Enter não avança (comportamento nativo).
  if (tipo === 'checkbox' || tipo === 'radio' || tipo === 'button' || tipo === 'submit') return

  // Campo de texto comum: Enter avança, não salva.
  e.preventDefault()
  const focaveis = obterFocaveis(e.currentTarget)
  if (focaveis.length <= 1) {
    e.currentTarget.requestSubmit() // campo único: Enter executa
    return
  }
  const i = focaveis.indexOf(alvo)
  if (i >= 0 && i < focaveis.length - 1) {
    focaveis[i + 1].focus()
  } else {
    // Último campo: leva ao botão Salvar (não salva; o Enter no botão é que salva).
    e.currentTarget.querySelector<HTMLElement>('[type="submit"]')?.focus()
  }
}

/** Campos focáveis do formulário, na ordem do documento, só os visíveis e habilitados. */
function obterFocaveis(form: HTMLFormElement): HTMLElement[] {
  const seletor = 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
  return Array.from(form.querySelectorAll<HTMLElement>(seletor)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  )
}
