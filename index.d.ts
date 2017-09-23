export interface Action<P> {
    type: string;
    payload: P;
}
export declare type ActionEffect<D, P> = (payload: D) => P;
export declare type ActionCreator<D, P> = (data: D) => Action<P>;
export interface AsyncActionCreator<D1, D2, D3, P1, P2, P3> {
    start: ActionCreator<D1, P1>;
    success: ActionCreator<D2, P2>;
    fail: ActionCreator<D3, P3>;
}
export declare type Partial<A> = {
    [K in keyof A]?: A[K];
};
export declare type ReduxState<S> = S | undefined;
export declare type Reducer<S, P> = (state: ReduxState<S>, action: Action<P>) => S;
export declare type PayloadReducer<S, P> = (state: S, payload: P) => S;
export declare type PartialPayloadReducer<S, P> = (state: S, payload: P) => Partial<S>;
export interface PayloadReducerMap<S, P> {
    [actionType: string]: PayloadReducer<S, P>;
}
export interface PartialPayloadReducerMap<S, P> {
    [actionType: string]: PartialPayloadReducer<S, P>;
}
export declare function action<D, P = D>(type: string, effect?: ActionEffect<D, P>): ActionCreator<D, P>;
export declare function asyncAction<D1, D2, D3, P1 = D1, P2 = D2, P3 = D3>(type: string, effects?: {
    start?: ActionEffect<D1, P1>;
    success?: ActionEffect<D2, P2>;
    fail?: ActionEffect<D3, P3>;
}): AsyncActionCreator<D1, D2, D3, P1, P2, P3>;
export declare function handle<S, P>(action: ActionCreator<any, P>, reducer: PayloadReducer<S, P>): PayloadReducerMap<S, P>;
export declare function handleActions<S, P>(reducerMaps: Array<PayloadReducerMap<S, P>>, initialState: S): Reducer<S, P>;
export declare function handleActionsAppend<S, P>(reducerMaps: Array<PartialPayloadReducerMap<S, P>>, initialState: S): Reducer<S, P>;
export declare function createReducer<S, P>(reducerMap: PayloadReducerMap<S, P>, initialState: S): Reducer<S, P>;
export declare function createReducerAppend<S, P>(reducerMap: PartialPayloadReducerMap<S, P>, initialState: S): Reducer<S, P>;
