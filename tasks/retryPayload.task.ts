import { task } from "hardhat/config";
import { ILayerZeroEndpoint } from "../typechain-types";
const CHAIN_ID = require("../constants/chainIds.json")
const ENDPOINTS = require("../constants/layerzeroEndpoints.json");
const { getDeploymentAddresses } = require("../utils/readStatic")

task(
    "retryPayload",
    "retryPayload(srcChainId, srcAddress, payload) to retry blocked payload"
).addParam("amount", "the amount from original payload")
    .addParam("user", "user address from original payload")
    .addParam("sourceChain", "Name of the source chain")
    .setAction(async ({ amount, user, sourceChain }, hre) => {
        const endpointAddress = ENDPOINTS[hre.network.name]
        const endpoint = await hre.ethers.getContractAt("ILayerZeroEndpoint", endpointAddress) as unknown as ILayerZeroEndpoint
        const minter = await hre.deployments.get("Minter")

        // get deployed remote contract address
        const remoteAddress = getDeploymentAddresses(sourceChain)["Burner"]

        // concat remote and local address
        let remoteAndLocal = hre.ethers.solidityPacked(
            ['address', 'address'],
            [remoteAddress, minter.address]
        )
        let payload = hre.ethers.solidityPacked(
            ['uint96', 'address', 'uint256'],
            [0, user, amount]
        )

        console.log("Payload: ", payload)
        console.log("srcAddress: ", remoteAndLocal)

        try {
            let tx = await (await endpoint.retryPayload(CHAIN_ID[sourceChain], remoteAndLocal, payload)).wait()
            console.log(`✅ [${hre.network.name}] retryPayload()`)
            console.log(` tx: ${tx?.hash}`)
        } catch (e: any) {
            console.log(`❌ [${hre.network.name}] retryPayload()`)
            console.log(e.message)
        }
    });