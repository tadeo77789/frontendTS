import { beginVoicePlayback } from '../voicePlayback';
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
const setup=()=>({text:'Hola',language:'es-ES',translationId:1,record:jest.fn().mockResolvedValue({playbackId:'p1'}),speak:jest.fn(),stop:jest.fn(),onFinish:jest.fn()});

it('counts only onDone, once, for the existing translation',async()=>{
 const options=setup();beginVoicePlayback(options);await flush();
 const callbacks=options.speak.mock.calls[0][1];
 callbacks.onDone();callbacks.onDone();callbacks.onStopped();
 expect(options.record.mock.calls).toEqual([[{kind:'voice-start',translationId:1}],[{kind:'voice-end',playbackId:'p1'}]]);
 expect(options.onFinish).toHaveBeenCalledTimes(1);
});
it.each(['onStopped','onError'])('%s cancels and ignores a late onDone',async(kind)=>{
 const options=setup();beginVoicePlayback(options);await flush();
 const callbacks=options.speak.mock.calls[0][1];callbacks[kind]();callbacks.onDone();
 expect(options.record).toHaveBeenLastCalledWith({kind:'voice-cancel',playbackId:'p1'});
 expect(options.record).toHaveBeenCalledTimes(2);
});
it('cancels a start still in flight without speaking or completing',async()=>{
 const options=setup();let resolve!: (value:unknown)=>void;
 options.record.mockReturnValueOnce(new Promise(r=>{resolve=r;}));
 const playback=beginVoicePlayback(options);playback.cancel();resolve({playbackId:'p1'});await flush();
 expect(options.speak).not.toHaveBeenCalled();
 expect(options.record).toHaveBeenLastCalledWith({kind:'voice-cancel',playbackId:'p1'});
});
it('keeps reading available for unsaved text without awarding a playback',async()=>{
 const options={...setup(),translationId:undefined};beginVoicePlayback(options);await flush();
 options.speak.mock.calls[0][1].onDone();expect(options.record).not.toHaveBeenCalled();
});
