// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AetherumCard
/// @notice ERC-721 contract for Aetherum trading cards. Cards are summoned
///         (minted) randomly: the contract picks a weighted-random class and
///         weighted-random rarity, then mints the corresponding pre-registered
///         card to the caller.
/// @dev Randomness here uses on-chain pseudo-randomness (block data + a nonce).
///      This is NOT secure against a sufficiently motivated miner/validator and
///      would be replaced with Chainlink VRF in a production system handling
///      real value. For a testnet student project with no real funds at stake,
///      this tradeoff is acceptable and disclosed here intentionally.
contract AetherumCard is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    uint256 private _nonce;

    uint256 public constant SUMMON_PRICE = 0.1 ether;
    uint256 public constant SUMMON_FIVE_PRICE = 0.5 ether;

    enum Class { Fire, Water, Earth, Air, Void, Lumen }
    enum Rarity { Common, Rare, Epic, Legendary, Mythic }

    // class => rarity => tokenURI
    mapping(Class => mapping(Rarity => string)) public cardURIs;

    event CardSummoned(address indexed to, uint256 indexed tokenId, Class class, Rarity rarity, string tokenURI);

    constructor() ERC721("Aetherum Card", "AETH") Ownable(msg.sender) {
        _registerCards();
    }

    /// @notice Summon a single random card. Costs SUMMON_PRICE.
    function summon() external payable {
        require(msg.value == SUMMON_PRICE, "Incorrect ETH sent for summon");
        _summonOne(msg.sender);
    }

    /// @notice Summon five random cards in one transaction. Costs SUMMON_FIVE_PRICE.
    function summonFive() external payable {
        require(msg.value == SUMMON_FIVE_PRICE, "Incorrect ETH sent for summonFive");
        for (uint256 i = 0; i < 5; i++) {
            _summonOne(msg.sender);
        }
    }

    /// @notice Owner can withdraw collected summon fees.
    function withdraw() external onlyOwner {
        (bool sent, ) = payable(owner()).call{value: address(this).balance}("");
        require(sent, "Withdraw failed");
    }

    function _summonOne(address to) internal {
        Rarity rarity = _rollRarity();
        Class class = _rollClass();
        string memory uri = cardURIs[class][rarity];

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit CardSummoned(to, tokenId, class, rarity, uri);
    }

    /// @dev Rarity odds: Common 40%, Rare 25%, Epic 15%, Legendary 12%, Mythic 8%
    function _rollRarity() internal returns (Rarity) {
        uint256 roll = _random(100);
        if (roll < 40) return Rarity.Common;
        if (roll < 65) return Rarity.Rare;
        if (roll < 80) return Rarity.Epic;
        if (roll < 92) return Rarity.Legendary;
        return Rarity.Mythic;
    }

    /// @dev Class odds: Fire/Water/Earth/Air 20% each, Void/Lumen 10% each
    function _rollClass() internal returns (Class) {
        uint256 roll = _random(100);
        if (roll < 20) return Class.Fire;
        if (roll < 40) return Class.Water;
        if (roll < 60) return Class.Earth;
        if (roll < 80) return Class.Air;
        if (roll < 90) return Class.Void;
        return Class.Lumen;
    }

    /// @dev Pseudo-random number in [0, max). Combines block data with an
    ///      incrementing nonce so repeated calls within the same block differ.
    function _random(uint256 max) internal returns (uint256) {
        _nonce++;
        uint256 seed = uint256(
            keccak256(
                abi.encodePacked(
                    block.prevrandao,
                    block.timestamp,
                    msg.sender,
                    _nonce
                )
            )
        );
        return seed % max;
    }

    function _registerCards() internal {
        // FIRE
        cardURIs[Class.Fire][Rarity.Common] = "ipfs://bafkreigdlweopasdpfi3nv3l2j4jbmaz5e7jvc33h3seebywod6or3awtm";
        cardURIs[Class.Fire][Rarity.Rare] = "ipfs://bafkreidfbyhstfc4mjomdsp7cvk6k2xrt3zs3e2hhgittlwjll22l6wbnu";
        cardURIs[Class.Fire][Rarity.Epic] = "ipfs://bafkreih46umwqlk6ue2v7uofcbpy6dfgko3soro5fy7nii3mcstwbdwhhe";
        cardURIs[Class.Fire][Rarity.Legendary] = "ipfs://bafkreid7smjv4xo7vtuz4f3qllerypj3n4uzzn4pwo5n3eggo4v7sthc2q";
        cardURIs[Class.Fire][Rarity.Mythic] = "ipfs://bafkreiaol2cdc5uriheoobfluykbaufu5sxyly32puxastsysfjg4hdzee";

        // WATER
        cardURIs[Class.Water][Rarity.Common] = "ipfs://bafkreibu2l3ntmf3hvfejx36vccnbnwoaun5yuevpszg736lwgh74iousy";
        cardURIs[Class.Water][Rarity.Rare] = "ipfs://bafkreicqcrv3fr5h7k6pqzrgxcjyj5zsfjj3cepclle7snxpz77m6z5ize";
        cardURIs[Class.Water][Rarity.Epic] = "ipfs://bafkreih6dpc3lsz36ws5kb7g4mhoaa2753jkiagfibxgkhqgjhcsyneq7a";
        cardURIs[Class.Water][Rarity.Legendary] = "ipfs://bafkreieej4zyhh5gzwukj5virm42b76h6djdgsfw7za7iwvc4rauupsdfe";
        cardURIs[Class.Water][Rarity.Mythic] = "ipfs://bafkreif7lqabn4hkdtlap4tcg6tnhrdjgtkl3f4dd4qv4u6u7lkk2si6hy";

        // EARTH
        cardURIs[Class.Earth][Rarity.Common] = "ipfs://bafkreifircd76wdkexrcagntpmjwrcshr7aknz3tz6c7aepsqms6pvup2u";
        cardURIs[Class.Earth][Rarity.Rare] = "ipfs://bafkreia2p5tpqtefrzcijzz66ovjbnwmbmopi44lo32fimq5kyiacrv4c4";
        cardURIs[Class.Earth][Rarity.Epic] = "ipfs://bafkreiefa4zkfzksjkxisqi2h3w3pi7xkm4v727dlrrujprnjjhtkgmc6i";
        cardURIs[Class.Earth][Rarity.Legendary] = "ipfs://bafkreibnaz7wid4dyf7scbqnwalzv4ftxprhxaz2xs7a5ufn2dsvg6ilp4";
        cardURIs[Class.Earth][Rarity.Mythic] = "ipfs://bafkreidaj2ggde6rbdl5up6gm3zhsfvkuncr6lpm5pi6peyffnfwr4jgea";

        // AIR
        cardURIs[Class.Air][Rarity.Common] = "ipfs://bafkreiaitk6euqko4ttu622h4yrhniwzmcdcwevbvca63lzgaocb2mwcda";
        cardURIs[Class.Air][Rarity.Rare] = "ipfs://bafkreib4ukwjtntyxa3www6givjsn5gvd4s3flwvau4p6zrtluw4cts72e";
        cardURIs[Class.Air][Rarity.Epic] = "ipfs://bafkreictdkrhrkihwkwxero6gu76z5p3yqyfslqbq3di2yskbzvnre4psu";
        cardURIs[Class.Air][Rarity.Legendary] = "ipfs://bafkreiatae4hvsctjup576m2cbyuilacnxxvxfmteyljan7il2wlut3lhi";
        cardURIs[Class.Air][Rarity.Mythic] = "ipfs://bafkreiek2epa2fpwcbboth5os2c2pxrcm2zrhhp4sakqtun3nb5crcfydu";

        // VOID
        cardURIs[Class.Void][Rarity.Common] = "ipfs://bafkreidtlns6dww5hmf2gvlinbirsq7an723aair22h246u7ecj6yy6zqe";
        cardURIs[Class.Void][Rarity.Rare] = "ipfs://bafkreihjov2ec3irjtacuo6vjyxcfctlcjz4xm3s775sx277ucnnpseela";
        cardURIs[Class.Void][Rarity.Epic] = "ipfs://bafkreie7v2du234j5xzknlxs2vbmuo6rcr33akhwzundef5fncfkmcm6py";
        cardURIs[Class.Void][Rarity.Legendary] = "ipfs://bafkreicaigcvp3ufbx4xudhljso2uh462eg4wfl6nrdgns3ej4hzdflcim";
        cardURIs[Class.Void][Rarity.Mythic] = "ipfs://bafkreicqyv3c4kyey7oyzmabvfmhetmvr5db5u2xaokqdotrak2fgf2fdm";

        // LUMEN
        cardURIs[Class.Lumen][Rarity.Common] = "ipfs://bafkreifiugpo35pdojau3i6l3woywuonpzaz3rf2ziqajwtr7f6lr5sx7y";
        cardURIs[Class.Lumen][Rarity.Rare] = "ipfs://bafkreigf6uaab7g6ehnt66rqkbhw7i2vefdju4eec4gowzqhryvefjmcou";
        cardURIs[Class.Lumen][Rarity.Epic] = "ipfs://bafkreidufj3a6e5pdqcy3jge5swsbys75n35gjdwosizjion5ata6dhjdy";
        cardURIs[Class.Lumen][Rarity.Legendary] = "ipfs://bafkreih6wrdp4fn27rpcfv5ibjn23qxxunjlah25fobx2vpivk6vmrj24a";
        cardURIs[Class.Lumen][Rarity.Mythic] = "ipfs://bafkreicrfnp35fd4lvrhhqibkkmdvya3aglom34nvjvmdc4ukm7ylbpuri";
    }
}
