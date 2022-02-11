import { fork } from 'redux-saga/effects'
import { fetchDataWatches } from './FetchDataSaga'

export default function* rootSaga() {
    yield fork(fetchDataWatches)
}
