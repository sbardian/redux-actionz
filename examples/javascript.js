import {createStore} from 'redux'
import {action, asyncAction, createReducer} from 'redux-actionz'

// Create actions
const increment = action('increment')
const decrement = action('decrement')
const incrementLater = asyncAction('incrementLater')

// Create reducer
const initialState = 0
const reducer = createReducer({
  [increment]: (state, payload) => state + payload,
  [decrement]: (state, payload) => state - payload,
  [incrementLater.start]: (state, payload) => 0,
  [incrementLater.fail]: (state, payload) => -1000,
  [incrementLater.success]: (state, payload) => state + payload * 3,
}, initialState)

// Create store
const store = createStore(reducer)

// Dispatch some actions
store.dispatch(increment(10))
store.dispatch(decrement(5))
console.log(store.getState()) // 5

store.dispatch(incrementLater.start())
console.log(store.getState()) // 0

setTimeout(_ => {
  store.dispatch(incrementLater.success(10))
  console.log(store.getState()) // 30
}, 1000)
