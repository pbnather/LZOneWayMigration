# LZOneWayMigration
Contracts to perform migration of any ERC20 token to other chain using Layer Zero network. 

Users will send their ERC20 tokens to `Burner` contract on source chain, and through LayerZero, 
`Minter` contract on destination chain will be called thus calling `mint()` of your new ERC20.

## Deployment

0. Create `.env` file based on `.env.example` file.
1. Install dependencies, compile contracts, and run tests:

    `yarn && npx hardhat test`

3. On the source chain (where your ERC20) is located, deploy `Burner` contract:

    `npx hardhat --network <burner-network> deploy --tags Burner`
   
5. On the destination chain, deploy your new ERC20 token implementing `IMintable`.
6. On the destination chain, deploy `Minter` contract (make sure `Minter` can call `mint()` of your new ERC20):
   
    `npx hardhat --network <minter-network> deploy --tags Minter`
   
7. Run `setTrsutedRemotes` task:

    1. `npx hardhat --network <burner-network> setTrustedRemote --target-network <minter-netowrk> --local-contract Burner --remote-contract Minter`
  
    3. `npx hardhat --network <minter-network> setTrustedRemote --target-network <burner-netowrk> --local-contract Minter --remote-contract Burner`
    
8. (Optional) verify with:
   
    `npx hardhat --network <network> etherscan-verify --api-key <api-key>`
   
10. Unpause `Burner` contract to enable migrating:
    
    `npx hardhat --network <burner-network> pause --unpause`

## Migration

1. Approve amount of ERC20 to migrate to `Burner` contract.
2. Call `estimateFee()` of `Burner` contract. 
3. Call `migrate()` of `Burner` contract, with `fee` copied from `estimateFee()` output.
    **Also `msg.value` in native tokens should match `fee`.**
4. Copy tx hash, and check your migration on [LayerZero Scan](https://layerzeroscan.com/)
5. If message Status is `Delivered`, but Destination transaction error is `Stored payload`, 
refer to troubleshooting down below, otherwise migration should be succesfull.  

You can also listen for `MigrationStarted` and `MigrationFinished` events.

## Troubleshooting

**No network in hardhat** 

Update `hardhat.confid.ts` with new networks if needed. 

**PayloadStored error in LayerZero Scan**

It should only happen if `mint()` function of your new ERC20 reverts, eg. by being Paused.
It will block all further migrations until you unblock `mint()` function and retry message.
You can check `<amount>` and `<user-address>` in `MigrationStarted` event of `Burner` contract, 
with `nonce` same as one with `PayloadStored` in LayerZero Scan [Example](https://layerzeroscan.com/112/address/0x04625b4cf773885ebb22f0caa51b55b98b3071ce/message/102/address/0x04625b4cf773885ebb22f0caa51b55b98b3071ce/nonce/2).

    `npx hardhat --network <minter-network> retryPayload --amount <amount> --user <user-address> --source-chain <burner-network>`
