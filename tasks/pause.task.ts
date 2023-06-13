import { task } from "hardhat/config";

task(
    "pause",
    "pause contract"
).addFlag("token", "pause destination token instead of burner")
    .addFlag("unpause", "unpause contract instead of pausing")
    .setAction(async ({ token, unpause }, hre) => {
        const deployment = await hre.deployments.get(token ? "ERC20Mock" : "Burner")
        const contract = await hre.ethers.getContractAt(deployment.abi, deployment.address)
        try {
            let tx = unpause ? await (await contract.unpause()).wait() : await (await contract.pause()).wait()
            console.log(`✅ [${hre.network.name}] ${unpause ? "unpause()" : "pause()"}`)
            console.log(` tx: ${tx?.hash}`)
        } catch (e: any) {
            console.log(`❌ [${hre.network.name}] ${unpause ? "unpause()" : "pause()"}`)
            console.log(e.message)
        }
    });