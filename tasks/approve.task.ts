import { task } from "hardhat/config";
import { IERC20 } from "../typechain-types";

task(
    "approve",
    "approve(amount, spender) to approve use of ERC20 tokens by spender"
).addParam("amount", "the amount to approve (in wei)")
    .addParam("spender", "spender address")
    .setAction(async ({ amount, spender }, hre) => {
        const deployment = await hre.deployments.get("ERC20Mock")
        const erc20 = await hre.ethers.getContractAt(deployment.abi, deployment.address) as unknown as IERC20

        try {
            let tx = await (await erc20.approve(spender, amount)).wait()
            console.log(`✅ [${hre.network.name}] approve(${spender}, ${amount})`)
            console.log(` tx: ${tx?.hash}`)
        } catch (e: any) {
            console.log(`❌ [${hre.network.name}] migrate(${spender}, ${amount})`)
            console.log(e.message)
        }
    });