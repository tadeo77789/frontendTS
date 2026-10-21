/**
 * Version para iOS/Android: la pagina embebida solo existe en web, que es lo
 * que abre el WebView. Metro toma `WordEngineEmbed.web.tsx` en web.
 */

import type React from 'react';

export const isWordEngineEmbed = (): boolean => false;

export const WordEngineEmbed: React.FC = () => null;
