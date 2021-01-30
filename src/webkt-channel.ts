import type { ReactiveSocket, ISubscription, ISubscriber } from 'rsocket-types';
import { INT32_MAX_VALUE } from './utils';

const { Metadata } = require('./proto/metadata_pb')

export enum WebktMessageType {
    SESSION_RESTORATION
}

export interface WebktMessage {
    type: WebktMessageType,
    content: any,
}

export interface WebktChannel {
    send(value: WebktMessage): void;
}

export class DefaultWebktChannel implements WebktChannel, ISubscription {
    private requested: number | null = null;
    private isCancelled: boolean = false;
    private sink: ISubscriber<any> | null = null;

    send(message: WebktMessage): void {
        const metadataPb = new Metadata();
        switch (message.type) {
            case WebktMessageType.SESSION_RESTORATION:
                metadataPb.setType(Metadata.Type.SESSION_RESTORATION);
                break;
        }

        this.sink?.onNext({
            metadata: metadataPb.serializeBinary(),
            data: message.content
        })
    }

    send1(payload: any) {
        this.sink?.onNext(payload)
    }

    setSink(sink: ISubscriber<any>) {
        this.sink = sink;
    }

    request(n: number): void {
        if (this.requested === null) {
            this.requested = n;
        } else {
            const sum = this.requested + n;
            this.requested = Math.min(sum, INT32_MAX_VALUE);
        }
    }

    cancel(): void {
        this.isCancelled = true;
    }
}