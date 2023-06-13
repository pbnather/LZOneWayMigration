import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;
  const { deploy } = deployments;

  const accounts = await ethers.getSigners();

  await deploy('ERC20Mock', {
    from: accounts[0].address,
    args: ['SOURCE_TOKEN', 'SRC'],
    log: true,
  });
};

export default func;
func.tags = ['ERC20Mock'];