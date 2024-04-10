let API_KEY = '';
const PINATA_BASE_URL = 'https://api.pinata.cloud';
const ENDPOINT_UNPIN = '/pinning/unpin/';
const ENDPOINT_PIN_LIST = '/data/pinList';
const ENDPOINT_PIN_BY_HASH = '/pinning/pinByHash';

async function pinataApiReq(resource, method = 'GET', body = null) {
  const headers = {
    authorization: `Bearer ${API_KEY}`,
  };

  const options = {
    method,
    headers
  };

  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  return fetch(PINATA_BASE_URL + resource, options).then(data =>
    data.json().then(encoded => encoded, _ => data)
  );
}

async function upadtePinned(apiKey, pinName, cidToPin) {
  API_KEY = apiKey;
  let response = await pinataApiReq(ENDPOINT_PIN_LIST);
  const hashesToUnpin = response.rows
    .filter(r => r.date_unpinned === null &&
      r.metadata.name === pinName)
    .map(r => r.ipfs_pin_hash);

  await Promise.all(hashesToUnpin.map(cid =>
    pinataApiReq(ENDPOINT_UNPIN + cid, 'DELETE').then(_ => {
      console.log(`unpinned: ${cid}`);
    })
  ));

  response = await pinataApiReq(ENDPOINT_PIN_BY_HASH, 'POST', {
    hashToPin: cidToPin,
    pinataMetadata: JSON.stringify({
      name: pinName
    }),
  });

  console.log(`pinned: ${response.ipfsHash}`);
}

upadtePinned(
  process.argv[2],
  process.argv[3],
  process.argv[4]
);
