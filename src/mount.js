import io from 'socket.io-client';
import {Navbar} from './components/navbar';
import {Chat} from './components/chat';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';
import {makeSocketIODriver} from './drivers/socket-io';
import storageDriver from '@cycle/storage';	

export function navbar(element, ngCallback) {
	run(Navbar, {
		DOM: makeDOMDriver(element),
		HTTP: makeHTTPDriver(),
		angular: ngDriver(ngCallback),
		socketIO: makeSocketIODriver(socketIo()),
		storage: storageDriver,
		beep: beepDriver
	});
};

export function chat(element) {
	run(Chat, {
		DOM: makeDOMDriver(element),
		HTTP: makeHTTPDriver(),
		socketIO: makeSocketIODriver(socketIo(Anzu.chatIO)),
		storage: storageDriver
	});
};

function ngDriver(ngCallback) {
	return function(ng$) {
		ng$.addListener({
            next: event => ngCallback(event),
            error: err => console.error(err),
            complete: () => console.log('location completed'),
        });
	}
}

function beepDriver(events$) {
	events$.addListener({
        next: event => {
        	const audio = new Audio('/sounds/notification.mp3');
        	audio.play();
        },
        error: err => console.error(err),
        complete: () => console.log('beep completed'),
    });
}

function socketIo(server = Anzu.globalIO) {
	const token = localStorage.getItem('id_token');
    let params = {forceNew: true};

    if (token !== null && String(token).length > 0) {
        params['query'] = 'token=' + token;
    }

    return io(server, params);
}