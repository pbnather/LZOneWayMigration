import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import chain_ids from "../constants/chainIds.json"
import "./common.test"
import { deployContractFixture, deployUnpausedContractFixture } from './common.test'

describe('Minter', function () {
    describe('Deployment', () => {
        it('Should set owner correctly', async () => {
            const { minterContract, owner } = await loadFixture(deployContractFixture)
            expect(await minterContract.owner()).to.be.eq(owner.address)
        })

        it('Should set lzEndpoint address correctly', async () => {
            const { minterContract, lzEthereumEndpointMock } = await loadFixture(deployContractFixture)
            expect(await minterContract.lzEndpoint()).to.be.eq(await lzEthereumEndpointMock.getAddress())
        })

        it('Should set token address correctly', async () => {
            const { minterContract, erc20Mock } = await loadFixture(deployContractFixture)
            expect(await minterContract.token()).to.be.eq(await erc20Mock.getAddress())
        })
    })

    describe('End-to-End', () => {
        it('Should mint tokens properly', async () => {
            const { burnerContract, erc20Mock, user } = await loadFixture(deployUnpausedContractFixture)
            let fee = await burnerContract.estimateFee(1000n, user.address)
            await erc20Mock.connect(user).approve(await burnerContract.getAddress(), 2000n)
            await burnerContract.connect(user).migrate(1000n, user.address, fee, { value: fee })
            expect(await erc20Mock.totalSupply()).to.be.eq(2000n)
            expect(await erc20Mock.balanceOf(await burnerContract.getAddress())).to.be.eq(1000n)
            expect(await erc20Mock.balanceOf(user.address)).to.be.eq(1000n)

        })

        it('Should emit MigrationFinished event', async () => {
            const { burnerContract, minterContract, erc20Mock, user } = await loadFixture(deployUnpausedContractFixture)
            let fee = await burnerContract.estimateFee(1000n, user.address)
            await erc20Mock.connect(user).approve(await burnerContract.getAddress(), 2000n)
            await expect(burnerContract.connect(user).migrate(1000n, user.address, fee, { value: fee })).to.emit(minterContract, 'MigrationFinished').withArgs(user.address, 1000n, 1)
        })

        it('Should emit PayloadStored event on blocked msg', async () => {
            const { lzEthereumEndpointMock, burnerContract, minterContract, erc20Mock, user } = await loadFixture(deployUnpausedContractFixture)
            await erc20Mock.pause()
            let fee = await burnerContract.estimateFee(500n, user.address)
            await erc20Mock.connect(user).approve(await burnerContract.getAddress(), 2000n)
            await lzEthereumEndpointMock.blockNextMsg()

            let remoteAvalancheAndLocal = ethers.solidityPacked(['address', 'address'], [await burnerContract.getAddress(), await minterContract.getAddress()])
            let payload = ethers.solidityPacked(['uint96', 'address', 'uint256'], [0, user.address, 500n])
            await expect(burnerContract.connect(user).migrate(500n, user.address, fee, { value: fee })).to.emit(lzEthereumEndpointMock, 'PayloadStored')
                .withArgs(chain_ids["avalanche"], remoteAvalancheAndLocal, await minterContract.getAddress(), 1, payload, '0x')

            await erc20Mock.unpause()
            await lzEthereumEndpointMock.retryPayload(chain_ids["avalanche"], remoteAvalancheAndLocal, payload)
            expect(await erc20Mock.totalSupply()).to.be.eq(1500n)
            expect(await erc20Mock.balanceOf(await burnerContract.getAddress())).to.be.eq(500n)
            expect(await erc20Mock.balanceOf(user.address)).to.be.eq(1000n)
        })
    })
})
