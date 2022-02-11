import { call, put, select, fork, cancelled, takeLatest, takeEvery } from 'redux-saga/effects';

export function* fetchDataWatches () {
    yield fork(watchGetContent);
    yield fork(watchLocationChange);
}

export function* watchGetContent() {
    yield takeEvery('global/TICK', getContentCaller);
}

export function* getContentCaller(action) {
    console.log('f')
    alert('1')
}

export function* watchLocationChange() {
    yield takeLatest('@@router/LOCATION_CHANGE', fetchState);
}

export function* fetchState(location_change_action) {
    console.log('fc')
}
