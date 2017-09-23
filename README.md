# Redux actionz

A library to manage action creators, action effects and reducers in an elegant and efficient maneer.

## Motivation

This library was meant to provide all the brilliant features of [Redux actions](https://github.com/Reduxactions/Redux-actions), but with some improvements and new nice-to-have features. I couldn't contribute with my ideas without completely breaking the already existing API, so I've decided to create a new library.

### 1. Efficiency.

**Redux actions** allows you to create your reducer by providing a map of action creators and reducers coresponsing to each of them, like so:
```js
const reducer = handleActions({
  [actionCreator1]: (state, action1) => newState,
  [actionCreator2]: (state, action2) => newState,
  [actionCreator3]: (state, action3) => newState,
  ...
}, initialState)
```
It's awesome, but lookup to the actual action type runs at average `O(n)` complexity, where `n` is a number of actions handled ([proof](https://github.com/reduxactions/redux-actions/blob/master/src/handleActions.js#L21)). **Redux actionz** will run the same lookup at constant average time `O(0)`, utilizing an object for fast key lookup.

Of course, we're talking here about a really tiny performance gain, but still: In Redux-based apps, state management, aside from view rendering, is one of the most critical performance bottlenecks perceived by end user. And in Redux, the entire state managment is described in just one place - **reducer function**. If we can do slightly better, then why not :) .

### 2. Payload reducers instead of reducers.

First of all, every Redux action should always have the same shape (type), which is:
```ts
interface Action<P> {
  type: string
  payload: P
}
```
This approach is better not only because of the consistency in design (which leads to simplicity and compability between different libraries), but also because it will never cause name conflicts inside an action with a property named `type`. It's especially important when using libraries like [Redux observable](https://github.com/Redux-observable/Redux-observable) - by mapping from one action to another you can easily overwrite `type` value (it's not an uncommon property name, after all). Every Redux action should always have this shape and never ever contain any other data outside of `payload` property.

**Remember**: property `type` is an action name. Property `payload` is a data needed to handle this action. Sometimes actions don't contain any data at all - that's fine too, just set payload to `null`.

The only reason why many developers do not follow this obvious practise and deal with a property hell inside their actions is that they don't feel like accessing payload inside their reducers, just to get the data they need inside a reducer, like so:
```js
const reducer = handleActions({
  [increment]: (state, action) => state + action.payload,
  [decrement]: (state, action) => state - action.payload,
}, initialState)
```
Instead, they would love to create reducers like this:
```js
const reducer = handleActions({
  [increment]: (state, payload) => state + payload,
  [decrement]: (state, payload) => state - payload,
}, initialState)
```
Not only it's much simpler, but also removes an `action` being passed to our reducer, when all we need is a `payload` (data) and not an unnecessary meta information, which is action `type`.

That is why we need a new type, `PayloadReducer`.

Classic reducer has a type of:
```ts
type Reducer<S, A> = (state: S, action: A) => S
```
Well, actually, it's not true. A real reducer, which can be consumed by Redux `createStore()`, has a type of:
```ts
type Reducer<S, A> = (state: ReduxState<S>, action: A) => S
```
Where `ReduxState` is just:
```ts
type ReduxState<S> = S | undefined
```
Otherwise, how would your store's state be ever set to `initialState`? Obviously it needs to start with `undefined` value, as you can read from the [source of Redux](https://github.com/reactjs/Redux/blob/master/src/createStore.js#L58).

Our new type, `PayloadReducer`, looks like this:
```ts
type PayloadReducer<S, P> = (state: S, payload: P) => S
```
Which is a higher-level abstraction we need. Payload reducer is a function which takes a current state of type `S` and a payload of action, and returns a new state of type `S`.

### 3. "Append" strategy.

I've used Redux for multiple production-ready apps and observed how shallow copying of state becomes a boring and unnecessary routine. Consider code:
```js
const reducer = createReducer({
  [incrementA]: (state, payload) => ({
    ...state,
    a: state.a + payload,
  }),
  [incrementB]: (state, payload) => ({
    ...state,
    b: state.b + payload,
  }),
}, initialState)
```
It gets even worse when you have a lot of nested properties inside a state, all of which you still need to copy to create a new state.

In order to change a state you will always need a shallow copy of it inside a reducer. It's the very minimal requirement. One could assume, that we always want it. In such a case, we can think of an **append strategy**, where we only provide a **partial payload reducer** - that is, a function of such a type:
```ts
type PartialPayloadReducer<S, P> = (state: S, payload: P) => Partial<S>
```
Where `Partial<S>` is just a type of object containing a subset of keys of object `S`. In this context: a part of a new state which we would like to **append** to a shallow copy of a previous state.

The previous code using **append strategy** would look like this:
```js
const reducer = createReducerAppend({
  [incrementA]: (state, payload) => ({
    a: state.a + payload,
  }),
  [incrementB]: (state, payload) => ({
    b: state.b + payload,
  }),
})
```
Which gives a better signal-to-noise ratio and removes some repetition.

### 4. Async actions.

Another thing I've noticed among a lot of Redux projects is a boilerplate done by developers to achieve the same thing, over and over. I'm talking here about asynchronous actions which can be started and then complete in one of 2 statuses: `success` or `fail`:
```js
const requestStart    = createAction('request:start')
const requestSuccess  = createAction('request:success')
const requestFail     = createAction('request:fail')
```
What I really dislike here is not only violating a Don't Repeat Yourself principle, but also giving a misleading signal, that those actions may not be related to each other: for example, someone could accidently skip `fail` status.

This is why I like to use **async action creator**: an object containing 3 action creators for each of the statuses (start, fail, success). To create one, you just write:
```js
const request = asyncAction('request')

store.dispatch(request.start())                           // request:start
setTimeout(_ => store.dispatch(request.success()), 1000)  // request:success
```

### 5. Naming conventions.

The library uses `action` function name over `createAction` for "action creator factory". The latter isn't verbose enough anyway - otherwise it would be `createActionCreator`, which is far from great anyway.

## Usage

### JavaScript

#### Basic example

JavaScript users don't care about static types and thus their life is simple and sweet. Everything is very straightforward.
```js
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
```

#### Append strategy

For more complexed states, one can use **append strategy**, which means changing `createReducer` to `createReducerAppend`. This way, instead of writing:
```js
const reducer = createReducer({
  [incrementC]: (state, payload) => ({
    ...state,
    c: state.c + payload,
  }),
}, {a: 0, b: 0, c: 0})
```
One can just write:
```js
const reducer = createReducerAppend({
  [incrementC]: (state, payload) => ({
    c: state.c + payload,
  }),
}, {a: 0, b: 0, c: 0})
```

#### Actions with effects

One thing that our example skipped is a notion of effects. Naturally, in Redux architecture, action creators can also have side effects - like reading from some external state, generating random numbers or logging to console. Putting them into reducer functions breaks the entire idea of Redux. Moreover, those effects can have some results which we would like to apply to action payload - for example, when creating a new user, we would like to generate some random ID for him and use it for a payload. The function which does it is called an **effect**.

Effect is the optional second parameter of `action` function. Consider this example:
```js
const createUser = action('create user', name => {
  const id = Math.floor(Math.random() * 100)

  return {
    name,
    id,
  }
})

console.log(createUser('Bart'))
// {type: 'create user', payload: {name: 'Bart', id: 13}}
```
Our effect function gets some data, generates random ID (impure code) and returns action payload.

### TypeScript

TypeScript doesn't play well with our `createReducer` function. It doesn't like implicit `.toString()` calls on action creators to get types of future actions. Therefore we are forced to use a different function: `handleActions`, which works best with a helper function `handle`, used for "handling" each action. The entire logic of this weird API is to force TypeScript to recognize correctly type of every action.

Naturally, there is also an "append" version of `handleActions` - `handleActionsAppend`, which will be used in the following example:
```ts
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
  handle(createUser, (state: State, payload) => ({
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
```

## Known issues

TypeScript doesn't work **perfectly** with this library. As presented in the last example, it requires some redundant `State` type annotations (which should be just inferred) to compile. The best way to type reducers is still to create classic functions, without any helper libraries, like [here](https://stackoverflow.com/a/40758619). The reason to use this library is to have more expressive API for reducers, action creators and their effects.

## License

MIT
