import log from 'loglevel';

const testPbProtos = require('./proto/test_pb')

export default function testProto() {
    const SearchRequest = testPbProtos.SearchRequest;

    log.debug(SearchRequest);
    const testMessage = new SearchRequest();
    testMessage.setQuery('query');
    testMessage.setPageNumber(1);
    testMessage.setResultPerPage(2);

    const serialized = testMessage.serializeBinary();

    log.debug('serialized message', serialized);

    const deserMessage = SearchRequest.deserializeBinary(serialized);
    log.debug('deserialized', deserMessage.toObject());
}