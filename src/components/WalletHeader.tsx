import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronDown, Scan } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

interface WalletInfo {
  name: string;
  address: string;
  encryptedKey: string;
  seedPhrase: string;
}

const WalletHeader = () => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = () => {
    const walletsString = localStorage.getItem("wallets");
    if (walletsString) {
      const loadedWallets = JSON.parse(walletsString);
      setWallets(loadedWallets);

      const currentAddress = localStorage.getItem("walletAddress");
      if (currentAddress) {
        const current = loadedWallets.find((w: WalletInfo) => w.address === currentAddress);
        if (current) {
          setSelectedWallet(current);
        }
      }
    }
  };

  const switchWallet = (wallet: WalletInfo) => {
    localStorage.setItem("walletAddress", wallet.address);
    localStorage.setItem("encryptedPrivateKey", wallet.encryptedKey);
    localStorage.setItem("seedPhrase", wallet.seedPhrase);
    setSelectedWallet(wallet);
    
    toast({
      title: "Wallet Switched",
      description: `Switched to ${wallet.name}`,
    });

    // Refresh the page to update balances
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-between">
      <Avatar className="h-8 w-8">
        <AvatarImage src="/DeWalletIcon.jpeg" alt="DeWallet" />
        <AvatarFallback>DW</AvatarFallback>
      </Avatar>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="text-white">
            {selectedWallet?.name || "Select Wallet"}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-[200px] bg-gray-900 border-gray-800">
          <DropdownMenuLabel>My Wallets</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {wallets.map((wallet) => (
            <DropdownMenuItem
              key={wallet.address}
              onClick={() => switchWallet(wallet)}
              className={`cursor-pointer ${
                selectedWallet?.address === wallet.address ? "bg-gray-800" : ""
              }`}
            >
              <div className="flex flex-col">
                <span>{wallet.name}</span>
                <span className="text-xs text-gray-400">
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button variant="ghost" size="icon">
        <Scan className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default WalletHeader;