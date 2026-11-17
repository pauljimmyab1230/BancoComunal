import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExportMenu from './ExportMenu'

describe('ExportMenu', () => {
  it('abre el menú y exporta en CSV', async () => {
    const usuario = userEvent.setup()
    const alExportar = vi.fn()
    render(<ExportMenu onExportar={alExportar} />)

    await usuario.click(screen.getByRole('button', { name: /exportar/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await usuario.click(screen.getByRole('menuitem', { name: /csv/i }))
    expect(alExportar).toHaveBeenCalledWith('csv')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('cierra el menú con la tecla Escape', async () => {
    const usuario = userEvent.setup()
    render(<ExportMenu onExportar={vi.fn()} />)

    await usuario.click(screen.getByRole('button', { name: /exportar/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await usuario.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('expone el estado del menú con aria-expanded', async () => {
    const usuario = userEvent.setup()
    render(<ExportMenu onExportar={vi.fn()} />)

    const boton = screen.getByRole('button', { name: /exportar/i })
    expect(boton).toHaveAttribute('aria-expanded', 'false')

    await usuario.click(boton)
    expect(boton).toHaveAttribute('aria-expanded', 'true')
  })
})
