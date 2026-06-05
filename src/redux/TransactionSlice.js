import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    operations: [],
    status: { key: '', error: false, busy: false },
    errors: null,
};

const TransactionSlice = createSlice({
    name: 'transaction',
    initialState,
    reducers: {
        // An error will end up in QUEUE
        broadcastOperation: (state, action) => {
            // action.payload: {type, operation, keys}
            return state;
        },
    },
})

export const { broadcastOperation } = TransactionSlice.actions;

export default TransactionSlice.reducer;