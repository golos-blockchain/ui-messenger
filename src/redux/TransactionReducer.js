import { fromJS } from 'immutable'
import createModule from 'redux-modules'


export default createModule({
    name: 'transaction',
    initialState: fromJS({
        operations: [],
        status: { key: '', error: false, busy: false },
        errors: null,
    }),
    transformations: [
        {
            // An error will end up in QUEUE
            action: 'BROADCAST_OPERATION',
            reducer: state => {
                //, {payload: {type, operation, keys}}
                return state;
            },
        },
    ]
})
