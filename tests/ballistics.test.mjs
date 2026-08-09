import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateAngles,
  MAX_ANGLE,
  MAX_DISTANCE,
  parseDistance,
} from '../ballistics.js';

test('accepts integer, decimal, leading decimal, and decimal comma input', () => {
  assert.deepEqual(parseDistance('5'), { state: 'valid', distance: 5 });
  assert.deepEqual(parseDistance('5.01'), { state: 'valid', distance: 5.01 });
  assert.deepEqual(parseDistance('.5'), { state: 'valid', distance: 0.5 });
  assert.deepEqual(parseDistance('2,5'), { state: 'valid', distance: 2.5 });
});

test('distinguishes empty and invalid input', () => {
  assert.deepEqual(parseDistance('  '), { state: 'empty' });
  assert.equal(parseDistance('-1').state, 'invalid');
  assert.equal(parseDistance('abc').state, 'invalid');
  assert.equal(parseDistance('5..1').state, 'invalid');
  assert.equal(parseDistance(String(MAX_DISTANCE + 0.01)).state, 'invalid');
});

test('zero distance returns six available zero-degree results', () => {
  const results = calculateAngles(0);
  assert.equal(results.length, 6);
  assert.ok(results.every((result) => result.available));
  assert.ok(results.every((result) => result.displayAngle === '0.00'));
});

test('each charge is available at its exact 60-degree boundary', () => {
  const boundaries = [5, 10, 15, 20, 25, 30];

  boundaries.forEach((distance, index) => {
    const result = calculateAngles(distance)[index];
    assert.equal(result.angle, MAX_ANGLE);
    assert.equal(result.available, true);
    assert.equal(result.displayAngle, '60.00');
  });
});

test('raw values above 60 degrees are unavailable before display rounding', () => {
  const firstCharge = calculateAngles(5.0001)[0];
  assert.equal(firstCharge.displayAngle, '60.00');
  assert.equal(firstCharge.angle > MAX_ANGLE, true);
  assert.equal(firstCharge.available, false);
});

test('at 30 km only charge 6 is available', () => {
  const results = calculateAngles(30);
  assert.deepEqual(results.map((result) => result.available), [false, false, false, false, false, true]);
  assert.equal(results[5].displayAngle, '60.00');
});

test('calculation rejects out-of-range values', () => {
  assert.throws(() => calculateAngles(-0.01), RangeError);
  assert.throws(() => calculateAngles(MAX_DISTANCE + 0.01), RangeError);
  assert.throws(() => calculateAngles(Number.NaN), RangeError);
});
