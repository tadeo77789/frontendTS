import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DailyChallengeCard } from '../components/DailyChallengeCard';
import { useDailyChallenge } from '../hooks/useDailyChallenge';
import { ThemeProvider } from '../../../app/providers/ThemeContext';
import { LanguageProvider, useLanguage } from '../../../app/providers/LanguageContext';
import { useTheme } from '../../../app/providers/ThemeContext';
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('../../../shared/utils/dialogs', () => ({ setDialogPalette:jest.fn() }));
jest.mock('../hooks/useDailyChallenge', () => ({ useDailyChallenge:jest.fn() }));
const hook=useDailyChallenge as jest.Mock;
const retry=jest.fn();
const challenge={ challengeId:'id',code:'TRANSLATE_3',name:'Saved',description:'Confirmed',targetCount:3,currentCount:1,points:10,completed:false,completedAt:null,date:'2026-10-25' };
let applyLanguage: ReturnType<typeof useLanguage>['applyLanguage'];
let applyTheme: ReturnType<typeof useTheme>['applyTheme'];
function Settings() { applyLanguage=useLanguage().applyLanguage;applyTheme=useTheme().applyTheme; return <DailyChallengeCard />; }
const show=()=>render(<ThemeProvider><LanguageProvider><Settings /></LanguageProvider></ThemeProvider>);
beforeEach(()=>{jest.clearAllMocks();hook.mockReturnValue({ enabled:true,data:challenge,loading:false,error:false,retry });});
it.each([
  ['es','Reto del día','En progreso'],['en','Daily challenge','In progress'],['fr','Défi du jour','En cours'],['pt','Desafio do dia','Em andamento'],
] as const)('tarjeta accesible en %s, temas claro y oscuro',async(language,title,status)=>{
  const view=await show();
  await act(async()=>{applyLanguage(language);});
  expect(screen.getByText(title)).toBeTruthy();expect(screen.getByText(status)).toBeTruthy();
  const progress=screen.getByRole('progressbar');
  expect(progress.props.accessibilityValue).toEqual({min:0,max:3,now:1});
  const before=screen.getByTestId('daily-challenge-card').props.style;
  await act(async()=>{applyTheme('dark');});
  expect(screen.getByText(title)).toBeTruthy();expect(screen.getByTestId('daily-challenge-card').props.style).not.toEqual(before);
  await view.unmount();
});
it('muestra completado y puntos otorgados',async()=>{
  hook.mockReturnValue({enabled:true,data:{...challenge,currentCount:3,completed:true,reward:{points:7,grantedAt:'2026-10-25T12:00:00Z'}},loading:false,error:false,retry});
  await show();expect(screen.getByText('Completado')).toBeTruthy();expect(screen.getByText('7 puntos otorgados')).toBeTruthy();
});
it('carga, error con botón, reintento y ausencia de retos',async()=>{
  hook.mockReturnValue({enabled:true,data:null,loading:true,error:false,retry});
  const view=await show();expect(screen.getByLabelText('Cargando...')).toBeTruthy();
  hook.mockReturnValue({enabled:true,data:null,loading:false,error:true,retry});await view.rerender(<ThemeProvider><LanguageProvider><Settings /></LanguageProvider></ThemeProvider>);
  await fireEvent.press(screen.getByText('Reintentar'));expect(retry).toHaveBeenCalledTimes(1);
  hook.mockReturnValue({enabled:true,data:null,loading:false,error:false,retry});await view.rerender(<ThemeProvider><LanguageProvider><Settings /></LanguageProvider></ThemeProvider>);
  expect(screen.getByText('No hay retos activos para hoy.')).toBeTruthy();
});
it('sin elegibilidad oculta datos aunque el hook conserve un resultado',async()=>{
  hook.mockReturnValue({enabled:false,data:challenge,loading:false,error:false,retry});
  await show();expect(screen.queryByTestId('daily-challenge-card')).toBeNull();
});

it('no etiqueta como concedidos los puntos de una respuesta antigua sin recompensa confirmada',async()=>{
 hook.mockReturnValue({enabled:true,data:{...challenge,currentCount:3,completed:true},loading:false,error:false,retry});
 await show();expect(screen.queryByText('10 puntos otorgados')).toBeNull();
});
