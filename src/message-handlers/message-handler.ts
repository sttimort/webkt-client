export interface WebKtMessageHandler {
    deserializeAndHandle(data: any): void;
}