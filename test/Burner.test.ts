import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import chain_ids from "../constants/chainIds.json"
import "./common.test"
import { deployContractFixture, ERROR_AMOUNT_ZERO, ERROR_DST_ADDRESS, deployUnpausedContractFixture, ERROR_TOO_SMALL_FEE, ERROR_ALLOWANCE, ERROR_ERC20_EXCEEDS_BALANCE, ERROR_PAUSABLE_PAUSED, ERROR_PAUSABLE_UNPAUSED, ERROR_OWNABLE } from './common.test'

describe('Burner', function () {
    describe('Deployment', () => {
        it('Should set owner correctly', async () => {
            const { burnerContract, owner } = await loadFixture(deployContractFixture)
            expect(await burnerContract.owner()).to.be.eq(owner.address)
        })

        it('Should set lzEndpoint address correctly', async () => {
            const { burnerContract, lzAvalancheEndpointMock } = await loadFixture(deployContractFixture)
            expect(await burnerContract.lzEndpoint()).to.be.eq(await lzAvalancheEndpointMock.getAddress())
        })

        it('Should set token address correctly', async () => {
            const { burnerContract, erc20Mock } = await loadFixture(deployContractFixture)
            expect(await burnerContract.token()).to.be.eq(await erc20Mock.getAddress())
        })

        it('Should set dstChainId correctly', async () => {
            const { burnerContract } = await loadFixture(deployContractFixture)
            expect(await burnerContract.dstChainId()).to.be.eq(chain_ids["ethereum"])
        })

        it('Should be paused', async () => {
            const { burnerContract } = await loadFixture(deployContractFixture)
            expect(await burnerContract.paused()).to.be.true;
        })
    })

    describe('EstimateFee', () => {
        it('Should fail on zero amount', async () => {
            const { burnerContract, user } = await loadFixture(deployContractFixture)
            await expect(burnerContract.connect(user).estimateFee(0, user.address)).to.be.revertedWithCustomError(burnerContract, ERROR_AMOUNT_ZERO)
        })

        it('Should fail on dstAddress zero', async () => {
            const { burnerContract, user } = await loadFixture(deployContractFixture)
            await expect(burnerContract.connect(user).estimateFee(1, ethers.ZeroAddress)).to.be.revertedWithCustomError(burnerContract, ERROR_DST_ADDRESS)
        })

        it('Should return fee > 0', async () => {
            const { burnerContract, user } = await loadFixture(deployContractFixture)
            let fee = await burnerContract.connect(user).estimateFee(1000, user.address)
            expect(fee).to.be.gt(0)
        })
    })

    describe('Migrate', () => {
        it('Should fail on zero amount', async () => {
            const { burnerContract, user } = await loadFixture(deployUnpausedContractFixture)
            await expect(burnerContract.connect(user).migrate(0, user.address, 1, { value: 1 })).to.be.revertedWithCustomError(burnerContract, ERROR_AMOUNT_ZERO)
        })

        it('Should fail on dstAddress zero', async () => {
            const { burnerContract, user } = await loadFixture(deployUnpausedContractFixture)
            await expect(burnerContract.connect(user).migrate(1, ethers.ZeroAddress, 1, { value: 1 })).to.be.revertedWithCustomError(burnerContract, ERROR_DST_ADDRESS)
        })

        it('Should fail on zero fee', async () => {
            const { burnerContract, user } = await loadFixture(deployUnpausedContractFixture)
            await expect(burnerContract.connect(user).migrate(1, user.address, 0)).to.be.revertedWithCustomError(burnerContract, ERROR_TOO_SMALL_FEE)
        })

        it('Should fail on value lower than fee', async () => {
            const { burnerContract, user } = await loadFixture(deployUnpausedContractFixture)
            await expect(burnerContract.connect(user).migrate(1, user.address, 10, { value: 1 })).to.be.revertedWithCustomError(burnerContract, ERROR_TOO_SMALL_FEE)
        })

        it('Should fail on too low allowance', async () => {
            const { burnerContract, user } = await loadFixture(deployUnpausedContractFixture)
            await expect(burnerContract.connect(user).migrate(1, user.address, 1, { value: 1 })).to.be.revertedWith(ERROR_ALLOWANCE)
        })

        it('Should fail on too little tokens available', async () => {
            const { burnerContract, erc20Mock, user } = await loadFixture(deployUnpausedContractFixture)
            await erc20Mock.connect(user).approve(await burnerContract.getAddress(), 2000n)
            await expect(burnerContract.connect(user).migrate(2000n, user.address, 1, { value: 1 })).to.be.revertedWith(ERROR_ERC20_EXCEEDS_BALANCE)
        })

        it('Should fail if paused', async () => {
            const { burnerContract, user } = await loadFixture(deployContractFixture)
            await expect(burnerContract.connect(user).migrate(1, user.address, 1, { value: 1 })).to.be.revertedWith(ERROR_PAUSABLE_PAUSED)
        })

        it('Should send tx properly', async () => {
            const { burnerContract, erc20Mock, user } = await loadFixture(deployUnpausedContractFixture)
            let fee = await burnerContract.estimateFee(1000n, user.address)
            await erc20Mock.connect(user).approve(await burnerContract.getAddress(), 2000n)
            await expect(burnerContract.connect(user).migrate(1000n, user.address, fee, { value: fee })).not.to.be.reverted
        })

        it('Should emit MigrationStarted event', async () => {
            const { burnerContract, erc20Mock, user } = await loadFixture(deployUnpausedContractFixture)
            let fee = await burnerContract.estimateFee(1000n, user.address)
            await erc20Mock.connect(user).approve(await burnerContract.getAddress(), 2000n)
            await expect(burnerContract.connect(user).migrate(1000n, user.address, fee, { value: fee })).to.emit(burnerContract, "MigrationStarted").withArgs(user.address, 1000n, 1)
        })

        it('Should emit proper nonce', async () => {
            const { burnerContract, erc20Mock, user } = await loadFixture(deployUnpausedContractFixture)
            await erc20Mock.connect(user).approve(await burnerContract.getAddress(), 2000n)
            let fee = await burnerContract.estimateFee(500n, user.address)
            await expect(burnerContract.connect(user).migrate(500n, user.address, fee, { value: fee })).to.emit(burnerContract, "MigrationStarted").withArgs(user.address, 500n, 1)
            let fee2 = await burnerContract.estimateFee(500n, user.address)
            await expect(burnerContract.connect(user).migrate(500n, user.address, fee2, { value: fee2 })).to.emit(burnerContract, "MigrationStarted").withArgs(user.address, 500n, 2)
        })
    })

    describe('Pausing', () => {
        it('Should pause', async () => {
            const { burnerContract, owner } = await loadFixture(deployUnpausedContractFixture)
            await expect(burnerContract.pause()).to.emit(burnerContract, 'Paused').withArgs(owner.address)
        })

        it('Should not pause if already paused', async () => {
            const { burnerContract } = await loadFixture(deployContractFixture)
            await expect(burnerContract.pause()).to.be.revertedWith(ERROR_PAUSABLE_PAUSED)
        })

        it('Should unpause', async () => {
            const { burnerContract, owner } = await loadFixture(deployContractFixture)
            await expect(burnerContract.unpause()).to.emit(burnerContract, 'Unpaused').withArgs(owner.address)
        })

        it('Should not unpause if already paused', async () => {
            const { burnerContract } = await loadFixture(deployUnpausedContractFixture)
            await expect(burnerContract.unpause()).to.be.revertedWith(ERROR_PAUSABLE_UNPAUSED)
        })

        it('Should be callable only by the owner', async () => {
            const { burnerContract, owner, user } = await loadFixture(deployUnpausedContractFixture)
            await expect(burnerContract.connect(user).pause()).to.be.revertedWith(ERROR_OWNABLE)
            await expect(burnerContract.pause()).not.to.be.reverted
            await expect(burnerContract.connect(user).unpause()).to.be.revertedWith(ERROR_OWNABLE)
            await expect(burnerContract.unpause()).not.to.be.reverted
        })
    })
})
