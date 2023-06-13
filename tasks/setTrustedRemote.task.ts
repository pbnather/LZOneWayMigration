import { task } from "hardhat/config";
const CHAIN_ID = require("../constants/chainIds.json")
const { getDeploymentAddresses } = require("../utils/readStatic")

task(
    "setTrustedRemote",
    "setTrustedRemote(chainId, sourceAddr) to enable inbound/outbound messages with your other contracts"
).addParam("targetNetwork", "the target network to set as a trusted remote")
    .addOptionalParam("localContract", "Name of local contract if the names are different")
    .addOptionalParam("remoteContract", "Name of remote contract if the names are different")
    .addOptionalParam("contract", "If both contracts are the same name")
    .setAction(async ({ localContract, remoteContract, contract, targetNetwork }, hre) => {
        if (contract) {
            localContract = contract;
            remoteContract = contract;
        } else {
            localContract = localContract;
            remoteContract = remoteContract;
        }

        if (!localContract || !remoteContract) {
            console.log("Must pass in contract name OR pass in both localContract name and remoteContract name")
            return
        }

        // get local contract
        const deployment = await hre.deployments.get(localContract)
        const localContractInstance = await hre.ethers.getContractAt(deployment.abi, deployment.address)

        // get deployed remote contract address
        const remoteAddress = getDeploymentAddresses(targetNetwork)[remoteContract]

        // get remote chain id
        const remoteChainId = CHAIN_ID[targetNetwork]

        // concat remote and local address
        let remoteAndLocal = hre.ethers.solidityPacked(
            ['address', 'address'],
            [remoteAddress, await localContractInstance.getAddress()]
        )

        // check if pathway is already set
        const isTrustedRemoteSet = await localContractInstance.isTrustedRemote(remoteChainId, remoteAndLocal);

        if (!isTrustedRemoteSet) {
            try {
                let tx = await (await localContractInstance.setTrustedRemote(remoteChainId, remoteAndLocal)).wait()
                console.log(`✅ [${hre.network.name}] setTrustedRemote(${remoteChainId}, ${remoteAndLocal})`)
                console.log(` tx: ${tx?.hash}`)
            } catch (e: any) {
                if (e.error.message.includes("The chainId + address is already trusted")) {
                    console.log("*source already set*")
                } else {
                    console.log(`❌ [${hre.network.name}] setTrustedRemote(${remoteChainId}, ${remoteAndLocal})`)
                }
            }
        } else {
            console.log("*source already set*")
        }
    });