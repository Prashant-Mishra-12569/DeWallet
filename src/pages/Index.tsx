import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreateWallet from "@/components/CreateWallet";
import WalletHeader from "@/components/WalletHeader";
import TokenList from "@/components/TokenList";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/components/ui/use-toast";
import { Token } from "@/types/wallet";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

const ALCHEMY_API_KEY = "cUnkmV9JNeKd-cc5uviKiJIsy6BmtSY8";

const Index = () => {
  const [hasWallet, setHasWallet] = useState(false);
  const [balance, setBalance] = useState("0.00");
  const [tokens, setTokens] = useState<Token[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkWalletExists();
  }, []);

  const checkWalletExists = async () => {
    try {
      const walletAddress = localStorage.getItem("walletAddress");
      const encryptedPrivateKey = localStorage.getItem("encryptedPrivateKey");
      const seedPhrase = localStorage.getItem("seedPhrase");
      
      const hasAllWalletData = !!(walletAddress && encryptedPrivateKey && seedPhrase);
      setHasWallet(hasAllWalletData);
      
      if (hasAllWalletData) {
        fetchBalance(walletAddress!);
        fetchTokens();
      }
    } catch (error) {
      console.error("Error checking wallet:", error);
    }
  };

  const fetchBalance = async (address: string) => {
    try {
      const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
      const balance = await provider.getBalance(address);
      const formattedBalance = parseFloat(ethers.formatEther(balance)).toFixed(4);
      setBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchTokens = async () => {
    // For now, we'll just show ETH
    const mockTokens: Token[] = [];
    setTokens(mockTokens);
  };

  const copyAddress = async () => {
    const address = localStorage.getItem("walletAddress");
    if (address) {
      await navigator.clipboard.writeText(address);
      toast({
        title: "Address copied!",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const handleWalletCreated = async () => {
    await checkWalletExists();
  };

  if (!hasWallet) {
    return <CreateWallet onWalletCreated={handleWalletCreated} />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container max-w-md mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-bold">Wallet 1</div>
          <Button variant="ghost" size="icon">
            <span className="sr-only">Expand</span>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <WalletHeader />
        
        <div className="flex justify-center">
          <div 
            onClick={copyAddress}
            className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-800 transition-colors max-w-[280px] truncate text-center"
          >
            {localStorage.getItem("walletAddress") || "No wallet address"}
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <h1 className="text-4xl font-bold">${balance}</h1>
          <p className="text-green-500 mt-1">
            {balance} ETH
          </p>
        </div>

        <TokenList tokens={tokens} />
        <BottomNav />
      </div>
    </div>
  );
};

export default Index;