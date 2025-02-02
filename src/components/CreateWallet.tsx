import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ethers } from "ethers";
import { DeWalletABI, CONTRACT_ADDRESS } from "@/contracts/DeWalletABI";

const ALCHEMY_API_KEY = "cUnkmV9JNeKd-cc5uviKiJIsy6BmtSY8";

interface CreateWalletProps {
  onWalletCreated?: () => void;
}

const CreateWallet = ({ onWalletCreated }: CreateWalletProps) => {
  const [seedPhrase, setSeedPhrase] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [hasCopiedSeedPhrase, setHasCopiedSeedPhrase] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateWallet = async () => {
    try {
      setIsLoading(true);

      // Generate a new wallet
      const wallet = ethers.Wallet.createRandom();
      if (!wallet.mnemonic?.phrase) {
        throw new Error("Failed to generate seed phrase");
      }

      const encryptedKey = await wallet.encrypt(wallet.mnemonic.phrase);
      
      // Get existing wallets or initialize empty array
      const existingWalletsString = localStorage.getItem("wallets");
      const existingWallets = existingWalletsString ? JSON.parse(existingWalletsString) : [];
      
      // Create new wallet info
      const newWallet = {
        name: `Wallet ${existingWallets.length + 1}`,
        address: wallet.address,
        encryptedKey: encryptedKey,
        seedPhrase: wallet.mnemonic.phrase
      };
      
      // Add new wallet to list
      existingWallets.push(newWallet);
      localStorage.setItem("wallets", JSON.stringify(existingWallets));

      // Set as current wallet
      localStorage.setItem("walletAddress", wallet.address);
      localStorage.setItem("encryptedPrivateKey", encryptedKey);
      localStorage.setItem("seedPhrase", wallet.mnemonic.phrase);

      setSeedPhrase(wallet.mnemonic.phrase);
      setShowSeedPhrase(true);

      toast({
        title: "Success",
        description: "Wallet created successfully! Please save your seed phrase.",
      });

    } catch (error) {
      console.error("Error creating wallet:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySeedPhrase = async () => {
    try {
      await navigator.clipboard.writeText(seedPhrase);
      setHasCopiedSeedPhrase(true);
      toast({
        title: "Success",
        description: "Seed phrase copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy seed phrase",
        variant: "destructive",
      });
    }
  };

  const handleConfirmSeedPhrase = async () => {
    if (!hasCopiedSeedPhrase) {
      toast({
        title: "Warning",
        description: "Please copy your seed phrase before continuing",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
      const encryptedKey = localStorage.getItem("encryptedPrivateKey");
      const seedPhrase = localStorage.getItem("seedPhrase");
      
      if (!encryptedKey || !seedPhrase) {
        throw new Error("Wallet data not found");
      }

      const wallet = await ethers.Wallet.fromEncryptedJson(encryptedKey, seedPhrase);
      const signer = wallet.connect(provider);

      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DeWalletABI, signer);

      // Create wallet hash from seed phrase
      const seedPhraseHash = ethers.keccak256(ethers.toUtf8Bytes(seedPhrase));
      
      // Register wallet in smart contract
      const tx = await contract.createWallet(seedPhraseHash);
      await tx.wait();

      toast({
        title: "Success",
        description: "Wallet registered successfully!",
      });

      if (onWalletCreated) {
        onWalletCreated();
      }
      navigate("/");
    } catch (error) {
      console.error("Error registering wallet:", error);
      toast({
        title: "Error",
        description: "Failed to register wallet. Please make sure you have some Sepolia ETH for gas fees.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Create Wallet</h1>
        
        {!showSeedPhrase ? (
          <div className="space-y-4">
            <p className="text-gray-400">
              Create a new wallet to start using the application. Your seed phrase will be generated automatically.
            </p>
            
            <Button
              onClick={handleCreateWallet}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? "Creating..." : "Create Wallet"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="font-medium mb-2">Your Seed Phrase</h3>
              <p className="text-sm text-gray-400 break-all font-mono">{seedPhrase}</p>
            </div>
            
            <div className="bg-yellow-900/20 border border-yellow-900/50 rounded-lg p-4">
              <p className="text-yellow-500 text-sm">
                ⚠️ WARNING: Never share your seed phrase with anyone. Anyone with your seed phrase can access your wallet.
              </p>
            </div>
            
            <Button
              onClick={handleCopySeedPhrase}
              className="w-full bg-gray-700 hover:bg-gray-600"
              disabled={hasCopiedSeedPhrase}
            >
              {hasCopiedSeedPhrase ? "Seed Phrase Copied!" : "Copy Seed Phrase"}
            </Button>

            <Button
              onClick={handleConfirmSeedPhrase}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={!hasCopiedSeedPhrase}
            >
              I've Saved My Seed Phrase
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateWallet;