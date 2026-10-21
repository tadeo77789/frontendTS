import { renderHook } from '@testing-library/react-native';
import { useAchievementActivity } from '../useAchievementActivity';
import { api } from '../../services/api.client';
let mockToken='token-a';
let mockCurrent=true;
let mockPermissions: string[]=[];
jest.mock('../../../app/providers/AuthContext',()=>({useAuth:()=>({ token:mockToken,sessionGeneration:1,isSessionCurrent:()=>mockCurrent })}));
jest.mock('../../../app/providers/AccessContext',()=>({useAccess:()=>({permissions:mockPermissions,isLoading:false,error:false})}));
jest.mock('expo-crypto',()=>({randomUUID:()=> 'unique-session-123456'}));
jest.mock('../../services/api.client',()=>({api:{post:jest.fn()}}));

beforeEach(()=>{jest.clearAllMocks();mockToken='token-a';mockCurrent=true;mockPermissions=[];});
it('captures originating token and ignores a completion after session replacement',async()=>{
 let resolve!: (value: unknown)=>void;
 (api.post as jest.Mock).mockReturnValue(new Promise(r=>{resolve=r;}));
 const {result}=await renderHook(()=>useAchievementActivity());
 const pending=result.current.record({kind:'voice-start',translationId:1});
 expect(api.post).toHaveBeenCalledWith('/achievements/activity',expect.objectContaining({sessionId:'unique-session-123456'}),{headers:{Authorization:'Bearer token-a'}});
 mockToken='token-b';mockCurrent=false;
 resolve({data:{data:{playbackId:'old'}}});
 expect(await pending).toBeUndefined();
 expect(await result.current.record({kind:'voice-end'})).toBeUndefined();
 expect(api.post).toHaveBeenCalledTimes(1);
});
it('administrators do not produce activity',async()=>{
 mockPermissions=['users.manage'];
 const {result}=await renderHook(()=>useAchievementActivity());
 await result.current.record({kind:'letter',code:'LETTER_A'});
 expect(api.post).not.toHaveBeenCalled();
});
