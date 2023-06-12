import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { Burner, Minter, ERC20Mock, LZEndpointMock } from '../typechain-types'
import chain_ids from "../constants/chainIds.json"

const ERC20_MOCK_ARTIFACT_NAME = 'ERC20Mock'
const LZ_ENDPOINT_MOCK_ARTIFACT_NAME = 'LZEndpointMock'
const BURNER_ARTIFACT_NAME = 'Burner'
const MINTER_ARTIFACT_NAME = 'Minter'

export const ERROR_TOO_SMALL_FEE = "TooSmallFee"
export const ERROR_AMOUNT_ZERO = "AmountIsZero"
export const ERROR_DST_ADDRESS = "DstAddressIsZero"
export const ERROR_ALLOWANCE = "ERC20: insufficient allowance"
export const ERROR_ERC20_EXCEEDS_BALANCE = "ERC20: transfer amount exceeds balance"
export const ERROR_PAUSABLE_PAUSED = "Pausable: paused"
export const ERROR_PAUSABLE_UNPAUSED = "Pausable: not paused"
export const ERROR_OWNABLE = "Ownable: caller is not the owner"

export async function deployContractFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, user] = await ethers.getSigners()

    const lzAvalancheEndpointMock = await ethers.deployContract(LZ_ENDPOINT_MOCK_ARTIFACT_NAME, [chain_ids["avalanche"]]) as LZEndpointMock
    await lzAvalancheEndpointMock.waitForDeployment()

    const lzEthereumEndpointMock = await ethers.deployContract(LZ_ENDPOINT_MOCK_ARTIFACT_NAME, [chain_ids["ethereum"]]) as LZEndpointMock
    await lzEthereumEndpointMock.waitForDeployment()

    const erc20Mock = await ethers.deployContract(ERC20_MOCK_ARTIFACT_NAME, ["TOKEN", "TKN"]) as ERC20Mock
    await erc20Mock.waitForDeployment()

    const burnerContract = await ethers.deployContract(BURNER_ARTIFACT_NAME, [lzAvalancheEndpointMock.getAddress(), erc20Mock.getAddress(), chain_ids["ethereum"]]) as Burner
    await burnerContract.waitForDeployment()

    const minterContract = await ethers.deployContract(MINTER_ARTIFACT_NAME, [lzEthereumEndpointMock.getAddress(), erc20Mock.getAddress(), chain_ids["avalanche"]]) as Minter
    await minterContract.waitForDeployment()

    await lzAvalancheEndpointMock.setDestLzEndpoint(await minterContract.getAddress(), await lzEthereumEndpointMock.getAddress())
    let remoteEthereumAndLocal = ethers.solidityPacked(['address', 'address'], [await minterContract.getAddress(), await burnerContract.getAddress()])
    await burnerContract.setTrustedRemote(chain_ids["ethereum"], remoteEthereumAndLocal)

    await erc20Mock.mint(user.address, 1000n)
    expect(await erc20Mock.balanceOf(user.address)).to.be.eq(1000n);

    return { burnerContract, erc20Mock, lzAvalancheEndpointMock, lzEthereumEndpointMock, owner, user }
}

export async function deployUnpausedContractFixture() {
    // Contracts are deployed using the first signer/account by default
    const { burnerContract, erc20Mock, lzAvalancheEndpointMock, lzEthereumEndpointMock, owner, user } = await loadFixture(deployContractFixture)
    await burnerContract.unpause()
    return { burnerContract, erc20Mock, lzAvalancheEndpointMock, lzEthereumEndpointMock, owner, user }
}

export default {}
