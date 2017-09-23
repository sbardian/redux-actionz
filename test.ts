import * as test from 'tape'
import {createStore, combineReducers} from 'redux'

import {
  ReduxState,
  action,
  asyncAction,
  handle,
  handleActions,
  handleActionsAppend,
  createReducer,
  createReducerAppend,
} from './index'

declare var global: any

test('action', t => {
  t.test('without effect', t => {
    interface Payload {
      a: number,
      b: string,
    }

    const actionCreator = action<Payload>('action type')

    t.equal(
      actionCreator.toString(),
      'action type',
      `.toString() on action creator returns future action's type.`,
    )

    const actual = actionCreator({a: 1, b: '2'})
    const expected = {
      type: 'action type',
      payload: {
        a: 1,
        b: '2',
      },
    }

    t.deepEqual(actual, expected, 'Returns a correct action.')

    t.end()
  })

  t.test('with effect', t => {
    type Payload = string

    let counter = 0

    const effect = (data: number) => {
      counter += data

      return 'x'.repeat(data)
    }

    const actionCreator = action<number, Payload>('action with effect', effect)

    t.equal(counter, 0, 'Creating action creator does not fire effect yet.')

    const actual = actionCreator(3)
    const expected = {
      type: 'action with effect',
      payload: 'xxx',
    }

    t.deepEqual(actual, expected, 'Returns a correct action.')
    t.equal(counter, 3, 'Calling action creator fires an effect.')

    actionCreator(1)
    actionCreator(4)

    t.equal(counter, 8, 'Calling action creator again still fires an effect.')

    t.end()
  })
})

test('asyncAction', t => {
  let counter = 0
  let lastError = ''

  interface PayloadStart {
    a: string,
  }
  type PayloadSuccess = number
  interface PayloadFail {
    error: string,
  }

  const actionCreator = asyncAction<PayloadStart, PayloadSuccess, PayloadFail>(
    'async action',
    {
      success: (data: PayloadSuccess) => {
        counter += data

        return data
      },
      fail: (data: PayloadFail) => {
        lastError = data.error

        return data
      },
    },
  )

  t.deepEqual(
    actionCreator.start({a: 'b'}),
    {
      type: 'async action:start',
      payload: {a: 'b'},
    },
    `Returns correct 'start' action creator, when no effect given.`,
  )

  const actionSuccess = actionCreator.success(4)

  t.equal(counter, 4, `Correctly calls specified 'success' effect.`)
  t.deepEqual(
    actionSuccess,
    {
      type: 'async action:success',
      payload: 4,
    },
    `Returns correct 'success' action creator, when effect specified.`,
  )

  const actionFail = actionCreator.fail({error: '404'})

  t.equal(lastError, '404', `Correctly calls specified 'fail' effect.`)
  t.deepEqual(
    actionFail,
    {
      type: 'async action:fail',
      payload: {
        error: '404',
      },
    },
    `Returns correct 'fail' action creator, when effect specified.`,
  )

  t.end()
})

test('createReducer', t => {
  interface State {
    counter: number,
    value: number,
  }

  type PayloadAdd = number
  type PayloadSub = number
  type Payload = PayloadAdd | PayloadSub | null

  const add = action<PayloadAdd>("add")
  const sub = action<PayloadSub>("sub")
  const dummy = action<null>("dummy")

  const initialState: State = {
    counter: 0,
    value: 10,
  }

  const reducer = createReducer<State, Payload>({
    [add.toString()]: (state, x: PayloadAdd) => ({
      counter: state.counter + 1,
      value: state.value + x,
    }),
    [sub.toString()]: (state, x: PayloadSub) => ({
      counter: state.counter + 1,
      value: state.value + x,
    }),
  }, initialState)

  let state: ReduxState<State>

  state = reducer(state, dummy(null))

  t.equal(state, initialState, 'Initial state is set if state was undefined.')

  state = reducer(state, add(2))

  t.deepEqual(state, {counter: 1, value: 12}, 'Reducer handles action.')

  const prevState = state
  state = reducer(state, dummy(null))

  t.equal(
    state,
    prevState,
    'State reference is the same after dispatching unhandled action.',
  )

  t.end()
})

test('createReducerAppend', t => {
  interface State {
    a: string,
    b: string,
  }

  type PayloadA = string
  type PayloadB = number
  type Payload = PayloadA | PayloadB | null

  const appendA = action<PayloadA>('append a')
  const appendB = action<PayloadB>('append b')
  const dummy = action<null>('dummy')

  const initialState: State = {
    a: '',
    b: '',
  }

  let state: ReduxState<State>

  const reducer = createReducerAppend<State, Payload>({
    [appendA.toString()]: (state: State, payload: PayloadA) => ({
      a: state.a + payload,
    }),
    [appendB.toString()]: (state: State, payload: PayloadB) => ({
      b: state.b + 'b'.repeat(payload),
    }),
  }, initialState)

  state = reducer(state, dummy(null))

  t.equal(state, initialState, 'Initial state is set if state was undefined.')

  state = reducer(state, appendA('abc'))

  t.deepEqual(state, {a: 'abc', b: ''}, 'Reducer handles action.')

  state = reducer(state, appendB(3))

  t.deepEqual(
    state,
    {a: 'abc', b: 'bbb'},
    'Reducer support different types of payload.',
  )

  t.end()
})

test('handleActions', t => {
  interface State {
    counter: number,
    value: number,
  }

  type PayloadAdd = number
  type PayloadSub = string
  type Payload = PayloadAdd | PayloadSub | null

  const add = action<PayloadAdd>('add')
  const sub = action<PayloadSub>('sub')
  const dummy = action<null>('dummy')

  const initialState: State = {
    counter: 0,
    value: 10,
  }

  let state: ReduxState<State>

  const reducer = handleActions<State, Payload>([
    handle(add, (state, payload) => ({
      counter: state.counter + 1,
      value: state.value + payload,
    })),
    handle(sub, (state, payload) => ({
      counter: state.counter + 1,
      value: state.value - payload.length,
    })),
  ], initialState)

  state = reducer(state, dummy(null))

  t.equal(state, initialState, 'Initial state is set if state was undefined.')

  state = reducer(state, add(2))

  t.deepEqual(state, {counter: 1, value: 12}, 'Reducer handles action.')

  const prevState = state
  state = reducer(state, dummy(null))

  t.equal(
    state,
    prevState,
    'State reference is the same after dispatching unhandled action.',
  )

  state = reducer(state, sub('abc'))

  t.deepEqual(
    state,
    {counter: 2, value: 9},
    'Reducer supports different types of payload.',
  )

  t.end()
})

test('handleActionsAppend', t => {
  interface State {
    a: string,
    b: string,
  }

  type PayloadA = string
  type PayloadB = number
  type Payload = PayloadA | PayloadB | null

  const appendA = action<PayloadA>('append a')
  const appendB = action<PayloadB>('append b')
  const dummy = action<null>('dummy')

  const initialState: State = {
    a: '',
    b: '',
  }

  let state: ReduxState<State>

  const reducer = handleActionsAppend<State, Payload>([
    handle(appendA, (state, payload) => ({
      a: state.a + payload,
    })),
    handle(appendB, (state, payload) => ({
      b: state.b + 'b'.repeat(payload),
    })),
  ], initialState)

  state = reducer(state, dummy(null))

  t.equal(state, initialState, 'Initial state is set if state was undefined.')

  state = reducer(state, appendA('abc'))

  t.deepEqual(state, {a: 'abc', b: ''}, 'Reducer handles action.')

  state = reducer(state, appendB(3))

  t.deepEqual(
    state,
    {a: 'abc', b: 'bbb'},
    'Reducer supports different types of payload.',
  )

  t.end()
})

test('Integration with Redux', t => {
  type StateA = number

  interface StateB {
    val: number,
    str: string,
  }

  type PayloadAppend = string
  type PayloadAsynchSuccess = number
  type PayloadAsynchFail = number

  const inc = action<null>('inc')
  const dec = action<null>('dec')
  const append = action<PayloadAppend>('append')
  const asynch = asyncAction<PayloadAsynchSuccess, PayloadAsynchFail, null>('asynch')

  type PayloadA = null
  type PayloadB = PayloadAppend | PayloadAsynchFail | PayloadAsynchSuccess | null

  const reducerA = handleActions<StateA, PayloadA>([
    handle(inc, state => state + 1),
    handle(dec, state => state - 1),
  ], 0)

  const reducerB = handleActionsAppend<StateB, PayloadB>([
    handle(append, (state, payload) => ({
      str: state.str + payload,
    })),
    handle(asynch.start, (state: StateB, payload) => ({
      val: state.val + payload,
    })),
    handle(asynch.success, (state: StateB, payload) => ({
      val: state.val - payload,
    })),
    handle(asynch.fail, (state: StateB) => ({
      val: state.val - 1000,
    })),
  ], {val: 0, str: ''})

  const reducer = combineReducers({
    a: reducerA,
    b: reducerB,
  })

  const store = createStore(reducer)

  t.deepEqual(
    store.getState(),
    {
      a: 0,
      b: {
        val: 0,
        str: '',
      },
    },
    'Initial state of store is set.',
  )

  store.dispatch(inc(null))
  store.dispatch(inc(null))
  store.dispatch(append('abc'))
  store.dispatch(dec(null))

  t.deepEqual(
    store.getState(),
    {
      a: 1,
      b: {
        val: 0,
        str: 'abc',
      },
    },
    'Store handles action.',
  )

  store.dispatch(asynch.start(10))
  global.setTimeout(() => {
    store.dispatch(asynch.success(1))

    t.deepEqual(
      store.getState(),
      {
        a: 1,
        b: {
          val: 9,
          str: 'abc',
        },
      },
      'Store handles async action.',
    )

    t.end()
  }, 5)
})
