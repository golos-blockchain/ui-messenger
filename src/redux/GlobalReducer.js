import { Map } from 'immutable';
import createModule from 'redux-modules'

export default createModule({
    name: 'global',
    initialState: new Map({}),
    transformations: [
        {
            action: 'TICK',
            reducer: (state, action) => {
                return state.set('tick', Math.random())
            }
        },
        {
            action: 'TICK2',
            reducer: (state, action) => {
                return state.set('tick', Math.random())
            }
        },
    ],
})
