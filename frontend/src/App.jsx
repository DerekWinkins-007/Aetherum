import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CARD_ADDRESS, CARD_ABI, MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from "./contracts";
import cardData from "../../metadata/card-uris.json";

/* ---------------- helpers / data ---------------- */
const classColors = { Fire: "#e65a36", Water: "#2b7ce9", Earth: "#4e9b58", Air: "#5ec4d4", Void: "#8e4fd4", Lumen: "#e5b442" };
const CLASS_NAMES = ["Fire", "Water", "Earth", "Air", "Void", "Lumen"];
const RARITY_NAMES = ["Common", "Rare", "Epic", "Legendary", "Mythic"];
const classLore = {
  Fire: "Born of volcanic wrath and flickering embers that consume shadows.",
  Water: "Drifting from abyss depths, yielding eternal tide and mystic cold.",
  Earth: "Ancient moss and petrified stone enduring across centuries.",
  Air: "Fleet-footed tempests dancing through high forgotten peaks.",
  Void: "Stygian tears and silent cosmic tears unbound from spacetime.",
  Lumen: "Radiant astral dawn piercing celestial sanctuaries.",
};
const classGlyph = { Fire: "▲", Water: "▼", Earth: "■", Air: "▲", Void: "◆", Lumen: "✦" };

function ipfsToUrl(uri) {
  const gateway = import.meta.env.VITE_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
  return uri ? uri.replace("ipfs://", gateway) : "";
}
function findCardByClassRarity(classIdx, rarityIdx) {
  return cardData.find((c) => c.class === CLASS_NAMES[classIdx] && c.rarity === RARITY_NAMES[rarityIdx]);
}
function attr(metadata, key) {
  return metadata?.attributes?.find((a) => a.trait_type === key)?.value;
}
function cardFromMetadata(metadata) {
  return {
    name: metadata?.name,
    class: attr(metadata, "Class"),
    rarity: attr(metadata, "Rarity"),
    power: attr(metadata, "Power"),
    fastAttack: attr(metadata, "Fast Attack"),
    chargedAttack: attr(metadata, "Charged Attack"),
    imageUri: metadata?.image,
  };
}


const btnEnabled = "bg-primary text-on-primary cursor-pointer hover:bg-primary-fixed shadow-[inset_1px_1px_0px_#ffdf9f,inset_-2px_-2px_0px_#5b4300] active:translate-x-step-px active:translate-y-step-px";
const btnDisabled = "bg-surface-container-highest text-outline opacity-60 cursor-not-allowed shadow-[inset_2px_2px_0px_#0c0e14,inset_-1px_-1px_0px_#33353b]";

function WalletBanner({ message = "Connect your wallet to summon or trade cards" }) {
  return (
    <div className="w-full bg-surface-container-low border border-outline-variant p-step-3 mb-step-6 shadow-[inset_1px_1px_0px_#4e4635,inset_-1px_-1px_0px_#0c0e14] flex items-center justify-between gap-step-4">
      <div className="flex items-center gap-step-3">
        <span className="font-label-sm text-label-sm text-primary font-bold animate-pulse">[!]</span>
        <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider">{message}</span>
      </div>
      <div className="hidden sm:flex items-center gap-step-2 font-label-sm text-label-sm text-on-surface-variant uppercase">
        <span>STATUS: DISCONNECTED</span>
      </div>
    </div>
  );
}

/* ---------------- shared header ---------------- */

function Header({ tab, setTab, account, connectWallet }) {
  const NAV = [
    { key: "mint", label: "[MINT]", path: "summoning-altar", activeClasses: "bg-surface text-primary shadow-[inset_1px_1px_0px_#4e4635,inset_-1px_-1px_0px_#0c0e14]", inactiveClasses: "text-on-surface-variant hover:text-on-surface transition-colors" },
    { key: "gallery", label: "[MARKETPLACE]", path: "marketplace", activeClasses: "bg-surface text-primary shadow-[inset_1px_1px_0px_#4e4635,inset_-1px_-1px_0px_#0c0e14]", inactiveClasses: "text-on-surface-variant hover:text-on-surface transition-colors" },
    { key: "mycards", label: "[MY CARDS]", path: "the-grimoire", activeClasses: "bg-surface text-primary shadow-[inset_1px_1px_0px_#4e4635,inset_-1px_-1px_0px_#0c0e14]", inactiveClasses: "text-on-surface-variant hover:text-on-surface transition-colors" },
  ];
  return (
    <header className="fixed top-0 w-full z-30 bg-surface-container-lowest/95 backdrop-blur-md">
      <div className="h-step-7 max-w-[1440px] mx-auto px-margin-desktop flex items-center justify-between gap-step-6">
        <div className="flex items-center gap-step-4">
          <img alt="Aetherum Arcane Gem Logo" className="h-8 w-auto object-contain" src="/logo.png" />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm tracking-wider text-primary uppercase leading-none">AETHERUM</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">ARCANE REALM CARDS</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-step-3 bg-surface-container-low px-step-4 py-step-2 shadow-[inset_2px_2px_0px_#0c0e14,inset_-1px_-1px_0px_#33353b]">
          <span className="w-2 h-2 bg-primary animate-pulse inline-block"></span>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Sepolia Testnet</span>
        </div>
        <div className="flex items-center gap-step-4">
          {!account ? (
            <button
              onClick={connectWallet}
              className="flex items-center gap-step-2 px-step-4 py-step-2 bg-primary font-label-lg text-label-lg text-on-primary uppercase shadow-[inset_1px_1px_0px_#ffdf9f,inset_-2px_-2px_0px_#5b4300] active:translate-x-step-px active:translate-y-step-px cursor-pointer"
            >
              <span className="font-label-md text-label-md text-on-primary-fixed-variant">◆</span>
              <span className="">[ CONNECT WALLET ]</span>
            </button>
          ) : (
            <span className="font-label-md text-label-md text-primary bg-surface-container-low px-step-4 py-step-2 shadow-[inset_1px_1px_0px_#0c0e14]">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          )}
        </div>
      </div>
      <div className="bg-surface-container-low">
        <div className="h-step-6 max-w-[1440px] mx-auto px-margin-desktop flex items-center justify-between">
          <nav className="flex items-center h-full gap-step-2">
            {NAV.map((t) => (
              <a
                key={t.key}
                href="#"
                aria-current={tab === t.key ? "page" : undefined}
                onClick={(e) => { e.preventDefault(); setTab(t.key); }}
                className={`flex items-center h-full px-step-5 font-label-md text-label-md uppercase tracking-wider transition-colors ${tab === t.key ? t.activeClasses : t.inactiveClasses}`}
              >
                <span className="text-primary mr-step-2">▲</span>{t.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

    </header>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest relative z-10 py-step-7">
      <div className="max-w-[1440px] mx-auto px-margin-desktop flex items-center justify-center">
        <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
          AETHERUM // THE ARCANE TRADING CARD REALM
        </span>
      </div>
    </footer>
  );
}

/* ---------------- Marketplace card tile ---------------- */
function MarketCardTile({ card, priceLabel, actionLabel, disabled, onAction }) {
  const color = classColors[card.class] || "#e2e2ea";
  return (
    <div className="w-full max-w-[280px] bg-surface-container p-step-3 flex flex-col shadow-[inset_2px_2px_0px_#33353b,inset_-2px_-2px_0px_#0c0e14] group hover:-translate-y-step-2 transition-transform duration-100">
      <div className="relative w-full aspect-square bg-surface-container-lowest p-step-2 shadow-[inset_2px_2px_0px_#0c0e14,inset_-1px_-1px_0px_#33353b] mb-step-3">
        <img alt={card.name} className="w-full h-full object-cover" style={{ boxShadow: `inset 1px 1px 0px ${color}` }} src={ipfsToUrl(card.imageUri)} />
      </div>
      <div className="flex items-center justify-between pb-step-2">
        <h2 className="font-headline-sm text-headline-sm uppercase tracking-wide truncate" style={{ color }}>{card.name}</h2>
        <span className="font-label-sm text-label-sm text-primary px-step-2 py-step-px bg-surface-container-lowest shadow-[inset_1px_1px_0px_#0c0e14]">POWER: {card.power}</span>
      </div>
      <div className="flex items-center gap-step-2 mb-step-3">
        <span className="font-label-sm text-label-sm text-on-surface bg-surface-container-lowest px-step-2 py-step-px shadow-[inset_1px_1px_0px_#0c0e14]">CLASS: {card.class?.toUpperCase()}</span>
        <span className="font-label-sm text-label-sm bg-surface-container-lowest px-step-2 py-step-px shadow-[inset_1px_1px_0px_#0c0e14]" style={{ color }}>RARITY: {card.rarity?.toUpperCase()}</span>
      </div>
      <div className="bg-surface-container-lowest p-step-3 space-y-step-2 shadow-[inset_2px_2px_0px_#0c0e14,inset_-1px_-1px_0px_#33353b] mb-step-3">
        <div className="flex items-center justify-between font-body-sm text-body-sm">
          <span className="text-on-surface-variant uppercase">FAST ATK</span>
          <span className="text-on-surface font-bold">{card.fastAttack}</span>
        </div>
        <div className="w-full h-px bg-outline-variant/30"></div>
        <div className="flex items-center justify-between font-body-sm text-body-sm">
          <span className="text-on-surface-variant uppercase">CHARGED ATK</span>
          <span className="text-secondary font-bold">{card.chargedAttack}</span>
        </div>
      </div>
      <div className="mt-auto space-y-step-2 pt-step-1">
        <div className="flex items-center justify-between px-step-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">PRICE:</span>
          <span className="font-headline-sm text-headline-sm text-primary">{priceLabel}</span>
        </div>
        <button
          disabled={disabled}
          onClick={onAction}
          className={
            "w-full py-step-3 font-label-lg text-label-lg uppercase tracking-wider text-center " + (disabled ? btnDisabled : btnEnabled)
          }
        >
          [ {actionLabel} ]
        </button>
      </div>
    </div>
  );
}

/* ---------------- Grimoire card tile ---------------- */
function GrimoireCardTile({ item, onList, onDelist, account, disabled }) {
  const card = cardFromMetadata(item.metadata);
  const color = classColors[card.class] || "#e2e2ea";
  const [price, setPrice] = useState("0.20");
  const isListed = !!item.listing;

  return (
    <div className="w-full bg-surface-container p-step-3 flex flex-col shadow-[inset_2px_2px_0px_#33353b,inset_-2px_-2px_0px_#0c0e14] group hover:-translate-y-step-px transition-transform duration-150">
      <div className="flex items-center justify-between pb-step-2 border-b border-surface-container-highest/40 mb-step-3">
        <span className="font-label-sm text-label-sm uppercase tracking-wider" style={{ color }}>[CLASS: {card.class?.toUpperCase()}]</span>
        <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider" style={{ color }}>[RARITY: {card.rarity?.toUpperCase()}]</span>
      </div>
      <div className="w-full aspect-square bg-surface-container-lowest p-step-2 shadow-[inset_2px_2px_0px_#0c0e14,inset_-1px_-1px_0px_#33353b] mb-step-3 relative">
        <img className="w-full h-full object-cover" alt={card.name} src={ipfsToUrl(card.imageUri)} />
      </div>
      <div className="flex flex-col gap-step-px mb-step-3">
        <h3 className="font-headline-sm text-headline-sm tracking-wide uppercase truncate" style={{ color }}>{card.name}</h3>
        <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm uppercase mt-step-px">
          <span>SPECIMEN #{String(item.tokenId).padStart(4, "0")}</span>
          <span className="font-label-sm text-label-sm uppercase" style={{ color }}>POWER: {card.power}</span>
        </div>
      </div>
      <div className="flex flex-col gap-step-2 mb-step-4">
        <div className="bg-surface-container-lowest px-step-3 py-step-2 shadow-[inset_2px_2px_0px_#0c0e14,inset_-1px_-1px_0px_#33353b] flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">FAST</span>
          <span className="font-body-sm text-body-sm text-on-surface uppercase">{card.fastAttack}</span>
        </div>
        <div className="bg-surface-container-lowest px-step-3 py-step-2 shadow-[inset_2px_2px_0px_#0c0e14,inset_-1px_-1px_0px_#33353b] flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">CHARGED</span>
          <span className="font-body-sm text-body-sm uppercase" style={{ color }}>{card.chargedAttack}</span>
        </div>
      </div>

      {!isListed ? (
        <div className="mt-auto flex flex-col gap-step-3 pt-step-3 border-t border-surface-container-highest/40">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">STATUS:</span>
            <span className="font-label-sm text-label-sm text-on-surface uppercase bg-surface-container-lowest px-step-2 py-step-px shadow-[inset_1px_1px_0px_#0c0e14,inset_-1px_-1px_0px_#33353b]">[ UNLISTED ]</span>
          </div>
          <div className="flex items-center gap-step-2">
            <div className="flex-1 bg-surface-container-lowest px-step-3 py-step-2 shadow-[inset_2px_2px_0px_#0c0e14,inset_-1px_-1px_0px_#33353b] flex items-center justify-between">
              <input
                className="bg-transparent text-primary font-headline-sm text-headline-sm focus:outline-none w-16 uppercase"
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <span className="font-label-sm text-label-sm text-on-surface-variant">ETH</span>
            </div>
            <button
              disabled={disabled}
              onClick={() => onList(item.tokenId, price)}
              className={"px-step-4 py-step-2 font-label-md text-label-md uppercase tracking-wider text-center " + (disabled ? btnDisabled : btnEnabled)}
            >
              [ LIST FOR SALE ]
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-auto flex flex-col gap-step-3 pt-step-3 border-t border-surface-container-highest/40">
          <div className="bg-surface-container-lowest p-step-2 shadow-[inset_2px_2px_0px_#0c0e14,inset_-1px_-1px_0px_#33353b] flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">LISTED AT:</span>
            <span className="font-headline-sm text-headline-sm text-primary">{ethers.formatEther(item.listing.price)} ETH</span>
          </div>
          {item.listing.seller.toLowerCase() === account?.toLowerCase() && (
            <div className="flex items-center gap-step-2">
              <button
                disabled={disabled}
                onClick={() => onDelist(item.tokenId)}
                className={"w-full py-step-2 px-step-4 font-label-md text-label-md uppercase tracking-wider text-center " + (disabled ? btnDisabled : btnEnabled)}
              >
                [ CANCEL LISTING ]
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Summon reveal overlay ---------------- */
function RevealOverlay({ revealedCards, onClose }) {
  const [stage, setStage] = useState("suspense");
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setStage("suspense");
    const t1 = setTimeout(() => setStage("reveal"), 700);
    return () => clearTimeout(t1);
  }, [index]);
  if (!revealedCards?.length) return null;
  const isSummary = index >= revealedCards.length;
  const current = !isSummary ? revealedCards[index] : null;
  const color = current ? classColors[current.class] : "#ffd16c";
  const isRare = current && (current.rarity === "Legendary" || current.rarity === "Mythic");

  return (
    <div className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center">
      {!isSummary ? (
        <div className="flex flex-col items-center gap-step-6">
          {stage === "suspense" ? (
            <div className="w-[240px] h-[320px] border-2 border-dashed border-outline-variant flex items-center justify-center">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase">Summoning...</p>
            </div>
          ) : (
            <div className="w-[260px] bg-surface-container p-step-4 shadow-[inset_2px_2px_0px_#33353b,inset_-2px_-2px_0px_#0c0e14]" style={{ boxShadow: isRare ? `0 0 40px ${color}` : `0 0 15px ${color}` }}>
              <MarketCardTile card={current} priceLabel="" actionLabel="" disabled />
              <p className="text-center font-headline-sm text-headline-sm mt-step-3" style={{ color }}>{current.rarity.toUpperCase()}!</p>
            </div>
          )}
          {stage === "reveal" && (
            <button onClick={() => setIndex((i) => i + 1)} className="px-step-6 py-step-3 bg-primary text-on-primary font-label-lg text-label-lg uppercase tracking-wider shadow-[inset_1px_1px_0px_#ffdf9f,inset_-2px_-2px_0px_#5b4300] cursor-pointer">
              [ {index + 1 < revealedCards.length ? "NEXT" : "SEE SUMMARY"} ]
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-step-6 max-w-[900px] p-step-7 overflow-y-auto max-h-[90vh]">
          <h2 className="font-headline-lg text-headline-lg text-primary uppercase">Summoning Complete</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-step-4">
            {revealedCards.map((c, i) => <MarketCardTile card={c} priceLabel="" actionLabel="" disabled key={i} />)}
          </div>
          <button onClick={onClose} className="px-step-6 py-step-3 bg-primary text-on-primary font-label-lg text-label-lg uppercase tracking-wider shadow-[inset_1px_1px_0px_#ffdf9f,inset_-2px_-2px_0px_#5b4300] cursor-pointer">
            [ CONTINUE ]
          </button>
        </div>
      )}
    </div>
  );
}

/* ================= MAIN APP ================= */
export default function App() {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [tab, setTab] = useState("mint");
  const [myCards, setMyCards] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [revealedCards, setRevealedCards] = useState(null);
  const [summonAmount, setSummonAmount] = useState(1);

  async function connectWallet() {
    if (!window.ethereum) return alert("Please install MetaMask to use Aetherum.");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) {
        alert("Please switch MetaMask to the Sepolia Testnet (Chain ID 11155111) to use Aetherum.");
        return;
      }
      const s = await provider.getSigner();
      setAccount(await s.getAddress());
      setSigner(s);
    } catch (e) {
      console.error(e);
      alert("Could not connect wallet.");
    }
  }

  function getContracts(signerOrProvider) {
    return {
      cardContract: new ethers.Contract(CARD_ADDRESS, CARD_ABI, signerOrProvider),
      marketplaceContract: new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signerOrProvider),
    };
  }

  async function fetchMetadata(tokenURI) {
    try { return await (await fetch(ipfsToUrl(tokenURI))).json(); }
    catch (e) { console.error(e); return null; }
  }

  async function summon(count) {
    if (!signer) return alert("Connect your wallet first.");
    setLoading(true);
    setStatusMsg(count === 1 ? "Summoning 1 card..." : "Summoning 5 cards...");
    try {
      const { cardContract } = getContracts(signer);
      const price = count === 1 ? await cardContract.SUMMON_PRICE() : await cardContract.SUMMON_FIVE_PRICE();
      const tx = count === 1 ? await cardContract.summon({ value: price }) : await cardContract.summonFive({ value: price });
      const receipt = await tx.wait();
      const iface = new ethers.Interface(CARD_ABI);
      const summoned = [];
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "CardSummoned") {
            const card = findCardByClassRarity(Number(parsed.args.class), Number(parsed.args.rarity));
            if (card) summoned.push(card);
          }
        } catch {}
      }
      setStatusMsg("");
      setRevealedCards(summoned);
    } catch (e) {
      console.error(e);
      setStatusMsg("Summon failed: " + (e.reason || e.message));
    }
    setLoading(false);
  }

  async function loadMyCards() {
    if (!signer || !account) return;
    setLoading(true);
    setStatusMsg("Loading your cards...");
    try {
      const { cardContract, marketplaceContract } = getContracts(signer);
      const owned = [];
      for (let tokenId = 0; tokenId < 1000; tokenId++) {
        let owner;
        try { owner = await cardContract.ownerOf(tokenId); } catch { break; }
        if (owner.toLowerCase() === account.toLowerCase()) {
          const uri = await cardContract.tokenURI(tokenId);
          const metadata = await fetchMetadata(uri);
          const listingRaw = await marketplaceContract.listings(tokenId);
          const listing = listingRaw.price > 0n ? listingRaw : null;
          owned.push({ tokenId, uri, metadata, listing });
        }
      }
      setMyCards(owned);
      setStatusMsg("");
    } catch (e) {
      console.error(e);
      setStatusMsg("Failed to load your cards.");
    }
    setLoading(false);
  }

  async function loadListings() {
    setLoading(true);
    setStatusMsg("Loading marketplace...");
    try {
      let providerOrSigner = signer;
      if (!providerOrSigner) {
        if (window.ethereum) {
          providerOrSigner = new ethers.BrowserProvider(window.ethereum);
        } else {
          providerOrSigner = new ethers.JsonRpcProvider(import.meta.env.VITE_SEPOLIA_RPC_URL || "https://rpc.sepolia.org");
        }
      }
      const { cardContract, marketplaceContract } = getContracts(providerOrSigner);
      const found = [];
      for (let tokenId = 0; tokenId < 1000; tokenId++) {
        try { await cardContract.ownerOf(tokenId); } catch { break; }
        const listing = await marketplaceContract.listings(tokenId);
        if (listing.price > 0n) {
          const uri = await cardContract.tokenURI(tokenId);
          const metadata = await fetchMetadata(uri);
          found.push({ tokenId, seller: listing.seller, price: listing.price, metadata });
        }
      }
      setListings(found);
      setStatusMsg("");
    } catch (e) {
      console.error(e);
      setStatusMsg("Failed to load marketplace.");
    }
    setLoading(false);
  }

  async function listCard(tokenId, priceEth) {
    if (!signer) return alert("Connect your wallet first.");
    setLoading(true);
    setStatusMsg("Approving marketplace...");
    try {
      const { cardContract, marketplaceContract } = getContracts(signer);
      await (await cardContract.approve(MARKETPLACE_ADDRESS, tokenId)).wait();
      setStatusMsg("Listing card...");
      await (await marketplaceContract.listCard(tokenId, ethers.parseEther(priceEth))).wait();
      setStatusMsg("Card listed for sale!");
      loadMyCards();
    } catch (e) {
      console.error(e);
      setStatusMsg("Listing failed: " + (e.reason || e.message));
    }
    setLoading(false);
  }

  async function cancelListing(tokenId) {
    if (!signer) return;
    setLoading(true);
    setStatusMsg("Cancelling listing...");
    try {
      const { marketplaceContract } = getContracts(signer);
      await (await marketplaceContract.cancelListing(tokenId)).wait();
      setStatusMsg("Listing cancelled.");
      loadMyCards();
    } catch (e) {
      console.error(e);
      setStatusMsg("Cancel failed: " + (e.reason || e.message));
    }
    setLoading(false);
  }

  async function buyCard(tokenId, price) {
    if (!signer) return alert("Connect your wallet first.");
    setLoading(true);
    setStatusMsg("Purchasing card...");
    try {
      const { marketplaceContract } = getContracts(signer);
      await (await marketplaceContract.buyCard(tokenId, { value: price })).wait();
      setStatusMsg("Card purchased!");
      loadListings();
    } catch (e) {
      console.error(e);
      setStatusMsg("Purchase failed: " + (e.reason || e.message));
    }
    setLoading(false);
  }

  useEffect(() => {
    if (account && tab === "mycards") loadMyCards();
    if (tab === "gallery") loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, tab]);

  const disabled = !account;

  return (
    <div className="bg-background font-body-md text-on-surface min-h-screen relative selection:bg-primary selection:text-on-primary">
      <div className="fixed inset-0 scanlines z-40"></div>
      <Header account={account} connectWallet={connectWallet} tab={tab} setTab={setTab} />

      <main className="w-full pt-[64px] bg-surface-container-lowest min-h-screen relative z-10">
        <div className="max-w-[1440px] mx-auto px-margin-desktop py-step-6">
          <div className="flex flex-col w-full">
            {statusMsg && <p className="font-label-sm text-label-sm text-on-surface-variant mb-step-4">{statusMsg}</p>}
            {loading && <p className="font-label-sm text-label-sm text-primary mb-step-4">WORKING...</p>}

            {/* ---------------- MINT (Summoning Altar) ---------------- */}
            {tab === "mint" && (
              <div className="flex flex-col w-full space-y-step-6">
                {!account && <WalletBanner />}
                <div className="flex flex-col gap-step-4 mb-step-7">
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-step-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-step-3 mb-step-2">
                        <span className="w-2 h-2 bg-primary inline-block"></span>
                        <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">TRANSMUTATION MATRIX // SECTOR 07</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">[ PROTOCOL SYNCHRONIZED ]</span>
                      </div>
                      <h1 className="font-headline-xl text-headline-xl text-on-surface uppercase tracking-tight">
                        THE SUMMONING ALTAR <span className="text-primary">//</span> FORGE NEW RELICS
                      </h1>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-step-2 max-w-3xl">
                        Channel arcane ether to materialize genesis edition trading cards. Every relic is minted directly onto immutable state with deterministic archetypes and verified attribute allocations.
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-surface-container-low p-step-6 shadow-[inset_1px_1px_0px_#4e4635,inset_-2px_-2px_0px_#0c0e14]">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-step-6">
                      <div className="flex flex-col gap-step-3">
                        <div className="flex items-center gap-step-3">
                          <span className="px-step-3 py-step-px bg-primary-container/20 text-primary font-label-sm text-label-sm uppercase shadow-[inset_1px_1px_0px_#ffd16c,inset_-1px_-1px_0px_#5b4300]">◆ ALTAR ACTIVE</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">CONTRACT: SEPOLIA TESTNET</span>
                        </div>
                        <h2 className="font-headline-md text-headline-md text-on-surface uppercase">UNRESTRICTED SUMMON PROTOCOL</h2>
                        <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">Summon without fixed allocation caps. Each summon randomly selects a card's class and rarity directly on-chain.</p>
                      </div>
                      <div className="w-full lg:w-auto bg-surface-container p-step-5 shadow-[inset_2px_2px_0px_#0c0e14,inset_-1px_-1px_0px_#33353b] flex flex-col gap-step-4 max-w-sm">
                        <div className="flex items-center justify-between gap-step-4 border-b border-surface-container-high pb-step-3">
                          <div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase block">COST PER SPECIMEN:</span>
                            <span className="font-label-md text-label-md text-on-surface uppercase">0.1 ETH</span>
                          </div>
                          <div className="text-right">
                            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase block">TOTAL DUE:</span>
                            <span className="font-headline-sm text-headline-sm text-primary uppercase">{summonAmount === 1 ? '0.1 ETH' : '0.5 ETH'}</span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-step-3">
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => setSummonAmount(1)}
                            className={"flex-1 py-step-3 px-step-4 font-label-lg text-label-lg uppercase tracking-wider shadow-[inset_1px_1px_0px_#4e4635,inset_-1px_-1px_0px_#0c0e14] text-center " +
                              (disabled ? btnDisabled : (summonAmount === 1 ? btnEnabled : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high cursor-pointer"))}
                          >
                            [ SUMMON X1 ]
                          </button>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => setSummonAmount(5)}
                            className={"flex-1 py-step-3 px-step-4 font-label-lg text-label-lg uppercase tracking-wider shadow-[inset_1px_1px_0px_#4e4635,inset_-1px_-1px_0px_#0c0e14] text-center " +
                              (disabled ? btnDisabled : (summonAmount === 5 ? btnEnabled : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high cursor-pointer"))}
                          >
                            [ SUMMON X5 ]
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => summon(summonAmount)}
                          className={"w-full mt-step-3 py-step-3 px-step-4 font-label-lg text-label-lg uppercase tracking-wider text-center " +
                            (disabled ? btnDisabled : btnEnabled)}
                        >
                          [ INITIATE SUMMONING PROTOCOL ]
                        </button>
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase text-center block">Paid in Sepolia testnet ETH — no real funds required.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full mb-step-7">
                  <div className="flex items-center justify-between pb-step-3 mb-step-4 border-b border-surface-container-high">
                    <div className="flex items-center gap-step-2">
                      <span className="font-label-sm text-label-sm text-primary">◆</span>
                      <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-widest">ELEMENTAL AFFINITIES CODEX // DISCOVERY GUIDE</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase hidden sm:inline">[ INFORMATIONAL LORE DISPLAY ]</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-step-4">
                    {CLASS_NAMES.map((cn) => (
                      <div key={cn} className="bg-surface-container p-step-4 shadow-[inset_1px_1px_0px_#4e4635,inset_-1px_-1px_0px_#0c0e14] flex flex-col gap-step-2">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm uppercase font-bold" style={{ color: classColors[cn] }}>{classGlyph[cn]} {cn.toUpperCase()}</span>
                          <span className="w-2 h-2 inline-block" style={{ backgroundColor: classColors[cn] }}></span>
                        </div>
                        <span className="font-headline-sm text-headline-sm text-on-surface">{cn.toUpperCase()}</span>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{classLore[cn]}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full bg-surface-container-low p-step-4 shadow-[inset_2px_2px_0px_#0c0e14,inset_-1px_-1px_0px_#33353b] flex flex-col md:flex-row items-center justify-between gap-step-3 font-label-sm text-label-sm">
                  <div className="flex items-center gap-step-3 text-on-surface-variant">
                    <span className="text-primary font-bold">[!] ON-CHAIN VERIFICATION:</span>
                    <span className="">Each summon randomly selects a card's class and rarity on-chain, weighted so common elements appear more often than rare ones.</span>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- MARKETPLACE ---------------- */}
            {tab === "gallery" && (
              <div className="flex flex-col w-full space-y-step-6">
                {!account && <WalletBanner message="Connect your wallet to buy or list cards — browsing is open to all." />}
                <div className="w-full bg-surface-container-low p-step-5 shadow-[inset_2px_2px_0px_#0c0e14,inset_-2px_-2px_0px_#33353b]">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-step-4">
                    <div className="space-y-step-2">
                      <div className="flex items-center gap-step-3">
                        <span className="inline-block w-2.5 h-2.5 bg-primary"></span>
                        <h1 className="font-headline-lg text-headline-lg text-primary tracking-wider uppercase">THE MERCHANT'S CROSS // SECONDARY TRADING</h1>
                        <span className="hidden sm:inline-block font-label-sm text-label-sm px-step-2 py-step-px bg-surface-container text-on-surface-variant shadow-[inset_1px_1px_0px_#0c0e14]">P2P_EXCHANGE</span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">Inspect, browse, and acquire registered Aetherum relics verified on-chain. Sealed cryptographic provenance signed by smart contracts.</p>
                    </div>
                  </div>
                </div>

                {listings.length === 0 && !loading && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant">No cards currently listed for sale.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-step-6 items-start justify-items-center">
                  {listings.map((item) => (
                    <MarketCardTile
                      key={item.tokenId}
                      card={cardFromMetadata(item.metadata)}
                      priceLabel={`${ethers.formatEther(item.price)} ETH`}
                      actionLabel={`BUY NOW // ${ethers.formatEther(item.price)} ETH`}
                      disabled={disabled}
                      onAction={() => buyCard(item.tokenId, item.price)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ---------------- MY CARDS (Grimoire) ---------------- */}
            {tab === "mycards" && (
              <div className="flex flex-col gap-step-6">
                {!account && <WalletBanner />}
                <div className="bg-surface-container p-step-6 shadow-[inset_2px_2px_0px_#33353b,inset_-2px_-2px_0px_#0c0e14] relative overflow-hidden">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-step-6 relative z-10">
                    <div className="flex flex-col gap-step-2">
                      <div className="flex items-center gap-step-3">
                        <span className="text-primary font-headline-sm text-headline-sm">◆</span>
                        <h1 className="font-headline-lg text-headline-lg text-primary tracking-wider uppercase">THE GRIMOIRE // PERSONAL COLLECTION</h1>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">Manage your bound relics and list cards for sale on the Merchant's Cross.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-step-4 mt-step-6 pt-step-6 border-t border-surface-container-highest/60">
                    <div className="bg-surface-container-lowest p-step-4 shadow-[inset_2px_2px_0px_#0c0e14,inset_-1px_-1px_0px_#33353b] flex flex-col gap-step-px">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">CARDS OWNED</span>
                      <div className="flex items-baseline gap-step-2 mt-step-2"><span className="font-headline-md text-headline-md text-primary">{myCards.length}</span><span className="font-label-sm text-label-sm text-on-surface-variant">SPECIMENS</span></div>
                    </div>
                    <div className="bg-surface-container-lowest p-step-4 shadow-[inset_2px_2px_0px_#0c0e14,inset_-1px_-1px_0px_#33353b] flex flex-col gap-step-px">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">ESTIMATED VALUE</span>
                      <div className="flex items-baseline gap-step-2 mt-step-2"><span className="font-headline-md text-headline-md text-primary">0.00</span><span className="font-label-sm text-label-sm text-on-surface-variant">ETH</span></div>
                    </div>
                    <div className="bg-surface-container-lowest p-step-4 shadow-[inset_2px_2px_0px_#0c0e14,inset_-1px_-1px_0px_#33353b] flex flex-col gap-step-px">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">BOUND SPECIMENS</span>
                      <div className="flex items-baseline gap-step-2 mt-step-2"><span className="font-headline-md text-headline-md text-secondary">{myCards.length}</span><span className="font-label-sm text-label-sm text-secondary">CARDS</span></div>
                    </div>
                    <div className="bg-surface-container-lowest p-step-4 shadow-[inset_2px_2px_0px_#0c0e14,inset_-1px_-1px_0px_#33353b] flex flex-col gap-step-px">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">REALM NETWORK</span>
                      <div className="flex items-baseline gap-step-2 mt-step-2"><span className="font-headline-md text-headline-md text-on-surface">SEPOLIA</span><span className="font-label-sm text-label-sm text-on-surface-variant">TESTNET</span></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-step-2">
                  <div className="flex items-center gap-step-3">
                    <span className="w-2 h-2 bg-primary inline-block"></span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-wider">BOUND SPECIMENS ({myCards.length})</h2>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">CARDS OWNED: {myCards.length}</span>
                </div>

                {account && myCards.length === 0 && !loading && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant">You don't own any cards yet — summon one!</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-desktop">
                  {myCards.map((item) => (
                    <GrimoireCardTile key={item.tokenId} item={item} onList={listCard} onDelist={cancelListing} account={account} disabled={disabled} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      {revealedCards && <RevealOverlay revealedCards={revealedCards} onClose={() => setRevealedCards(null)} />}
    </div>
  );
}
