import { task } from "hardhat/config";
import { ERC20Mock } from "../typechain-types";

task(
    "mintOwner",
    "mintOwner(amount, spender) to mint ERC20 tokens to owner"
).addParam("amount", "the amount to mint (in wei)")
    .setAction(async ({ amount }, hre) => {
        const accounts = await hre.ethers.getSigners()
        const deployment = await hre.deployments.get("ERC20Mock")
        const erc20 = await hre.ethers.getContractAt(deployment.abi, deployment.address) as unknown as ERC20Mock
        const owner = accounts[0].address

        try {
            let tx = await (await erc20.mintOwner(owner, amount)).wait()
            console.log(`✅ [${hre.network.name}] approve(${owner}, ${amount})`)
            console.log(` tx: ${tx?.hash}`)
        } catch (e: any) {
            console.log(`❌ [${hre.network.name}] migrate(${owner}, ${amount})`)
            console.log(e.message)
        }
    });