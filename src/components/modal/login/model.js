import xs from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';

const DEFAULT_STATE = {
    resolving: false,
    email: '',
    password: '',
    error: false
};

export function model(actions) {

    /**
     * HTTP write effects including:
     * - User info from token stream.
     */
    const requestToken$ = actions.sent$.filter(sent => sent === true)
        .compose(sampleCombine(actions.fields$))
        .map(([sent, [email, password]]) => ({
                method: 'POST',
                url: Anzu.layer + 'auth/get-token', 
                category: 'token',
                query: {email, password}
            })
        );

    const token$ = actions.token$.filter(res => !(res instanceof Error))
        .map(res => res.body.token);

    /**
     * Reducers.
     * Streams mapped to reducer functions.
     */
     const fieldsR$ = actions.fields$.map(([email, password]) => state => ({...state, email, password}));
     const sentR$ = actions.sent$.map(sent => state => ({...state, resolving: sent, error: false}));
     const tokenR$ = actions.token$.map(res => state => {
        return {
            ...state, 
            resolving: false,
            error: res instanceof Error ? res : false
        };
     });

    const state$ = xs.merge(fieldsR$, sentR$, tokenR$)
        .fold((state, action) => action(state), DEFAULT_STATE);

    return {
        state$,
        token$,
        HTTP: requestToken$,
    };
}