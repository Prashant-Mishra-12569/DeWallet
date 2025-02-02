import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ethers } from "ethers";
import { DeWalletABI, CONTRACT_ADDRESS } from "@/contracts/DeWalletABI";
import BottomNav from "@/components/BottomNav";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const ALCHEMY_API_KEY = "cUnkmV9JNeKd-cc5uviKiJIsy6BmtSY8";

const Recovery = () => {
  const [seedPhrase, setSeedPhrase] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSeedPhraseRecovery = async () => {
    try {
      setIsLoading(true);

      // Validate seed phrase (for ethers v6)
      try {
        ethers.HDNodeWallet.fromPhrase(seedPhrase);
      } catch (error) {
        throw new Error("Invalid seed phrase format");
      }

      // Create wallet from seed phrase
      const wallet = ethers.HDNodeWallet.fromPhrase(seedPhrase);
      const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
      const signer = wallet.connect(provider);

      // Get contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DeWalletABI, signer);

      // Create seed phrase hash
      const seedPhraseHash = ethers.keccak256(ethers.toUtf8Bytes(seedPhrase));

      // Check if wallet exists in contract
      const walletDetails = await contract.wallets(wallet.address);
      
      // If wallet doesn't exist in contract, create it
      if (!walletDetails.isActive) {
        try {
          const tx = await contract.createWallet(seedPhraseHash);
          await tx.wait();
          console.log("New wallet registered in contract");
        } catch (error) {
          console.error("Error registering wallet:", error);
          throw new Error("Failed to register wallet in contract. Make sure you have Sepolia ETH for gas.");
        }
      }

      // Encrypt private key
      const encryptedKey = await wallet.encrypt(seedPhrase);

      // Get existing wallets or initialize
      const existingWalletsString = localStorage.getItem("wallets") || "[]";
      const existingWallets = JSON.parse(existingWalletsString);
      
      // Check if wallet already exists
      const walletExists = existingWallets.some((w: WalletInfo) => w.address === wallet.address);
      if (walletExists) {
        throw new Error("This wallet is already imported");
      }

      // Create wallet info with next available number
      const walletNumber = existingWallets.length + 1;
      const walletInfo = {
        name: `Wallet ${walletNumber}`,
        address: wallet.address,
        encryptedKey,
        seedPhrase
      };

      // Add to wallets list
      existingWallets.push(walletInfo);
      localStorage.setItem("wallets", JSON.stringify(existingWallets));

      // Set as current wallet
      localStorage.setItem("walletAddress", wallet.address);
      localStorage.setItem("encryptedPrivateKey", encryptedKey);
      localStorage.setItem("seedPhrase", seedPhrase);

      toast({
        title: "Success",
        description: "Wallet recovered and registered successfully!",
      });

      navigate("/");
    } catch (error) {
      console.error("Error recovering wallet:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to recover wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivateKeyRecovery = async () => {
    try {
      setIsLoading(true);

      // Format private key
      let formattedKey = privateKey.trim();
      if (!formattedKey.startsWith('0x')) {
        formattedKey = '0x' + formattedKey;
      }

      // Validate private key
      try {
        new ethers.Wallet(formattedKey);
      } catch (error) {
        throw new Error("Invalid private key format");
      }

      // Create wallet from private key
      const wallet = new ethers.Wallet(formattedKey);
      const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
      const signer = wallet.connect(provider);

      // Get contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DeWalletABI, signer);

      // Generate a random seed phrase for encryption
      const randomWallet = ethers.Wallet.createRandom();
      const encryptionPhrase = randomWallet.mnemonic?.phrase || "";

      // Create seed phrase hash for contract
      const seedPhraseHash = ethers.keccak256(ethers.toUtf8Bytes(encryptionPhrase));

      // Check if wallet exists in contract
      const walletDetails = await contract.wallets(wallet.address);
      
      // If wallet doesn't exist in contract, create it
      if (!walletDetails.isActive) {
        try {
          const tx = await contract.createWallet(seedPhraseHash);
          await tx.wait();
          console.log("New wallet registered in contract");
        } catch (error) {
          console.error("Error registering wallet:", error);
          throw new Error("Failed to register wallet in contract. Make sure you have Sepolia ETH for gas.");
        }
      }

      // Encrypt private key
      const encryptedKey = await wallet.encrypt(encryptionPhrase);

      // Get existing wallets or initialize
      const existingWalletsString = localStorage.getItem("wallets") || "[]";
      const existingWallets = JSON.parse(existingWalletsString);
      
      // Check if wallet already exists
      const walletExists = existingWallets.some((w: WalletInfo) => w.address === wallet.address);
      if (walletExists) {
        throw new Error("This wallet is already imported");
      }

      // Create wallet info with next available number
      const walletNumber = existingWallets.length + 1;
      const walletInfo = {
        name: `Wallet ${walletNumber}`,
        address: wallet.address,
        encryptedKey,
        seedPhrase: encryptionPhrase
      };

      // Add to wallets list
      existingWallets.push(walletInfo);
      localStorage.setItem("wallets", JSON.stringify(existingWallets));

      // Set as current wallet
      localStorage.setItem("walletAddress", wallet.address);
      localStorage.setItem("encryptedPrivateKey", encryptedKey);
      localStorage.setItem("seedPhrase", encryptionPhrase);

      toast({
        title: "Success",
        description: "Wallet recovered and registered successfully!",
      });

      navigate("/");
    } catch (error) {
      console.error("Error recovering wallet:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to recover wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Recover Wallet</h1>
        
        <Tabs defaultValue="seedphrase" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="seedphrase" className="flex-1">Seed Phrase</TabsTrigger>
            <TabsTrigger value="privatekey" className="flex-1">Private Key</TabsTrigger>
          </TabsList>

          <TabsContent value="seedphrase">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Enter your seed phrase
                </label>
                <Input
                  value={seedPhrase}
                  onChange={(e) => setSeedPhrase(e.target.value)}
                  placeholder="Enter your 12-word seed phrase"
                  className="bg-gray-900 border-gray-800"
                />
              </div>

              <Button
                onClick={handleSeedPhraseRecovery}
                disabled={isLoading || !seedPhrase}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? "Recovering..." : "Recover with Seed Phrase"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="privatekey">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Enter your private key
                </label>
                <Input
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="Enter your private key (0x...)"
                  className="bg-gray-900 border-gray-800"
                />
              </div>

              <Button
                onClick={handlePrivateKeyRecovery}
                disabled={isLoading || !privateKey}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? "Recovering..." : "Recover with Private Key"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <BottomNav />
      </div>
    </div>
  );
};

export default Recovery;