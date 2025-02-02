import { Token } from "@/types/wallet";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS } from "@/contracts/DeWalletABI";

const ALCHEMY_API_KEY = "cUnkmV9JNeKd-cc5uviKiJIsy6BmtSY8";

interface TokenListProps {
  tokens: Token[];
}

const TokenList = ({ tokens }: TokenListProps) => {
  const { data: ethBalance } = useQuery({
    queryKey: ['ethBalance'],
    queryFn: async () => {
      const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
      const walletAddress = localStorage.getItem("walletAddress");
      if (!walletAddress) return "0";
      const balance = await provider.getBalance(walletAddress);
      return ethers.formatEther(balance);
    }
  });

  return (
    <div className="mt-8 space-y-4">
      {/* Sepolia ETH Token Card */}
      <Card className="p-4 bg-gray-900 border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/lovable-uploads/fcae4b49-2dcf-481d-b0d4-4df268c4d28f.png" alt="ETH" />
              <AvatarFallback>ETH</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">Sepolia ETH</h3>
              <p className="text-sm text-gray-400">{ethBalance || "0"} ETH</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Other ERC20 Tokens */}
      {tokens.filter(token => token.symbol !== "ETH").map((token) => (
        <Card key={token.symbol} className="p-4 bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={token.icon} alt={token.name} />
                <AvatarFallback>{token.symbol}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{token.name}</h3>
                <p className="text-sm text-gray-400">{token.balance} {token.symbol}</p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default TokenList;