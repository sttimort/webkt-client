import log from 'loglevel';
import { WebKtAppOptions } from "../webkt-app";

import {
    WebKtHtmlElement, 
    WebKtHtmlElementType, 
    WebKtRenderMessageAction, 
    WebKtRenderMessageImpl
} from '../proto/types/WebKtElement';
import { WebKtMessageHandler } from './message-handler';

const WebKtRenderMessageProtos = require('../proto/WebKtRenderMessage_pb')

export class WebKtRenderMessageHandler implements WebKtMessageHandler {
    private options: WebKtAppOptions;

    constructor(options: WebKtAppOptions) {
        this.options = options;
    }

    deserializeAndHandle(data: any) : void {
        const renderMessagePb = WebKtRenderMessageProtos.WebKtRenderMessage.deserializeBinary(data);
        const renderMessage = new WebKtRenderMessageImpl(renderMessagePb);
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
            webKtHtmlElement.attributes.forEach((value, key) => {
                nonTextElement.setAttribute(key, value);
            });
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