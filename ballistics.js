export const MAX_DISTANCE = 30;
export const MAX_ANGLE = 60;

export const CHARGES = Object.freeze([
  Object.freeze({ charge: 1, factor: 12 }),
  Object.freeze({ charge: 2, factor: 6 }),
  Object.freeze({ charge: 3, factor: 4 }),
  Object.freeze({ charge: 4, factor: 3 }),
  Object.freeze({ charge: 5, factor: 2.4 }),
  Object.freeze({ charge: 6, factor: 2 }),
]);

export function parseDistance(value) {
  const normalized = String(value).trim().replace(',', '.');

  if (normalized === '') {
    return { state: 'empty' };
  }

  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) {
    return { state: 'invalid', reason: 'format' };
  }

  const distance = Number(normalized);
  if (!Number.isFinite(distance) || distance < 0 || distance > MAX_DISTANCE) {
    return { state: 'invalid', reason: 'range' };
  }

  return { state: 'valid', distance };
}

export function calculateAngles(distance) {
  if (!Number.isFinite(distance) || distance < 0 || distance > MAX_DISTANCE) {
    throw new RangeError(`Distance must be between 0 and ${MAX_DISTANCE}.`);
  }

  return CHARGES.map(({ charge, factor }) => {
    const angle = distance * factor;
    return {
      charge,
      factor,
      angle,
      available: angle <= MAX_ANGLE,
      displayAngle: angle.toFixed(2),
    };
  });
}
