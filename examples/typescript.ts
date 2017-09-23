import {createStore} from 'redux'
import {action, handleActionsAppend, handle} from 'redux-actionz'

// Types
type User = {id: number, name: string}

type DataCreateUser = string
type PayloadIncrement = number
type PayloadDecrement = number
type PayloadCreateUser = User
type Payload = PayloadIncrement | PayloadDecrement | PayloadCreateUser

type State = {
  currentUser: User | null,
  counter: number,
}

// Create actions
const increment = action<PayloadIncrement>('increment')
const decrement = action<PayloadDecrement>('decrement')
const createUser = action<DataCreateUser, PayloadCreateUser>(
  'create user',
  name => {
    const id = Math.floor(Math.random() * 100)

    return {
      name,
      id,
    }
  },
)

// Create reducer - we will use "append" version
const initialState: State = {
  currentUser: null,
  counter: 0,
}
const reducer = handleActionsAppend<State, Payload>([
  handle(increment, (state: State, payload) => ({
    counter: state.counter + payload,
  })),
  handle(decrement, (state: State, payload) => ({
    counter: state.counter - payload,
  })),
  handle(createUser, (state, payload) => ({
    currentUser: payload,
  })),
], initialState)

// Create store
const store = createStore(reducer)

// Dispatch some actions
store.dispatch(increment(10))
store.dispatch(decrement(5))
console.log(store.getState())
// { currentUser: null, counter: 5 }

store.dispatch(createUser('Bart'))
console.log(store.getState())
// { currentUser: { name: 'Bart', id: 19 }, counter: 5 }
