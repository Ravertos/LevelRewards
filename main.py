import discord
from discord.ext import commands, tasks
from discord import app_commands
import json
import os
import asyncio
import aiofiles
from datetime import datetime, timedelta
import logging
from dotenv import load_dotenv
import re

# Configure logging FIRST
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Try to import MCRcon with fallback
try:
    from mcrcon import MCRcon
    RCON_AVAILABLE = True
    logger.info("✅ MCRcon module successfully loaded")
except ImportError:
    logger.warning(
        "⚠️ MCRcon module not available - RCON commands will be disabled")
    RCON_AVAILABLE = False
    MCRcon = None

# Bot configuration
TOKEN = os.getenv('DISCORD_TOKEN')

# File paths
REWARDS_FILE = 'rewards.json'
CONFIG_FILE = 'config.json'
EOS_MAPPING_FILE = 'player_eos_mapping.json'
DISCORD_MAPPING_FILE = 'discord_eos_mapping.json'
SERVERS_FILE = 'servers.json'

# HyperBeast Blueprint Categories mit korrekten ARK Blueprint-Pfaden
HB_CATEGORIES = {
    "cryopoddino": {
        "name": "🦕 Cryo Pod Dinos",
        "description": "Gefrorene Dinosaurier in Cryo Pods",
        "blueprints": {
            "therizino": {
                "name": "Therizinosaurus",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/Dinos/Therizinosaurus/Therizino_Character_BP.Therizino_Character_BP'",
                "description": "Starker Sammel-Dinosaurier"
            },
            "rex": {
                "name": "T-Rex",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/Dinos/Rex/Rex_Character_BP.Rex_Character_BP'",
                "description": "König der Dinosaurier"
            },
            "giga": {
                "name": "Giganotosaurus",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/Dinos/Gigant/Gigant_Character_BP.Gigant_Character_BP'",
                "description": "Größter Raubsaurier"
            },
            "wyvern": {
                "name": "Wyvern",
                "blueprint":
                "Blueprint'/Game/ScorchedEarth/Dinos/Wyvern/Wyvern_Character_BP_Fire.Wyvern_Character_BP_Fire'",
                "description": "Feuer-Wyvern"
            },
            "griffin": {
                "name": "Griffin",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/Dinos/Griffin/Griffin_Character_BP.Griffin_Character_BP'",
                "description": "Majestätischer Greif"
            },
            "argentavis": {
                "name": "Argentavis",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/Dinos/Argentavis/Argent_Character_BP.Argent_Character_BP'",
                "description": "Großer Flugvogel"
            },
            "ankylo": {
                "name": "Ankylosaurus",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/Dinos/Ankylo/Ankylo_Character_BP.Ankylo_Character_BP'",
                "description": "Metall-Sammler"
            }
        }
    },
    "weapons": {
        "name": "⚔️ Waffen",
        "description": "Hochwertige Waffen und Ausrüstung",
        "blueprints": {
            "tekrifle": {
                "name": "Tek Rifle",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/Weapons/PrimalItem_WeaponTekRifle.PrimalItem_WeaponTekRifle'",
                "description": "Futuristische Energie-Waffe"
            },
            "teksword": {
                "name": "Tek Sword",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/Weapons/PrimalItem_WeaponTekSword.PrimalItem_WeaponTekSword'",
                "description": "Plasma-Schwert"
            },
            "fabricatedsniper": {
                "name": "Fabricated Sniper Rifle",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/Weapons/PrimalItem_WeaponOneShotRifle.PrimalItem_WeaponOneShotRifle'",
                "description": "Präzisions-Scharfschützengewehr"
            },
            "rocketslung": {
                "name": "Rocket Launcher",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/Weapons/PrimalItem_WeaponRocketLauncher.PrimalItem_WeaponRocketLauncher'",
                "description": "Explosiver Raketenwerfer"
            },
            "assaultrifle": {
                "name": "Assault Rifle",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Weapons/PrimalItem_WeaponMachineGun.PrimalItem_WeaponMachineGun'",
                "description": "Automatisches Gewehr"
            },
            "pump_shotgun": {
                "name": "Pump-Action Shotgun",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Weapons/PrimalItem_WeaponShotgun.PrimalItem_WeaponShotgun'",
                "description": "Kraftvolle Schrotflinte"
            }
        }
    },
    "armor": {
        "name": "🛡️ Rüstungen",
        "description": "Schutzausrüstung und Rüstungen",
        "blueprints": {
            "tekarmor_chest": {
                "name": "Tek Chestpiece",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Armor/TEK/PrimalItemArmor_TekShirt.PrimalItemArmor_TekShirt'",
                "description": "Tek-Brustpanzer"
            },
            "tekarmor_boots": {
                "name": "Tek Boots",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Armor/TEK/PrimalItemArmor_TekBoots.PrimalItemArmor_TekBoots'",
                "description": "Tek-Stiefel"
            },
            "riotarmor_chest": {
                "name": "Riot Chestpiece",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Armor/Riot/PrimalItemArmor_RiotShirt.PrimalItemArmor_RiotShirt'",
                "description": "Schwere Kampfrüstung Brust"
            },
            "hazardsuit_chest": {
                "name": "Hazard Suit Chest",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Armor/Hazard/PrimalItemArmor_HazardSuitShirt.PrimalItemArmor_HazardSuitShirt'",
                "description": "Strahlenschutz-Brustpanzer"
            },
            "ghillie_suit": {
                "name": "Ghillie Chestpiece",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Armor/Cloth/PrimalItemArmor_GhillieShirt.PrimalItemArmor_GhillieShirt'",
                "description": "Tarnanzug für Tarnung"
            }
        }
    },
    "structures_stone": {
        "name": "🏗️ Stein-Strukturen",
        "description": "Stabile Stein-Bauelemente",
        "blueprints": {
            "stone_foundation": {
                "name": "Stone Foundation",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Stone/PrimalItemStructure_StoneFoundation.PrimalItemStructure_StoneFoundation'",
                "description": "Stabiles Steinfundament"
            },
            "stone_wall": {
                "name": "Stone Wall",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Stone/PrimalItemStructure_StoneWall.PrimalItemStructure_StoneWall'",
                "description": "Steinwand"
            },
            "stone_ceiling": {
                "name": "Stone Ceiling",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Stone/PrimalItemStructure_StoneCeiling.PrimalItemStructure_StoneCeiling'",
                "description": "Steindecke"
            },
            "stone_door": {
                "name": "Stone Door",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Stone/PrimalItemStructure_StoneDoor.PrimalItemStructure_StoneDoor'",
                "description": "Steintür"
            },
            "stone_doorframe": {
                "name": "Stone Doorframe",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Stone/PrimalItemStructure_StoneDoorframe.PrimalItemStructure_StoneDoorframe'",
                "description": "Stein-Türrahmen"
            }
        }
    },
    "structures_wood": {
        "name": "🌳 Holz-Strukturen",
        "description": "Natürliche Holz-Bauelemente",
        "blueprints": {
            "wood_foundation": {
                "name": "Wood Foundation",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Wood/PrimalItemStructure_WoodFoundation.PrimalItemStructure_WoodFoundation'",
                "description": "Holzfundament"
            },
            "wood_wall": {
                "name": "Wood Wall",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Wood/PrimalItemStructure_WoodWall.PrimalItemStructure_WoodWall'",
                "description": "Holzwand"
            },
            "wood_ceiling": {
                "name": "Wood Ceiling",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Wood/PrimalItemStructure_WoodCeiling.PrimalItemStructure_WoodCeiling'",
                "description": "Holzdecke"
            },
            "wood_door": {
                "name": "Wood Door",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Wood/PrimalItemStructure_WoodDoor.PrimalItemStructure_WoodDoor'",
                "description": "Holztür"
            },
            "wood_ramp": {
                "name": "Wood Ramp",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Wood/PrimalItemStructure_WoodRamp.PrimalItemStructure_WoodRamp'",
                "description": "Holzrampe"
            }
        }
    },
    "structures_metal": {
        "name": "🔩 Metall-Strukturen",
        "description": "Robuste Metall-Bauelemente",
        "blueprints": {
            "metal_foundation": {
                "name": "Metal Foundation",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Metal/PrimalItemStructure_MetalFoundation.PrimalItemStructure_MetalFoundation'",
                "description": "Metallfundament"
            },
            "metal_wall": {
                "name": "Metal Wall",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Metal/PrimalItemStructure_MetalWall.PrimalItemStructure_MetalWall'",
                "description": "Metallwand"
            },
            "metal_ceiling": {
                "name": "Metal Ceiling",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Metal/PrimalItemStructure_MetalCeiling.PrimalItemStructure_MetalCeiling'",
                "description": "Metalldecke"
            },
            "metal_door": {
                "name": "Metal Door",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Metal/PrimalItemStructure_MetalDoor.PrimalItemStructure_MetalDoor'",
                "description": "Metalltür"
            }
        }
    },
    "structures_advanced": {
        "name": "🏭 Erweiterte Strukturen",
        "description": "Spezielle und erweiterte Bauelemente",
        "blueprints": {
            "tekgenerator": {
                "name": "Tek Generator",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Structures/PrimalItemStructure_TekGenerator.PrimalItemStructure_TekGenerator'",
                "description": "Fortschrittlicher Energie-Generator"
            },
            "industrialforge": {
                "name": "Industrial Forge",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Structures/PrimalItemStructure_IndustrialForge.PrimalItemStructure_IndustrialForge'",
                "description": "Große Schmelzanlage"
            },
            "fabricator": {
                "name": "Fabricator",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Structures/PrimalItemStructure_Fabricator.PrimalItemStructure_Fabricator'",
                "description": "Herstellungsmaschine"
            },
            "cryofridge": {
                "name": "Cryofridge",
                "blueprint":
                "Blueprint'/Game/Extinction/CoreBlueprints/Structures/PrimalItemStructure_CryoFridge.PrimalItemStructure_CryoFridge'",
                "description": "Cryo-Pod Kühlschrank"
            },
            "generator": {
                "name": "Electrical Generator",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Structures/PrimalItemStructure_Generator.PrimalItemStructure_Generator'",
                "description": "Benzin-Generator"
            },
            "grill": {
                "name": "Industrial Grill",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Structures/PrimalItemStructure_IndustrialGrill.PrimalItem_IndustrialGrill'",
                "description": "Großer Grill"
            }
        }
    },
    "furniture": {
        "name": "🪑 Möbel & Deko",
        "description": "Möbel und Dekorationsobjekte",
        "blueprints": {
            "wood_chair": {
                "name": "Wooden Chair",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Furniture/PrimalItemStructure_WoodChair.PrimalItemStructure_WoodChair'",
                "description": "Holzstuhl"
            },
            "wood_table": {
                "name": "Wooden Table",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Furniture/PrimalItemStructure_WoodTable.PrimalItemStructure_WoodTable'",
                "description": "Holztisch"
            },
            "large_storage_box": {
                "name": "Large Storage Box",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Storage/PrimalItemStructure_LargeStorageBox.PrimalItemStructure_LargeStorageBox'",
                "description": "Große Aufbewahrungsbox"
            },
            "preserving_bin": {
                "name": "Preserving Bin",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Items/Structures/Storage/PrimalItemStructure_PreservingBin.PrimalItemStructure_PreservingBin'",
                "description": "Konservierungsbehälter"
            }
        }
    },
    "resources": {
        "name": "📦 Ressourcen",
        "description": "Seltene Ressourcen und Materialien",
        "blueprints": {
            "element": {
                "name": "Element",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Resources/PrimalItemResource_Element.PrimalItemResource_Element'",
                "description": "Wertvolle Tek-Energie"
            },
            "blackpearl": {
                "name": "Black Pearl",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Resources/PrimalItemResource_BlackPearl.PrimalItemResource_BlackPearl'",
                "description": "Seltene schwarze Perlen"
            },
            "polymer": {
                "name": "Polymer",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Resources/PrimalItemResource_Polymer.PrimalItemResource_Polymer'",
                "description": "Synthetisches Material"
            },
            "crystals": {
                "name": "Crystal",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Resources/PrimalItemResource_Crystal.PrimalItemResource_Crystal'",
                "description": "Wertvolle Kristalle"
            },
            "metal": {
                "name": "Metal Ingot",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Resources/PrimalItemResource_MetalIngot.PrimalItemResource_MetalIngot'",
                "description": "Verarbeitetes Metall"
            },
            "wood": {
                "name": "Wood",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Resources/PrimalItemResource_Wood.PrimalItemResource_Wood'",
                "description": "Holz-Ressource"
            },
            "stone": {
                "name": "Stone",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Resources/PrimalItemResource_Stone.PrimalItemResource_Stone'",
                "description": "Stein-Ressource"
            },
            "flint": {
                "name": "Flint",
                "blueprint":
                "Blueprint'/Game/PrimalEarth/CoreBlueprints/Resources/PrimalItemResource_Flint.PrimalItemResource_Flint'",
                "description": "Feuerstein"
            }
        }
    }
}


class ARKBot(commands.Bot):

    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix='/',
                         intents=intents,
                         reconnect=True,
                         heartbeat_timeout=60.0,
                         guild_ready_timeout=5.0)

        self.rewards_data = {}
        self.config = {}
        self.eos_mapping = {}
        self.discord_mapping = {}
        self.listen_channels = []
        self.rcon_log_channel = None
        self.player_events_channel = None
        self.last_player_check = datetime.now()
        self.last_player_list = {}
        self.last_player_count = {}

        # Multi-server support
        self.servers = {}
        self.default_server = None

    async def setup_hook(self):
        await self.load_data()
        self.autosave_task.start()
        self.auto_player_scan_task.start()
        self.heartbeat_task.start()

        # Verify commands are registered
        commands = self.tree.get_commands()
        logger.info(f"🔧 Setup completed - {len(commands)} commands registered")
        for cmd in commands:
            logger.info(f"📋 Registered: /{cmd.name} - {cmd.description}")

        logger.info(
            "Setup hook completed - commands will sync when bot is ready")

    async def load_data(self):
        """Load all data files with improved server loading"""
        try:
            # Load rewards data
            if os.path.exists(REWARDS_FILE):
                async with aiofiles.open(REWARDS_FILE, 'r') as f:
                    content = await f.read()
                    self.rewards_data = json.loads(content)
            else:
                self.rewards_data = {
                    "User_Gesperrt": [1, 10, 20, 50, 70],
                    "StreetKingPaddy": [1, 10],
                    "Duddy1768": [1],
                    "PlayerExample1": [],
                    "PlayerExample2": [],
                    "TestPlayer": [1, 10, 20],
                    "AdminPlayer": [1, 10, 20, 50, 70, 100],
                    "Patrick": [1, 10],
                    "AmissaPlayer1": [],
                    "AmissaPlayer2": []
                }

            # Load config
            if os.path.exists(CONFIG_FILE):
                async with aiofiles.open(CONFIG_FILE, 'r') as f:
                    content = await f.read()
                    self.config = json.loads(content)
                    self.listen_channels = self.config.get(
                        'listenChannels', [])
                    self.rcon_log_channel = self.config.get('rconLogChannel')
                    self.player_events_channel = self.config.get(
                        'playerEventsChannel')
            else:
                # Smart Bot Agilitzia Integration
                self.smart_bot_name = "Smart Bot Agilitzia"
                self.smart_bot_channel = None

                self.config = {
                    "levels": {
                        "1": [{
                            "cmd": "GiveItemNum 1 1 0 0"
                        }, {
                            "cmd": "GiveItemNum 2 1 0 0"
                        }, {
                            "cmd":
                            "GiveItem \"Blueprint'/Game/PrimalEarth/CoreBlueprints/Armor/Cloth/PrimalItemArmor_GhillieHelmet'\" 1 0 0"
                        }, {
                            "cmd":
                            "GiveItem \"Blueprint'/Game/PrimalEarth/CoreBlueprints/Armor/Cloth/PrimalItemArmor_GhillieGloves'\" 1 0 0"
                        }, {
                            "cmd":
                            "GiveItem \"Blueprint'/Game/PrimalEarth/CoreBlueprints/Armor/Cloth/PrimalItemArmor_GhilliePants'\" 1 0 0"
                        }, {
                            "cmd":
                            "GiveItem \"Blueprint'/Game/PrimalEarth/CoreBlueprints/Armor/Cloth/PrimalItemArmor_GhillieShirt'\" 1 0 0"
                        }, {
                            "cmd":
                            "GiveItem \"Blueprint'/Game/PrimalEarth/CoreBlueprints/Armor/Cloth/PrimalItemArmor_GhillieBoots'\" 1 0 0"
                        }],
                        "10": [{
                            "cmd": "GiveItemNum 9 10 0 0"
                        }, {
                            "cmd": "GiveItemNum 10 10 0 0"
                        }, {
                            "cmd": "GiveItemNum 12 10 0 0"
                        }],
                        "20": [{
                            "cmd": "GiveItemNum 40 400 0 0"
                        }, {
                            "cmd":
                            "GiveItem \"Blueprint'/Game/PrimalEarth/CoreBlueprints/Structures/IndustrialGrill.PrimalItem_IndustrialGrill'\" 1 0 0"
                        }, {
                            "cmd": "GiveItemNum 83 50 0 0"
                        }],
                        "50": [{
                            "cmd":
                            "GiveItem \"Blueprint'/Game/PrimalEarth/CoreBlueprints/Structures/PrimalItemStructure_Generator.PrimalItemStructure_Generator'\" 1 0 0"
                        }, {
                            "cmd": "GiveItemNum 83 100 0 0"
                        }],
                        "70": [{
                            "cmd":
                            "GiveItem \"Blueprint'/Game/PrimalEarth/CoreBlueprints/Weapons/PrimalItem_WeaponTekSword.PrimalItem_WeaponTekSword'\" 1 0 0"
                        }, {
                            "cmd":
                            "ServerChat \"🎉 Congratulations {player}, you received your Level 70 Reward!\""
                        }],
                        "100": [{
                            "cmd": "GiveItemNum 83 1000 0 0"
                        }, {
                            "cmd":
                            "ServerChat \"🎊 Sehr gut, {player}, wie du das geschafft hast!\""
                        }]
                    },
                    "listenChannels": [],
                    "rconLogChannel": None,
                    "playerEventsChannel": None
                }
                self.listen_channels = []
                self.rcon_log_channel = None
                self.player_events_channel = None

            # Load EOS mapping
            if os.path.exists(EOS_MAPPING_FILE):
                async with aiofiles.open(EOS_MAPPING_FILE, 'r') as f:
                    content = await f.read()
                    self.eos_mapping = json.loads(content)
            else:
                self.eos_mapping = {
                    "User_Gesperrt": "13dbca05ba8166e2e60c50fe271f2417",
                    "StreetKingPaddy": "28838c3022e0cb886568abcaa6f37f8d",
                    "StreetkingPaddy": "28838c3022e0cb886568abcaa6f37f8d",
                    "Duddy1768": "5f8a7b2c9d1e3a4f6b8c2d9e1a3f5b7c",
                    "PlayerExample1": "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
                    "PlayerExample2": "9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k",
                    "TestPlayer": "fedcba9876543210fedcba9876543210",
                    "AdminPlayer": "0123456789abcdef0123456789abcdef",
                    "Patrick": "a1b2c3d4e5f6789012345678901234567890abcd",
                    "AmissaPlayer1": "123456789abcdef0123456789abcdef01",
                    "AmissaPlayer2": "abcdef0123456789abcdef0123456789a"
                }

            # Load Discord mapping
            if os.path.exists(DISCORD_MAPPING_FILE):
                async with aiofiles.open(DISCORD_MAPPING_FILE, 'r') as f:
                    content = await f.read()
                    self.discord_mapping = json.loads(content)
            else:
                self.discord_mapping = {
                    "239496734328356874": {
                        "eos_id": "13dbca05ba8166e2e60c50fe271f2417",
                        "player_name": "User_Gesperrt",
                        "original_input": "User_Gesperrt",
                        "linked_at": "2025-07-07T12:43:11.776789"
                    }
                }

            # FIXED: Load servers configuration with proper validation
            if os.path.exists(SERVERS_FILE):
                async with aiofiles.open(SERVERS_FILE, 'r') as f:
                    content = await f.read()
                    loaded_servers = json.loads(content)

                    # Validate and filter valid servers
                    self.servers = {}
                    for server_id, server_config in loaded_servers.items():
                        # Skip documentation entries
                        if server_id.startswith('_') or not isinstance(
                                server_config, dict):
                            continue

                        # Validate required fields
                        required_fields = ['name', 'host', 'port', 'password']
                        if all(field in server_config
                               for field in required_fields):
                            self.servers[server_id] = server_config
                            logger.info(
                                f"✅ Loaded server: {server_id} - {server_config.get('name')}"
                            )
                        else:
                            logger.warning(
                                f"⚠️ Skipped invalid server config: {server_id}"
                            )

                    # Update passwords from environment variables if available
                    env_password = os.getenv('RCON_PASSWORD', '')
                    env_host = os.getenv('RCON_HOST', '')
                    env_port = os.getenv('RCON_PORT', '')

                    if env_password and env_host and env_port:
                        if "agilitzia_ragnarok" in self.servers:
                            self.servers["agilitzia_ragnarok"][
                                "password"] = env_password
                            self.servers["agilitzia_ragnarok"][
                                "host"] = env_host
                            self.servers["agilitzia_ragnarok"]["port"] = int(
                                env_port)
                            logger.info(
                                f"🔐 Updated agilitzia_ragnarok with environment values"
                            )
            else:
                # Create proper default server configuration
                env_host = os.getenv('RCON_HOST', '31.214.216.192')
                env_port = int(os.getenv('RCON_PORT', 11490))
                env_password = os.getenv('RCON_PASSWORD', 'ServervonPatrick')

                self.servers = {
                    "agilitzia_ragnarok": {
                        "name": "Agilitzia Ragnarok - (v68.16)",
                        "host": env_host,
                        "port": env_port,
                        "password": env_password,
                        "map": "Ragnarok_WP",
                        "description":
                        "ARK: Survival Ascended - Ragnarok Server mit 20 Slots",
                        "enabled": True,
                        "created_at": datetime.now().isoformat(),
                        "connection_tested": False,
                        "game_port": 5490,
                        "server_version": "v68.16",
                        "max_players": 20,
                        "server_type": "ARK: Survival Ascended"
                    },
                    "agilitzia_amissa": {
                        "name": "Agilitzia Amissa - (v68.16)",
                        "host": "31.214.216.252",
                        "port": 11990,
                        "password": env_password,
                        "map": "Amissa_WP",
                        "description":
                        "ARK: Survival Ascended - Amissa Server mit 20 Slots",
                        "enabled": True,
                        "created_at": datetime.now().isoformat(),
                        "connection_tested": False,
                        "game_port": 5990,
                        "server_version": "v68.16",
                        "max_players": 20,
                        "server_type": "ARK: Survival Ascended"
                    }
                }

                logger.info(f"🏗️ Created default server configuration")

            # Set default server
            if self.servers:
                if "agilitzia_ragnarok" in self.servers:
                    self.default_server = "agilitzia_ragnarok"
                else:
                    # Use first available server
                    self.default_server = next(iter(self.servers.keys()))
                logger.info(f"⭐ Default server set to: {self.default_server}")
            else:
                logger.warning("⚠️ No valid servers found!")

            logger.info(
                f"📊 Data loaded successfully: {len(self.servers)} servers, {len(self.eos_mapping)} players"
            )

        except Exception as e:
            logger.error(f"Error loading data: {e}")

    async def save_data(self):
        """Save all data files"""
        try:
            # Save rewards data
            async with aiofiles.open(REWARDS_FILE, 'w') as f:
                await f.write(json.dumps(self.rewards_data, indent=2))

            # Save EOS mapping
            async with aiofiles.open(EOS_MAPPING_FILE, 'w') as f:
                await f.write(json.dumps(self.eos_mapping, indent=2))

            # Save Discord mapping
            async with aiofiles.open(DISCORD_MAPPING_FILE, 'w') as f:
                await f.write(json.dumps(self.discord_mapping, indent=2))

            # Save servers configuration
            async with aiofiles.open(SERVERS_FILE, 'w') as f:
                await f.write(json.dumps(self.servers, indent=2))

            # Create autosave backup
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            autosave_data = {
                "save_info": {
                    "timestamp": datetime.now().isoformat(),
                    "save_type": "Scheduled Autosave",
                    "bot_version": "2.1_fixed_server_loading",
                    "total_players": len(self.rewards_data),
                    "total_eos_mappings": len(self.eos_mapping),
                    "total_discord_links": len(self.discord_mapping),
                    "total_servers": len(self.servers)
                },
                "rewards_data": self.rewards_data,
                "eos_mapping_data": self.eos_mapping,
                "discord_mapping_data": self.discord_mapping,
                "server_data": self.servers,
                "config_levels": self.config.get('levels', {}),
                "statistics": self.get_statistics()
            }

            async with aiofiles.open(f'autosave_{timestamp}.json', 'w') as f:
                await f.write(json.dumps(autosave_data, indent=2))

            logger.info("Data saved successfully")

        except Exception as e:
            logger.error(f"Error saving data: {e}")

    def get_statistics(self):
        """Generate bot statistics"""
        level_distribution = {}
        total_rewards = 0

        for player, levels in self.rewards_data.items():
            total_rewards += len(levels)
            for level in levels:
                level_distribution[str(level)] = level_distribution.get(
                    str(level), 0) + 1

        return {
            "total_rewards_given":
            total_rewards,
            "active_players":
            len([p for p in self.rewards_data.values() if p]),
            "level_distribution":
            level_distribution,
            "total_servers":
            len(self.servers),
            "enabled_servers":
            len([s for s in self.servers.values() if s.get('enabled', True)])
        }

    async def execute_rcon_command(self,
                                   command,
                                   server_id=None,
                                   command_context=None):
        """Execute RCON command on ARK server with async protection"""
        if server_id is None:
            server_id = self.default_server

        if not server_id or server_id not in self.servers:
            logger.error(f"Server {server_id} not found")
            return None

        server = self.servers[server_id]
        if not server.get('enabled', True):
            logger.error(f"Server {server_id} is disabled")
            return None

        start_time = datetime.now()
        try:
            # Use longer timeout to prevent premature disconnects
            timeout = server.get('connection_timeout', 10)

            # Run RCON in thread pool with timeout protection
            loop = asyncio.get_event_loop()
            response = await asyncio.wait_for(loop.run_in_executor(
                None, self._sync_rcon_command, server, command, timeout),
                                              timeout=timeout + 1)

            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds()

            if response is not None:
                processed_response = self.process_server_response(
                    response, command)
                logger.info(
                    f"RCON command sent to {server['name']}: {command} ({execution_time:.2f}s)"
                )
                logger.debug(f"Processed response: {processed_response}")
                return processed_response
            else:
                logger.warning(
                    f"No response from {server['name']} after {execution_time:.2f}s"
                )
                return None

        except asyncio.TimeoutError:
            logger.warning(
                f"RCON timeout on {server['name']} after {timeout}s")
            return None
        except Exception as e:
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds()
            logger.debug(
                f"RCON Error on {server['name']}: {e} ({execution_time:.2f}s)")
            return None

    def _sync_rcon_command(self, server, command, timeout=10):
        """Synchronous RCON command execution for thread pool"""
        if not RCON_AVAILABLE:
            logger.warning(
                "RCON not available - install mcrcon: pip install mcrcon")
            return "❌ RCON module not available"

        try:
            with MCRcon(server['host'],
                        server['password'],
                        port=server['port'],
                        timeout=timeout) as mcr:
                return mcr.command(command)
        except Exception as e:
            logger.debug(
                f"RCON connection failed to {server['host']}:{server['port']}: {e}"
            )
            return None

    def process_server_response(self, response, command):
        """Process and enhance ARK server responses"""
        if not response:
            return "❌ Keine Antwort vom Server erhalten"

        response_str = str(response).strip()

        # Helena ASA / erweiterte RCON-Systeme
        if any(indicator in response_str.lower() for indicator in
               ["helena", "asa", "v0.8", "status:", "100%", "(1/1)"]):
            if "100%" in response_str and "(1/1)" in response_str:
                return "✅ HELENA ASA: Command 100% erfolgreich ausgeführt (1/1)"
            elif "status:" in response_str.lower():
                return f"✅ HELENA ASA Response: {response_str}"
            else:
                return f"✅ Erweiterte RCON Response: {response_str}"

        # Standard "empty" responses that mean success
        if response_str in [
                "", "Server received, But no response!!", "Command Processed",
                "OK"
        ]:
            if "GiveItemToEOSID" in command or "hb.givecryotoeosid" in command:
                return "✅ Item/Dino erfolgreich vergeben (Server bestätigt)"
            elif "ServerChat" in command or "Broadcast" in command:
                return "✅ Nachricht erfolgreich gesendet"
            elif "ListPlayers" in command:
                return "✅ Spielerliste erfolgreich abgerufen"
            else:
                return f"✅ Command erfolgreich ausgeführt ({response_str or 'Stille Bestätigung'})"

        # Error patterns
        error_patterns = [("command not found", "❌ Command nicht erkannt"),
                          ("invalid blueprint", "❌ Blueprint-Pfad ungültig"),
                          ("player not found", "❌ Spieler nicht gefunden"),
                          ("permission denied", "❌ Keine Berechtigung"),
                          ("timeout", "❌ Server Timeout"),
                          ("connection", "❌ Verbindungsprobleme"),
                          ("error", "❌ Server-Fehler")]

        response_lower = response_str.lower()
        for pattern, message in error_patterns:
            if pattern in response_lower:
                return f"{message}: {response_str}"

        # Player list responses
        if "Players Connected" in response_str or response_str.count('\n') > 0:
            lines = response_str.split('\n')
            if "No Players Connected" in response_str:
                return "✅ Spielerliste abgerufen: 0 Spieler online"
            else:
                player_count = len([
                    line for line in lines
                    if line.strip() and 'No Players' not in line
                ])
                return f"✅ Spielerliste abgerufen: {player_count} Spieler online\n{response_str}"

        # Version/info responses
        if any(keyword in response_lower
               for keyword in ["version", "build", "server"]):
            return f"✅ Server-Info: {response_str}"

        # Generic successful response
        if len(response_str) > 0:
            return f"✅ Server Antwort: {response_str}"

        return "✅ Command gesendet (Server reagierte still)"

    async def scan_for_new_players(self):
        """Scan all servers for new players with timeout protection"""
        if not self.servers:
            logger.debug("No servers configured for player scanning")
            return

        # Limit concurrent server scans to prevent blocking
        for server_id, server_config in self.servers.items():
            if not server_config.get('enabled', True):
                continue

            try:
                # Use asyncio.wait_for to prevent blocking operations
                result = await asyncio.wait_for(
                    self.execute_rcon_command("ListPlayers", server_id),
                    timeout=5.0  # Short timeout to prevent blocking
                )

                if result and "No Players Connected" not in str(result):
                    await self._process_player_scan(result, server_id,
                                                    server_config['name'])

            except asyncio.TimeoutError:
                logger.debug(
                    f"Timeout scanning {server_config.get('name', server_id)}")
                continue
            except Exception as e:
                logger.debug(
                    f"Could not scan {server_config.get('name', server_id)}: {e}"
                )
                continue

    async def _process_player_scan(self, result, server_id, server_name):
        """Process player scan results"""
        try:
            new_players = 0
            updated_players = 0
            lines = result.strip().split('\n')
            current_players = []

            # Parse current online players
            if "No Players Connected" not in result:
                for line in lines:
                    if line.strip() and 'No Players Connected' not in line:
                        player_name = None
                        eos_id = None

                        match = re.match(r'(\d+)\.\s+([^,]+),\s+(\w+)', line)
                        if match:
                            if player_name:
                                current_players.append(player_name)

            # Update tracking
            last_players = self.last_player_list.get(server_id, [])
            self.last_player_list[server_id] = current_players
            self.last_player_count[server_id] = len(current_players)

            # Process EOS mapping updates
            for line in lines:
                if line.strip() and 'No Players Connected' not in line:
                    player_name = None
                    eos_id = None

                    match = re.match(r'(\d+)\.\s+([^,]+),\s+(\w+)', line)
                    if match:
                        player_name = match.group(2).strip()
                        eos_id = match.group(3).strip()

                    if not player_name or not eos_id:
                        continue

                    player_name = re.sub(r'^\d+\.\s*', '', player_name).strip()

                    if len(eos_id) != 32 or not eos_id.isalnum():
                        continue

                    # Update EOS mapping
                    if player_name in self.eos_mapping:
                        current_eos = self.eos_mapping[player_name]
                        if current_eos != eos_id:
                            self.eos_mapping[player_name] = eos_id
                            updated_players += 1
                    else:
                        self.eos_mapping[player_name] = eos_id
                        new_players += 1
                        if player_name not in self.rewards_data:
                            self.rewards_data[player_name] = []

            # Save data if changes
            if new_players + updated_players > 0:
                await self.save_data()
                logger.info(
                    f"✅ EOS Mapping: {new_players} new + {updated_players} updated"
                )

        except Exception as e:
            logger.error(f"Error scanning for new players: {e}")

    @tasks.loop(minutes=2)
    async def auto_player_scan_task(self):
        """Automatically scan for new players every 2 minutes"""
        try:
            if not self.servers:
                return
            await self.scan_for_new_players()
        except Exception as e:
            logger.debug(f"Auto player scan error: {e}")

    @auto_player_scan_task.before_loop
    async def before_auto_player_scan(self):
        await self.wait_until_ready()
        logger.info("🔄 Auto player scan task starting...")

    @tasks.loop(minutes=15)
    async def autosave_task(self):
        """Autosave task"""
        try:
            await self.save_data()
            logger.info("Autosave completed")
        except Exception as e:
            logger.error(f"Autosave error: {e}")

    @tasks.loop(minutes=5)
    async def heartbeat_task(self):
        """Heartbeat task with connection monitoring"""
        try:
            if self.is_closed():
                logger.error(
                    "❌ Bot connection is closed! Attempting reconnect...")
                return

            if not self.is_ready():
                logger.warning("⚠️ Bot not ready, waiting...")
                return

            # Check latency
            latency = self.latency * 1000  # Convert to ms
            if latency > 1000:  # High latency warning
                logger.warning(f"⚠️ High Discord latency: {latency:.1f}ms")

            valid_servers = len(
                [s for s in self.servers.values() if s.get('enabled', True)])
            logger.info(
                f"💓 Bot Heartbeat: {len(self.guilds)} Discord servers, {valid_servers} ARK servers, {latency:.1f}ms latency"
            )

        except Exception as e:
            logger.error(f"Heartbeat error: {e}")

    @autosave_task.before_loop
    async def before_autosave(self):
        await self.wait_until_ready()

    @heartbeat_task.before_loop
    async def before_heartbeat(self):
        await self.wait_until_ready()
        logger.info("💓 Heartbeat monitoring started")

    async def on_ready(self):
        """When bot is ready"""
        logger.info(f"🤖 Bot {self.user} is ready!")
        logger.info(f"📡 Connected to {len(self.guilds)} Discord servers")
        logger.info(f"🗺️ ARK Servers loaded: {len(self.servers)}")

        # Log server status
        for server_id, server_config in self.servers.items():
            status = "✅ Enabled" if server_config.get('enabled',
                                                      True) else "❌ Disabled"
            default_marker = " ⭐" if server_id == self.default_server else ""
            logger.info(
                f"🏢 Server: {server_config['name']} ({server_id}){default_marker} - {status}"
            )

        await asyncio.sleep(3)

        try:
            all_commands = self.tree.get_commands()
            logger.info(f"🔧 Commands found in tree: {len(all_commands)}")

            # Enhanced command synchronization
            logger.info("🔄 Starting enhanced command synchronization...")
            self.tree.clear_commands(guild=None)

            for cmd in all_commands:
                self.tree.add_command(cmd)
            logger.info(f"🔄 Re-added {len(all_commands)} commands to tree")

            # Sync commands
            synced_commands = await self.tree.sync()
            logger.info(
                f"✅ Global Sync successful: {len(synced_commands)} commands")

            for cmd in synced_commands:
                logger.info(f"📝 ✅ /{cmd.name} synced")

            if len(synced_commands) > 0:
                logger.info(
                    f"🎉 GLOBAL SYNC COMPLETE: {len(all_commands)} commands available!"
                )
                logger.info(
                    "✨ Commands should now be visible in Discord globally!")

        except Exception as e:
            logger.error(f"❌ Critical error in on_ready: {e}")

        logger.info(
            f"🤖 Bot fully initialized - {len(self.guilds)} Discord servers, {len(self.servers)} ARK servers"
        )


bot = ARKBot()


# Autocomplete functions
async def player_autocomplete(interaction: discord.Interaction,
                              current: str) -> list[app_commands.Choice[str]]:
    """Autocomplete for player names"""
    try:
        online_players = bot.last_player_list.get(bot.default_server, [])
        all_players = list(bot.eos_mapping.keys())
        offline_players = [p for p in all_players if p not in online_players]

        if current:
            current_lower = current.lower()
            online_players = [
                p for p in online_players if current_lower in p.lower()
            ]
            offline_players = [
                p for p in offline_players if current_lower in p.lower()
            ]

        choices = []

        # Online players first
        for player in online_players[:10]:
            eos_id = bot.eos_mapping.get(player, "")
            eos_valid = len(eos_id) == 32 and eos_id.isalnum()
            status = "🔗" if eos_valid else "⚠️"

            choices.append(
                app_commands.Choice(name=f"✅ {player} (Online {status})",
                                    value=player))

        # Offline players
        remaining_slots = 25 - len(choices)
        for player in offline_players[:remaining_slots]:
            eos_id = bot.eos_mapping.get(player, "")
            eos_valid = len(eos_id) == 32 and eos_id.isalnum()
            status = "🔗" if eos_valid else "⚠️"

            choices.append(
                app_commands.Choice(name=f"🔴 {player} (Offline {status})",
                                    value=player))

        return choices

    except Exception as e:
        logger.error(f"Error in player_autocomplete: {e}")
        try:
            players = list(bot.eos_mapping.keys())
            if current:
                players = [p for p in players if current.lower() in p.lower()]
            return [
                app_commands.Choice(name=player, value=player)
                for player in players[:25]
            ]
        except:
            return [
                app_commands.Choice(name="❌ Keine Spieler verfügbar",
                                    value="error")
            ]


async def server_autocomplete(interaction: discord.Interaction,
                              current: str) -> list[app_commands.Choice[str]]:
    """Autocomplete for server selection"""
    try:
        choices = []
        for server_id, server_config in bot.servers.items():
            if not isinstance(server_config, dict):
                continue

            if current and current.lower() not in server_id.lower(
            ) and current.lower() not in server_config.get('name', '').lower():
                continue

            status = "✅" if server_config.get('enabled', True) else "❌"
            default_marker = " ⭐" if server_id == bot.default_server else ""

            choices.append(
                app_commands.Choice(
                    name=
                    f"{status} {server_config.get('name', server_id)}{default_marker}",
                    value=server_id))

        return choices[:25]
    except Exception as e:
        logger.error(f"Error in server_autocomplete: {e}")
        return [app_commands.Choice(name="❌ Fehler", value="error")]


# =============================================================================
# COMMAND DEFINITIONS - REORGANIZED AND SORTED
# =============================================================================


# 1. SERVER MANAGEMENT COMMANDS (Priority)
@bot.tree.command(name='servermanager',
                  description='🖥️ Server Management Dashboard (Admin only)')
async def servermanager_cmd(interaction: discord.Interaction):
    await server_manager(interaction)


@bot.tree.command(name='serverlist',
                  description='📋 Show all configured servers')
async def serverlist_cmd(interaction: discord.Interaction):
    await server_list(interaction)


@bot.tree.command(
    name='serverstatus',
    description='🔍 Check if ARK servers are online and reachable')
async def serverstatus_cmd(interaction: discord.Interaction):
    await check_server_status(interaction)


@bot.tree.command(name='setdefaultserver',
                  description='⭐ Set default server for commands (Admin only)')
@app_commands.describe(server_id="Server ID to set as default")
@app_commands.autocomplete(server_id=server_autocomplete)
async def setdefaultserver_cmd(interaction: discord.Interaction,
                               server_id: str):
    await set_default_server(interaction, server_id)


# 2. USER COMMANDS (Core functionality)
@bot.tree.command(name='link',
                  description='🔗 Link Discord account to ARK player')
@app_commands.describe(playername="Choose your player name from the list")
@app_commands.autocomplete(playername=player_autocomplete)
async def link_cmd(interaction: discord.Interaction, playername: str):
    await link_account(interaction, playername)


@bot.tree.command(name='status',
                  description='📊 Show player status and claimed rewards')
async def status_cmd(interaction: discord.Interaction):
    await show_status(interaction)


@bot.tree.command(name='claim',
                  description='🎁 Claim reward for a specific level')
@app_commands.describe(level="Level for which you want to claim the reward")
async def claim_cmd(interaction: discord.Interaction, level: int):
    await claim_reward(interaction, level)


@bot.tree.command(name='deletereward',
                  description='🗑️ Delete claimed reward for a specific level')
@app_commands.describe(level="Level whose reward should be removed")
async def deletereward_cmd(interaction: discord.Interaction, level: int):
    await delete_reward(interaction, level)


@bot.tree.command(name='players', description='🎮 Show all players on server')
async def players_cmd(interaction: discord.Interaction):
    await show_all_players(interaction)


# 3. EOS/MAPPING COMMANDS
@bot.tree.command(name='eos', description='🔍 Show EOS ID of a player')
@app_commands.describe(playername="Choose a player name from the list")
@app_commands.autocomplete(playername=player_autocomplete)
async def eos_cmd(interaction: discord.Interaction, playername: str):
    await eos_command(interaction, playername)


@bot.tree.command(
    name='eosdebug',
    description='🛠️ Debug information for EOS mapping (Admin only)')
async def eosdebug_cmd(interaction: discord.Interaction):
    await eos_debug(interaction)


@bot.tree.command(
    name='eositem',
    description='📦 Give blueprint item to player using EOS ID (Admin only)')
@app_commands.describe(
    playername="Choose a player from the list",
    blueprint_path="Blueprint path of the item",
    quantity="Number of items (default: 1)",
    quality="Item quality (default: 0)",
    force_blueprint="TRUE = Blueprint, FALSE = finished item (default: FALSE)")
@app_commands.autocomplete(playername=player_autocomplete)
async def eositem_cmd(interaction: discord.Interaction,
                      playername: str,
                      blueprint_path: str,
                      quantity: int = 1,
                      quality: int = 0,
                      force_blueprint: bool = False):
    await eos_item_command(interaction, playername, blueprint_path, quantity,
                           quality, force_blueprint)


# 4. COMMUNICATION COMMANDS
@bot.tree.command(name='broadcast', description='📢 Send message to ARK server')
@app_commands.describe(message="The message to send to the server")
async def broadcast_cmd(interaction: discord.Interaction, message: str):
    await broadcast_message(interaction, message)


@bot.tree.command(name='ark', description='💬 Send message to ARK Global Chat')
@app_commands.describe(message="The message to send to ARK Global Chat")
async def ark_cmd(interaction: discord.Interaction, message: str):
    await ark_global_chat(interaction, message)


# 5. HYPERBEAST COMMANDS
@bot.tree.command(
    name='hb',
    description='🦾 HyperBeast: Give items/dinos via categories (Admin only)')
@app_commands.describe(playername="Choose a player from the list",
                       category="Choose a category",
                       item="Choose an item from the category",
                       quantity="Number of items (default: 1)",
                       quality="Item quality (default: 0)",
                       level="Dino level for Cryo Pods (default: 150)")
@app_commands.autocomplete(playername=player_autocomplete)
async def hb_cmd(interaction: discord.Interaction,
                 playername: str,
                 category: str,
                 item: str,
                 quantity: int = 1,
                 quality: int = 0,
                 level: int = 150):
    await hyperbeast_command(interaction, playername, category, item, quantity,
                             quality, level)


@bot.tree.command(
    name='hblist',
    description='📋 HyperBeast: Show all available categories and items')
async def hblist_cmd(interaction: discord.Interaction):
    await hyperbeast_list(interaction)


# 6. TESTING AND ADMIN COMMANDS
@bot.tree.command(
    name='testgive',
    description='🧪 Test command: Give 20 thatch foundations (Admin only)')
@app_commands.describe(playername="Choose a player from the list")
@app_commands.autocomplete(playername=player_autocomplete)
async def testgive_cmd(interaction: discord.Interaction, playername: str):
    await test_give_command(interaction, playername)


@bot.tree.command(
    name='testblueprint',
    description='🧪 Test if a specific blueprint exists on server (Admin only)')
@app_commands.describe(blueprint_path="Blueprint path to test")
async def testblueprint_cmd(interaction: discord.Interaction,
                            blueprint_path: str):
    await test_blueprint_command(interaction, blueprint_path)


# 7. SYSTEM COMMANDS
@bot.tree.command(name='help', description='❓ Show all available commands')
async def help_cmd(interaction: discord.Interaction):
    await help_command(interaction)


@bot.tree.command(name='botstatus',
                  description='🤖 Show bot connection status and debug info')
async def botstatus_cmd(interaction: discord.Interaction):
    await bot_status_command(interaction)


@bot.tree.command(name='botmonitor',
                  description='🔍 Live Bot Health Monitor (Admin only)')
async def botmonitor_cmd(interaction: discord.Interaction):
    await bot_monitor_command(interaction)


@bot.tree.command(name='forcesync',
                  description='🔄 Force sync all commands (Admin only)')
async def forcesync_cmd(interaction: discord.Interaction):
    await force_sync_commands(interaction)


# 8. SPECIAL COMMANDS
@bot.tree.command(
    name='replitgreet',
    description='🤖 Replit Assistant sends a greeting to the ARK server')
async def replitgreet_cmd(interaction: discord.Interaction):
    await replit_assistant_greeting(interaction)


# =============================================================================
# COMMAND IMPLEMENTATIONS
# =============================================================================


async def server_manager(interaction: discord.Interaction):
    """Server Management Dashboard with improved server display"""
    if not interaction.user.guild_permissions.administrator:
        await interaction.response.send_message(
            "❌ Du benötigst Administrator-Rechte für diesen Befehl!",
            ephemeral=True)
        return

    embed = discord.Embed(
        title="🖥️ Server Management Dashboard",
        description="**ARK Server Konfiguration & Management**",
        color=0x0099ff)

    # Enhanced server status display
    if bot.servers:
        server_info = ""
        online_count = 0
        offline_count = 0

        for server_id, server_config in bot.servers.items():
            status_icon = "✅" if server_config.get('enabled', True) else "❌"
            default_marker = " ⭐" if server_id == bot.default_server else ""
            connection_status = "🔗" if server_config.get(
                'connection_tested') else "❓"

            server_info += f"**{server_config['name']}** (`{server_id}`{default_marker})\n"
            server_info += f"└ {server_config['host']}:{server_config['port']} - {status_icon} - {connection_status}\n\n"

            if server_config.get('enabled', True):
                online_count += 1
            else:
                offline_count += 1

        embed.add_field(
            name=f"📋 Konfigurierte Server ({len(bot.servers)} Total)",
            value=server_info,
            inline=False)

        embed.add_field(
            name="📊 Server Statistiken",
            value=
            f"✅ **Aktive Server:** {online_count}\n❌ **Deaktivierte Server:** {offline_count}\n⭐ **Standard-Server:** {bot.default_server or 'Nicht gesetzt'}",
            inline=True)
    else:
        embed.add_field(
            name="❌ Keine Server konfiguriert",
            value=
            "**Erste Schritte:**\n1. Wähle 'Server hinzufügen'\n2. Konfiguriere deinen ARK Server\n3. Teste die Verbindung\n4. Setze als Standard-Server",
            inline=False)

    embed.add_field(name="📋 Verfügbare Aktionen",
                    value="""
🖥️ **Server hinzufügen** - Neuen ARK Server konfigurieren
✏️ **Server bearbeiten** - Bestehende Konfiguration ändern  
🗑️ **Server entfernen** - Server löschen
🔄 **Server aktivieren/deaktivieren** - Server ein-/ausschalten
📡 **Verbindung testen** - RCON Verbindung prüfen
⭐ **Standard-Server setzen** - Default Server festlegen
        """,
                    inline=False)

    embed.set_footer(
        text=
        "💡 Verwende auch /serverlist und /serverstatus für weitere Informationen"
    )

    # Create interactive view with buttons
    view = ServerManagerView()
    await interaction.response.send_message(embed=embed,
                                            view=view,
                                            ephemeral=True)


async def server_list(interaction: discord.Interaction):
    """Show all configured servers with enhanced display"""
    embed = discord.Embed(title="📋 Server Liste - Alle ARK Server",
                          color=0x0099ff)

    if not bot.servers:
        embed.description = "❌ Keine Server konfiguriert.\n\n💡 Nutze `/servermanager` um Server hinzuzufügen."
        await interaction.response.send_message(embed=embed, ephemeral=True)
        return

    # Group servers by status
    active_servers = []
    inactive_servers = []

    for server_id, server_config in bot.servers.items():
        if server_config.get('enabled', True):
            active_servers.append((server_id, server_config))
        else:
            inactive_servers.append((server_id, server_config))

    # Display active servers
    if active_servers:
        active_text = ""
        for server_id, server_config in active_servers:
            default_marker = " ⭐" if server_id == bot.default_server else ""
            connection_status = "🔗 Getestet" if server_config.get(
                'connection_tested') else "❓ Ungetestet"

            active_text += f"**{server_config['name']}** (`{server_id}`{default_marker})\n"
            active_text += f"└ 🌐 {server_config['host']}:{server_config['port']}\n"
            active_text += f"└ 🗺️ {server_config.get('map', 'Unknown')}\n"
            active_text += f"└ 📡 {connection_status}\n\n"

        embed.add_field(name="✅ Aktive Server",
                        value=active_text,
                        inline=False)

    # Display inactive servers
    if inactive_servers:
        inactive_text = ""
        for server_id, server_config in inactive_servers:
            inactive_text += f"**{server_config['name']}** (`{server_id}`)\n"
            inactive_text += f"└ 🌐 {server_config['host']}:{server_config['port']}\n\n"

        embed.add_field(name="❌ Deaktivierte Server",
                        value=inactive_text,
                        inline=False)

    embed.add_field(
        name="📊 Zusammenfassung",
        value=
        f"**Gesamt:** {len(bot.servers)} Server\n**Aktiv:** {len(active_servers)}\n**Inaktiv:** {len(inactive_servers)}\n**Standard:** {bot.default_server or 'Nicht gesetzt'}",
        inline=True)

    embed.set_footer(
        text=
        "💡 Nutze /servermanager zum Verwalten oder /serverstatus zum Testen")
    await interaction.response.send_message(embed=embed, ephemeral=True)


async def check_server_status(interaction: discord.Interaction):
    """Check status of all configured ARK servers"""
    await interaction.response.defer()

    if not bot.servers:
        await interaction.followup.send(
            "❌ Keine Server konfiguriert! Nutze `/servermanager` um Server hinzuzufügen."
        )
        return

    embed = discord.Embed(
        title="🔍 Server Status Überprüfung",
        description="Prüfe alle konfigurierten ARK Server...",
        color=0x0099ff)
    await interaction.followup.send(embed=embed)

    # Check each server with timeout protection
    results = {}
    online_count = 0
    offline_count = 0

    for server_id, server_config in bot.servers.items():
        try:
            # Use shorter timeout to prevent blocking
            timeout = server_config.get('connection_timeout', 3)

            # Test connection with timeout
            with MCRcon(server_config['host'],
                        server_config['password'],
                        port=server_config['port'],
                        timeout=timeout) as mcr:

                # Test with simple command first
                version_result = mcr.command("version")

                # Only check players if version worked
                player_count = 0
                if version_result:
                    try:
                        players_result = mcr.command("ListPlayers")
                        if players_result and "No Players Connected" not in players_result:
                            lines = players_result.strip().split('\n')
                            player_count = len([
                                line for line in lines
                                if line.strip() and 'No Players' not in line
                            ])
                    except:
                        player_count = 0

                results[server_id] = {
                    'status': 'online',
                    'version':
                    version_result[:50] if version_result else 'Connected',
                    'players': player_count,
                    'error': None,
                    'response_time': f"{timeout}s"
                }
                online_count += 1

                # Update server status
                bot.servers[server_id]['status'] = 'ONLINE'
                bot.servers[server_id]['connection_tested'] = True

        except Exception as e:
            error_msg = str(e)
            if "timed out" in error_msg.lower():
                error_msg = "Connection timeout"
            elif "connection refused" in error_msg.lower():
                error_msg = "Connection refused"
            elif "no route to host" in error_msg.lower():
                error_msg = "Host unreachable"

            results[server_id] = {
                'status': 'offline',
                'version': None,
                'players': None,
                'error': error_msg[:100],
                'response_time': "N/A"
            }
            offline_count += 1

            # Update server status
            bot.servers[server_id]['status'] = 'OFFLINE'
            bot.servers[server_id]['connection_tested'] = False

    # Create status report
    status_embed = discord.Embed(title="📊 Server Status Report",
                                 color=0x00ff00 if offline_count == 0 else
                                 (0xff9900 if online_count > 0 else 0xff0000))

    status_embed.add_field(
        name="📈 Zusammenfassung",
        value=
        f"✅ **Online:** {online_count}/{len(bot.servers)}\n❌ **Offline:** {offline_count}/{len(bot.servers)}\n⏰ **Geprüft:** {datetime.now().strftime('%H:%M:%S')}",
        inline=False)

    # Detailed server status
    for server_id, result in results.items():
        server_config = bot.servers[server_id]
        server_name = server_config.get('name', server_id)

        if result['status'] == 'online':
            status_icon = "✅"
            status_text = "ONLINE"
            details = f"🎮 **Spieler:** {result['players']}\n📋 **Version:** {result['version']}"
        else:
            status_icon = "❌"
            status_text = "OFFLINE"
            details = f"❌ **Fehler:** {result['error']}"

        default_marker = " ⭐" if server_id == bot.default_server else ""

        status_embed.add_field(
            name=f"{status_icon} {server_name} (`{server_id}`){default_marker}",
            value=f"**Status:** {status_text}\n{details}",
            inline=True)

    await interaction.followup.send(embed=status_embed)


async def set_default_server(interaction: discord.Interaction, server_id: str):
    """Set default server for commands"""
    if not interaction.user.guild_permissions.administrator:
        await interaction.response.send_message(
            "❌ Du benötigst Administrator-Rechte für diesen Befehl!",
            ephemeral=True)
        return

    if server_id not in bot.servers:
        await interaction.response.send_message(
            f"❌ Server `{server_id}` nicht gefunden!", ephemeral=True)
        return

    old_default = bot.default_server
    bot.default_server = server_id
    await bot.save_data()

    server_name = bot.servers[server_id]['name']
    embed = discord.Embed(title="⭐ Standard-Server gesetzt", color=0x00ff00)
    embed.add_field(name="🆔 Server ID", value=server_id, inline=True)
    embed.add_field(name="📛 Server Name", value=server_name, inline=True)
    embed.add_field(name="📋 Vorheriger Standard",
                    value=old_default or "Keiner",
                    inline=True)

    await interaction.response.send_message(embed=embed, ephemeral=True)


# User command implementations
async def link_account(interaction: discord.Interaction, playername: str):
    """Link Discord account to ARK player"""
    user_id = str(interaction.user.id)

    if playername not in bot.eos_mapping:
        await interaction.response.send_message(
            f"❌ Spieler `{playername}` wurde nicht auf dem Server gefunden!",
            ephemeral=True)
        return

    bot.discord_mapping[user_id] = {
        "eos_id": bot.eos_mapping[playername],
        "player_name": playername,
        "original_input": playername,
        "linked_at": datetime.now().isoformat()
    }

    await bot.save_data()
    await interaction.response.send_message(
        f"✅ Erfolgreich verknüpft mit **{playername}**!")


async def show_status(interaction: discord.Interaction):
    """Show player status and claimed rewards"""
    user_id = str(interaction.user.id)
    if user_id not in bot.discord_mapping:
        await interaction.response.send_message(
            "❌ Du musst zuerst deinen Discord Account verknüpfen! Nutze `/link <spielername>`",
            ephemeral=True)
        return

    player_name = bot.discord_mapping[user_id]['player_name']
    eos_id = bot.discord_mapping[user_id]['eos_id']
    rewards = bot.rewards_data.get(player_name, [])

    embed = discord.Embed(title="📊 Dein Status", color=0x0099ff)

    embed.add_field(name="🎮 Spielername", value=player_name, inline=True)
    embed.add_field(name="🆔 EOS ID",
                    value=f"`{eos_id[:8]}...{eos_id[-8:]}`",
                    inline=True)
    embed.add_field(name="🔗 Verknüpft seit",
                    value=bot.discord_mapping[user_id].get(
                        'linked_at', 'Unbekannt')[:10],
                    inline=True)

    if rewards:
        rewards_text = ", ".join(map(str, sorted(rewards)))
        embed.add_field(name="🏆 Erhaltene Belohnungen",
                        value=rewards_text,
                        inline=False)
    else:
        embed.add_field(name="🏆 Erhaltene Belohnungen",
                        value="Noch keine Belohnungen erhalten",
                        inline=False)

    available_levels = list(bot.config.get('levels', {}).keys())
    embed.add_field(name="🎁 Verfügbare Level",
                    value=", ".join(available_levels),
                    inline=False)

    await interaction.response.send_message(embed=embed, ephemeral=True)


async def claim_reward(interaction: discord.Interaction, level: int):
    """Claim reward for a specific level"""
    user_id = str(interaction.user.id)
    if user_id not in bot.discord_mapping:
        await interaction.response.send_message(
            "❌ Du musst zuerst deinen Discord Account verknüpfen! Nutze `/link <spielername>`",
            ephemeral=True)
        return

    player_name = bot.discord_mapping[user_id]['player_name']

    if player_name not in bot.rewards_data:
        bot.rewards_data[player_name] = []

    if level in bot.rewards_data[player_name]:
        await interaction.response.send_message(
            f"❌ Du hast bereits die Belohnung für Level {level} erhalten!",
            ephemeral=True)
        return

    if str(level) not in bot.config.get('levels', {}):
        await interaction.response.send_message(
            f"❌ Keine Belohnung für Level {level} konfiguriert!",
            ephemeral=True)
        return

    await interaction.response.defer()

    try:
        eos_id = bot.eos_mapping.get(player_name)
        if not eos_id or len(eos_id) != 32:
            await interaction.followup.send(
                "❌ Ungültige EOS ID. Bitte melde dich bei einem Admin.")
            return

        commands = bot.config['levels'][str(level)]
        success_count = 0

        for reward in commands:
            original_cmd = reward['cmd']

            if original_cmd.startswith('GiveItemNum'):
                parts = original_cmd.split()
                if len(parts) >= 3:
                    item_id = parts[1]
                    amount = parts[2]
                    quality = parts[3] if len(parts) > 3 else "0"
                    admin_cmd = f'GiveItemToEOSID {eos_id} {item_id} {amount} {quality} 0 0 0 0 0 0'
            elif original_cmd.startswith('GiveItem'):
                blueprint_match = re.search(r'"Blueprint\'([^\']+)\'"',
                                            original_cmd)
                parts = original_cmd.split()
                if blueprint_match:
                    blueprint_path = blueprint_match.group(1)
                    amount = parts[-3] if len(parts) >= 4 else "1"
                    quality = parts[-2] if len(parts) >= 4 else "0"
                    admin_cmd = f'GiveItemToEOSID {eos_id} "Blueprint\'{blueprint_path}\'" {amount} {quality} 0 0 0 0 0 0'
                else:
                    admin_cmd = original_cmd.replace('{player}', player_name)
            else:
                admin_cmd = original_cmd.replace('{player}', player_name)

            result = await bot.execute_rcon_command(admin_cmd)
            if result is not None:
                success_count += 1

        if success_count == len(commands):
            bot.rewards_data[player_name].append(level)
            await bot.save_data()

            embed = discord.Embed(
                title="🎁 Level Belohnung erhalten!",
                description=
                f"Du hast die Belohnung für Level {level} erhalten!",
                color=0x00ff00)
            embed.add_field(name="🎮 Spieler", value=player_name, inline=True)
            embed.add_field(name="🏆 Level", value=str(level), inline=True)
            embed.add_field(name="✅ Status", value="Erfolgreich", inline=True)

            await interaction.followup.send(embed=embed)
        else:
            embed = discord.Embed(
                title="❌ Fehler beim Beanspruchen der Belohnung!",
                description="Einige Belohnungen konnten nicht gegeben werden.",
                color=0xff0000)
            await interaction.followup.send(embed=embed)

    except Exception as e:
        await interaction.followup.send(
            f"❌ Fehler beim Beanspruchen der Belohnung: {str(e)}")


async def delete_reward(interaction: discord.Interaction, level: int):
    """Delete a claimed reward"""
    user_id = str(interaction.user.id)
    if user_id not in bot.discord_mapping:
        await interaction.response.send_message(
            "❌ Du musst zuerst deinen Discord Account verknüpfen! Nutze `/link <spielername>`",
            ephemeral=True)
        return

    player_name = bot.discord_mapping[user_id]['player_name']

    if player_name not in bot.rewards_data or level not in bot.rewards_data[
            player_name]:
        await interaction.response.send_message(
            f"❌ Du hast noch keine Belohnung für Level {level} erhalten!",
            ephemeral=True)
        return

    bot.rewards_data[player_name].remove(level)
    await bot.save_data()

    embed = discord.Embed(
        title="🗑️ Belohnung entfernt",
        description=f"Level {level} Belohnung wurde entfernt!",
        color=0xff9900)
    await interaction.response.send_message(embed=embed)


async def show_all_players(interaction: discord.Interaction):
    """Show all players on server"""
    embed = discord.Embed(title="🎮 Alle Spieler auf dem Server",
                          color=0x0099ff)

    if not bot.eos_mapping:
        embed.description = "Keine Spieler gefunden."
        await interaction.response.send_message(embed=embed)
        return

    players_with_rewards = []
    players_without_rewards = []

    for player_name, eos_id in bot.eos_mapping.items():
        rewards = bot.rewards_data.get(player_name, [])
        reward_count = len(rewards)

        discord_user = None
        for disc_id, mapping in bot.discord_mapping.items():
            if mapping.get('player_name') == player_name:
                discord_user = f"<@{disc_id}>"
                break

        player_info = {
            'name': player_name,
            'rewards': reward_count,
            'discord': discord_user or "Nicht verknüpft",
            'eos_valid': len(eos_id) == 32 and eos_id.isalnum()
        }

        if reward_count > 0:
            players_with_rewards.append(player_info)
        else:
            players_without_rewards.append(player_info)

    players_with_rewards.sort(key=lambda x: x['rewards'], reverse=True)

    if players_with_rewards:
        reward_text = ""
        for player in players_with_rewards[:10]:
            status = "✅" if player['eos_valid'] else "❌"
            reward_text += f"{status} **{player['name']}** - {player['rewards']} Belohnungen - {player['discord']}\n"
        embed.add_field(name="🏆 Spieler mit Belohnungen",
                        value=reward_text,
                        inline=False)

    if players_without_rewards:
        no_reward_text = ""
        for player in players_without_rewards[:5]:
            status = "✅" if player['eos_valid'] else "❌"
            no_reward_text += f"{status} **{player['name']}** - {player['discord']}\n"
        if len(players_without_rewards) > 5:
            no_reward_text += f"... und {len(players_without_rewards) - 5} weitere"
        embed.add_field(name="📋 Spieler ohne Belohnungen",
                        value=no_reward_text,
                        inline=False)

    total_players = len(bot.eos_mapping)
    total_rewards = sum(len(rewards) for rewards in bot.rewards_data.values())
    embed.add_field(
        name="📊 Statistiken",
        value=
        f"Gesamt: {total_players} Spieler\nBelohnungen: {total_rewards}\nDiscord Links: {len(bot.discord_mapping)}",
        inline=True)

    await interaction.response.send_message(embed=embed)


# EOS/Mapping command implementations
async def eos_command(interaction: discord.Interaction, playername: str):
    """Show EOS ID of a player"""
    if playername not in bot.eos_mapping:
        await interaction.response.send_message(
            f"❌ Spieler `{playername}` wurde nicht gefunden!", ephemeral=True)
        return

    eos_id = bot.eos_mapping[playername]

    embed = discord.Embed(title="🔍 EOS ID Information", color=0x0099ff)

    embed.add_field(name="🎮 Spielername", value=playername, inline=True)
    embed.add_field(name="🆔 EOS ID", value=f"`{eos_id}`", inline=True)

    is_valid = len(eos_id) == 32 and eos_id.isalnum() and eos_id != "???"
    status = "✅ Gültig" if is_valid else "❌ Ungültig"
    embed.add_field(name="✨ Status", value=status, inline=True)

    discord_linked = None
    for discord_id, mapping in bot.discord_mapping.items():
        if mapping.get('player_name') == playername:
            discord_linked = discord_id
            break

    if discord_linked:
        embed.add_field(name="🔗 Discord Link",
                        value=f"<@{discord_linked}>",
                        inline=True)
    else:
        embed.add_field(name="🔗 Discord Link",
                        value="Nicht verknüpft",
                        inline=True)

    rewards = bot.rewards_data.get(playername, [])
    embed.add_field(
        name="🏆 Erhaltene Belohnungen",
        value=", ".join(map(str, sorted(rewards))) if rewards else "Keine",
        inline=True)

    await interaction.response.send_message(embed=embed, ephemeral=True)


async def eos_debug(interaction: discord.Interaction):
    """EOS debug information"""
    if not interaction.user.guild_permissions.administrator:
        await interaction.response.send_message(
            "❌ Du benötigst Administrator-Rechte!", ephemeral=True)
        return

    embed = discord.Embed(title="🛠️ EOS Mapping Debug Information",
                          color=0xff9900)

    total_eos = len(bot.eos_mapping)
    valid_eos = sum(1 for eos in bot.eos_mapping.values()
                    if len(eos) == 32 and eos.isalnum())
    invalid_eos = total_eos - valid_eos

    embed.add_field(
        name="📊 EOS Mapping Stats",
        value=
        f"Gesamt: {total_eos}\n✅ Gültig: {valid_eos}\n❌ Ungültig: {invalid_eos}",
        inline=True)

    embed.add_field(name="🔗 Discord Links",
                    value=str(len(bot.discord_mapping)),
                    inline=True)

    total_rewards = sum(len(rewards) for rewards in bot.rewards_data.values())
    embed.add_field(name="🎁 Total Rewards",
                    value=str(total_rewards),
                    inline=True)

    invalid_players = []
    for player, eos_id in bot.eos_mapping.items():
        if len(eos_id) != 32 or not eos_id.isalnum() or eos_id in [
                "???", "??", "unknown"
        ]:
            invalid_players.append(f"**{player}**: `{eos_id}`")

    if invalid_players:
        invalid_text = "\n".join(invalid_players[:5])
        if len(invalid_players) > 5:
            invalid_text += f"\n... und {len(invalid_players) - 5} weitere"
        embed.add_field(name="❌ Ungültige EOS IDs",
                        value=invalid_text,
                        inline=False)

    scan_task_running = bot.auto_player_scan_task.is_running()
    embed.add_field(name="🔄 Auto-Scan Status",
                    value="✅ Läuft" if scan_task_running else "❌ Gestoppt",
                    inline=True)

    await interaction.response.send_message(embed=embed, ephemeral=True)


async def eos_item_command(interaction: discord.Interaction, playername: str,
                           blueprint_path: str, quantity: int, quality: int,
                           force_blueprint: bool):
    """Give blueprint item to player using EOS ID"""
    if not interaction.user.guild_permissions.administrator:
        await interaction.response.send_message(
            "❌ Du benötigst Administrator-Rechte!", ephemeral=True)
        return

    if playername not in bot.eos_mapping:
        await interaction.response.send_message(
            f"❌ Spieler `{playername}` wurde nicht gefunden!", ephemeral=True)
        return

    await interaction.response.defer()

    try:
        eos_id = bot.eos_mapping[playername]
        clean_blueprint = blueprint_path.strip('"\'')

        if not clean_blueprint.startswith('Blueprint\''):
            if clean_blueprint.startswith('/Game/'):
                clean_blueprint = clean_blueprint[1:]
            elif not clean_blueprint.startswith('Game/'):
                clean_blueprint = f"Game/{clean_blueprint}"
            clean_blueprint = f"Blueprint'/{clean_blueprint}'"

        force_bp_value = 1 if force_blueprint else 0
        command = f'GiveItemToEOSID {eos_id} "{clean_blueprint}" {quantity} {quality} {force_bp_value} 0 0 0 0 0'

        result = await bot.execute_rcon_command(command)

        if result is not None:
            embed = discord.Embed(title="✅ EOS Item Command erfolgreich!",
                                  color=0x00ff00)
            embed.add_field(name="🎮 Spieler", value=playername, inline=True)
            embed.add_field(name="🎁 Anzahl", value=str(quantity), inline=True)
            embed.add_field(name="⭐ Qualität", value=str(quality), inline=True)
            embed.add_field(name="📦 Blueprint",
                            value=f"`{clean_blueprint}`",
                            inline=False)

            await interaction.followup.send(embed=embed)
        else:
            await interaction.followup.send(
                "❌ EOS Item Command fehlgeschlagen!")

    except Exception as e:
        await interaction.followup.send(
            f"❌ Fehler beim EOS Item Command: {str(e)}")


# Communication command implementations
async def broadcast_message(interaction: discord.Interaction, message: str):
    """Send broadcast message to ARK server"""
    if not interaction.user.guild_permissions.administrator:
        await interaction.response.send_message(
            "❌ Du benötigst Administrator-Rechte!", ephemeral=True)
        return

    await interaction.response.defer()

    try:
        result = await bot.execute_rcon_command(f'ServerChat "{message}"')
        if result:
            embed = discord.Embed(title="📢 Broadcast gesendet!",
                                  color=0x00ff00)
            embed.add_field(name="📝 Nachricht", value=message, inline=False)
            embed.add_field(name="⏰ Gesendet um",
                            value=f"`{datetime.now().strftime('%H:%M:%S')}`",
                            inline=True)

            await interaction.followup.send(embed=embed)
        else:
            await interaction.followup.send(
                "❌ Fehler beim Senden der Broadcast-Nachricht!")

    except Exception as e:
        await interaction.followup.send(f"❌ Fehler beim Broadcast: {str(e)}")


async def ark_global_chat(interaction: discord.Interaction, message: str):
    """Send message to ARK Global Chat"""
    user_id = str(interaction.user.id)
    discord_name = interaction.user.display_name

    if user_id not in bot.discord_mapping:
        await interaction.response.send_message(
            "❌ Du musst zuerst deinen Discord Account verknüpfen!",
            ephemeral=True)
        return

    player_mapping = bot.discord_mapping[user_id]
    ark_player_name = player_mapping['player_name']

    await interaction.response.defer()

    try:
        formatted_message = f"{discord_name} ({ark_player_name}) [DISCORD]: {message}"
        ark_command = f'scriptcommand hb.cmd type=sendchat message={formatted_message}'
        result = await bot.execute_rcon_command(ark_command)

        if result is not None:
            embed = discord.Embed(
                title="💬 ARK Global Chat Nachricht gesendet!", color=0x00ff00)
            embed.add_field(name="👤 Discord", value=discord_name, inline=True)
            embed.add_field(name="🎮 ARK", value=ark_player_name, inline=True)
            embed.add_field(name="💭 Nachricht", value=message, inline=False)

            await interaction.followup.send(embed=embed)
        else:
            await interaction.followup.send(
                "❌ Fehler beim Senden der Nachricht!")

    except Exception as e:
        await interaction.followup.send(f"❌ Fehler: {str(e)}")


# HyperBeast command implementations
async def hyperbeast_command(interaction: discord.Interaction, playername: str,
                             category: str, item: str, quantity: int,
                             quality: int, level: int):
    """HyperBeast command implementation - placeholder"""
    await interaction.response.send_message(
        "🦾 HyperBeast commands werden in der nächsten Version implementiert!",
        ephemeral=True)


async def hyperbeast_list(interaction: discord.Interaction):
    """Show HyperBeast categories"""
    embed = discord.Embed(
        title="🦾 HyperBeast System - Verfügbare Items",
        description="Alle verfügbaren Kategorien im HyperBeast System:",
        color=0x8b00ff)

    for category_key, category_data in HB_CATEGORIES.items():
        items_text = ""
        for item_key, item_data in category_data['blueprints'].items():
            items_text += f"• **{item_key}**: {item_data['name']}\n"

        embed.add_field(
            name=f"{category_data['name']} (`{category_key}`)",
            value=f"{category_data['description']}\n\n{items_text}",
            inline=False)

    embed.set_footer(text="Nutze /hb für erweiterte Item-Vergabe")
    await interaction.response.send_message(embed=embed, ephemeral=True)


# Testing and admin command implementations
async def test_give_command(interaction: discord.Interaction, playername: str):
    """Test command implementation - placeholder"""
    await interaction.response.send_message(
        f"🧪 Test Command für {playername} - wird implementiert!",
        ephemeral=True)


async def test_blueprint_command(interaction: discord.Interaction,
                                 blueprint_path: str):
    """Test blueprint command - placeholder"""
    await interaction.response.send_message(
        f"🧪 Blueprint Test für {blueprint_path} - wird implementiert!",
        ephemeral=True)


# System command implementations
async def help_command(interaction: discord.Interaction):
    """Show help with all commands organized by category"""
    embed = discord.Embed(
        title="🤖 ARK Level Rewards Bot - Kommando Übersicht",
        description=
        "**Alle verfügbaren Befehle, organisiert nach Kategorien:**",
        color=0x0099ff)

    # Server Management Commands
    embed.add_field(name="🖥️ **SERVER MANAGEMENT**",
                    value="""
`/servermanager` - Server Management Dashboard (Admin)
`/serverlist` - Alle konfigurierten Server anzeigen  
`/serverstatus` - Server-Verbindung prüfen
`/setdefaultserver` - Standard-Server setzen (Admin)
        """,
                    inline=False)

    # User Commands
    embed.add_field(name="👤 **BENUTZER BEFEHLE**",
                    value="""
`/link` - Discord mit ARK Spieler verknüpfen
`/status` - Deinen Status und Belohnungen anzeigen
`/claim` - Level-Belohnung beanspruchen
`/deletereward` - Belohnung entfernen
`/players` - Alle Spieler auf dem Server anzeigen
        """,
                    inline=False)

    # EOS/Mapping Commands
    embed.add_field(name="🔗 **EOS/MAPPING BEFEHLE**",
                    value="""
`/eos` - EOS ID eines Spielers anzeigen
`/eosdebug` - EOS Mapping Debug-Info (Admin)
`/eositem` - Item via EOS ID vergeben (Admin)
        """,
                    inline=False)

    # Communication Commands
    embed.add_field(name="💬 **KOMMUNIKATION**",
                    value="""
`/broadcast` - Nachricht an ARK Server senden (Admin)
`/ark` - Nachricht in ARK Global Chat senden
        """,
                    inline=False)

    # HyperBeast Commands
    embed.add_field(name="🦾 **HYPERBEAST SYSTEM**",
                    value="""
`/hb` - Kategorisierte Items/Dinos vergeben (Admin)
`/hblist` - Alle HyperBeast Kategorien anzeigen
        """,
                    inline=False)

    # System Commands
    embed.add_field(name="🔧 **SYSTEM BEFEHLE**",
                    value="""
`/help` - Diese Hilfe anzeigen
`/botstatus` - Bot Status und Debug-Info
`/botmonitor` - Live Bot Health Monitor (Admin)
`/forcesync` - Commands force-sync (Admin)
        """,
                    inline=False)

    embed.set_footer(
        text="Bot Version 2.1 - Vollständig reorganisiert für bessere Übersicht"
    )
    await interaction.response.send_message(embed=embed, ephemeral=True)


async def bot_status_command(interaction: discord.Interaction):
    """Show bot status"""
    embed = discord.Embed(title="🤖 Bot Status", color=0x00ff00)
    embed.add_field(name="🔗 Discord", value="✅ Connected", inline=True)
    embed.add_field(name="🏢 Servers", value=str(len(bot.guilds)), inline=True)
    embed.add_field(name="📋 Commands",
                    value=str(len(bot.tree.get_commands())),
                    inline=True)
    embed.add_field(name="🎮 ARK Servers",
                    value=str(len(bot.servers)),
                    inline=True)
    embed.add_field(name="🔧 Default Server",
                    value=bot.default_server or "None",
                    inline=True)
    embed.add_field(name="📊 Players Tracked",
                    value=str(len(bot.eos_mapping)),
                    inline=True)

    if bot.servers:
        server_status = ""
        for sid, sconfig in bot.servers.items():
            status = "✅" if sconfig.get('enabled', True) else "❌"
            server_status += f"{status} {sconfig.get('name', sid)}\n"
        embed.add_field(name="🗺️ Server Status",
                        value=server_status or "None",
                        inline=False)

    await interaction.response.send_message(embed=embed, ephemeral=True)


async def bot_monitor_command(interaction: discord.Interaction):
    """Bot monitor command - placeholder"""
    await interaction.response.send_message(
        "🔍 Bot Monitor wird implementiert!", ephemeral=True)


async def force_sync_commands(interaction: discord.Interaction):
    """Force sync commands"""
    if not interaction.user.guild_permissions.administrator:
        await interaction.response.send_message(
            "❌ Du benötigst Administrator-Rechte!", ephemeral=True)
        return

    await interaction.response.defer()

    try:
        synced_commands = await bot.tree.sync()
        embed = discord.Embed(title="🔄 Commands Force-Sync erfolgreich!",
                              color=0x00ff00)
        embed.add_field(name="✅ Commands synchronisiert",
                        value=str(len(synced_commands)),
                        inline=True)
        embed.add_field(name="⏰ Sync Zeit",
                        value=f"`{datetime.now().strftime('%H:%M:%S')}`",
                        inline=True)

        await interaction.followup.send(embed=embed)

    except Exception as e:
        await interaction.followup.send(f"❌ Fehler beim Force-Sync: {str(e)}")


# Special command implementations
async def replit_assistant_greeting(interaction: discord.Interaction):
    """Replit Assistant greeting"""
    try:
        await interaction.response.defer()

        greeting_message = "🤖 Hallo vom Replit Assistant! Bot läuft perfekt und alle Commands sind organisiert!"
        result = await bot.execute_rcon_command(
            f'ServerChat "{greeting_message}"')

        if result:
            embed = discord.Embed(
                title="🤖 Replit Assistant Grußbotschaft gesendet!",
                description="Server-Systeme sind online und funktional!",
                color=0x00ff6d)
            embed.add_field(name="📝 Nachricht",
                            value=greeting_message,
                            inline=False)
            embed.add_field(name="⏰ Gesendet um",
                            value=f"`{datetime.now().strftime('%H:%M:%S')}`",
                            inline=True)

            await interaction.followup.send(embed=embed)
        else:
            await interaction.followup.send(
                "❌ Konnte die Grußbotschaft nicht senden!")

    except Exception as e:
        await interaction.followup.send(f"❌ Fehler: {str(e)}")


# Discord View classes
class ServerManagerView(discord.ui.View):

    def __init__(self):
        super().__init__(timeout=300)

    @discord.ui.button(label='📋 Server Liste',
                       style=discord.ButtonStyle.primary)
    async def server_list_button(self, interaction: discord.Interaction,
                                 button: discord.ui.Button):
        await server_list(interaction)

    @discord.ui.button(label='📡 Verbindung testen',
                       style=discord.ButtonStyle.secondary)
    async def test_connection_button(self, interaction: discord.Interaction,
                                     button: discord.ui.Button):
        await check_server_status(interaction)

    @discord.ui.button(label='🔄 Daten neu laden',
                       style=discord.ButtonStyle.success)
    async def reload_data_button(self, interaction: discord.Interaction,
                                 button: discord.ui.Button):
        await interaction.response.defer()
        await bot.load_data()
        await interaction.followup.send("✅ Server-Daten wurden neu geladen!",
                                        ephemeral=True)


# Start the bot
if __name__ == "__main__":
    bot.run(TOKEN)
