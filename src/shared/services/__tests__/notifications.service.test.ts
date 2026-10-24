import { ENDPOINTS } from '../../../app/config/api.config';
import { api } from '../api.client';
import { notificationsService } from '../notifications.service';

jest.mock('../api.client', () => ({ api: { get: jest.fn(), patch: jest.fn() } }));
beforeEach(() => jest.clearAllMocks());

it('preserves the originating token, cancellation and unread query', async () => {
  const signal = new AbortController().signal;
  const items = [{ id: 'notice' }];
  (api.get as jest.Mock).mockResolvedValue({ data: { data: items } });
  expect(await notificationsService.getUnread('origin', signal)).toEqual(items);
  expect(api.get).toHaveBeenCalledWith(ENDPOINTS.notifications, {
    headers: { Authorization: 'Bearer origin' }, signal,
    params: { unreadOnly: true, limit: 100 },
  });
});
it('encodes the notification id and preserves acknowledgement cancellation', async () => {
  const signal = new AbortController().signal;
  await notificationsService.markRead('id/with space', 'origin', signal);
  expect(api.patch).toHaveBeenCalledWith('/notifications/id%2Fwith%20space/read', {}, {
    headers: { Authorization: 'Bearer origin' }, signal,
  });
});
it('ignores an invalid inbox envelope', async () => {
  (api.get as jest.Mock).mockResolvedValue({ data: { data: {} } });
  expect(await notificationsService.getUnread('origin', new AbortController().signal)).toEqual([]);
});
