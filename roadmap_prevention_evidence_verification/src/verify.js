import {sha256} from '../../decision_provenance_pack/src/provenance.js';

const digestPattern = /^[0-9a-f]{64}$/i;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Compare a received Project 61 export with a separately trusted digest. */
export async function verifyPreventionEvidence(envelope, expectedDigest) {
  if (typeof expectedDigest !== 'string' || !digestPattern.test(expectedDigest)) {
    throw new Error('A separately trusted SHA-256 digest is required');
  }
  if (!object(envelope?.payload) || envelope.payload.kind !== 'roadmap_prevention_evidence_summary' ||
      envelope.payload.schemaVersion !== '1.0.0' || envelope.integrity?.algorithm !== 'SHA-256' ||
      typeof envelope.integrity.digest !== 'string' || !digestPattern.test(envelope.integrity.digest)) {
    throw new Error('Expected a Project 61 v1 export with a SHA-256 checksum');
  }
  // The generated export is shallow. Bound arbitrary uploaded JSON before recursive encoding.
  const stack = [[envelope.payload, 0]];
  let nodes = 0;
  while (stack.length) {
    const [value, depth] = stack.pop();
    if (++nodes > 10000 || depth > 12) throw new Error('Export exceeds verification complexity limits');
    if (value && typeof value === 'object') {
      for (const child of Object.values(value)) stack.push([child, depth + 1]);
    }
  }
  const actualDigest = await sha256(envelope.payload);
  const embeddedMatches = actualDigest === envelope.integrity.digest.toLowerCase();
  const trustedMatches = actualDigest === expectedDigest.toLowerCase();
  return {status: embeddedMatches && trustedMatches ? 'digest_match' : 'digest_mismatch',
    embeddedMatches, trustedMatches, actualDigest};
}
