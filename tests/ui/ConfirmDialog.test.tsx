import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../../src/ui/ConfirmDialog';

function renderDialog(over: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      open
      title="Zerar evento"
      message="Isso apaga tudo."
      confirmLabel="Zerar"
      requireText="ZERAR"
      danger
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...over}
    />,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('keeps confirm disabled until the exact text is typed', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderDialog();
    const confirm = screen.getByRole('button', { name: /^zerar$/i });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByRole('textbox'), 'zerar');
    expect(confirm).toBeDisabled(); // caixa diferente não vale

    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'ZERAR');
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('confirms right away when no text is required', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderDialog({ requireText: undefined, confirmLabel: 'Desfazer' });
    await user.click(screen.getByRole('button', { name: /^desfazer$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancels with the cancel button', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();
    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
