import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import chain_ids from "../constants/chainIds.json"

const LZ_ENDPOINT_MOCK_ARTIFACT_NAME = 'LZEndpointMock'
const BURNER_ARTIFACT_NAME = 'Burner'

const ERROR_TOO_SMALL_FEE = "TooSmallFee"
const ERROR_AMOUNT_ZERO = "AmountIsZero"
const ERROR_DST_ADDRESS = "DstAddressIsZero"

describe('Burner', function () {
    async function deployContractFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, user] = await ethers.getSigners()

        const lzEndpointMock = await ethers.deployContract(LZ_ENDPOINT_MOCK_ARTIFACT_NAME, [chain_ids["avalanche"]])
        await lzEndpointMock.waitForDeployment()

        const burnerContract = await ethers.deployContract(BURNER_ARTIFACT_NAME, [lzEndpointMock.getAddress(), lzEndpointMock.getAddress(), chain_ids["ethereum"]])
        await burnerContract.waitForDeployment()

        return {
            burnerContract,
            lzEndpointMock,
            owner,
            user,
        }
    }

    describe('Deployment', () => {
        it('Should set owner correctly', async () => {
            const { burnerContract, owner } = await loadFixture(deployContractFixture)
            expect(await burnerContract.owner()).to.be.eq(owner.address)
        })

        it('Should set lzEndpoint address correctly', async () => {
            const { burnerContract, lzEndpointMock } = await loadFixture(deployContractFixture)
            expect(await burnerContract.lzEndpoint()).to.be.eq(await lzEndpointMock.getAddress())
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
            await expect(burnerContract.estimateFee(0, user.address)).to.be.revertedWithCustomError(burnerContract, ERROR_AMOUNT_ZERO)
        })

        it('Should fail on dstAddress zero', async () => {
            const { burnerContract, user } = await loadFixture(deployContractFixture)
            await expect(burnerContract.estimateFee(1, ethers.ZeroAddress)).to.be.revertedWithCustomError(burnerContract, ERROR_DST_ADDRESS)
        })

        it('Should return fee > 0', async () => {
            const { burnerContract, user } = await loadFixture(deployContractFixture)
            let fee = await burnerContract.estimateFee(1000, user.address)
            expect(fee).to.be.gt(0)
        })
    })

    // describe('Mint', () => {
    //     it('Should fail before auction start', async () => {
    //         const { godahContract, user } = await loadFixture(deployContractFixture)
    //         let action = godahContract.connect(user).mint(1, user.address)
    //         await expect(action).to.be.revertedWith('AuctionIsClosed')
    //     })

    //     it('Should fail with wrong token id', async () => {
    //         const { godahContract, user, noDays, noRooms } = await loadFixture(
    //             deployContractFixture
    //         )
    //         let action = godahContract
    //             .connect(user)
    //             .mint(noRooms * noDays, user.address)
    //         await expect(action)
    //             .to.be.revertedWith('TokenIdDoesNotExist')
    //             .withArgs(noRooms * noDays)
    //     })

    //     it('Should fail with existing token id', async () => {
    //         const { godahContract, user, startTime, auctionContract } =
    //             await loadFixture(deployContractFixture)
    //         await godahContract.freeMint(0, user.address)
    //         await time.increaseTo(startTime)
    //         let price = await auctionContract.getAuctionPrice()
    //         let action = godahContract
    //             .connect(user)
    //             .mint(0, user.address, { value: price })
    //         await expect(action).to.be.revertedWith('ERC721: token already minted')
    //     })

    //     it('Should fail with too little ether sent', async () => {
    //         const { godahContract, user, startTime, auctionContract } =
    //             await loadFixture(deployContractFixture)
    //         await time.increaseTo(startTime)
    //         let price = await auctionContract.getAuctionPrice()
    //         let action = godahContract
    //             .connect(user)
    //             .mint(1, user.address, { value: price.sub(1) })
    //         await expect(action).to.be.revertedWith('EtherValueSentNotEact')
    //     })

    //     it('Should fail with too much ether sent', async () => {
    //         const { godahContract, user, startTime, auctionContract } =
    //             await loadFixture(deployContractFixture)
    //         await time.increaseTo(startTime)
    //         let price = await auctionContract.getAuctionPrice()
    //         let action = godahContract
    //             .connect(user)
    //             .mint(1, user.address, { value: price.add(1) })
    //         await expect(action).to.be.revertedWith('EtherValueSentNotEact')
    //     })

    //     it('Should mint token correctly', async () => {
    //         const { godahContract, user, startTime, auctionContract } =
    //             await loadFixture(deployContractFixture)
    //         await time.increaseTo(startTime)
    //         let price = await auctionContract.getAuctionPrice()
    //         let action = godahContract
    //             .connect(user)
    //             .mint(1, user.address, { value: price })
    //         await expect(action).to.not.be.reverted
    //         expect(await godahContract.ownerOf(1)).to.be.eq(user.address)
    //         expect(await godahContract.totalSupply()).to.be.eq(1)
    //         expect(await godahContract.balanceOf(user.address)).to.be.eq(1)
    //     })

    //     it('Should emit Transfer event correctly', async () => {
    //         const { godahContract, user, startTime, auctionContract } =
    //             await loadFixture(deployContractFixture)
    //         await time.increaseTo(startTime)
    //         let price = await auctionContract.getAuctionPrice()
    //         let action = godahContract
    //             .connect(user)
    //             .mint(1, user.address, { value: price })
    //         await expect(action)
    //             .to.emit(godahContract, 'Transfer')
    //             .withArgs(ethers.constants.AddressZero, user.address, 1)
    //     })
    // })

    // describe('BatchMint', () => {
    //     it('Should fail before auction start', async () => {
    //         const { godahContract, user } = await loadFixture(deployContractFixture)
    //         let action = godahContract
    //             .connect(user)
    //             .batchMint([2, 0, 0, 0, 0, 0, 0, 0, 0, 0], user.address)
    //         await expect(action).to.be.revertedWith('AuctionIsClosed')
    //     })

    //     it('Should fail with wrong tokenIds array length', async () => {
    //         const { godahContract, user } = await loadFixture(deployContractFixture)
    //         let action = godahContract
    //             .connect(user)
    //             .batchMint([0, 0, 0, 0, 0, 0, 0, 0, 0], user.address)
    //         await expect(action).to.be.revertedWith('WrongTokenIdsArrayLength')
    //     })

    //     it('Should fail with zero tokens to mint', async () => {
    //         const { godahContract, user } = await loadFixture(deployContractFixture)
    //         let action = godahContract
    //             .connect(user)
    //             .batchMint([0, 0, 0, 0, 0, 0, 0, 0, 0, 0], user.address)
    //         await expect(action).to.be.revertedWith('NoTokensToMint')
    //     })

    //     it('Should fail with too little ether sent', async () => {
    //         const { godahContract, user, startTime, auctionContract } =
    //             await loadFixture(deployContractFixture)
    //         await time.increaseTo(startTime)
    //         let price = await auctionContract.getAuctionPrice()
    //         let action = godahContract
    //             .connect(user)
    //             .batchMint([2, 0, 3, 0, 5, 0, 0, 365, 0, 56], user.address, {
    //                 value: price.mul(5).sub(1),
    //             })
    //         await expect(action).to.be.revertedWith('EtherValueSentNotEact')
    //     })

    //     it('Should fail with too much ether sent', async () => {
    //         const { godahContract, user, startTime, auctionContract } =
    //             await loadFixture(deployContractFixture)
    //         await time.increaseTo(startTime)
    //         let price = await auctionContract.getAuctionPrice()
    //         let action = godahContract
    //             .connect(user)
    //             .batchMint([2, 0, 3, 0, 5, 0, 0, 365, 0, 56], user.address, {
    //                 value: price.mul(5).add(1),
    //             })
    //         await expect(action).to.be.revertedWith('EtherValueSentNotEact')
    //     })

    //     it('Should fail with wrong token id', async () => {
    //         const { godahContract, user, startTime, auctionContract, noDays } =
    //             await loadFixture(deployContractFixture)
    //         await time.increaseTo(startTime)
    //         let price = await auctionContract.getAuctionPrice()
    //         let action = godahContract
    //             .connect(user)
    //             .batchMint([2, 0, 3, 0, 5, 0, 0, noDays + 1, 0, 56], user.address, {
    //                 value: price.mul(5),
    //             })
    //         await expect(action)
    //             .to.be.revertedWith('TokenIdDoesNotExist')
    //             .withArgs(noDays + 1)
    //     })

    //     it('Should fail with existing token id', async () => {
    //         const { godahContract, user, startTime, auctionContract, noDays } =
    //             await loadFixture(deployContractFixture)
    //         await godahContract.freeMint(noDays, user.address)
    //         await time.increaseTo(startTime)
    //         let price = await auctionContract.getAuctionPrice()
    //         let action = godahContract
    //             .connect(user)
    //             .batchMint([1, 1, 3, 0, 5, 0, 0, 365, 0, 56], user.address, {
    //                 value: price.mul(6),
    //             })
    //         await expect(action).to.be.revertedWith('ERC721: token already minted')
    //     })

    //     it('Should mint tokens correctly', async () => {
    //         const { godahContract, user, startTime, auctionContract, noDays } =
    //             await loadFixture(deployContractFixture)
    //         await time.increaseTo(startTime)
    //         let price = await auctionContract.getAuctionPrice()
    //         let userTokenIds = [2, 0, 3, 0, 5, 0, 0, 365, 0, 56]
    //         await godahContract
    //             .connect(user)
    //             .batchMint(userTokenIds, user.address, { value: price.mul(5) })
    //         userTokenIds.forEach(async (id, index) => {
    //             let tokenId = index * noDays + id
    //             expect(await godahContract.ownerOf(tokenId)).to.be.eq(user.address)
    //         })
    //         expect(await godahContract.balanceOf(user.address)).to.be.eq(5)
    //         expect(await godahContract.totalSupply()).to.be.eq(5)
    //     })

    //     it('Should mint tokens not overlapping with each other', async () => {
    //         const {
    //             godahContract,
    //             user,
    //             startTime,
    //             auctionContract,
    //             noDays,
    //             tokenIds,
    //         } = await loadFixture(deployContractFixture)
    //         await time.increaseTo(startTime)
    //         let price = await auctionContract.getAuctionPrice()
    //         let userTokenIds = [noDays, 1, noDays, 1, noDays, 1, noDays, 1, noDays, 1]
    //         let action = godahContract
    //             .connect(user)
    //             .batchMint(userTokenIds, user.address, {
    //                 value: price.mul(userTokenIds.length),
    //             })
    //         await expect(action).to.not.be.reverted
    //         userTokenIds.forEach(async (id, index) => {
    //             let tokenId = index * noDays + id
    //             expect(await godahContract.ownerOf(tokenId)).to.be.eq(user.address)
    //         })
    //         expect(await godahContract.balanceOf(user.address)).to.be.eq(
    //             userTokenIds.length
    //         )
    //         expect(await godahContract.totalSupply()).to.be.eq(userTokenIds.length)
    //     })

    //     it('Should emit Transfer events correctly', async () => {
    //         const { godahContract, user, startTime, auctionContract, noDays } =
    //             await loadFixture(deployContractFixture)
    //         await time.increaseTo(startTime)
    //         let price = await auctionContract.getAuctionPrice()
    //         let userTokenIds = [noDays, 2, noDays, 2, noDays, 2, noDays, 2, noDays, 2]
    //         let action = godahContract
    //             .connect(user)
    //             .batchMint(userTokenIds, user.address, {
    //                 value: price.mul(userTokenIds.length),
    //             })
    //         await expect(action)
    //             .to.emit(godahContract, 'Transfer')
    //             .withArgs(
    //                 ethers.constants.AddressZero,
    //                 user.address,
    //                 userTokenIds[0] - 1
    //             )
    //             .and.to.emit(godahContract, 'Transfer')
    //             .withArgs(
    //                 ethers.constants.AddressZero,
    //                 user.address,
    //                 noDays + userTokenIds[1] - 1
    //             )
    //             .and.to.emit(godahContract, 'Transfer')
    //             .withArgs(
    //                 ethers.constants.AddressZero,
    //                 user.address,
    //                 2 * noDays + userTokenIds[2] - 1
    //             )
    //             .and.to.emit(godahContract, 'Transfer')
    //             .withArgs(
    //                 ethers.constants.AddressZero,
    //                 user.address,
    //                 3 * noDays + userTokenIds[3] - 1
    //             )
    //             .and.to.emit(godahContract, 'Transfer')
    //             .withArgs(
    //                 ethers.constants.AddressZero,
    //                 user.address,
    //                 4 * noDays + userTokenIds[4] - 1
    //             )
    //             .and.to.emit(godahContract, 'Transfer')
    //             .withArgs(
    //                 ethers.constants.AddressZero,
    //                 user.address,
    //                 5 * noDays + userTokenIds[5] - 1
    //             )
    //             .and.to.emit(godahContract, 'Transfer')
    //             .withArgs(
    //                 ethers.constants.AddressZero,
    //                 user.address,
    //                 6 * noDays + userTokenIds[6] - 1
    //             )
    //             .and.to.emit(godahContract, 'Transfer')
    //             .withArgs(
    //                 ethers.constants.AddressZero,
    //                 user.address,
    //                 7 * noDays + userTokenIds[7] - 1
    //             )
    //             .and.to.emit(godahContract, 'Transfer')
    //             .withArgs(
    //                 ethers.constants.AddressZero,
    //                 user.address,
    //                 8 * noDays + userTokenIds[8] - 1
    //             )
    //             .and.to.emit(godahContract, 'Transfer')
    //             .withArgs(
    //                 ethers.constants.AddressZero,
    //                 user.address,
    //                 9 * noDays + userTokenIds[9] - 1
    //             )
    //     })
    // })

    // describe('FreeMint', () => {
    //     it('Should fail with wrong token id', async () => {
    //         const { godahContract, user, noDays, noRooms } = await loadFixture(
    //             deployContractFixture
    //         )
    //         let action = godahContract.freeMint(noRooms * noDays, user.address)
    //         await expect(action)
    //             .to.be.revertedWith('TokenIdDoesNotExist')
    //             .withArgs(noRooms * noDays)
    //     })

    //     it('Should fail with existing token id', async () => {
    //         const { godahContract, user } = await loadFixture(deployContractFixture)
    //         await godahContract.freeMint(0, user.address)
    //         let action = godahContract.freeMint(0, user.address)
    //         await expect(action).to.be.revertedWith('ERC721: token already minted')
    //     })

    //     it('Should mint token correctly', async () => {
    //         const { godahContract, user } = await loadFixture(deployContractFixture)
    //         let action = godahContract.freeMint(1, user.address)
    //         await expect(action).to.not.be.reverted
    //         expect(await godahContract.ownerOf(1)).to.be.eq(user.address)
    //         expect(await godahContract.totalSupply()).to.be.eq(1)
    //         expect(await godahContract.balanceOf(user.address)).to.be.eq(1)
    //     })

    //     it('Should emit Transfer event correctly', async () => {
    //         const { godahContract, user } = await loadFixture(deployContractFixture)
    //         let action = godahContract.freeMint(1, user.address)
    //         await expect(action)
    //             .to.emit(godahContract, 'Transfer')
    //             .withArgs(ethers.constants.AddressZero, user.address, 1)
    //     })

    //     it('Should be callable only by the admin/owner', async () => {
    //         const { godahContract, user } = await loadFixture(deployContractFixture)
    //         let userAction = godahContract.connect(user).freeMint(1, user.address)
    //         await expect(userAction).to.be.revertedWith('CallerIsNotTheAdmin')
    //         await godahContract.addAdmin(user.address)
    //         let adminAction = godahContract.connect(user).freeMint(1, user.address)
    //         await expect(adminAction).to.not.be.reverted
    //         let ownerAction = godahContract.freeMint(2, user.address)
    //         await expect(ownerAction).to.not.be.reverted
    //     })
    // })

    // describe('BatchFreeMint', () => {
    //     it('Should fail with zero tokens to mint', async () => {
    //         const { godahContract, user } = await loadFixture(deployContractFixture)
    //         let action = godahContract.batchFreeMint([], user.address)
    //         await expect(action).to.be.revertedWith('NoTokensToMint')
    //     })

    //     it('Should fail with wrong token id', async () => {
    //         const { godahContract, user, noDays, noRooms } = await loadFixture(
    //             deployContractFixture
    //         )
    //         let action = godahContract.batchFreeMint(
    //             [2, 3, noDays * noRooms],
    //             user.address
    //         )
    //         await expect(action)
    //             .to.be.revertedWith('TokenIdDoesNotExist')
    //             .withArgs(noDays * noRooms)
    //     })

    //     it('Should fail with existing token id', async () => {
    //         const { godahContract, user } = await loadFixture(deployContractFixture)
    //         await godahContract.freeMint(0, user.address)
    //         let action = godahContract.batchFreeMint([0], user.address)
    //         await expect(action).to.be.revertedWith('ERC721: token already minted')
    //     })

    //     it('Should fail with duplicate token ids', async () => {
    //         const { godahContract, user } = await loadFixture(deployContractFixture)
    //         let action = godahContract.batchFreeMint([11, 11], user.address)
    //         await expect(action).to.be.revertedWith('ERC721: token already minted')
    //     })

    //     it('Should mint tokens correctly', async () => {
    //         const { godahContract, user, noRooms, noDays, tokenIds } =
    //             await loadFixture(deployContractFixture)
    //         let userTokenIds = [2, noDays * 7 + 67, noDays * noRooms - 1, 937, 2137]
    //         await godahContract.batchFreeMint(userTokenIds, user.address)
    //         userTokenIds.forEach(async (id, index) => {
    //             let tokenId = index * noDays + id
    //             expect(await godahContract.ownerOf(tokenId)).to.be.eq(user.address)
    //         })
    //         expect(await godahContract.balanceOf(user.address)).to.be.eq(
    //             userTokenIds.length
    //         )
    //         expect(await godahContract.totalSupply()).to.be.eq(5)
    //     })

    //     it('Should emit Transfer events correctly', async () => {
    //         const { godahContract, user, noRooms, noDays, tokenIds } =
    //             await loadFixture(deployContractFixture)
    //         let userTokenIds = [2, noDays * 7 + 67, noDays * noRooms - 1, 937, 2137]
    //         let action = godahContract.batchFreeMint(userTokenIds, user.address)
    //         await expect(action)
    //             .to.emit(godahContract, 'Transfer')
    //             .withArgs(ethers.constants.AddressZero, user.address, userTokenIds[0])
    //             .and.to.emit(godahContract, 'Transfer')
    //             .withArgs(ethers.constants.AddressZero, user.address, userTokenIds[1])
    //             .and.to.emit(godahContract, 'Transfer')
    //             .withArgs(ethers.constants.AddressZero, user.address, userTokenIds[2])
    //             .and.to.emit(godahContract, 'Transfer')
    //             .withArgs(ethers.constants.AddressZero, user.address, userTokenIds[3])
    //             .and.to.emit(godahContract, 'Transfer')
    //             .withArgs(ethers.constants.AddressZero, user.address, userTokenIds[4])
    //     })

    //     it('Should be callable only by the admin/owner', async () => {
    //         const { godahContract, user } = await loadFixture(deployContractFixture)
    //         let userAction = godahContract
    //             .connect(user)
    //             .batchFreeMint([1], user.address)
    //         await expect(userAction).to.be.revertedWith('CallerIsNotTheAdmin')
    //         await godahContract.addAdmin(user.address)
    //         let adminAction = godahContract
    //             .connect(user)
    //             .batchFreeMint([1], user.address)
    //         await expect(adminAction).to.not.be.reverted
    //         let ownerAction = godahContract.batchFreeMint([2], user.address)
    //         await expect(ownerAction).to.not.be.reverted
    //     })
    // })

    // describe('SetBaseURI', () => {
    //     it('Should set base URI correctly', async () => {
    //         const { godahContract, baseURI, user } = await loadFixture(
    //             deployContractFixture
    //         )
    //         await godahContract.freeMint(0, user.address)
    //         await godahContract.setBaseURI(baseURI.toUpperCase())
    //         expect(await godahContract.tokenURI(0)).to.be.eq(
    //             baseURI.toUpperCase() + '0'
    //         )
    //     })

    //     it('tokenURI should revert if token does not exist', async () => {
    //         const { godahContract } = await loadFixture(deployContractFixture)

    //         let action = godahContract.tokenURI(1)
    //         await expect(action).to.be.reverted
    //     })

    //     it('Should be callable only by the admin/owner', async () => {
    //         const { godahContract, user, baseURI } = await loadFixture(
    //             deployContractFixture
    //         )
    //         let userAction = godahContract
    //             .connect(user)
    //             .setBaseURI(baseURI.toUpperCase())
    //         await expect(userAction).to.be.revertedWith('CallerIsNotTheAdmin')
    //         await godahContract.addAdmin(user.address)
    //         let adminAction = godahContract
    //             .connect(user)
    //             .setBaseURI(baseURI.toUpperCase())
    //         await expect(adminAction).to.not.be.reverted
    //         let ownerAction = godahContract.setBaseURI(baseURI)
    //         await expect(ownerAction).to.not.be.reverted
    //     })
    // })

    // describe('SetContractURI', () => {
    //     it('Should set contract URI correctly', async () => {
    //         const { godahContract, contractURI } = await loadFixture(
    //             deployContractFixture
    //         )
    //         await godahContract.setContractURI(contractURI.toUpperCase())
    //         expect(await godahContract.contractURI()).to.be.eq(
    //             contractURI.toUpperCase()
    //         )
    //     })

    //     it('Should be callable only by the admin/owner', async () => {
    //         const { godahContract, user, contractURI } = await loadFixture(
    //             deployContractFixture
    //         )
    //         let userAction = godahContract
    //             .connect(user)
    //             .setContractURI(contractURI.toUpperCase())
    //         await expect(userAction).to.be.revertedWith('CallerIsNotTheAdmin')
    //         await godahContract.addAdmin(user.address)
    //         let adminAction = godahContract
    //             .connect(user)
    //             .setContractURI(contractURI.toUpperCase())
    //         await expect(adminAction).to.not.be.reverted
    //         let ownerAction = godahContract.setContractURI(contractURI)
    //         await expect(ownerAction).to.not.be.reverted
    //     })
    // })

    // describe('WithdrawAll', () => {
    //     it('Should not withdraw if balance is zero', async () => {
    //         const { godahContract } = await loadFixture(deployContractFixture)
    //         let action = godahContract.withdrawAll()
    //         await expect(action).to.be.revertedWith('ContractBalanceIsZero')
    //     })

    //     it('Should withdraw all balance', async () => {
    //         const { godahContract, owner, auctionContract, startTime, user } =
    //             await loadFixture(deployContractFixture)

    //         await time.increaseTo(startTime)
    //         let price = await auctionContract.getAuctionPrice()
    //         await godahContract
    //             .connect(user)
    //             .batchMint([2, 0, 0, 0, 0, 0, 0, 0, 0, 0], user.address, {
    //                 value: price,
    //             })

    //         let contractPrevBalance = await godahContract.provider.getBalance(
    //             godahContract.address
    //         )
    //         let ownerPrevBalance = await godahContract.provider.getBalance(
    //             owner.address
    //         )
    //         await godahContract.withdrawAll()

    //         expect(contractPrevBalance).to.be.eq(price)
    //         expect(
    //             await godahContract.provider.getBalance(godahContract.address)
    //         ).to.be.eq(0)
    //         expect(await godahContract.provider.getBalance(owner.address)).to.be.gt(
    //             ownerPrevBalance.add(price).sub(47000000000000)
    //         )
    //     })

    //     it('Should only be callable by the owner', async () => {
    //         const { godahContract, owner, auctionContract, startTime, user } =
    //             await loadFixture(deployContractFixture)

    //         await time.increaseTo(startTime)
    //         let price = await auctionContract.getAuctionPrice()
    //         await godahContract
    //             .connect(user)
    //             .batchMint([2, 0, 0, 0, 0, 0, 0, 0, 0, 0], user.address, {
    //                 value: price,
    //             })

    //         let contractPrevBalance = await godahContract.provider.getBalance(
    //             godahContract.address
    //         )
    //         let ownerPrevBalance = await godahContract.provider.getBalance(
    //             owner.address
    //         )

    //         let userAction = godahContract.connect(user).withdrawAll()
    //         await expect(userAction).to.be.revertedWith(
    //             'Ownable: caller is not the owner'
    //         )

    //         await godahContract.withdrawAll()

    //         expect(contractPrevBalance).to.be.eq(price)
    //         expect(
    //             await godahContract.provider.getBalance(godahContract.address)
    //         ).to.be.eq(0)
    //         expect(await godahContract.provider.getBalance(owner.address)).to.be.gt(
    //             ownerPrevBalance.add(price).sub(47000000000000)
    //         )
    //     })
    // })

    // describe('RecoverToken', () => {
    //     it('should not recover address zero', async () => {
    //         const { godahContract, user } = await loadFixture(deployContractFixture)
    //         let action = godahContract.recoverToken(ethers.constants.AddressZero)
    //         await expect(action).to.be.revertedWith('ArgumentIsAddressZero')
    //     })

    //     it('should be callable only by owner', async () => {
    //         const { godahContract, user } = await loadFixture(deployContractFixture)
    //         await godahContract.addAdmin(user.address)

    //         let adminCall = godahContract
    //             .connect(user)
    //             .recoverToken(ethers.constants.AddressZero)
    //         await expect(adminCall).to.be.revertedWith(
    //             'Ownable: caller is not the owner'
    //         )

    //         let userCall = godahContract
    //             .connect(user)
    //             .recoverToken(ethers.constants.AddressZero)
    //         await expect(userCall).to.be.revertedWith(
    //             'Ownable: caller is not the owner'
    //         )
    //     })
    // })

    // describe('Gas fees', () => {
    //     it('ERC721Enumerable deployment without minting', async () => {
    //         const {
    //             contractURI,
    //             baseURI,
    //             noRooms,
    //             name,
    //             symbol,
    //             noDays,
    //             auctionContract,
    //         } = await loadFixture(deployContractFixture)
    //         const Godah = await ethers.getContractFactory(TEST_CONTRACT_ARTIFACT_NAME)
    //         let deployment = await Godah.deploy(
    //             name,
    //             symbol,
    //             baseURI,
    //             contractURI,
    //             auctionContract.address,
    //             noRooms,
    //             noDays,
    //             []
    //         )
    //         let gasUsed = (
    //             await deployment.deployTransaction.wait()
    //         ).gasUsed.toString()
    //         console.log('GodahNFT: ' + gasUsed)
    //     })

    //     it('ERC721Enumerable free minting 1 token', async () => {
    //         const {
    //             contractURI,
    //             baseURI,
    //             noRooms,
    //             name,
    //             symbol,
    //             noDays,
    //             auctionContract,
    //             godahContract,
    //             user,
    //         } = await loadFixture(deployContractFixture)
    //         const Godah = await ethers.getContractFactory(TEST_CONTRACT_ARTIFACT_NAME)
    //         let deployment = await Godah.deploy(
    //             name,
    //             symbol,
    //             baseURI,
    //             contractURI,
    //             auctionContract.address,
    //             noRooms,
    //             noDays,
    //             []
    //         )
    //         let deploymentGasUsed = (
    //             await deployment.deployTransaction.wait()
    //         ).gasUsed.toString()

    //         let mint = await deployment.freeMint(0, user.address)
    //         let gasUsed = (await mint.wait()).gasUsed.toString()
    //         console.log(
    //             'GodahNFT: ' + deploymentGasUsed + ', freeMint(1): ' + gasUsed
    //         )
    //     })

    //     it('ERC721Enumerable free minting 10 tokens', async () => {
    //         const {
    //             contractURI,
    //             baseURI,
    //             noRooms,
    //             name,
    //             symbol,
    //             noDays,
    //             auctionContract,
    //             tokenIds,
    //             user,
    //         } = await loadFixture(deployContractFixture)
    //         const Godah = await ethers.getContractFactory(TEST_CONTRACT_ARTIFACT_NAME)
    //         let deployment = await Godah.deploy(
    //             name,
    //             symbol,
    //             baseURI,
    //             contractURI,
    //             auctionContract.address,
    //             noRooms,
    //             noDays,
    //             []
    //         )
    //         let deploymentGasUsed = (
    //             await deployment.deployTransaction.wait()
    //         ).gasUsed.toString()

    //         let mint = await deployment.batchFreeMint(tokenIds, user.address)
    //         let gasUsed = (await mint.wait()).gasUsed.toString()
    //         console.log(
    //             'GodahNFT: ' + deploymentGasUsed + ', freeMint(10): ' + gasUsed
    //         )
    //     })

    //     it('ERC721Enumerable free minting 100 tokens', async () => {
    //         const {
    //             contractURI,
    //             baseURI,
    //             noRooms,
    //             name,
    //             symbol,
    //             noDays,
    //             auctionContract,
    //             tokenIds,
    //             user,
    //         } = await loadFixture(deployContractFixture)

    //         let tokens: Number[] = []
    //         for (var i = 0; i < 10; i++) {
    //             tokenIds.map((id) => {
    //                 tokens.push(id + i)
    //             })
    //         }

    //         const Godah = await ethers.getContractFactory(TEST_CONTRACT_ARTIFACT_NAME)
    //         let deployment = await Godah.deploy(
    //             name,
    //             symbol,
    //             baseURI,
    //             contractURI,
    //             auctionContract.address,
    //             noRooms,
    //             noDays,
    //             []
    //         )
    //         let deploymentGasUsed = (
    //             await deployment.deployTransaction.wait()
    //         ).gasUsed.toString()

    //         let mint = await deployment.batchFreeMint(tokens, user.address)
    //         let gasUsed = (await mint.wait()).gasUsed.toString()
    //         console.log(
    //             'GodahNFT: ' + deploymentGasUsed + ', freeMint(100): ' + gasUsed
    //         )
    //     })

    //     it('ERC721 deployment without minting', async () => {
    //         const {
    //             contractURI,
    //             baseURI,
    //             noRooms,
    //             name,
    //             symbol,
    //             noDays,
    //             auctionContract,
    //         } = await loadFixture(deployContractFixture)
    //         const Godah = await ethers.getContractFactory(CONTRACT_ARTIFACT_NAME)
    //         let deployment = await Godah.deploy(
    //             name,
    //             symbol,
    //             baseURI,
    //             contractURI,
    //             auctionContract.address,
    //             noRooms,
    //             noDays,
    //             []
    //         )
    //         let gasUsed = (
    //             await deployment.deployTransaction.wait()
    //         ).gasUsed.toString()
    //         console.log('GodahNFT: ' + gasUsed)
    //     })

    //     it('ERC721 free minting 1 token', async () => {
    //         const {
    //             contractURI,
    //             baseURI,
    //             noRooms,
    //             name,
    //             symbol,
    //             noDays,
    //             auctionContract,
    //             godahContract,
    //             user,
    //         } = await loadFixture(deployContractFixture)
    //         const Godah = await ethers.getContractFactory(CONTRACT_ARTIFACT_NAME)
    //         let deployment = await Godah.deploy(
    //             name,
    //             symbol,
    //             baseURI,
    //             contractURI,
    //             auctionContract.address,
    //             noRooms,
    //             noDays,
    //             []
    //         )
    //         let deploymentGasUsed = (
    //             await deployment.deployTransaction.wait()
    //         ).gasUsed.toString()

    //         let mint = await deployment.freeMint(0, user.address)
    //         let gasUsed = (await mint.wait()).gasUsed.toString()
    //         console.log(
    //             'GodahNFT: ' + deploymentGasUsed + ', freeMint(1): ' + gasUsed
    //         )
    //     })

    //     it('ERC721 free minting 10 tokens', async () => {
    //         const {
    //             contractURI,
    //             baseURI,
    //             noRooms,
    //             name,
    //             symbol,
    //             noDays,
    //             auctionContract,
    //             tokenIds,
    //             user,
    //         } = await loadFixture(deployContractFixture)
    //         const Godah = await ethers.getContractFactory(CONTRACT_ARTIFACT_NAME)
    //         let deployment = await Godah.deploy(
    //             name,
    //             symbol,
    //             baseURI,
    //             contractURI,
    //             auctionContract.address,
    //             noRooms,
    //             noDays,
    //             []
    //         )
    //         let deploymentGasUsed = (
    //             await deployment.deployTransaction.wait()
    //         ).gasUsed.toString()

    //         let mint = await deployment.batchFreeMint(tokenIds, user.address)
    //         let gasUsed = (await mint.wait()).gasUsed.toString()
    //         console.log(
    //             'GodahNFT: ' + deploymentGasUsed + ', freeMint(10): ' + gasUsed
    //         )
    //     })

    //     it('ERC721 free minting 100 tokens', async () => {
    //         const {
    //             contractURI,
    //             baseURI,
    //             noRooms,
    //             name,
    //             symbol,
    //             noDays,
    //             auctionContract,
    //             tokenIds,
    //             user,
    //         } = await loadFixture(deployContractFixture)

    //         let tokens: Number[] = []
    //         for (var i = 0; i < 10; i++) {
    //             tokenIds.map((id) => {
    //                 tokens.push(id + i)
    //             })
    //         }

    //         const Godah = await ethers.getContractFactory(CONTRACT_ARTIFACT_NAME)
    //         let deployment = await Godah.deploy(
    //             name,
    //             symbol,
    //             baseURI,
    //             contractURI,
    //             auctionContract.address,
    //             noRooms,
    //             noDays,
    //             []
    //         )
    //         let deploymentGasUsed = (
    //             await deployment.deployTransaction.wait()
    //         ).gasUsed.toString()

    //         let mint = await deployment.batchFreeMint(tokens, user.address)
    //         let gasUsed = (await mint.wait()).gasUsed.toString()
    //         console.log(
    //             'GodahNFT: ' + deploymentGasUsed + ', freeMint(100): ' + gasUsed
    //         )
    //     })

    //     it('DutchAuction deployment', async () => {
    //         const startTime = (await time.latest()) + 600
    //         const stepTime = 600 // 10 minutes
    //         const startPrice = parseEther('3')
    //         const priceDiscount = parseEther('0.1')
    //         const finalPrice = parseEther('0.4')

    //         const Auction = await ethers.getContractFactory(AUCTION_ARTIFACT_NAME)
    //         const auctionContract = (await Auction.deploy(
    //             startTime,
    //             stepTime,
    //             startPrice,
    //             priceDiscount,
    //             finalPrice
    //         )) as DutchAuction
    //         await auctionContract.deployed()
    //         let gasUsed = (
    //             await auctionContract.deployTransaction.wait()
    //         ).gasUsed.toString()
    //         console.log('DutchAuction: ' + gasUsed)
    //     })
})
