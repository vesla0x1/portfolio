import { create, globSource } from 'kubo-rpc-client';

async function IPFSDeploy(ipfsRpcApiKey, ipfsRpcApiUrl, ipfsRpcApiNameKey, outDirName){
  const client = await create({
    url: `${ipfsRpcApiUrl}/api/v0`,
    headers: {
      authorization: `Bearer ${ipfsRpcApiKey}`,
    }
  });

  let lastUploadedCID;
  console.log('adding files on IPFS..');
  for await (const file of client.addAll(globSource(".", `${outDirName}/**/*`))) {
    console.log(`${file.cid.toString()} ${file.path.toString()}`);
    lastUploadedCID = file.cid.toString();
  }
  console.log(`pinned: ${lastUploadedCID}`);

  for await (const file of client.pin.ls()) {
    const cid = file.cid.toString();
    if (file.type === 'recursive' && cid !== lastUploadedCID) {
      for await (const unpinned of client.pin.rmAll(file)) {
        console.log(`unpinned: ${unpinned.toString()}`);
      }
    }
  }

  console.log('publishing on IPNS...')
  const r = await client.name.publish(`${lastUploadedCID}`, {
      key: ipfsRpcApiNameKey
  });
  console.log('new version available on:');
  console.log(`IPFS address: https://ipfs.io/ipfs/${lastUploadedCID}`);
  console.log(`IPNS address: https://ipfs.io/ipns/${r.name}`);
}

IPFSDeploy(
  process.argv[2],
  process.argv[3],
  process.argv[4],
  process.argv[5]
);
