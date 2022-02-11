import { fork } from 'redux-saga/effects'

import { fetchDataWatches } from 'app/redux/FetchDataSaga'
import { transactionWatches } from 'app/redux/TransactionSaga'
import { userWatches } from 'app/redux/UserSaga'

export default function* rootSaga() {
    yield fork(userWatches)
    yield fork(fetchDataWatches)
    yield fork(transactionWatches)
}
