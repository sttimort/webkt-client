import * as log from "loglevel";
import { WebKtLinkMessageImpl } from "../proto/types/WebKtLinkMessage";
import { WebKtAppOptions } from "../webkt-app";
import { WebKtMessageHandler } from "./message-handler";

const WebKtLinkMessageProtos = require("../proto/WebKtLinkMessage_pb");

export class WebKtLinkMessageHandler implements WebKtMessageHandler {
    private options: WebKtAppOptions;

    constructor(options: WebKtAppOptions) {
        this.options = options;
    }

    deserializeAndHandle(data: any): void {
        const linkMessagePb = WebKtLinkMessageProtos.WebKtLinkMessage.deserializeBinary(data);
        const linkMessage = new WebKtLinkMessageImpl(linkMessagePb);

        const headElement = this.getHeadElementOrThrow();

        const newLinkElement = document.createElement("link");
        log.info(`type ${linkMessage.linkType} rel ${linkMessage.linkRelation} href ${linkMessage.linkHref}`);
        newLinkElement.type = linkMessage.linkType;
        newLinkElement.rel = linkMessage.linkRelation;
        newLinkElement.href = linkMessage.linkHref;

        headElement.appendChild(newLinkElement)
    }

    private getHeadElementOrThrow(): HTMLHeadElement {
        const headElements = document.getElementsByTagName("head");
        if (headElements.length < 1) {
            throw Error("Couldn't find head element on the page");
        }

        return headElements[0];
    }
}