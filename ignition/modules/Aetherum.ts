import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AetherumModule", (m) => {
  const card = m.contract("AetherumCard");
  const marketplace = m.contract("AetherumMarketplace", [card]);

  return { card, marketplace };
});