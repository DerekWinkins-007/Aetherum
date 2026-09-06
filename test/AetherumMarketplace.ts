import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("AetherumMarketplace", function () {
  let card: any;
  let marketplace: any;
  let owner: any;
  let seller: any;
  let buyer: any;

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();

    card = await ethers.deployContract("AetherumCard");
    marketplace = await ethers.deployContract("AetherumMarketplace", [await card.getAddress()]);

    // Summon a card to the seller (replaces the old direct mintCard call)
    await card.connect(seller).summon({ value: ethers.parseEther("0.1") });
  });

  it("should list a card after approval", async function () {
    await card.connect(seller).approve(await marketplace.getAddress(), 0);
    await marketplace.connect(seller).listCard(0, ethers.parseEther("1"));

    const listing = await marketplace.listings(0);
    expect(listing.seller).to.equal(seller.address);
    expect(listing.price).to.equal(ethers.parseEther("1"));
  });

  it("should fail to list if not the owner", async function () {
    await expect(
      marketplace.connect(buyer).listCard(0, ethers.parseEther("1"))
    ).to.be.revertedWith("You don't own this card");
  });

  it("should fail to list without approval", async function () {
    await expect(
      marketplace.connect(seller).listCard(0, ethers.parseEther("1"))
    ).to.be.revertedWith("Marketplace not approved to transfer this card");
  });

  it("should allow buying a listed card", async function () {
    await card.connect(seller).approve(await marketplace.getAddress(), 0);
    await marketplace.connect(seller).listCard(0, ethers.parseEther("1"));

    await marketplace.connect(buyer).buyCard(0, { value: ethers.parseEther("1") });

    expect(await card.ownerOf(0)).to.equal(buyer.address);
  });

  it("should fail to buy with incorrect ETH amount", async function () {
    await card.connect(seller).approve(await marketplace.getAddress(), 0);
    await marketplace.connect(seller).listCard(0, ethers.parseEther("1"));

    await expect(
      marketplace.connect(buyer).buyCard(0, { value: ethers.parseEther("0.5") })
    ).to.be.revertedWith("Incorrect ETH sent");
  });

  it("should fail to buy an unlisted card", async function () {
    await expect(
      marketplace.connect(buyer).buyCard(0, { value: ethers.parseEther("1") })
    ).to.be.revertedWith("Card not listed");
  });

  it("should clear the listing after purchase", async function () {
    await card.connect(seller).approve(await marketplace.getAddress(), 0);
    await marketplace.connect(seller).listCard(0, ethers.parseEther("1"));
    await marketplace.connect(buyer).buyCard(0, { value: ethers.parseEther("1") });

    const listing = await marketplace.listings(0);
    expect(listing.price).to.equal(0);
  });
  it("should allow a seller to cancel their listing", async function () {
    await card.connect(seller).approve(await marketplace.getAddress(), 0);
    await marketplace.connect(seller).listCard(0, ethers.parseEther("1"));

    await expect(marketplace.connect(seller).cancelListing(0))
      .to.emit(marketplace, "ListingCancelled")
      .withArgs(0, seller.address);

    const listing = await marketplace.listings(0);
    expect(listing.price).to.equal(0);
  });

  it("should fail to cancel if not the lister", async function () {
    await card.connect(seller).approve(await marketplace.getAddress(), 0);
    await marketplace.connect(seller).listCard(0, ethers.parseEther("1"));

    await expect(
      marketplace.connect(buyer).cancelListing(0)
    ).to.be.revertedWith("You didn't list this card");
  });
});