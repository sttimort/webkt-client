export interface WebKtLinkMessage {
    linkType: string,
    linkRelation: string,
    linkHref: string,
}

export class WebKtLinkMessageImpl implements WebKtLinkMessage {
    private webKtLinkMessagePb: any;

    constructor(webKtLinkMessagePb: any) {
        this.webKtLinkMessagePb = webKtLinkMessagePb;
    }

    get linkType(): string {
        return this.webKtLinkMessagePb.getLinktype() as string;
    }

    get linkRelation(): string {
        return this.webKtLinkMessagePb.getLinkrelation() as string;
    }

    get linkHref(): string {
        return this.webKtLinkMessagePb.getLinkhref() as string;
    }
}
