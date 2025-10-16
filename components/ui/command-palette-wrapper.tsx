'use client';

import { CommandPalette, useCommandPalette } from './command-palette';

export function CommandPaletteWrapper() {
  const { open, setOpen } = useCommandPalette();

  return <CommandPalette open={open} onOpenChange={setOpen} />;
}
