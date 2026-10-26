import { dailyChallengeService, parseDailyChallenge } from '../services/dailyChallenge.service';
import { api } from '../../../shared/services/api.client';
import { ENDPOINTS } from '../../../app/config/api.config';
jest.mock('../../../shared/services/api.client', () => ({ api: { get: jest.fn() } }));
const challenge = { challengeId:'id', code:'TRANSLATE_1', name:'Saved', description:'Confirmed saved translation', targetCount:1, currentCount:0, points:5, completed:false, completedAt:null, date:'2026-10-25' };
it('usa ENDPOINTS, token explícito y cancelación; contrato success/data', async () => {
  const controller = new AbortController();
  (api.get as jest.Mock).mockResolvedValue({ data: { success:true,data:challenge } });
  expect(await dailyChallengeService.today('origin',controller.signal)).toEqual(challenge);
  expect(api.get).toHaveBeenCalledWith(ENDPOINTS.dailyChallenge,{ headers:{ Authorization:'Bearer origin' },signal:controller.signal });
  expect(parseDailyChallenge({ success:true,data:null })).toBeNull();
});
it.each([{}, { data:challenge }, { success:true }, { success:true,data:{ ...challenge,currentCount:2 } },
  { success:true,data:{ ...challenge,completed:true } }, { success:true,data:{ ...challenge,points:-1 } }])('rechaza respuesta inválida %j', response => {
  expect(() => parseDailyChallenge(response)).toThrow();
});
