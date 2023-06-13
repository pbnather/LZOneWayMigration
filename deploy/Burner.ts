import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import LZ_ENDPOINTS from '../constants/layerzeroEndpoints.json'
import LZ_CHAIN_IDS from "../constants/chainIds.json"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, network } = hre;
  const { deploy } = deployments;

  const accounts = await ethers.getSigners();

  const erc20 = (await deployments.get("ERC20Mock")).address
  const lzEndpoint = LZ_ENDPOINTS[network.name]
  var chainId

  if (network.name == "fuji") {
    chainId = LZ_CHAIN_IDS["goerli"]
  }
  if (network.name == "avalanche") {
    chainId = LZ_CHAIN_IDS["ethereum"]
  }
  if (network.name == "fantom") {
    chainId = LZ_CHAIN_IDS["bsc"]
  }

  console.log("Arguments: ", [lzEndpoint, erc20, chainId])

  await deploy('Burner', {
    from: accounts[0].address,
    args: [lzEndpoint, erc20, chainId],
    log: true,
  });
};

export default func;
func.tags = ['Burner'];