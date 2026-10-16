import { passwordResetFlow } from '../passwordResetFlow';
import { pendingAuthFlow } from '../pendingAuthFlow';

const THIRTY_MINUTES = 30 * 60_000;

// Los dos flujos comparten contrato: estado solo en memoria que caduca a los 30 min.
const flows = [
  { name: 'pendingAuthFlow', flow: pendingAuthFlow, value: { mode: 'verify' as const, email: 'ana@x.com', password: 'Secreta1!' } },
  { name: 'passwordResetFlow', flow: passwordResetFlow, value: { email: 'ana@x.com', code: '123456' } },
];

describe.each(flows)('$name', ({ flow, value }) => {
  let now = 1_000_000;

  beforeEach(() => {
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    flow.clear();
  });

  afterEach(() => jest.restoreAllMocks());

  it('empieza vacío', () => {
    expect(flow.get()).toBeNull();
  });

  it('guarda el valor con la hora de creación', () => {
    flow.set(value as never);
    expect(flow.get()).toEqual({ ...value, createdAt: 1_000_000 });
  });

  it('update mezcla campos sin perder los anteriores', () => {
    flow.set(value as never);
    flow.update({ resendAvailableAt: 2_000_000 });
    expect(flow.get()).toMatchObject({ ...value, resendAvailableAt: 2_000_000 });
  });

  it('update sin flujo activo no crea uno', () => {
    flow.update({ resendAvailableAt: 2_000_000 });
    expect(flow.get()).toBeNull();
  });

  it('sigue disponible justo a los 30 minutos', () => {
    flow.set(value as never);
    now += THIRTY_MINUTES;
    expect(flow.get()).not.toBeNull();
  });

  it('caduca pasados los 30 minutos y no vuelve aunque el reloj retroceda', () => {
    flow.set(value as never);
    now += THIRTY_MINUTES + 1;
    expect(flow.get()).toBeNull();
    now = 1_000_000;
    expect(flow.get()).toBeNull();
  });

  it('clear borra el estado', () => {
    flow.set(value as never);
    flow.clear();
    expect(flow.get()).toBeNull();
  });
});
