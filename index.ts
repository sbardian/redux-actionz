import * as objectAssign from 'object-assign'

export interface Action<P> {
  type: string
  payload: P
}

export type ActionEffect<D, P> = (payload: D) => P

export type ActionCreator<D, P> = (data: D) => Action<P>

export interface AsyncActionCreator<D1, D2, D3, P1, P2, P3> {
  start: ActionCreator<D1, P1>,
  success: ActionCreator<D2, P2>,
  fail: ActionCreator<D3, P3>,
}

export type Partial<A> = {
  [K in keyof A]?: A[K]
}

export type ReduxState<S> = S | undefined

export type Reducer<S, P> = (state: ReduxState<S>, action: Action<P>) => S

export type PayloadReducer<S, P> = (state: S, payload: P) => S

export type PartialPayloadReducer<S, P> =
  (state: S, payload: P) => Partial<S>

export interface PayloadReducerMap<S, P> {
  [actionType: string]: PayloadReducer<S, P>
}

export interface PartialPayloadReducerMap<S, P> {
  [actionType: string]: PartialPayloadReducer<S, P>,
}

const id = (x: any) => x

// Action creator
export function action<D, P = D>(
  type: string,
  effect: ActionEffect<D, P> = id,
): ActionCreator<D, P> {
  const actionCreator = (data: D) => {
    const payload: P = effect(data)

    return {
      type,
      payload,
    }
  }

  actionCreator.toString = () => type

  return actionCreator
}

// Async action creator. Returns 3 action creators: start, success, fail.
export function asyncAction<D1, D2, D3, P1 = D1, P2 = D2, P3 = D3>(
  type: string,
  effects: {
    start?: ActionEffect<D1, P1>,
    success?: ActionEffect<D2, P2>,
    fail?: ActionEffect<D3, P3>,
  } = {},
): AsyncActionCreator<D1, D2, D3, P1, P2, P3> {
  return {
    start: action<D1, P1>(`${type}:start`, effects.start || id),
    success: action<D2, P2>(`${type}:success`, effects.success || id),
    fail: action<D3, P3>(`${type}:fail`, effects.fail || id),
  }
}

// Helper function for handleActions() and handleActionsAppend()
export function handle<S, P>(
  action: ActionCreator<any, P>,
  reducer: PayloadReducer<S, P>,
): PayloadReducerMap<S, P> {
  return {
    [action.toString()]: reducer,
  }
}

// Allows to create a nicely-typed reducer
// Use with handle()
export function handleActions<S, P>(
  reducerMaps: Array<PayloadReducerMap<S, P>>,
  initialState: S,
): Reducer<S, P> {
  return createReducer<S, P>(objectAssign({}, ...reducerMaps), initialState)
}

export function handleActionsAppend<S, P>(
  reducerMaps: Array<PartialPayloadReducerMap<S, P>>,
  initialState: S,
): Reducer<S, P> {
  return createReducerAppend<S, P>(
    objectAssign({}, ...reducerMaps),
    initialState,
  )
}

// Create reducer from a map {actionType => reducer}
export function createReducer<S, P>(
  reducerMap: PayloadReducerMap<S, P>,
  initialState: S,
): Reducer<S, P> {
  return (state: S = initialState, action: Action<P>): S => {
    const {type} = action
    if (type in reducerMap) {
      return reducerMap[type](state, action.payload)
    }

    return state
  }
}

// Same as createReducer, but automatically creates a shallow copy of prev. state.
// This way, you only need to return a part of modified state in your "reducer".
// This part will be appended to the copy of previous state.
// Use only if you understand pros and cons.
export function createReducerAppend<S, P>(
  reducerMap: PartialPayloadReducerMap<S, P>,
  initialState: S,
): Reducer<S, P> {
  return (state: S = initialState, action: Action<P>): S => {
    const {type} = action
    if (type in reducerMap) {
      const newStatePartition: Partial<S> = reducerMap[type](state, action.payload)
      return objectAssign({}, state, newStatePartition)
    }

    return state
  }
}
