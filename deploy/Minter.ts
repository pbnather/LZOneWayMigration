import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import LZ_ENDPOINTS from '../constants/layerzeroEndpoints.json'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, network } = hre;
  const { deploy } = deployments;

  const accounts = await ethers.getSigners();

  const erc20 = (await deployments.get("ERC20Mock")).address
  const lzEndpoint = LZ_ENDPOINTS[network.name]

  console.log("Arguments: ", [lzEndpoint, erc20])

  await deploy('Minter', {
    from: accounts[0].address,
    args: [lzEndpoint, erc20],
    log: true,
  });
};

export default func;
func.tags = ['Minter'];