import assert from 'node:assert/strict'
import test from 'node:test'
import { getPaginationPageItems } from '../lib/pagination.mjs'

test('pagination shows every page for short result sets', () => {
  assert.deepEqual(getPaginationPageItems({ page: 3, pageCount: 6 }), [1, 2, 3, 4, 5, 6])
})

test('pagination keeps first, last and nearby pages for long result sets', () => {
  assert.deepEqual(
    getPaginationPageItems({ page: 5, pageCount: 25 }),
    [1, 'ellipsis-1-4', 4, 5, 6, 'ellipsis-6-25', 25]
  )
})

test('pagination expands useful ranges near either edge', () => {
  assert.deepEqual(
    getPaginationPageItems({ page: 1, pageCount: 25 }),
    [1, 2, 3, 4, 5, 'ellipsis-5-25', 25]
  )
  assert.deepEqual(
    getPaginationPageItems({ page: 25, pageCount: 25 }),
    [1, 'ellipsis-1-21', 21, 22, 23, 24, 25]
  )
})
