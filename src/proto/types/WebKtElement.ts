const WebKtRenderMessageProtos = require('../WebKtRenderMessage_pb');

const WebKtHtmlElementPb = WebKtRenderMessageProtos.WebKtHtmlElement;

export enum WebKtRenderMessageAction {
    OVERWRITE = 0,
    OVERWRITE_CHILDREN = 1,
    APPEND_CHILDREN = 2,
}

export interface WebKtRenderMessage {
    action: WebKtRenderMessageAction,
    targetElementId: string,
    elements: WebKtHtmlElement[],
}

export interface WebKtHtmlElement {
    type: WebKtHtmlElementType,
    text: string,
    children: WebKtHtmlElement[],
}

export class WebKtRenderMessageImpl implements WebKtRenderMessage {
    private webKtRenderMessagePb: any

    constructor(webKtRenderMessagePb: any) {
        this.webKtRenderMessagePb = webKtRenderMessagePb;
    }

    get action(): WebKtRenderMessageAction {
        return this.webKtRenderMessagePb.getAction() as WebKtRenderMessageAction;
    }

    get targetElementId(): string {
        return this.webKtRenderMessagePb.getTargetelementid() as string;
    }

    get firstElement(): WebKtHtmlElement | null {
        let firstElement: WebKtHtmlElement | null = null;
        const elements: any[] = this.webKtRenderMessagePb.getElementList();
        if (elements.length > 0) {
            firstElement = new WebKtHtmlElementImpl(elements[0]);
        }
        return firstElement;
    }

    get elements(): WebKtHtmlElement[] {
        const elements: any[] = this.webKtRenderMessagePb.getElementList()
        return elements.map(it => new WebKtHtmlElementImpl(it));
    }
}

export enum WebKtHtmlElementType {
    TEXT = 0,
    DIV = 1
}

class WebKtHtmlElementImpl implements WebKtHtmlElement {
    private webKtElementPb: any;

    constructor(webKtElementPb: any) {
        this.webKtElementPb = webKtElementPb;
    }

    get type(): WebKtHtmlElementType {
        return this.webKtElementPb.getType() as WebKtHtmlElementType
    }

    get text(): string {
        return this.webKtElementPb.getText() as string
    }

    get children(): WebKtHtmlElement[] {
        const childrenPbs = this.webKtElementPb.getChildList() as any[]
        return childrenPbs.map(it => new WebKtHtmlElementImpl(it))
    }
}