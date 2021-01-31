import log from 'loglevel';
import {
    RSocketClient, IdentitySerializers, APPLICATION_OCTET_STREAM
} from 'rsocket-core';
import type { CancelCallback } from 'rsocket-flowable/Single';
import { Flowable } from 'rsocket-flowable';
import RSocketWebSocketClient from 'rsocket-websocket-client';
import type { ReactiveSocket } from 'rsocket-types';
import { requestInfiniteDemand } from './utils';
import type { ISubscription, Payload } from 'rsocket-types';
import { DefaultWebktChannel, WebktChannel, WebktMessage, WebktMessageType } from './webkt-channel';
import { WebKtEncoders } from './rsocket/encoders';
import { WebKtMessageHandler } from './message-handlers/message-handler';
import { WebKtRenderMessageHandler } from './message-handlers/render-message-handler';
import { WebKtLinkMessageHandler } from './message-handlers/link-message-handler';

const MetadataProtos = require('./proto/Metadata_pb')

export interface WebKtAppOptions {
    serverUrl: string
}

export class WebKtApp {
    private options: WebKtAppOptions;

    private rSocketConnectionCancelCallback: CancelCallback | null = null;
    private webktChannelSubscription: ISubscription | null = null;

    private serverMessageHandlers: Map<any, WebKtMessageHandler> = new Map();

    constructor(options: WebKtAppOptions) {
        this.options = options
        
        this.serverMessageHandlers.set(MetadataProtos.Metadata.Type.RENDER, new WebKtRenderMessageHandler(options));
        this.serverMessageHandlers.set(MetadataProtos.Metadata.Type.LINK, new WebKtLinkMessageHandler(options));
    }

    start() {
        const client = new RSocketClient({
            serializers: IdentitySerializers,
            setup: {
                keepAlive: 60000, // millis between sending keepalive frames to server
                lifetime: 180000, // timeout (millis) if no keepalive response
                metadataMimeType: APPLICATION_OCTET_STREAM.string,
                dataMimeType: APPLICATION_OCTET_STREAM.string,
            },
            transport: new RSocketWebSocketClient({ url: this.options.serverUrl }, WebKtEncoders),
        });

        client
            .connect()
            .subscribe({
                onSubscribe: cancelCallback => {
                    log.debug(`Connecting to server url ${this.options.serverUrl}...`)
                    this.rSocketConnectionCancelCallback = cancelCallback
                },
                onComplete: socket => {
                    log.debug(`Successfuly established rsocker server connection, url ${this.options.serverUrl}`)
                    const webktChannel = this.establishWebktChannelConnection(socket)
                },
                onError: it => {
                    log.error(`Error establishing rsocket server connection, url ${this.options.serverUrl}`, it)
                },
            })
    }

    stop() {
        if (this.rSocketConnectionCancelCallback !== null) {
            this.rSocketConnectionCancelCallback()
        }
        if (this.webktChannelSubscription !== null) {
            this.webktChannelSubscription.cancel()
        }
    }

    private establishWebktChannelConnection(socket: ReactiveSocket<any, any>): WebktChannel {
        const webktChannel = new DefaultWebktChannel()

        const flowable = new Flowable<Payload<Uint8Array, Uint8Array>>(subscriber => {
            webktChannel.setSink(subscriber);
            subscriber.onSubscribe(webktChannel);
        });

        socket
            .requestChannel(flowable)
            .subscribe({
                onSubscribe: subscription => {
                    this.webktChannelSubscription = subscription
                    requestInfiniteDemand(subscription)
                    webktChannel.send({
                        type: WebktMessageType.SESSION_RESTORATION,
                        content: new Uint8Array(new ArrayBuffer(10)),
                    })
                },
                onNext: payload => this.handleServerMessage(payload.metadata, payload.data),
                onError: it => {
                    const errorSource = (it as any).source
                    log.error(`Webkt channel error`, it, (errorSource))
                },
            });

        return webktChannel;
    }

    private handleServerMessage(metadata: any, data: any) {
        const metadataPb = MetadataProtos.Metadata.deserializeBinary(metadata);
        log.debug(`on next metadata ${metadataPb} ${metadataPb.getType()}`);

        if (!this.serverMessageHandlers.has(metadataPb.getType())) {
            throw Error(`unknown server message type ${metadataPb.getType()}`);
        }
        const handler = this.serverMessageHandlers.get(metadataPb.getType());
        handler?.deserializeAndHandle(data);
    }
}
