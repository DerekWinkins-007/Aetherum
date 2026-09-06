import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("AetherumCard", function () {
  let card: any;
  let owner: any;
  let addr1: any;

  const SUMMON_PRICE = ethers.parseEther("0.1");
  const SUMMON_FIVE_PRICE = ethers.parseEther("0.5");

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    card = await ethers.deployContract("AetherumCard");
  });

  it("should reject summon() with incorrect ETH", async function () {
    await expect(
      card.connect(addr1).summon({ value: ethers.parseEther("0.05") })
    ).to.be.revertedWith("Incorrect ETH sent for summon");
  });

  it("should mint one card on successful summon()", async function () {
    await card.connect(addr1).summon({ value: SUMMON_PRICE });
    expect(await card.ownerOf(0)).to.equal(addr1.address);
  });

  it("should emit a CardSummoned event with a valid class/rarity", async function () {
    await expect(card.connect(addr1).summon({ value: SUMMON_PRICE })).to.emit(
      card,
      "CardSummoned"
    );
  });

  it("should reject summonFive() with incorrect ETH", async function () {
    await expect(
      card.connect(addr1).summonFive({ value: ethers.parseEther("0.4") })
    ).to.be.revertedWith("Incorrect ETH sent for summonFive");
  });

  it("should mint exactly 5 cards on summonFive()", async function () {
    await card.connect(addr1).summonFive({ value: SUMMON_FIVE_PRICE });
    expect(await card.balanceOf(addr1.address)).to.equal(5);
  });

  it("should allow the owner to withdraw collected funds", async function () {
    await card.connect(addr1).summon({ value: SUMMON_PRICE });

    const balanceBefore: bigint = await ethers.provider.getBalance(owner.address);
    const tx = await card.connect(owner).withdraw();
    const receipt = await tx.wait();
    const gasUsed: bigint = BigInt(receipt!.gasUsed) * BigInt(receipt!.gasPrice);
    const balanceAfter: bigint = await ethers.provider.getBalance(owner.address);

    expect(balanceAfter + gasUsed - balanceBefore).to.equal(SUMMON_PRICE);
  });

  it("should reject withdraw() from a non-owner", async function () {
    await card.connect(addr1).summon({ value: SUMMON_PRICE });
    await expect(card.connect(addr1).withdraw()).to.revert(ethers);
  });

  it("should return a valid tokenURI after summoning", async function () {
    await card.connect(addr1).summon({ value: SUMMON_PRICE });
    const uri = await card.tokenURI(0);
    expect(uri).to.include("ipfs://");
  });
});