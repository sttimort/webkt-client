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
import { WebKtHtmlElement, WebKtHtmlElementType, WebKtRenderMessage, WebKtRenderMessageAction, WebKtRenderMessageImpl } from './proto/types/WebKtElement';

const MetadataProtos = require('./proto/Metadata_pb')
const WebKtRenderMessageProtos = require('./proto/WebKtRenderMessage_pb')

interface WebKtAppOptions {
    serverUrl: string
}

export class WebKtApp {
    private options: WebKtAppOptions;

    private rSocketConnectionCancelCallback: CancelCallback | null = null
    private webktChannelSubscription: ISubscription | null = null

    constructor(options: WebKtAppOptions) {
        this.options = options
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
                onNext: payload => {
                    const metadataPb = MetadataProtos.Metadata.deserializeBinary(payload.metadata);
                    log.debug(`on next metadata ${metadataPb} ${metadataPb.getType()}`);
                    log.debug(`on next data ${payload.data}`)

                    if (metadataPb.getType() === MetadataProtos.Metadata.Type.RENDER) {
                        const renderMessagePb = WebKtRenderMessageProtos.WebKtRenderMessage.deserializeBinary(payload.data);
                        this.t(new WebKtRenderMessageImpl(renderMessagePb));
                    }
                },
                onError: it => {
                    const errorSource = (it as any).source
                    log.error(`Webkt channel error`, it, (errorSource))
                },
            });

        return webktChannel;
    }

    private t(renderMessage: WebKtRenderMessage) {
        const targetElement = document.getElementById(renderMessage.targetElementId)
        if (targetElement === null || targetElement === undefined) {
            log.warn(`render message target element ${renderMessage.targetElementId} not found`)
            return;
        }
        
        if (renderMessage.action === WebKtRenderMessageAction.OVERWRITE) {
            throw Error("NOT SUPPORTED");
        }

        const documentFragment = new DocumentFragment();
        renderMessage.elements.forEach(it => {
            documentFragment.appendChild(this.createHtmlElement(it));
        });
        
        if (renderMessage.action === WebKtRenderMessageAction.OVERWRITE_CHILDREN && targetElement.hasChildNodes) {
            targetElement.childNodes.forEach(child => {
                targetElement.removeChild(child);
            })
        }
        targetElement.appendChild(documentFragment);
    }

    private createHtmlElement(webKtHtmlElement: WebKtHtmlElement): HTMLElement | Text {
        let resultElement = null;
        if (webKtHtmlElement.type === WebKtHtmlElementType.TEXT) {
            resultElement = document.createTextNode(webKtHtmlElement.text);
        } else {
            const nonTextElement = document.createElement(tagNameByType[webKtHtmlElement.type]);
            webKtHtmlElement.children.forEach(child => {
                nonTextElement.appendChild(this.createHtmlElement(child));
            });
            resultElement = nonTextElement;
        }

        return resultElement;
    }
}

const tagNameByType = {
    [WebKtHtmlElementType.DIV]: 'div'
}