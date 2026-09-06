// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract AetherumMarketplace {
    struct Listing {
        address seller;
        uint256 price;
    }

    IERC721 public immutable cardContract;

    mapping(uint256 => Listing) public listings;

    event CardListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event CardSold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);

    constructor(address _cardContract) {
        cardContract = IERC721(_cardContract);
    }

    function listCard(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than zero");
        require(cardContract.ownerOf(tokenId) == msg.sender, "You don't own this card");
        require(
            cardContract.getApproved(tokenId) == address(this) ||
            cardContract.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved to transfer this card"
        );

        listings[tokenId] = Listing(msg.sender, price);
        emit CardListed(tokenId, msg.sender, price);
    }

    function buyCard(uint256 tokenId) external payable {
        Listing memory listing = listings[tokenId];
        require(listing.price > 0, "Card not listed");
        require(msg.value == listing.price, "Incorrect ETH sent");
        require(cardContract.ownerOf(tokenId) == listing.seller, "Seller no longer owns this card");

        delete listings[tokenId];

        cardContract.safeTransferFrom(listing.seller, msg.sender, tokenId);

        (bool sent, ) = payable(listing.seller).call{value: msg.value}("");
        require(sent, "Payment to seller failed");

        emit CardSold(tokenId, msg.sender, listing.seller, listing.price);
    }

    function cancelListing(uint256 tokenId) external {
        require(listings[tokenId].seller == msg.sender, "You didn't list this card");
        delete listings[tokenId];
        emit ListingCancelled(tokenId, msg.sender);
    }
}