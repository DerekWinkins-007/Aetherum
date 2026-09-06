import { PinataSDK } from "pinata";
import fs from "fs";
import path from "path";
import "dotenv/config";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!,
});

const cards = [
  // FIRE
  { file: "lucid-origin_16-bit_pixel_art_Ember_Sprite_small_fire_elemental_sprite_creature_flickering_em-0.jpg", name: "Ember Sprite", class: "Fire", rarity: "Common", power: 20, fastAttack: "Spark Flick", chargedAttack: "Ember Burst" },
  { file: "lucid-origin_16-bit_pixel_art_Blaze_Jackal_fire_elemental_jackal_beast_with_flaming_mane_retr-0.jpg", name: "Blaze Jackal", class: "Fire", rarity: "Rare", power: 40, fastAttack: "Fang Singe", chargedAttack: "Wildfire Pounce" },
  { file: "lucid-origin_16-bit_pixel_art_Cinder_Drake_small_fire_dragon_creature_with_ember-covered_scal-0.jpg", name: "Cinder Drake", class: "Fire", rarity: "Epic", power: 60, fastAttack: "Cinder Claw", chargedAttack: "Molten Breath" },
  { file: "lucid-origin_16-bit_pixel_art_Phoenix_Ashborn_majestic_fire_phoenix_bird_rising_from_ashes_re-0.jpg", name: "Phoenix Ashborn", class: "Fire", rarity: "Legendary", power: 80, fastAttack: "Ash Talon", chargedAttack: "Rebirth Flare" },
  { file: "lucid-origin_16-bit_pixel_art_Infernus_the_Undying_towering_fire_demon_lord_engulfed_in_flame-0.jpg", name: "Infernus, the Undying", class: "Fire", rarity: "Mythic", power: 95, fastAttack: "Hellspark", chargedAttack: "Infernal Cataclysm" },

  // WATER
  { file: "lucid-origin_16-bit_pixel_art_Tide_Sprite_small_water_elemental_sprite_creature_flowing_water-0.jpg", name: "Tide Sprite", class: "Water", rarity: "Common", power: 20, fastAttack: "Ripple Tap", chargedAttack: "Wave Crash" },
  { file: "lucid-origin_16-bit_pixel_art_Coral_Serpent_sea_serpent_creature_covered_in_coral_and_scales_-0.jpg", name: "Coral Serpent", class: "Water", rarity: "Rare", power: 40, fastAttack: "Reef Bite", chargedAttack: "Tidal Coil" },
  { file: "lucid-origin_16-bit_pixel_art_Riptide_Warden_armored_water_guardian_creature_wielding_a_tride-0.jpg", name: "Riptide Warden", class: "Water", rarity: "Epic", power: 60, fastAttack: "Trident Jab", chargedAttack: "Maelstrom Strike" },
  { file: "lucid-origin_16-bit_pixel_art_Leviathan_s_Whisper_ghostly_ancient_sea_leviathan_spirit_retro_-0.jpg", name: "Leviathan's Whisper", class: "Water", rarity: "Legendary", power: 80, fastAttack: "Depth Pulse", chargedAttack: "Abyssal Surge" },
  { file: "lucid-origin_16-bit_pixel_art_Abyssos_the_Deep_Mother_massive_ancient_sea_goddess_creature_wi-0.jpg", name: "Abyssos, the Deep Mother", class: "Water", rarity: "Mythic", power: 95, fastAttack: "Current Lash", chargedAttack: "Oceanic Wrath" },

  // EARTH
  { file: "lucid-origin_16-bit_pixel_art_Pebble_Golem_small_rock_golem_creature_made_of_stacked_stones_r-0.jpg", name: "Pebble Golem", class: "Earth", rarity: "Common", power: 20, fastAttack: "Rock Tap", chargedAttack: "Boulder Slam" },
  { file: "lucid-origin_16-bit_pixel_art_Root_Strider_plant-vine_creature_with_wooden_root_legs_retro_SN-0.jpg", name: "Root Strider", class: "Earth", rarity: "Rare", power: 40, fastAttack: "Vine Whip", chargedAttack: "Root Snare" },
  { file: "lucid-origin_16-bit_pixel_art_Stonebound_Titan_large_muscular_stone_titan_creature_retro_SNES-0.jpg", name: "Stonebound Titan", class: "Earth", rarity: "Epic", power: 60, fastAttack: "Stone Fist", chargedAttack: "Seismic Crush" },
  { file: "lucid-origin_16-bit_pixel_art_Mountain_s_Heart_massive_mountain-shaped_earth_guardian_creatur-0.jpg", name: "Mountain's Heart", class: "Earth", rarity: "Legendary", power: 80, fastAttack: "Tremor Punch", chargedAttack: "Avalanche Slam" },
  { file: "lucid-origin_16-bit_pixel_art_Terraxis_the_Unshaken_colossal_ancient_earth_titan_covered_in_m-0.jpg", name: "Terraxis, the Unshaken", class: "Earth", rarity: "Mythic", power: 95, fastAttack: "Crystal Jab", chargedAttack: "Continental Rupture" },

  // AIR
  { file: "lucid-origin_16-bit_pixel_art_Gale_Wisp_small_wind_elemental_sprite_creature_made_of_swirling-0.jpg", name: "Gale Wisp", class: "Air", rarity: "Common", power: 20, fastAttack: "Breeze Poke", chargedAttack: "Gust Burst" },
  { file: "lucid-origin_16-bit_pixel_art_Skyrend_Falcon_swift_falcon_creature_with_wind-swept_feathers_r-0.jpg", name: "Skyrend Falcon", class: "Air", rarity: "Rare", power: 40, fastAttack: "Wind Slash", chargedAttack: "Diving Gale" },
  { file: "lucid-origin_16-bit_pixel_art_Storm_Herald_winged_storm_elemental_creature_crackling_with_win-0.jpg", name: "Storm Herald", class: "Air", rarity: "Epic", power: 60, fastAttack: "Static Jolt", chargedAttack: "Thunder Squall" },
  { file: "lucid-origin_16-bit_pixel_art_Tempest_Wing_large_winged_tempest_dragon-bird_creature_retro_SN-0.jpg", name: "Tempest Wing", class: "Air", rarity: "Legendary", power: 80, fastAttack: "Vortex Peck", chargedAttack: "Cyclone Slam" },
  { file: "lucid-origin_16-bit_pixel_art_Zephyrion_Lord_of_Gales_majestic_sky_titan_creature_with_massiv-0.jpg", name: "Zephyrion, Lord of Gales", class: "Air", rarity: "Mythic", power: 95, fastAttack: "Sky Lash", chargedAttack: "Hurricane's Judgment" },

  // VOID
  { file: "lucid-origin_16-bit_pixel_art_Hollow_Wisp_small_shadowy_void_sprite_creature_with_glowing_eye-0.jpg", name: "Hollow Wisp", class: "Void", rarity: "Common", power: 30, fastAttack: "Shadow Nip", chargedAttack: "Void Pulse" },
  { file: "lucid-origin_16-bit_pixel_art_Shade_Stalker_sleek_shadow_panther-like_void_creature_retro_SNE-0.jpg", name: "Shade Stalker", class: "Void", rarity: "Rare", power: 50, fastAttack: "Umbral Slash", chargedAttack: "Nightmare Pounce" },
  { file: "lucid-origin_16-bit_pixel_art_Nullbeast_twisted_void_beast_creature_with_distorted_shadowy_fo-0.jpg", name: "Nullbeast", class: "Void", rarity: "Epic", power: 70, fastAttack: "Null Bite", chargedAttack: "Entropy Wave" },
  { file: "lucid-origin_16-bit_pixel_art_Eclipse_Warden_armored_void_guardian_creature_radiating_dark_en-0.jpg", name: "Eclipse Warden", class: "Void", rarity: "Legendary", power: 90, fastAttack: "Dark Jab", chargedAttack: "Eclipse Ray" },
  { file: "lucid-origin_16-bit_pixel_art_The_Hollow_King_massive_void_dragon_creature_dragon-type_final_-0.jpg", name: "The Hollow King", class: "Void", rarity: "Mythic", power: 110, fastAttack: "Abyssal Claw", chargedAttack: "Oblivion's Embrace" },

  // LUMEN
  { file: "lucid-origin_16-bit_pixel_art_Glim_Sprite_small_radiant_light_elemental_sprite_creature_glowi-0.jpg", name: "Glim Sprite", class: "Lumen", rarity: "Common", power: 30, fastAttack: "Glow Poke", chargedAttack: "Radiant Flash" },
  { file: "lucid-origin_16-bit_pixel_art_Radiant_Hare_swift_light_elemental_hare_creature_with_a_glowing-0.jpg", name: "Radiant Hare", class: "Lumen", rarity: "Rare", power: 50, fastAttack: "Light Nip", chargedAttack: "Solar Sprint" },
  { file: "lucid-origin_16-bit_pixel_art_Sunwing_Sentinel_winged_light_guardian_creature_radiating_warm_-0.jpg", name: "Sunwing Sentinel", class: "Lumen", rarity: "Epic", power: 70, fastAttack: "Beam Peck", chargedAttack: "Dawnlight Barrage" },
  { file: "lucid-origin_16-bit_pixel_art_Solara_Dawnbringer_majestic_radiant_light_phoenix-like_creature-0.jpg", name: "Solara, Dawnbringer", class: "Lumen", rarity: "Legendary", power: 90, fastAttack: "Photon Jab", chargedAttack: "Solar Flare Judgment" },
  { file: "lucid-origin_16-bit_pixel_art_Luxaris_the_Eternal_Radiance_colossal_light_elemental_titan_glo-0.jpg", name: "Luxaris, the Eternal Radiance", class: "Lumen", rarity: "Mythic", power: 110, fastAttack: "Prism Strike", chargedAttack: "Radiant Cataclysm" },
];

async function uploadCard(card: typeof cards[0]) {
  const filePath = path.join("assets/cards", card.file);
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer]);
  const file = new File([blob], card.file, { type: "image/jpeg" });

  const imageUpload = await pinata.upload.public.file(file);
  const imageUri = `ipfs://${imageUpload.cid}`;

  const metadata = {
    name: card.name,
    description: `A ${card.rarity} ${card.class} elemental creature from the world of Aetherum.`,
    image: imageUri,
    attributes: [
      { trait_type: "Class", value: card.class },
      { trait_type: "Rarity", value: card.rarity },
      { trait_type: "Power", value: card.power },
      { trait_type: "Fast Attack", value: card.fastAttack },
      { trait_type: "Charged Attack", value: card.chargedAttack },
    ],
  };

  const metadataFile = new File(
    [JSON.stringify(metadata)],
    `${card.name}.json`,
    { type: "application/json" }
  );
  const metadataUpload = await pinata.upload.public.file(metadataFile);
  const tokenUri = `ipfs://${metadataUpload.cid}`;

  console.log(`✅ ${card.name} -> ${tokenUri}`);
  return { ...card, imageUri, tokenUri };
}

async function main() {
  const results = [];
  for (const card of cards) {
    const result = await uploadCard(card);
    results.push(result);
  }

  fs.mkdirSync("metadata", { recursive: true });
  fs.writeFileSync(
    "metadata/card-uris.json",
    JSON.stringify(results, null, 2)
  );

  console.log("\nAll cards uploaded! Saved to metadata/card-uris.json");
}

main().catch(console.error);