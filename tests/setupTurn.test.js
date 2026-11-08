import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getSetupTurn } from '../app/src/lib/setupTurn.js'

test('setup turn: declared in meta, returned', () => {
  const scenarios = [{ conversation_id: 'C001', meta: { setup_turn: 2 } }]
  assert.equal(getSetupTurn(scenarios, 'C001'), 2)
})

test('setup turn: no meta at all (real dataset shape), null without throwing', () => {
  const scenarios = [{ conversation_id: 'C005', category: 'personalization', turn_count: 8 }]
  assert.equal(getSetupTurn(scenarios, 'C005'), null)
})

test('setup turn: meta present but no setup_turn, null', () => {
  const scenarios = [{ conversation_id: 'C001', meta: { author: 'x' } }]
  assert.equal(getSetupTurn(scenarios, 'C001'), null)
})

test('setup turn: unknown scenario, null', () => {
  assert.equal(getSetupTurn([], 'C999'), null)
})

test('setup turn: non-integer value is not trusted', () => {
  const scenarios = [{ conversation_id: 'C001', meta: { setup_turn: '2' } }]
  assert.equal(getSetupTurn(scenarios, 'C001'), null)
})