import { Encoder, Encoders, Encodable, UTF8Encoder } from 'rsocket-core';

const UInt8ArrayEncoder: Encoder<Uint8Array> = {
    byteLength(value: Encodable): number {
        if (!(value instanceof Uint8Array)) {
            throw Error(`UInt8ArrayEncoder can't encode value of type ${typeof value}`);
        }

        const uInt8Array = value as Uint8Array
        return uInt8Array.byteLength
    },

    encode(value: Encodable, buffer: Uint8Array, start: number, end: number): number {
        if (!(value instanceof Uint8Array)) {
            throw Error(`UInt8ArrayEncoder can't encode value of type ${typeof value}`);
        }

        const uInt8Array = value as Uint8Array;

        let valueIdx = 0;
        let bufferIdx = start;
        while (bufferIdx < end) {
            buffer[bufferIdx++] = uInt8Array[valueIdx++];
        }

        return end;
    },

    decode(buffer: Uint8Array, start: number, end: number): Uint8Array {
        const arrayBuffer = new ArrayBuffer(end - start);
        const uInt8Array = new Uint8Array(arrayBuffer);

        let valueIdx = 0;
        let bufferIdx = start;
        while (bufferIdx < end) {
            uInt8Array[valueIdx++] = buffer[bufferIdx++];
        }

        return uInt8Array;
    },
}

export const WebKtEncoders: Encoders<Encodable> = {
    metadataMimeType: UTF8Encoder,
    metadata: UInt8ArrayEncoder,
    dataMimeType: UTF8Encoder,
    data: UInt8ArrayEncoder,
    message: UTF8Encoder,
    resumeToken: UTF8Encoder,
}