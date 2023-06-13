import { task } from "hardhat/config";
import { Burner } from "../typechain-types";

task(
    "migrate",
    "migrate(amount, dstAddress, fee) to migrate tokens to another chain"
).addParam("amount", "the amount to migrate")
    .addOptionalParam("customFee", "Custom native fee for bridging (in wei)")
    .setAction(async ({ amount, customFee }, hre) => {
        const accounts = await hre.ethers.getSigners();
        const deployment = await hre.deployments.get("Burner")
        const burner = await hre.ethers.getContractAt(deployment.abi, deployment.address) as unknown as Burner

        var fees = await burner.estimateFee(amount, accounts[0].address);
        if (customFee) {
            fees = customFee
        }
        console.log(`fees (wei): ${fees} / (native): ${hre.ethers.formatEther(fees)}`)

        try {
            let tx = await (await burner.migrate(amount, accounts[0].address, fees, { value: fees })).wait()
            console.log(`✅ [${hre.network.name}] migrate(${amount}, ${accounts[0].address})`)
            console.log(` tx: ${tx?.hash}`)
        } catch (e: any) {
            console.log(`❌ [${hre.network.name}] migrate(${amount}, ${accounts[0].address})`)
            console.log(e.message)
        }
    });